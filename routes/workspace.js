var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
var db = mongoose.connection;

var Project = require('../models/Project.js');
var User = require('../models/User.js');

exports.showAll = function(req, res) {
	if (!req.session.email) {
		res.redirect('/');
	}
    else {
        User.find({'email': req.session.email}, function(err, user) {
	        if(err) {
	        	throw err;
	        }
	        else {
                var userProjects = JSON.parse(user[0].projects);
                if(userProjects.length < 1) {
                    userProjects = null;
                    res.render('workspace', {
                        projects : userProjects
                    });
                }
                else {
                    Project.find({ _id : { $in : userProjects } }, function(err, dbProjects) {
                        res.render('workspace', {
                            projects : dbProjects
                        });
                    });
                }
	        }
    	});
	}
};

exports.newProject = function(req, res) {  
    User.find({'email': req.session.email}, function(err, user) {
        if(err) {
            throw err;
        }
        else {
            var projectMembers = req.body.members;
            if(projectMembers) {
                projectMembers = user[0].email+","+projectMembers;
            }
            else {
                projectMembers = user[0].email;
            }

            var project = new Project({ 
                name: req.body.projectName,
                members: projectMembers                 
            });

            project.save(function(err, emptyProject) {
                if (err) 
                    throw err;
                else {
                    var projects = JSON.parse(user[0].projects);
                    projects.push(emptyProject._id);
                    user[0].update( {projects : JSON.stringify(projects)}, function () {
                        res.redirect('/workspace');  
                    });
                }
            });  
        }
    });
}

exports.showProject = function(req, res) {
    User.findOne({'email': req.session.email}, function(err, user) {
        if(err) {
            throw err;
        }
        else {
            if(user) { 
                Array.prototype.contains = function(k, callback) {
                    var self = this;
                    return (function check(i) {
                        if (i >= self.length) {
                            return callback(false);
                        }

                        if (self[i] === k) {
                            return callback(true);
                        }

                        return process.nextTick(check.bind(null, i+1));
                    }(0));
                }

                var projects = JSON.parse(user.projects);

                Project.find( {_id : req.params.projectId}, function(err, dbProject) {
                    projects.contains(dbProject[0]._id.toString(), function(pass) {
                        if (pass) {
                            res.render('project', {
                                project : dbProject[0]
                            });
                        } else {
                            res.redirect('/home');
                        }
                    });
                }); 
            }
            else {
                res.redirect('/');
            }
        }
    });
}

exports.saveProject = function(req, res) {
    Project.find( {_id : req.params.projectId}, function(err, dbProject) {
        dbProject[0].update( {code : req.body.code}, function () {
            res.redirect('/project/'+req.params.projectId);  
        });
    });
}