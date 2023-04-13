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

WORKDIR sets the working dir of our container. Setting the WORKDIR is very helpfull because any time we run a command when you set a WORKDIR it's going to run that command from this directory.
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
