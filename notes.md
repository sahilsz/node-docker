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

## Building a Blog application

### Adding Models

Create a mongoose schema to tell how our post should look like.
If they don't include title, we'll throw an error and say post must have title.

```js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
	title: {
		type: String,
		require: [true, "Post must have title"],
	},
	body: {
		type: String,
		require: [true, "Post must have body"],
	},
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
```

### Controllers

Adding controllers to handle creating, reading, updating and deleting our posts.

```js
const Post = require("../models/postModel");

exports.getAllPosts = async (req, res, next) => {
	try {
		const posts = await Post.find();

		res.status(200).json({
			status: "success",
			results: post.length,
			data: {
				posts,
			},
		});
	} catch (e) {
		res.status(400).json({
			status: "fail",
		});
	}
};

exports.getOnePost = async (req, res, next) => {
	try {
		const post = await Post.findById(req.params.id);
		res.status(200).json({
			status: "success",
			data: { post },
		});
	} catch (e) {
		res.status(400).json({
			status: "fail",
		});
	}
};

exports.createPost = async (req, res, next) => {
	try {
		const post = await Post.create(req.body);
		res.status(200).json({
			status: "success",
			data: {
				post,
			},
		});
	} catch (e) {
		res.status(400).json({
			status: "fail",
		});
	}
};

exports.updatePost = async (req, res, next) => {
	try {
		const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			status: "success",
			data: {
				post,
			},
		});
	} catch (e) {
		res.status(400).json({
			status: "fail",
		});
	}
};

exports.deletePost = async (req, res, next) => {
	try {
		const post = await Post.findByIdAndDelete(req.params.id);
		res.status(200).json({ status: "success" });
	} catch (e) {
		res.status(400).json({ status: "fail" });
	}
};
```

### Routes

```js
const express = require("express");
const postController = require("../controllers/postController");

const router = express();

router
	.route("/")
	.get(postController.getAllPosts)
	.post(postController.createPost);

router
	.route("/:id")
	.get(postController.getOnePost)
	.patch(postController.updatePost)
	.delete(postController.deletePost);

module.exports = router;
```

Adding routes to index.js

```js
const postRouter = require("./routes/postRoutes");

// middleware to read body
app.use(express.json());

app.use("/posts", postRouter);
```

## User signUp and login

We are going to use redis for authentication.

### Adding user model

```js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: [true, "User must have a username"],
		unique: true,
	},
	password: {
		type: String,
		required: [true, "User must have a password"],
		unique: true,
	},
});

const User = mongoose.model("User", userSchema);
module.exports = User;
```

### Add user controllers

```js
// models/userModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: [true, "User must have a username"],
		unique: true,
	},
	password: {
		type: String,
		required: [true, "User must have a password"],
		unique: true,
	},
});

const User = mongoose.model("User", userSchema);
module.exports = User;
// controllers/authController.js
const User = require("../models/userModel");

exports.signUp = async (req, res, next) => {
	try {
		const newUser = await User.create(req.body);
		res.status(200).json({
			status: "success",
			data: {
				user: newUser,
			},
		});
	} catch (e) {
		console.log(e);
		res.status(400).json({
			status: "fail",
		});
	}
};

// routes/userRoutes.js
const express = require("express");
const authControllers = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authControllers.signUp);

module.exports = router;

// index.js
const userRouter = require("./routes/postRoutes");

app.use("/users", userRouter);
```

Hashing the password

```js
// controllers/authController.js
const bcrypt = require("bcryptjs");

exports.signUp = async (req, res, next) => {
	const { username, password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 12);
	// 12 is the salt length to generate, pass a value that is going to be the strength of the hash

	try {
		const newUser = await User.create({
			username,
			password: hashedPassword,
		});
		res.status(200).json({
			status: "success",
			data: {
				user: newUser,
			},
		});
	} catch (e) {
		console.log(e);
		res.status(400).json({
			status: "fail",
		});
	}
};
```

User login

```js
// controllers/authControllers.js
exports.login = async (req, res, next) => {
	const { username, password } = req.body;

	try {
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(404).json({
				status: "fail",
				message: "user not found",
			});
		}

		const isCorrect = await bcrypt.compare(password, user.password);

		if (isCorrect) {
			return res.status(200).json({
				status: "success",
			});
		}

		return res.status(400).json({
			status: "fail",
			message: "incorrect username or password",
		});
	} catch (e) {
		console.log(e);
		return res.status(400).json({
			status: "fail",
		});
	}
};

// routes/userRoutes.js
router.post("/login", authControllers.login);
```

