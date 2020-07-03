# Frontend

This is the frontend. The Web interface and the MTurk interface serve as
different frontends with shared components.

# Web Interface

## Install dependencies
Go to the Folder frontends/web and run the below command to install dependencies for the web interface.
```sh
$ npm install
```

## Setup
Create a file named `.env` in the folder `frontends/web` with the copy the .env.example file.


## Development
Run application in local [http://localhost:3000/](http://localhost:3000/)
```sh
$ npm start
```

## Deployment
Make sure to you have updated the .env file and build the current application.
```sh
$ npm run build
```