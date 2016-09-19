# Number Switcher 3000 Auth Lambda

An AWS Lambda function meant to be used by a Number Switcher 3000 user interface to get temporary IAM credentials provided the correct login token is specified as part of the event payload.

## AWS IAM setup

- Create an IAM role for the Lambda function to run as
- Create an IAM role for an authenticated user using the UI to run as
- Establish a trust relationship on the UI role to allow the Lambda role to assume that role

E.g. on the UI role:

```JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::762636538502:role/number-switcher-3000-auth-lambda_dev"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

- Add a policy on the Lambda role to allow assuming the UI role

E.g., on the Lambda role:

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::762636538502:role/number-switcher-3000-ui_dev"
        }
    ]
}
```
