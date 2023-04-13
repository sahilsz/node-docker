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
