exports.guests = function(req, res){
	if (!req.session.username) {
		res.render('index');
	} else {
		res.redirect('/home');
	}
};