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
