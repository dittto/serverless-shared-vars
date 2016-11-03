# Serverless shared variables

This is a Serverless 1.0 plugin for sharing variables between the `serverless.yml` config and your codebase.

[![Build Status](https://travis-ci.org/dittto/serverless-shared-vars.svg?branch=master)](https://travis-ci.org/dittto/serverless-shared-vars) [![Coverage Status](https://coveralls.io/repos/github/dittto/serverless-shared-vars/badge.svg)](https://coveralls.io/github/dittto/serverless-shared-vars) [![npm](https://badge.fury.io/js/serverless-shared-vars.svg)](https://www.npmjs.com/package/serverless-shared-vars)

## How to use

First you'll need to setup your the values in your `serverless.yml`. This is done by adding any data you want to `custom > shared`. Everything referenced in https://serverless.com/framework/docs/guide/serverless-variables/ should be feasible to use in this:

```
custom:
  shared:
    stage: ${opt:stage, self:provider.stage}
    one:
      - two
      - three
    four:
      -
        five: six
        seven: eight
      -
        nine: ten
        eleven: twelve
    extras: ${file(myCustomFile.yml)}
```

Then add the following code to when you want access to the custom variables:

```
const SharedVars = require('serverless-shared-vars').get();
```

You can now access the same variables in both your `serverless.yml`:

```
PageQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:custom.shared.stage}-page-queue
```

And in your code:

```
console.log(SharedVars.stage);
```
