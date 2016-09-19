#!/usr/bin/env node

const AWS = require('aws-sdk');
const childProcess = require('child_process');

const env = process.argv[2] || 'dev';
console.log(`env=${env}`);
const correctLoginToken = process.argv[3] || 'login_token';

const functionName = `number-switcher-3000-auth-lambda_${env}`;

process.on('unhandledRejection', reason => {
  throw new Error(reason);
});

function convertBase64ToAscii(b64) {
  return new Buffer(b64, 'base64').toString('ascii');
}

AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

function invokeLambdaAsync(params) {
  return new Promise((resolve, reject) => {
    lambda.invoke(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

new Promise(resolve => {
  const deployProcess = childProcess.spawn(
    'npm',
    [
      'run', 'node-lambda', '--', 'deploy',
      '--functionName', functionName,
      '--region', 'us-east-1',
      '--role', `arn:aws:iam::762636538502:role/number-switcher-3000-auth-lambda_${env}`,
      '--configFile', 'deploy.env'
    ],
    { stdio: 'inherit' }
  );
  deployProcess.on('close', code => {
    if (code !== 0) {
      throw new Error('Deploying function failed');
    }
    resolve();
  });
})
  .then(() =>
    invokeLambdaAsync({
      FunctionName: functionName,
      Payload: JSON.stringify({ loginToken: correctLoginToken }),
      LogType: 'Tail'
    })
  )
  .then(data => {
    console.log(data);
    if (data.FunctionError) {
      console.log(convertBase64ToAscii(data.LogResult));
      throw new Error('Unexpected error with correct token');
    }

    return invokeLambdaAsync({
      FunctionName: functionName,
      Payload: JSON.stringify({ loginToken: 'incorrect' })
    });
  })
  .then(data => {
    console.log(data);
    if (data.FunctionError !== 'Handled') {
      throw new Error('Incorrect token should have error');
    }

    const deserializedPayload = JSON.parse(data.Payload);
    if (deserializedPayload.errorMessage !== 'Incorrect token') {
      throw new Error('Wrong error with incorrect token');
    }

    return invokeLambdaAsync({
      FunctionName: functionName,
      Payload: JSON.stringify({ login_token: 'wrong parameter name' }) // eslint-disable-line camelcase
    });
  })
  .then(data => {
    console.log(data);
    if (data.FunctionError !== 'Handled') {
      throw new Error('Wrong parameter name should have error');
    }

    const deserializedPayload = JSON.parse(data.Payload);
    if (deserializedPayload.errorMessage !== 'Missing `loginToken` parameter') {
      throw new Error('Wrong error with incorrect parameter name');
    }
  })
  .catch(err => {
    console.error(`Failed with: ${err}`);
    process.exit(1); // eslint-disable-line no-process-exit
  });
