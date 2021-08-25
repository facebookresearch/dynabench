#!/bin/sh
# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script is to bootstrap the deployment of dynabench
# This script has to be placed in the root and it should
# not be placed inside the dynabench folder.
# Nginx default file to be replaced with the generated nginx config
# at the end of the script to get it exposed in the 80 port.
# Run the script in your terminal as
# bash bootstrap.sh

# Frontend environment Requirement:
# Node - v12.16.1
# NGINX

# pip3 core dumped issue fix [not recommended]
rm -rf ~/.local

set -e

PYTHON_VERSION=3.6
HOME_PATH=dynabench
API_PATH=dynabench/api
API_CONFIG_PATH=dynabench/api/common
WEB_PATH=dynabench/frontends/web/
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color
YELLOW='\033[1;33m'

echo "Checking if node is present ..."
# Check if node is present
if which node > /dev/null
    then
        echo "node is installed, skipping..."
else
    echo "Node is not installed"
    echo "Ref: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04"
    exit 1
fi

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Check if nvm is present"
# Check if node version manager is installed
# If present setting node to latest version
. ~/.nvm/nvm.sh
command -v nvm
if [ $? -eq 0 ]; then
	echo "NVM is installed"
	nvm install v12.16.1
    nvm use v12.16.1
else
    echo "NVM is not installed"
    echo "Ref: https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04"
    exit 1
fi

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

#Checking if python3 installed or not
echo "Checking if Python3 is installed ..."
command -v python3 > /dev/null
if [ $? -eq 0 ]; then
  echo "Python3 is installed"
  # Verifying if python3.6 or above is installed
  echo "Checking the compatible version of Python3 ..."
  SYSTEM_PYTHON_VERSION=$(python3 --version | awk '{print $2}')
  if [ "$SYSTEM_PYTHON_VERSION" \< "$PYTHON_VERSION" ];
  then
    echo "This application needs Python3.6 or above for running the api"
  else
    echo "Compatible Python version found."
  fi
else
  echo "Python3 not found. Please install python >= 3.6 and pip3 ..."
  exit 1
fi

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

#Checking if mysql5.7 installed or not
echo "Checking if Mysql5.7 is installed ..."
command -v mysql > /dev/null
if [ $? -eq 0 ]; then
  echo "Mysql is installed"
  echo "Checking the version of Mysql ..."
  SYSTEM_MYSQL_VERSION=$(mysql --version | awk '{print $5}')
  echo "$SYSTEM_MYSQL_VERSION"
  if [[ $SYSTEM_MYSQL_VERSION == *"5.7"* ]]; then
    echo "Compatible Mysql version found."
  else
    echo "This application needs Mysql 5.7"
    echo "Ref : https://dev.mysql.com/downloads/mysql/5.7.html"
    exit 1
  fi
else
  echo "Mysql is not installed"
  echo "This application needs Mysql 5.7"
  echo "Ref : https://dev.mysql.com/downloads/mysql/5.7.html"
  exit 1
fi

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

#Checking if the repo is already cloned, if not cloning it.
DIR="dynabench"
if [ ! -d "$DIR" ]; then
    echo "Cloning Repo ..."
    read -p "Git username:" username
    read -p "Git password:" token
    eval "git clone https://$username:$token@github.com/facebookresearch/dynabench.git"
fi

echo "Navigating to Frontend - Web ..."
#dynabench/frontends/web/
pushd $HOME_PATH
echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Checking out changes ..."
git checkout .

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Switching to Master branch ..."
git checkout master

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Pulling latest from Master branch ..."
git pull

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

# checking requirement.txt and logs folder in home path
echo "Checking if requirements.txt file is present ..."
if [ ! -f requirements.txt ];then
  echo -e "${RED}requirements.txt file missing${NC}"
  exit 1
fi
echo "requirements.txt file is present"

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Checking if logs folder is present ..."
if [ ! -d logs ]; then
  echo "logs folder is missing"
  echo "creating logs folder in $HOME_PATH"
  mkdir logs
