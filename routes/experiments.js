var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
var db = mongoose.connection;

var Experiment = require('../models/Experiment.js');
var User = require('../models/User.js');

exports.showAll = function(req, res) {
	if (!req.session.username) {
		res.redirect('/');
	} else {
		if(req.params.username == req.session.username) {
			
			User.find({'username': req.body.username}, function(err, user) {
		        if(err) {
		        	throw err;
		        }
		        else {
		        	res.render('experiments', {
						username : req.session.username,
						experiments : user.experiments
					});
		        }
	    	});
		}
		else {
			res.redirect('/home');
		}
	}
};

exports.newExperiment = function(req, res) {
    if(req.params.username == req.session.username) {
        User.find({'username': req.body.username}, function(err, user) {
            if(err) {
                throw err;
            }
            else {
                var experiment = new Experiment({ 
                    name: req.body.experimentName,
                    urns: req.body.urns,
                    duration: req.body.duration,
                    offset: req.body.offset
                });

                experiment.save();

                var experiments = JSON.parse(user.experiments);
                experiments.push(experiment);
                user.experiments = JSON.stringify(user.experiments);
                user.save();

                res.render('experiments', {
                    username : req.session.username,
                    experiments : user.experiments
                });
            }
        });
    }
    else {
        res.redirect('/home');
    }

   


    res.redirect('/home');
}