## Handling authentication

Here we are going to store the state when a user logins in our application using sessions.
Implementing authentication in our application so that our user can signUp and login to be able to retrieve post, modify post or delete post.

So there are two ways of handling authentication:

- Sessions
- JWT

So we are going to use `express-session` package to implement session and we can add a redis database. We are going to use _redis database_ to store our sessions.

### Adding redis container

```yaml
# docker-compose.yml

# under mongo
redis:
  image: redis
```

### Initializing the connection with redis database to store sessions

Installing the dependencies
`npm install redis@3.1.2 connect-redis@6.1.3 express-session`

Building new image with new dependencies
earlier we used to docker-compose down and then docker-compose up --build to build a new image and then run the container.

**We can also use docker-compose up --build on running container to build new image with new container added or new dependencies added.**
But when we do docker-compose up --build on running container then our already running container is going to grab the old anonymous volume and our old anon volume has all of our dependencies and packages, So we need to force docker to use a new anonymous volume instead.
`docker-compose up  -d --build -V`

```js
// docker-compose.dev.yml
node-app:
	environment:
      - NODE_ENV=development
      - MONGO_USERNAME=darq
      - MONGO_PASSWORD=1324
      - SESSION_SECRET=secret


// config/config.js
module.exports = {
	MONGO_IP: process.env.MONGO_IP || "mongo",
	MONGO_PORT: process.env.MONGO_PORT || 27017,
	MONGO_USERNAME: process.env.MONGO_USERNAME,
	MONGO_PASSWORD: process.env.MONGO_PASSWORD,
	REDIS_URL: process.env.REDIS_URL || "redis",
	REDIS_PORT: process.env.REDIS_PORT || 6379,
	SESSION_SECRET: process.env.SESSION_SECRET,
};

// index.js
const {
	MONGO_USERNAME,
	MONGO_PASSWORD,
	MONGO_IP,
	MONGO_PORT,
	REDIS_URL,
	REDIS_PORT,
} = require("./config/config");

const redis = require("redis");
const session = require("express-session");
let RedisStore = require("connect-redis")(session);
let redisClient = redis.createClient({
	host: REDIS_URL,
	port: REDIS_PORT,
});

app.use(
	session({
		store: new RedisStore({ client: redisClient }),
		secret: config.SESSION_SECRET,
		cookie: {
			secure: false,
			resave: false,
			saveUninitialized: false,
			httpOnly: true,
			maxAge: 30000,
		},
	})
);
```

### Creating a session when user login

Connecting to redis database

```bash
docker exec -it node-docker-redis-1 bash
or
docker exec -it node-docker-redis-1 redis-cli
redis-cli # this drops us into redis database

# to see all the entries in redis database
KEYS *

# To get details about the keys
GET "KEY" # sess:EUaxAJvvZvf5RDH_BeDNQBNSn4LUQJQR

```

### Adding information to the session

With this session created we can store information whatever we want into this session. So what we want to do is when the user login we want to store user information within this session. That means if users information is in the session then user is logged in otherwise not logged in.

```js
// index.js
// add this to both the controller
req.session = newUser;
```

## Authorizing all the routes

Using express middleware
Middleware is nothing more than a function that runs your controller. This middleware is going to check that session object has user property attached to it and if there is user property then it will forward the req on to the controller, otherwise return failed status.

```js
// middleware/authMiddleware.js
const protect = (req, res, next) => {
	// destructuring the user
	const { user } = req.session;

	if (!user) {
		return res.status(401).json({
			status: "fail",
			message: "unauthorized",
		});
	}

	// optional
	req.user = user;

	next();
};

module.exports = protect;

// routes/postRoutes.js
const protect = require("../routes/postRoutes");

router
	.route("/")
	.get(postController.getAllPosts)
	.post(protect, postController.createPost);
```

## Adding nginx

