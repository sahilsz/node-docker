const express = require("express");
const mongoose = require("mongoose");
const {
	MONGO_USER,
	MONGO_PASSWORD,
	MONGO_IP,
	MONGO_PORT,
	REDIS_URL,
	REDIS_PORT,
	SESSION_SECRET,
} = require("./config/config");

const cors = require("cors");
const redis = require("redis");
const session = require("express-session");
let RedisStore = require("connect-redis")(session);
let redisClient = redis.createClient({
	host: REDIS_URL,
	port: REDIS_PORT,
});

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
``;
const MONGO_URL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectMongo = () => {
	mongoose
		.connect(MONGO_URL)
		.then(() => console.log("Successfully connected to db."))
		.catch((e) => {
			console.log(e);
			setTimeout(connectMongo, 5000);
			// try to reconnect mongodb after 5 seconds
		});
};

connectMongo();

const app = express();

app.enable("trust-proxy");
app.use(cors());

app.use(
	session({
		store: new RedisStore({ client: redisClient }),
		secret: SESSION_SECRET,
		cookie: {
			secure: false,
			resave: false,
			saveUninitialized: false,
			httpOnly: true,
			maxAge: 60000,
		},
	})
);

app.use(express.json());

app.get("/", (req, res) => {
	console.log("yooo");
	res.send("<h2>Hi There &#9995</h2>");
});

app.use("/posts", postRouter);

app.use("/users", userRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`));
