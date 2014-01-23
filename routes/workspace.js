var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
var db = mongoose.connection;

var Project = require('../models/Project.js');
var User = require('../models/User.js');

exports.showAll = function(req, res) {
	if (!req.session.username) {
		res.redirect('/');
	} else {
		if(req.params.username == req.session.username) {
			
			User.find({'username': req.params.username}, function(err, user) {
		        if(err) {
		        	throw err;
		        }
		        else {

                    var userProjects = JSON.parse(user[0].projects);
                    if(userProjects.length < 1) {
                        userProjects = null;
                    }

		        	res.render('workspace', {
						username : user[0].username,
						projects : JSON.parse(userProjects)
					});
		        }
	    	});
		}
		else {
			res.redirect('/home');
		}
	}
};

exports.newProject = function(req, res) {
    if(req.params.username == req.session.username) {
        User.find({'username': req.body.username}, function(err, user) {
            if(err) {
                throw err;
            }
            else {
                var project = new Project({ 
                    name: req.body.projectName,
                    urns: req.body.urns,
                    duration: req.body.duration,
                    offset: req.body.offset
                });

                project.save();

                var projects = JSON.parse(user.projects);
                projects.push(project);
                user.projects = JSON.stringify(user.projects);
                user.save();

                res.render('projects', {
                    username : req.session.username,
                    projects : user.projects
                });
            }
        });
    }
    else {
        res.redirect('/home');
    }

   


    res.redirect('/home');
}