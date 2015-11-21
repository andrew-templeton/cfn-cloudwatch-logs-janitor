
var AWS = require('aws-sdk');
var CfnLambda = require('cfn-lambda');

var LogGroups = new AWS.CloudWatchLogs({apiVersion: '2014-03-28'});

exports.handler = CfnLambda({
  Create: function(params, reply) {
    reply(null, toPhysicalId(params), {});
  },
  Update: function(physicalId, params, oldParams, reply) {
    reply(null, toPhysicalId(params), {});
  },
  Delete: Delete,
  SchemaPath: [__dirname, 'schema.json']
});


function Delete(physicalId, params, reply) {

  var pageSize = 50;
  var matchingLogGroupNames = [];
  collectMatchingGroups();

  function collectMatchingGroups(nextToken) {
    console.log('Scanning for matching log groups: %s', params.LogGroupNamePrefix);
    LogGroups.describeLogGroups({
      limit: pageSize,
      nextToken: nextToken,
      logGroupNamePrefix: params.LogGroupNamePrefix
    }, function(pageErr, page) {
      if (pageErr) {
        console.log('Error while paging through log groups: %j', pageErr);
        return reply(pageErr.message);
      }
      matchingLogGroupNames = matchingLogGroupNames
        .concat(page.logGroups.map(function(logGroup) {
          return logGroup.logGroupName;
        }));
      if (page.logGroups.length === pageSize) {
        console.log('Found %s log groups so far, there ' +
          'appear to be more.', matchingLogGroupNames.length);
        return collectMatchingGroups(page.nextToken);
      }
      console.log('Found %s matching log groups in total.', matchingLogGroupNames.length);
      manipulateGroups();
    });
  }

  function manipulateGroups() {
    console.log('Manipulating log groups.');
    var message = params.RetentionInDays
      ? 'Found RetentionInDays. Setting logs to expire after this time.'
      : 'No RetentionInDays found. Deleting all matching groups.';
    var manipulation = params.RetentionInDays
      ? updateWithDays(params.RetentionInDays)
      : deleteGroup;
    console.log(message);
    asyncMap(matchingLogGroupNames.map(manipulation), function(err, data) {
      if (err) {
        console.log('Error when manipulating Log Groups: %j', err);
        return reply(err.message);
      }
      console.log('Finished manipulating all groups.');
      reply();
    });
  }
}

function updateWithDays(numberOfDays) {
  return function(logGroup) {
    return function(callback) {
      LogGroups.putRetentionPolicy({
        logGroupName: logGroup,
        retentionInDays: numberOfDays
      }, function(err, data) {
        if (err && err.statusCode !== 404) {
          console.error('Failure changing policy for group %s: %j', logGroup, err);
          return callback(err);
        }
        console.log('Changed policy for group: %s', logGroup);
        callback(null, data);
      });
    };
  };
}

function deleteGroup(logGroup) {
  return function(callback) {
    LogGroups.deleteLogGroup({
      logGroupName: logGroup
    }, function(err, data) {
      if (err && err.statusCode !== 404) {
        console.error('Failure deleting group %s: %j', logGroup, err);
        return callback(err);
      }
      console.log('Success, group %s no longer exists.', logGroup);
      callback(null, data);
    });
  };
}

function asyncMap(actionSet, callback) {
  var results = [];
  var failed = false;
  var completed = 0;
  if (!actionSet.length) {
    return callback(null, []);
  }
  actionSet.forEach(function(action, index) {
    action(function(err, data) {
      if (failed) {
        return;
      }
      if (err) {
        failed = true;
        return callback(err);
      }
      results[index] = data;
      completed++;
      if (completed === actionSet.length) {
        callback(null, results);
      }
    });
  });
}

function toPhysicalId(params) {
  return 'CWLGJanitor-' + params.LogGroupNamePrefix
}
