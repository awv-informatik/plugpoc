# Configurator prototype

A simple proof of concept for a configurator integration with buerli and ClassCAD.


## Installation

### Install dependencies

Make sure `yarn 1` is installed.
```
npm i -g yarn@1.22
```

Afterwards install all dependencies of this monorepo by running the following command in the root package.
```
yarn install
```

### Get the required application file for classcad

Go to [buerli.io](https://buerli.io), sign up for a **user account** and download the required application package. Copy the downloaded `ccapp` to the folder `packages/cad` and rename it to `BaseModeling.ccapp`


## Start the CAD Server

### Windows

If you are on Windows, you can start the classcad server from the root package.
```
yarn start:cad
```

The server should now be available at [http://localhost:8182](http://localhost:8182/status).

### Docker

You can also run the linux build of the ClassCAD Server in a Docker container. A configuration is available in `packages/cad` and can be executed by running the following docker compose command.
```
docker compose -f "packages\cad\docker-compose.yml" up -d --build
```

The server should now be available at [http://localhost:8182](http://localhost:8182/status).


Stop the docker container again:
```
docker compose -f "packages\cad\docker-compose.yml" down
```

## Start the Client

Just start the development server and open the URL http://localhost:3000. Please note that it may take a moment until the development server is online.

```
yarn start:web
```
