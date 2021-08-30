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

The next step is to create config.py. As a start, copy `config.py.example` and edit accordingly:

```
cd api/common
cp config.py.example config.py
cd ../
```

After this, you need to setup the SSL certificates which can be specified in the config. [TODO: Make this optional]

### Running the API server

Run the server:

```
python server.py dev
```

Your API backend should now be running at https://localhost:8081.

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
