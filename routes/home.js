exports.welcome = function(req, res){
	if (!req.session.username) {
		res.redirect('/');
	} else {
		res.render('frontpage', {
			username : req.session.username
		});
	}
};