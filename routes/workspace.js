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
                        res.render('workspace', {
                            username : user[0].username,
                            projects : userProjects
                        });
                    }
                    else {
                        Project.find({ _id : { $in : userProjects } }, function(err, dbProjects) {
                            res.render('workspace', {
                                username : user[0].username,
                                projects : dbProjects
                            });
                        });
                    }
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
        User.find({'username': req.params.username}, function(err, user) {
            if(err) {
                throw err;
            }
            else {
                var projectMembers = req.body.members;
                if(projectMembers) {
                    projectMembers = user[0].username+","+projectMembers;
                }
                else {
                    projectMembers = user[0].username;
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
                            res.redirect('/'+req.params.username+'/workspace');  
                        });
                    }
                });  
            }
        });
    }
    else {
        res.redirect('/home');
    }
}

exports.showProject = function(req, res) {
    if(req.params.username == req.session.username) {
        User.find({'username': req.params.username}, function(err, user) {
            if(err) {
                throw err;
            }
            else {
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

                var projects = JSON.parse(user[0].projects);

                Project.find( {_id : req.params.projectId}, function(err, dbProject) {
                    projects.contains(dbProject[0]._id.toString(), function(pass) {
                        if (pass) {
                            res.render('project', {
                                username : req.params.username,
                                project : dbProject[0]
                            });
                        } else {
                            res.redirect('/home');
                        }
                    });
                }); 
            }
        });
    }
    else {
        res.redirect('/home');
    }    
}