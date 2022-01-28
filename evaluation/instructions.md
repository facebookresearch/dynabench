### WIP: DEFINE PROD AWS ACCOUNT OWNER ID = {prod_aws_account_owner_id}
# Task Owner Setup
In this document, we will go through how to set up a decentralized task on Dynabench (https://dynabench.org/), from a blank AWS account.

# Setup the EC2 instances to run build/evaluation server

To run a decentralized task, you will need to run a build server and an evaluation server in your AWS environment. To do that, do the following:

1. Navigate to your AWS account
2. Go to `EC2` service in AWS
3. Go to the `Instances` tab
4. Click `Launch Instances` (the orange button on the top right)
5. When the prompt asks you to choose an AMI, paste the following in the search bar: `ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-20201026`, and select that image (Choose the search result  in “Community AMIs”)
6. When the prompt asks you to choose an Instance Type, choose `T2.2xlarge`
7. Then click `Configure Instance Details`, do NOT click `Review and Launch Instance`
8. Don’t change any settings in the `Configure Instance` prompt, click `Next: Add Storage`
9. Put `128` in the `GiB` field
10. Then click `Review and Launch`

After launching the EC2 instance, make sure to download the `.pem` file and keep it somewhere secure on your laptop. We will refer to the path of this file as `{PEM_FILE_PATH}` here onwards. Also, find the IPv4 address of your instance (click on `Instances`, click on the instance you just created, and in the panel that pops up below click `Networking` and the IPv4 address will appear under `Public IPv4 address`). We will refer to this as `{EC2_IPV4_ADDRESS}`.

# Setup Code
SSH into your EC2 instance by running `ssh -i {PEM_FILE_PATH} ubuntu@{EC2_IPV4_ADDRESS}`. For example, the command might look like:
```
ssh -i ~/Documents/key.pem ubuntu@34.283.179.343
```

In this instance, we will first be setting up the environment using Anaconda:
1. `cd` into `/tmp`
2. Download Anaconda by running `curl -O https://repo.anaconda.com/archive/Anaconda3-2021.05-Linux-x86_64.sh` (this should be the right Anaconda package for the ubuntu image we downloaded above, but if not feel free to download the right package)
3. Run `bash Anaconda3-2021.05-Linux-x86_64.sh` to install Anaconda
4. The bash script will ask you where to download Anaconda. Choose the default option (you can just press ENTER here)
5. The bash script will ask whether to automatically run `conda init`. Choose Yes (you can enter `Y`)
6. The bash script should finish installing. Then run `source ~/.bashrc` to activate the conda install

Now we will clone the Dynabench github repo, to finish setting up the environment:
1. `cd` into your home directory (or just enter `cd`). This should be `/home/ubuntu` (you can check your current working directory by entering `pwd`)
2. Run `git clone https://github.com/facebookresearch/dynabench.git`
3. Run `cd dynbench`
4. Run `conda create -n dev python=3.7`
5. Run `conda activate dev`
6. Run `pip install -r requirements.txt`
7. Run `cd dynabench/builder`
8. Run `pip install -r requirements.txt`

At this point we have our environment setup, but we still have to create and fill out the config files for running the build and evaluation servers.

# Setup config files
To run the build and evaluation servers, we have to pull AWS keys and other relevant information from a config file.

## Setting up `build_config`
1. `cd ~/dynabench/builder`
2. Open a file called `build_config.py` with your favorite text editor, or by just entering `vim build_config.py`
3. Enter the following template to fill out
```
build_config = {
   "aws_access_key_id": "",
   "aws_secret_access_key": "",
   "aws_region": "",
   "sagemaker_role": "",
   "gateway_url": "",
   "queue_dump": "queue.dump",
   "builder_sqs_queue": "",
   "evaluation_sqs_queue": "",
   "DYNABENCH_API": "",
   "decen_eaas_secret": ""
}
```
### IAM specifications
First, we will be setting up the IAM user/roles needed to fill out the `aws_access_key_id`, `aws_secret_access_key` and `sagemaker_role` above. Create a custom policy with the following config (we will call this the `task_owner_policy` - this name is not important, but we will be attaching this policy to a user/role later on).
```
{
    "Version": "2020-10-20",
    "Statement": [
        {
            "Sid": "TaskOwnerPolicy",
            "Effect": "Allow",
            "Action": [
                "ecr:PutImageTagMutability",
                "ecr:StartImageScan",
                "ecr:ListTagsForResource",
                "ecr:UploadLayerPart",
                "ecr:BatchDeleteImage",
                "ecr:ListImages",
                "ecr:DeleteRepository",
                "ecr:CompleteLayerUpload",
                "ecr:DescribeRepositories",
                "ecr:DeleteRepositoryPolicy",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetLifecyclePolicy",
                "ecr:PutLifecyclePolicy",
                "ecr:DescribeImageScanFindings",
                "ecr:GetLifecyclePolicyPreview",
                "ecr:CreateRepository",
                "ecr:PutImageScanningConfiguration",
                "ecr:GetDownloadUrlForLayer",
                "ecr:GetAuthorizationToken",
                "ecr:DeleteLifecyclePolicy",
                "ecr:PutImage",
                "ecr:BatchGetImage",
                "ecr:DescribeImages",
                "ecr:StartLifecyclePolicyPreview",
                "ecr:InitiateLayerUpload",
                "ecr:GetRepositoryPolicy",
                "iam:GetRole"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::*"
        }
    ]
}
```

Now, we will be creating an execution role for Sagemaker (this is a part of AWS) to deploy models on your account's behalf. Create a new role with the name `sagemaker_role`, and attach two policies:
1. ` AmazonSageMakerFullAccess` (this is a default policy that AWS provides)
2. `task_owner_policy` from above

After you've created the role, add a trust relationship for sagemaker to this role. **This step is important**, without it, you will get `InternalFailure` thrown from AWS without any stack trace as to what is going wrong. To do add a trust relationship, navigate to your role, click on the tab that says `Trust Relationship`, click on `Edit Trust Relationship` which will popuop an interface to enter JSON, and add a section under `Statements` as follows:
```
{
    "Effect": "Allow",
    "Principal": {
        "Service": "sagemaker.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
}
```
This might not be the only thing in your JSON depending on how your account is setup, but this portion should be one of the dictionaries under `Statements`. For example, a full JSON might look like:
```
{
  "Version": "2012-10-17",
  "Statement": [
     {
      "Effect": "Allow",
      "Principal": {
        "Service": "sagemaker.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "other service"
        ]
      },
      ... (rest of the file)
    }
  ]
}
```

Finally, we will be creating the main user. Create a user with the name `dynabench_task_owner` and attach the following policies:
1. `AmazonSQSFullAccess`
2. `AmazonEC2ContainerRegistryFullAccess`
3. `AmazonS3FullAccess`
4. `AmazonSageMakerFullAccess`
5. `task_owner_policy` (the policy you made above)

Once you've created this user, navigate to the `Security Credentials` tab and click `Create access key`. This will create an access key id, and and access key secret. Copy these into the `build_config` file. Then add the name of the sagemaker execution role you created (if you followed our name suggestion, this will be `sagemaker_role`) to the `sagemaker_role` field in `build_config`. At this point, your `build_config` file should look like:

```
build_config = {
   "aws_access_key_id": THIS SHOULD BE FILLED,
   "aws_secret_access_key": THIS SHOULD BE FILLED,
   "aws_region": "",
   "sagemaker_role": THIS SHOULD BE FILLED,
   "gateway_url": "",
   "queue_dump": "queue.dump",
   "builder_sqs_queue": "",
   "evaluation_sqs_queue": "",
   "DYNABENCH_API": "",
   "decen_eaas_secret": ""
}
```

### SQS queue specification
To recieve messages to build and evaluate models, Dynabench uses SQS. This portion is simple, we just have to create two SQS queues. To do this:
1. Navigate to SQS in the AWS console
2. Click on `Create Queue`
3. In the `Name` section, enter `dev-build`
4. Under `Access policy`, and under `Define who can send messages to the queue`, choose the `Only the specified AWS accounts, IAM users and roles`
5. In the right hand column, you should see a portion that looks like:
```
    {
      "Sid": "__sender_statement",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          ""
        ]
      },
      "Action": [
        "SQS:SendMessage"
      ],
      "Resource": "arn:aws:sqs:us-west-1:{YOUR_AWS_ACCOUNT_ID}:dev-build"
    }
```
Fill in the `AWS` string with `"arn:aws:iam::{prod_aws_account_owner_id}:root"` and change allows action from `"SQS:SendMessage"` to `"SQS:*"`. Your final access policy should look something like:
```
{
  "Version": "2020-10-20",
  "Id": "__default_policy_ID",
  "Statement": [
    {
      "Sid": "__owner_statement",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::{YOUR_AWS_ACCOUNT_ID}:root"
      },
      "Action": "SQS:*",
      "Resource": "arn:aws:sqs:us-west-1:{YOUR_AWS_ACCOUNT_ID}:dev-build"
    },
    {
      "Sid": "__sender_statement",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::{prod_aws_account_owner_id}:root"
      },
      "Action": "SQS:*",
      "Resource": "arn:aws:sqs:us-west-1:{YOUR_AWS_ACCOUNT_ID}:dev-build"
    }
  ]
}
```

Repeat the exact steps above to create another queue, and name it `dev-eval`.

Then add `dev-build` to your build config under `builder_sqs_queue`. Then add `dev-eval` to your build config under `evaluation_sqs_queue`. Your `build_config` should then look something like:


```
build_config = {
   "aws_access_key_id": THIS SHOULD BE FILLED,
   "aws_secret_access_key": THIS SHOULD BE FILLED,
   "aws_region": "",
   "sagemaker_role": THIS SHOULD BE FILLED,
   "gateway_url": "",
   "queue_dump": "queue.dump",
   "builder_sqs_queue": THIS SHOULD BE FILLED,
   "evaluation_sqs_queue": THIS SHOULD BE FILLED,
   "DYNABENCH_API": "",
   "decen_eaas_secret": ""
}
```

### Filling in `gateway_url`
To securely talk to Sagemaker model endpoints, Dynabench uses API Gateway.


### Filling in the rest of the config
To fill the rest of `build_config` in, you can put your AWS account region under `aws_region`. To find this, in the AWS console in the very top bar right next to the account drop down, there will be a region name. Click on it, and it will show the region (it will look something like `us-west-1` or `us-east-1`).

For `DYNABENCH_API`, simply put ` "https://api.dynabench.org"`.

For `decen_eaas_secret`, navigate to your task on the main dynabench website (`https://dynabench.org`). Go to task settings, and check the box that says `"Is this a Decentralized Task?"`. As soon as you check that, a field should appear underneath containing your `decen_eaas_secret`. Copy that string, and paste it into the `build_config`.

## Filling in `eval_config`
Just like `build_config`, we have a config file to run the evaluation server. Much of the work we did to setup `build_config` will be copied over:
1. `cd ~/dynabench/evaluation`
2. Use your favorite text editor to create a file named `eval_config.py` (or just enter `vim eval_config.py`)
3. Paste in the following template:
```
eval_config = {
    "aws_access_key_id": "",
    "aws_secret_access_key": "",
    "aws_region": "",
    "sagemaker_role": "",
    "dataset_s3_bucket": "",
    "evaluation_sqs_queue": "",
    "scheduler_status_dump": "scheduler.dump",
    "computer_status_dump": "computer.dump",
    "max_submission": 20,
    "eval_server_id": "default",
    "compute_metric_processes": 1,
    "DYNABENCH_API": "",
    "task_code": "",
    "decen_eaas_secret": "",
}

```
Fill in `aws_access_key_id`, `aws_secret_access_key`, `aws_region`, `sagemaker_role`, `evaluation_sqs_queue`, `DYNABENCH_API`, and `decen_eaas_secret` as we did above. At this point, we only have two fields left to fill in: `task_code` and `dataset_s3_bucket`.

To fill in `dataset_s3_bucket`, just create an S3 bucket through the AWS console, give it any name, and paste that name into this field.

To fill in `task_code`, navigate to the home page of your task on `https://dynabench.org` and look at the URL - the last portion of the URL will be your `task_code`.

## Running build and evaluation servers
That's it! You're done wih set up. Now we just run the the servers on two screens on your EC2 instance. Specifically:

1. Run `screen -S build`. This will take you into a new screen (you will see your terminal window clear out)
2. Re-activate the conda environment by entering `conda activate dev`
3. Run `cd ~/dynabench/builder`
4. Run `python build_server_decen.py`
5. Exit the screen by pressing the keys `Ctrl-A` followed by `D`

Then run the evaluation server:
1. Run `screen -S eval`. This will take you into a new screen (you will see your terminal window clear out)
2. Re-activate the conda environment by entering `conda activate dev`
3. Run `cd ~/dynabench/evaluation`
4. Run `python eval_server_decen.py`
5. Exit the screen by pressing the keys `Ctrl-A` followed by `D`


Now finally, navigte to your task on `https://dynabench.org` and navigate to the task settings. Ensure the following:
1. `Is this a Decentralized Task?` is checked
2. The name of your build queue is entered in `Build queues`
3. The name of your evaluation queue is entered in `Eval queues`
4. Your AWS account ID is entered in `Task Owner AWS Account ID`
5. Hit `Save` to ensure these changes take place

And that's it! Your task is officially decentralized and your AWS account will handle all the building/evaluation of models. Congrats on making it to the end!
