exports.showAll = function(req, res) {
	if (!req.session.username) {
		res.redirect('/');
	} else {

		if(req.params.username == req.session.username) {
			res.render('experiments', {
				username : req.session.username
			});
		}
		else {
			res.redirect('/home');
		}
	}
};