else
  echo "logs folder is present, skipped ..."
fi

popd  > /dev/null

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Checking if data directory is present ..."
pushd $API_PATH > /dev/null
if [ ! -d data ]; then
  echo -e "${RED}Missing data folder with anli_v1.0 and aqa_v1.0 in the location $API_PATH. Please add it and re-run the scripts ${NC}"
  exit 1
fi
echo "data directory is present at $API_PATH"
cd data
if [ ! -d anli_v1.0 ]; then
  echo -e "${RED} Missing anli_v1.0 folder in data directory${NC}"
  echo -e "${GREEN}place anli_v1.0 folder in data directory and Re-run the script${NC}"
  exit 1
fi
if [ ! -d aqa_v1.0 ]; then
  echo -e "${RED} Missing aqa_v1.0 folder in data directory${NC}"
  echo -e "${GREEN}place aqa_v1.0 folder in data directory and Re-run the script${NC}"
  exit 1
fi
cd ..
popd > /dev/null

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Checking if config.py file is present ..."
pushd $API_CONFIG_PATH > /dev/null
if [ ! -f config.py ];then
  echo "config.py file is missing"
  echo "creating config.py file in $API_CONFIG_PATH"
  cp config.py.example config.py
  echo -e "${YELLOW}Config.py file created ${NC}"
  echo -e "The configuration file requires the below information. Please update appropriate details in the file ${YELLOW}$API_CONFIG_PATH/config.py${NC}"
  echo "
  # Configuration for api service dependancy modules
  config = {
        'jwtsecret': '', # JWT token secret value
        'jwtexp': 15*60, # in seconds (15 minutes) # JWT token expiry time
        'jwtalgo': '', # JWT Secret and token generation algorithm. By default sets to HS256
        'cookie_secret': '', # Client cookie set with secret value
        'refreshexp': 90, # in days # JWT refresh token expiry
        'db_host': 'localhost', # Change as required (aws rds)
        'db_name': '', # Mysql 5.7 database name
        'db_user': '', # Mysql 5.7 database user name
        'db_password': '', #Mysql 5.7 database password
        'forgot_pass_template': 'common/forgot_password.txt',
        'smtp_host': '', # Mail service - SMTP server host
        'smtp_port': 587, # SMTP Port - 587, 443
        'smtp_user': '', # SMTP server username
        'smtp_secret': '',# SMTP server password
        'aws_access_key_id': '', # AWS access key for S3 and sagemaker access for application id
        'aws_secret_access_key': '', # AWS access key secret for application id
        'aws_region': '', # AWS region
        'aws_s3_bucket_name': '', # AWS s3 bucket name to store profile picture
        'aws_s3_profile_base_url': '', # AWS s3 base url for profile picture upload
        'profile_img_max_size': 5 * 1024 * 1024, # 5 MB
        'ssl_cert_file_path': '', # Configuring the ssl certificate path
        'ssl_org_pem_file_path': ''
        }
  "
  echo "Once you have configured all the above configurations"
  echo -e "${GREEN}Please re-run the script ${NC}"
  echo ""
  echo "++++++++++++++++++++++++++++++++++++++++"
  echo ""
  exit 1
else
  echo "config.py file is present"
  echo -e "${YELLOW}Please make sure the config file has right values ${NC}, continuing setup ..."
fi
echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""
popd > /dev/null

echo "Configuring App mode ..."
pushd $API_PATH > /dev/null
# read -p "Enter server mode (dev or prod):" mode
# if [[ ! $mode =~ ^(dev|prod)$ ]]; then
#   echo -e "${RED}Invalid mode${NC} entered. By default it starts with ${GREEN}dev${NC} mode."
#   mode='dev'
# fi
# This script is for running in prod
mode='prod'

