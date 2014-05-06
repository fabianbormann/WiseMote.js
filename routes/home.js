var fs = require('fs');
var mongoose = require('mongoose');
var db = mongoose.connection;

var Group = require('../models/Group.js');
var User = require('../models/User.js');

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
	fs.readdir('./public/examples', function(err, files) {
		if(err) { 
			throw err;
		}
		else {
			var examples = [];
			for(var example = 0; example < files.length; example++) {
				if(files[example] != '.DS_Store') {
					examples.push(files[example].split('.')[0]);
				}
			}
			res.send(examples);
		}
	});
}

exports.showGroups = function(req, res) {
	res.render('groups');
}