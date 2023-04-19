const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

exports.signUp = async (req, res, next) => {
	const { username, password } = req.body;
	try {
		const hashedPassword = await bcrypt.hash(password, 12);
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
