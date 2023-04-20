const protect = (req, res, next) => {
	// destructuring the user
	try {
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
	} catch (e) {
		console.log(e);
	}
};

module.exports = protect;
