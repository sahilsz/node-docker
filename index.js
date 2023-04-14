const express = require("express");
const mongoose = require("mongoose");

mongoose
	.connect("mongodb://darq:1324@mongo:27017/?authSource=admin")
	.then(() => console.log("Successfully connected to db."))
	.catch((e) => console.log(e));

const app = express();

app.get("/", (req, res) => {
	res.send("<h2>Hi There &#9995</h2>");
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`));
