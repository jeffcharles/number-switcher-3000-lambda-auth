const AWS = require('aws-sdk');

const sts = new AWS.STS({ apiVersion: '2011-06-15' });

exports.handler = (event, context, callback) => {
  if (!event.loginToken) {
    callback(new Error('Missing `loginToken` parameter'));
    return;
  }

  if (event.loginToken !== process.env.LOGIN_TOKEN) {
    callback(new Error('Incorrect token'));
    return;
  }

  sts.assumeRole({
    RoleArn: process.env.ROLE_ARN,
    RoleSessionName: 'number-switcher-UI',
    DurationSeconds: 900
  }, (err, data) => {
    if (err) {
      console.error(err);
      callback(new Error('STS error'));
      return;
    }
    callback(null, data.Credentials);
  });
};
