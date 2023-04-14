# Node-Docker

## Initializing Project

Initializing a new Node.js project.
`npm init`

Installing dependency
`npm install express`

Setting up an express app

```js
# index.js
const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("<h2>Hi There &#9995</h2>");
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`));

```

## Integrating our express app into a docker container

Now we are going to integrate our express app into a docker container and set up a workflow so that we can move to developing our app exclusively within the docker container instead of developing on our local machine.

### Creating our own custom image

Dockerfile is going to be a set of instruction that docker is going to run to create our own customized image.
`touch Dockerfile`

WORKDIR sets the working dir of our container. Setting the WORKDIR is very helpful because any time we run a command when you set a WORKDIR it's going to run that command from this directory.
so we can run `node index.js` and it going to run it automatically in /app without us having to specify

## Building docker image

```dockerfile
# Dockerfile
FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install
COPY . /app/
EXPOSE 3000
CMD ["node", "index.js"]
```

Expose 3000 here doesn't means to expose port, this line actually does nothing. This is more for documentation purposes. If we delete this line then it will not impact our container in any way it perform.
Building an Image
`docker build -t node-app-image .`

Running the node-app-image container
`docker run -d -p 3000:3000 --name node-app node-app-image`

## Syncing source code with volumes

Volumes allow us to have persistent data in our containers.
There is a special volume called bind mount. It allows to sync a folder in our local host machine to a folder within our docker container.
So we don't have to continuously rebuild our image and redeploy a container every time we make a change. This will automatically sync those for us to speed up the development process.
`docker run -d -p 3000:3000 -v D:\Project\Web\Node\Node-Docker\:/app --name node-app node-app-image`
Shortcuts:

- for cmd
  `docker run -d -p 3000:3000 -v %cd%:/app --name node-app node-app-image`
- for powershell
  `docker run -d -p 3000:3000 -v ${pwd}:/app --name node-app node-app-image`
- for linux
  `docker run -d -p 3000:3000 -v $(pwd):/app --name node-app node-app-image`

### Installing dev dependencies

`npm install --save-dev nodemon`

```json
{
	"name": "node-docker",
	"version": "1.0.0",
	"description": "",
	"main": "index.js",
	"scripts": {
		"test": "echo \"Error: no test specified\" && exit 1",
		"start": "node index.js",
		"dev": "nodemon -L index.js"
	},
	"author": "",
	"license": "ISC",
	"dependencies": {
		"express": "^4.18.2"
	},
	"devDependencies": {
		"nodemon": "^2.0.22"
	}
}
```

### updating our Dockerfile

```dockerfile
FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install
COPY . /app/
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

==IMP==
`docker run -d -p 3000:3000 -v %cd%:/app --name node-app node-app-image`
Syncing our folder with containers WORKDIR results in overwriting our /app folder.
So we're going to create a new volume called _anonymous volume_.

To prevent this issue from happening we can create a new volume mount for /app/node_modules. Using this we can prevent bind mount from overwriting the /app/node_modules folder.
`docker run -d -p 3000:3000 -v ${pwd}:/app -v /app/node_modules --name node-app node-app-image`
So this prevents bind mount to delete the /app/node_modules directory. This opens up a security issue, this will eventually due to bind mount allow the container to create file and folder to the host machine.

## Read-Only Bind mounts

So you don't want your docker container being able to touch or make changes to any of your files.

So to prevent this we can create a **read-only bind mount** which means the docker container will be able to read any files but it can't touch or make changes to any of the files. It's read only.

`docker run -d -p 3000:3000 -v ${pwd}:/app:ro -v /app/node_modules --name node-app node-app-image`
ro - Read Only

## Environment Variables

Passing env variables in the Dockerfile

```dockerfile
FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install
COPY . /app/
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

Passing env variable in the command line
`docker -d -p 3000:4000 -e PORT=4000 --name node-app node-app-image`

Passing env variables from an .env file
`touch env`
`docker -d -p 3000:3000 --env-file ./.env --name node-app node-app-image`

**So whenever we delete a container it preserves the volume because of the volume mounts.**
TO list volumes: `docker volumes ls`
To delete all volumes: `docker volumes prune`
To delete the volume as we delete the container: `docker rm node-app -fv`

## Docker Compose

Docker Compose is a tool that help us define and share multi container applications. With compose we can create a Yaml file to define all the services that have all the steps and configuration and with a single command we can spin everything up or tear it all down.
`touch docker-compose.yaml`

docker-compose.yml

```yaml
version: "3"
services:
  node-app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - /app/node_modules
    # environment: PORT=3000
    env_file: ./.env
```

Running our container
`docker-compose up -d`
`docker-compose down -v`

Even we make some changes in the Dockerfile docker-compose doesn't make a new image and its not intelligent enough to now theres any change or not. So we have to force docker compose to build new image by passing the --build tag
`docker-compose up -d --build`

## Set up docker-compose file to have separate set of commands for production and separate commands for production

**Some people recommend not using the npm command within the container because it's just another layer between node and the container. So for production you may want to run `node index.js` instead of npm start.**

So we can create different docker files and docker-compose.yaml files, so you could have one for production and another for development. And some uses one file for both.

Using one docker file for base configuration and other for development and production.
`docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d`
This is going to load all the configuration from the base file i.e. docker-compose.yaml and then load all the configuration from the docker-compose.dev.yaml file and if it needs to it'll overwrite any of the configuration it's been set to.

`docker-compose -f docker-compose.yaml -f docker-compose.dev.yaml down -v`

**Npm to not install dev dependency we do `npm install --only=production`.**

To let Dockerfile know which env image to build we have to write an embedded bash script in Dockerfile.

```dockerfile
FROM node:18
WORKDIR /app
COPY package.json
ARG NODE_ENV
RUN if [ "$NODE_ENV" = "development" ]; \
        then npm install; \
        else npm install --only=production; \
        fi
