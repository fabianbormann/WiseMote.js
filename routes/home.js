exports.welcome = function(req, res){
	if (!req.session.email) {
		res.redirect('/');
	} else {
		res.render('frontpage', {
			email : req.session.email
		});
	}
};