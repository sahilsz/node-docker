const express = require("express");
const mongoose = require("mongoose");
const {
	MONGO_USERNAME,
	MONGO_PASSWORD,
	MONGO_IP,
	MONGO_PORT,
} = require("./config/config");

const MONGO_URL = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectMongo = () => {
	mongoose
		.connect()
		.then(() => console.log("Successfully connected to db."))
		.catch((e) => {
			console.log(e);
			setTimeout(connectMongo, 5000);
			// try to reconnect mongodb after 5 seconds
		});
};

connectMongo();

const app = express();

app.get("/", (req, res) => {
	res.send("<h2>Hi There &#9995</h2>");
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`));