# checking server is running
res=`ps -ef | grep -v grep | grep "server.py $mode" | awk '{print $2}'`
if [[  ! -z  $res ]]; then
  echo -e "${RED}Server already running in $mode mode at pid $res. Killing."
  kill -9 $res
  #echo -e "${RED}Server already running in $mode mode. Please stop that and re-run the script${NC}"
  #exit 1
fi
popd > /dev/null

pushd $WEB_PATH

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""
echo -e "${GREEN}UI server setup started ...${NC}"
echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

#echo "Cloning .env from .env.example ..."
#cp .env.example .env
#
#echo ""
#echo "++++++++++++++++++++++++++++++++++++++++"
#echo ""

API_HEALTH_CHECK="http://localhost:8080/"
REACT_APP_API_HOST="https://api.dynabench.org"
if [[ $mode == 'dev' ]]; then
  API_HEALTH_CHECK="http://localhost:8081/"
  REACT_APP_API_HOST="http://localhost:8081"
fi

#echo "REACT_APP_API_HOST=$REACT_APP_API_HOST" > .env
echo "Setting env ..."
cat .env
# fi

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Installing dependencies ... "
npm install

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""
echo "Building application ..."
npm run build

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

BUILD_DIR=$(pwd)

echo "Checking if NGINX is running ..."
echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""
if [ -e /var/run/nginx.pid ]; then
    echo "NGINX is running ..."
    echo ""
    echo "++++++++++++++++++++++++++++++++++++++++"
    echo ""
    echo "*Skip if already done."
    echo ""
    echo -e "${YELLOW}Configure NGINX:${NC}"
    echo -e "${YELLOW}Open the file /etc/nginx/sites-available/default${NC}"
    echo -e "${YELLOW}Replace the entire config with the below generated config and save it.${NC}"
    echo "
# Default server configuration
server {
        listen 80 default_server;
        listen [::]:80 default_server;

        location / {
            expires 365d;
            add_header Cache-Control 'public, no-transform';
            root $BUILD_DIR/build;
            try_files \$uri /index.html;
        }

}"
    echo -e "${YELLOW}Restart the NGINX server to reflect the changes by using the below command${NC}"
    echo -e ""
    echo -e "     ${RED}sudo service nginx restart${NC}"
    echo -e ""
    echo -e "${YELLOW}Note: Static files generated will be served through NGINX at port 80${NC}"
else
    echo "Please check if NGINX is running to serve the built static files"
    echo "If NGINX is not installed please install and try again"
fi

echo ""
echo ""
#read -p "Waiting for you to setup the NGINX configuration. Enter y if you are done:" isConfigured
# if [[ ! "${isConfigured,,}" =~ ^(y)$ ]]; then
#   echo -e "${RED}Invalid value provided. Please re-run the script${NC}"
#   exit 1
# fi

popd

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

pushd $HOME_PATH

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""
echo -e "${GREEN}API server setup started ...${NC}"
echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

echo "Installing required python modules ..."
pip3 install -r requirements.txt
popd > /dev/null

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

pushd $API_PATH > /dev/null
echo -e "Starting API Server in the mode - ${YELLOW}$mode${NC} ..."
nohup python3 server.py $mode > server.log 2>&1 &

# Sleep script for 5 seconds to start server in nohup thread
sleep 5
set +e

echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""

response=`curl -s -o /dev/null --write-out %{http_code} -H 'Origin:https://www.dynabench.org/' $API_HEALTH_CHECK`
if [[ $response == 200 ]]; then
  echo -e "${GREEN}Server started successfully${NC}"
else
  echo -e "${RED}Failed to start server ${NC}"
  echo "The root cause is :"
  error_status=watch tail -n 15 server.log
  echo -e "${RED} $error_status ${NC}"
  echo -e "${RED}Server exit with error${NC}. To Know further detail, inspect the ${YELLOW}server.log${NC} manually"
fi
echo ""
echo "++++++++++++++++++++++++++++++++++++++++"
echo ""
