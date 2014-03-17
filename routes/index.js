var mongoose = require('mongoose');
var db = mongoose.connection;

var Project = require('../models/Project.js');
var User = require('../models/User.js');
var Experiment = require('../models/Experiment.js');

exports.guests = function(req, res){
	if (!req.session.email) {
		res.render('index');
	} else {
		res.redirect('/home');
	}
};

exports.dropDatabase = function (req, res) {
	User.remove({}, function(err) {
		if(err) throw err;
		Project.remove({}, function(err) { 
			if(err) throw err;
        	Experiment.remove({}, function(err) { 
				if(err) throw err;
				delete req.session.email;
        		res.redirect('/');
    		});
    	});
    });
} 