# Development

Please read our [contributing guidelines](https://github.com/facebookresearch/dynabench/blob/main/CONTRIBUTING.md) to understand how to setup your development environment including `pre-commit` hooks.

## Clone the repository

First, clone the repo using:

```
git clone git@github.com:facebookresearch/dynabench.git
cd dynabench
```

## Backend

The backend is written in Python and requires a locally installed MySQL database.

### Prerequisites

We recommend using Conda to create an environment for the backend and easily managing the dependencies. The following will install all of the dependencies required by the backend server:

```
conda create -n dev python=3.7
conda activate dev
pip install -r requirements.txt
```

Next, follow these [instructions to install MySQL](database.md).

### Configuration

Set up your SSL certificates, e.g.:

```
mkdir ~/.ssl
cd ~/.ssl
openssl req -newkey rsa:2048 -x509 -new -nodes -keyout local-cert.key -out local-cert.crt -subj /CN=test1 -sha256 -days 365 -addext "extendedKeyUsage = serverAuth"
cat local-cert.key local-cert.crt > local-cert.pem
chmod 600 *
```

### Setting up the API server

Run the installation script to create your configuration files and ensure all outstanding database migrations are marked as completed:

```
cd api
python install.py 
```

### Running the API server

Run the server:

```
cd api
python server.py dev
```

Your API backend should now be running at https://localhost:8081. If you just generated a local and unverified certificate, you may need to tell your browser it's okay to proceed.

## Frontend

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
