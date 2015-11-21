
# cfn-cloudwatch-logs-janitor


## Purpose

AWS CloudFormation sometimes generates resources with machine generated names, which produce CloudWatch Log Groups with machine generated names. Many resources, such as Lambdas, produce logs with `RetentionPolicy` set to `Never Expire`. This creates a headache for anyone doing highly active development, with ephemeral log groups. 

This Resource Type sets allows a template developer to set `CloudWatch::LogGroup::RetentionPolicy::RetentionInDays` to supported values or specify deletion of `LogGroup`s when the template itself is deleted. The developer specifies a `LogGroupNamePrefix` to scope the janitor, and either sets the `RetentionInDays` to a number to allow logs to self-cleanse after a time, or omits the configuration to allow matching groups to delete immediately when the stack is torn down.

[This package on NPM](https://www.npmjs.com/package/cfn-cloudwatch-logs-janitor)  
[This package on GitHub](https://www.github.com/andrew-templeton/cfn-cloudwatch-logs-janitor)


## Implementation

This Lambda makes use of the Lambda-Backed CloudFormation Custom Resource flow module, `cfn-lambda` ([GitHub](https://github.com/andrew-templeton/cfn-lambda) / [NPM](https://www.npmjs.com/package/cfn-lambda)).


## Usage

  See [`./example.template.json`](./example.template.json) for a sample CloudFormation template. The example uses `Condition` statements, `Parameters`, and dynamic `ServiceToken` generation fully.


    "JanitorLogicalIdInResourcesObject": {
      "Type": "Type": "Custom::CloudWatchLogsJanitor",
      "Properties": {
        "ServiceToken": "arn:aws:lambda:<cfn-region-id>:<your-account-id>:function:<this-deployed-lambda-name>",
        "LogGroupNamePrefix": "/aws/lambda/MyLambda" // REQUIRED, prefix to manage
        "RetentionInDays": "zyxwvutsrq", // Optional ENUM. Days to retain logs.
            // Omission implies deletion when stack is deleted.
            // Can be: 1, 3, 5, 7, 14, 30, 60, 90, 
              // 120, 150, 180, 365, 400, 545, 731, 1827, 3653
      }
    }


## Installation of the Resource Service Lambda

#### Using the Provided Instant Install Script

The way that takes 10 seconds...

    # Have aws CLI installed + permissions for IAM and Lamdba
    $ npm run cfn-lambda-deploy


You will have this resource installed in every supported Region globally!


#### Using the AWS Console

... And the way more difficult way.

*IMPORTANT*: With this method, you must install this custom service Lambda in each AWS Region in which you want CloudFormation to be able to access the `CloudWatchLogsJanitor` custom resource!

1. Go to the AWS Lambda Console Create Function view:
  - [`us-east-1` / N. Virginia](https://console.aws.amazon.com/lambda/home?region=us-east-1#/create?step=2)
  - [`us-west-2` / Oregon](https://console.aws.amazon.com/lambda/home?region=us-west-2#/create?step=2)
  - [`eu-west-1` / Ireland](https://console.aws.amazon.com/lambda/home?region=eu-west-1#/create?step=2)
  - [`ap-northeast-1` / Tokyo](https://console.aws.amazon.com/lambda/home?region=ap-northeast-1#/create?step=2)
2. Zip this repository into `/tmp/CloudWatchLogsJanitor.zip`

    `$ cd $REPO_ROOT && zip -r /tmp/CloudWatchLogsJanitor.zip;`

3. Enter a name in the Name blank. I suggest: `CfnLambdaResouce-CloudWatchLogsJanitor`
4. Enter a Description (optional).
5. Toggle Code Entry Type to "Upload a .ZIP file"
6. Click "Upload", navigate to and select `/tmp/CloudWatchLogsJanitor.zip`
7. Set the Timeout under Advanced Settings to 10 sec
8. Click the Role dropdown then click "Basic Execution Role". This will pop out a new window.
9. Select IAM Role, then select option "Create a new IAM Role"
10. Name the role `lambda_cfn_api_gateway_resource` (or something descriptive)
11. Click "View Policy Document", click "Edit" on the right, then hit "OK"
12. Copy and paste the [`./execution-policy.json`](./execution-policy.json) document.
13. Hit "Allow". The window will close. Go back to the first window if you are not already there.
14. Click "Create Function". Finally, done! Now go to [Usage](#usage) or see [the example template](./example.template.json). Next time, stick to the instant deploy script.


#### Miscellaneous

##### Collaboration & Requests

Submit pull requests or Tweet [@ayetempleton](https://twitter.com/ayetempleton) if you want to get involved with roadmap as well, or if you want to do this for a living :)


##### License

[MIT](./License)


##### Want More CloudFormation or API Gateway?

Work is (extremely) active, published here:  
[Andrew's NPM Account](https://www.npmjs.com/~andrew-templeton)