COPY . /app/
EXPOSE 3000
CMD ["node", "index.js"]
```

SO here we are referencing $NODE_ENV variable which we have to pass in. So this is an argument that gets passed into our docker file when it's building our docker image and we have to set this value in our docker-compose.yaml file.

```yaml
# docker-compose.dev.yaml
version: "3"
services:
  node-app:
    build:
      context: .
      args:
        NODE_ENV: development
    volumes:
      - ./:/app
      - /app/node-modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

```yaml
# docker-compose.prod.yaml
version: "3"
services:
  node-app:
    build:
      context: .
      args:
        NODE_ENV: production
    environment:
      - NODE_ENV=production
    command: node index.js
```

## Adding mongo container

```yaml
# docker-compose.yaml
# This file will contain shared configuration.
version: "3"
services:
  node-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    # env_file: ./.env

  mongo:
    image: mongo
    environment:
      - MONGO_INITDB_ROOT_USERNAME=darq
      - MONGO_INITDB_ROOT_PASSWORD=1324
    ports:
      - "27017:27017"
    volumes:
      - mongo-db:data/db
```

### Connect to mongo container

`docker exec -it node-docker-mongo-1 bash`
`docker exec -it node-docker-mongo-1 mongosh -u 'username' -p 'password`

Since we are in the container so we can actually connect to the mongo.

```bash
mongosh # to open mongo shell
mongosh -u 'username' -p 'password'  # to connect to mongodb as admin
db  # to get the current database we connected to

# we can create a new database using 'use'
use mydb  # create new db called mydb

show dbs  # to list all the databases
# It will not list mydb because mongo won't list a database until we have a document or entry within that database

mydb.books.insertOne({ "Name" : "Harry Potter" })  # inserts a new entry to books collection

mydb.books.find()  # list all the entries in books collection
```

attaching named volume to mongodb to store db data

```yaml
volumes:
  - mongo-db:/data/db
```

if we try to run it as it is then it will throw an error: 'ERROR: Named volume 'mongo-db:/data/db:rw' is used in service mongo but no declaration was found in the volume sections.

So when it comes to named volumes we have to declare this volume in other portion of our docker compose file and that's because a named volume can be used by multiple services. e.g. we can attach another mongo service to the same exact volume.

```yaml
volumes:
  mongo-db:
```

## Connecting express app to mongodb

`npm install mongoose`

```js
# index.js
const express = require("express");
const mongoose = require("mongoose");

mongoose
	.connect("mongodb://darq:1324@172.18.0.2:27017/?authSource=admin")
	.then(() => console.log("Successfully connected to db."))
	.catch((e) => console.log(e));

const app = express();

app.get("/", (req, res) => {
	res.send("<h2>Hi There &#9995</h2>");
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`));
```

### Connecting containers using their service name

Docker allows containers to talk to other containers within same networks. And with custom networks we have DNS. So when one docker container wants to talk to another docker container we can use the name of that container or name of that service to talk to that container.

So uri could be changed to `mongodb://username:password@containerName/?authSource=admin`

To follow the containers log `docker logs container_name -f`
Inspect network properties `docker network inspect network_name`

## ENV variables

We are going to create a module called config.js which is going to export a variable that's going to store all our ENV variables.

```js
# config/config.js
module.exports = {
  MONGO_IP: process.env.MONGO_IP || "mongo",
  MONGO_PORT: process.env.MONGO_PORT || 27017,
  MONGO_USERNAME: process.env.MONGO_USERNAME,
  MONGO_PASSWORD: process.env.MONGO_PASSWORD,
}

# index.js
const {
	MONGO_USERNAME,
	MONGO_PASSWORD,
	MONGO_IP,
	MONGO_PORT,
} = require("./config/config");

mongoose
	.connect(
		`mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`
	)
	.then(() => console.log("Successfully connected to db."))
	.catch((e) => console.log(e));

# UPDATE docker-compose.dev.yml
environment:
      - NODE_ENV=development
      - MONGO_USERNAME=darq
      - MONGO_PASSWORD=1324
```

## Communicating between containers

So when it comes to starting our docker container using docker-compose we can end up in some potential issues. Such as when we spin up our both the container we don't actually know in which exact order these will spun up.
It can throw an error if our node container spins up first then its going to try and connect to our database. However if our database is not up, it's going to throw an error and then crash our app.

So we need a way to tell docker to load up our mongo container first so that we can ensure that when its up and running only then our node container connect to it.

We can use `depends_on`.

```yml
version: "3"
services:
  node-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    # env_file: ./.env
    depends_on:
      - mongo
```

**To start a specific service**
`docker-compose -f docker-compose.yml up node-app`
This will still start the mongo container because of depends_on. So to only start node-app
`docker-compose -f docker-compose.yml up --no-deps node-app`