```yaml
# docker-compose.yml
# This file will contian shared configuration.
version: "3"
services:
  nginx:
    image: nginx:stable-alpine
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro

  node-app:
    build: .
    environment:
      - PORT=3000
    # env_file: ./.env
    depends_on:
      - mongo

  mongo:
    image: mongo
    environment:
      - MONGO_INITDB_ROOT_USERNAME=darq
      - MONGO_INITDB_ROOT_PASSWORD=1324

    volumes:
      - mongo-db:/data/db

  redis:
    image: redis

volumes:
  mongo-db:

# docker-compose.dev.yml
version: "3"
services:
  nginx:
    ports:
      - "3000:80"
  node-app:
    build:
      context: .
      args:
        NODE_ENV: development
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGO_USERNAME=darq
      - MONGO_PASSWORD=1324
      - SESSION_SECRET=secret

    command: npm run dev

  mongo:
    environment:
      - MONGO_INITDB_ROOT_USERNAME=darq
      - MONGO_INITDB_ROOT_PASSWORD=1324
    ports:
      - "27017:27017"

# docker-compose.prod.yml
version: "3"
services:
  nginx:
    ports:
      - "80:80"
  node-app:
    build:
      context: .
      args:
        NODE_ENV: production
    environment:
      - NODE_ENV=production
    command: node index.js
```

Nginx configuration

```conf
server {
    listen 80;
    # this is the location where we want to send the reques to
    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;

        # here we specify the url of the servers that we want to proxy this traffic to
        proxy_pass http://node-app:3000;
        proxy_redirect off;
    }
}
```

index.js `app.enable("trust-proxy");

**Scaling the express app**
`docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --scale node-app=2`

**Enabling CORS**
CORS allows to run front-end on one domain and backend api to work on different domain because by default
let's say your front end is hosted at www.google.com and your api is on yahoo.com, since both are different domains so by default our api will reject that request from our frontend. So to allow these to run on different domains we have to configure cors, so that different domains can access our api.

`npm i cors`

```js
//index.js
const cors = require("cors");

app.use(cors());
```

---

## Deploying to Production

Updating the production docker file to get the env variable from the system not hardcode the values.

```yaml
# docker-compose.prod.yml
version: "3"
services:
  nginx:
    ports:
      - "80:80"
  node-app:
    build:
      context: .
      args:
        NODE_ENV: production
    environment:
      - NODE_ENV=production
      - MONGO_USER=${MONGO_USER}
      - MONGO_PASSWORD=${MONGO_PASSWORD}
      - SESSION_SECRET=${SESSION_SECRET}
    command: node index.js

  mongo:
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
```

### Set env variable on linux

**Creating secret key: `openssl rand -hex 32`**
export SESSION_SECRET=4150b909ffcb1cf739f31e7c89b54553fe4d138de5c19adf930a666275c6008a
or
create a file .env with all the env variables
then vim .profile and add this command:
`set -o allexport; source ~/.env; set -o allexport;`
This is gonna loop through all of those environment variables and set those environment variables on this machine.

## Telling docker compose to only rebuild our node app and recreate the container

`docker compose --env-file ~/.env -f docker-compose.yml -f docker-compose.prod.yml up -d --build node-app`
It will still rebuild the dependencies which was set in docker-compose file with _depends_on_.

To avoid rebuilding the dependencies:
`docker compose --env-file ~/.env -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps node-app`

**Force recreation**
`docker compose --env-file ~/.env -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate node-app`
Recreates containers even if their configuration and image haven't change.

Our normal workflow:
![Normal Workflow](meta/images/normal_workflow.png)

## Improved Dockerhub workflow

![Improved Workflow](meta/images/improved_dockerhub_workflow.png)

### Pushing docker image to Dockerhub

`docker login`
`docker push node-docker-node-app` // this will throw an error because we can't upload an image with name like our current

To change name:
`docker image tag current_image_name username/updated_name`

`docker push prototypid/docker-node`

![dockerhub](meta/images/dockerhub-image-pushed.png)

### Pushing changes to docker hub

Rebuilding image
`docker compose -f docker-compose.yml -f docker-compose.prod.yml build`

rebuilding specific service
`docker compose -f docker-compose.yml -f docker-compose.prod.yml build node-app`

Pushing to docker hub
pushing specific service:
`docker compose -f docker-compose.yml -f docker-compose.prod.yml node-app`

pushing all the services:
`docker compose -f docker-compose.yml -f docker-compose.prod.yml`

Pulling image from dockerhub
`docker compose -f docker-compose.yml -f docker-compose.prod.yml pull`

## WatchTower

It is a special container that will automatically check dockerhub periodically for new image and whenever an image gets pushed it'll automatically pull it to your production server and restart your container with brand new image.

`docker run -d --name watchtower -e WATCHTOWER_TRACE=true -e WATCHTOWER_DEBUG=true -e WATCHTOWER_POLL_INTERVAL=50 -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower node-docker-node-app`
pass the container you want to check for.

here 50 means 50 seconds.
