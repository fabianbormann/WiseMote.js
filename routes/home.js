var mongoose = require('mongoose');
var db = mongoose.connection;

var Example = require('../models/Example.js');


exports.welcome = function(req, res) {
	if (!req.session.email) {
		res.redirect('/');
	} else {
		res.render('frontpage', {
			email : req.session.email
		});
	}
};

exports.getExamples = function(req, res) {
	Example.find({}, function(err, examples) {
		if(err) {
			throw err;
		}
		else {
			res.send(examples);
		}
	});
}