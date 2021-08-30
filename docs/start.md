# Development

Please read our [contributing guidelines](https://github.com/facebookresearch/dynabench/blob/main/CONTRIBUTING.md) to understand how to setup your development environment including
`pre-commit` hooks.

## Enabling backend

First clone the repo using:

```
git clone git@github.com:facebookresearch/dynabench.git
cd dynabench
```

### Prerequisites

We recommend using Conda to create an environment for the backend and easily managing the dependencies.

```
conda create -n dev python=3.7
conda activate dev
pip install -r requirements.txt
```

This will install all of the dependencies required by the backend server.

Next step is to create config.py. For starter, copy `config.py.example`.

```
cd api/common
cp config.py.example config.py
cd ../
```

Next step is to install mysql to run the database locally, on mac, we recommend using [homebrew](https://docs.brew.sh/Installation)
```
brew install mysql@5.7
brew link --force mysql@5.7
```
This will ask for the password of the root user while installation so keep that handy.

Launch MySQL using the command:

```
brew services start mysql@5.7
mysql -u root -p
```

This will ask for the password, fill that in and you will reach a consolve.

Input the following SQL commands to create the `dynabench` user:

```
CREATE USER 'dynabench'@'localhost' IDENTIFIED BY 'dynabench';
CREATE DATABASE dynabench;
USE dynabench;
```

After these queries, ask for an admin for the latest dump of the db so that you can source that in. For now,
let's assume that this dump is in a file called `dump.sql`. Run the following commands:

```
source dump.sql
GRANT ALL PRIVILEGES ON dynabench.* TO 'dynabench'@'localhost';
```

After this, you need to setup the SSL certificates which can be specified in the config. [TODO: Make this optional]

Run the server by `python server.py dev`. You may face RuntimeError regarding missing datasets, please
ask an admin to provide you those.

### Frontend

To install and run frontend, we recommend using [nvm](https://github.com/creationix/nvm) to manage
and install node versions.

```
cd ..
cd frontends/web/
nvm install latest
nvm alias default latest
nvm use latest
npm install
echo 'REACT_APP_API_HOST = "http://localhost:8081"' >> .env
npm start
```
