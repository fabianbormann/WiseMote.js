var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
var fs = require('fs');
var db = mongoose.connection;

var Project = require('../models/Project.js');
var Experiment = require('../models/Experiment.js')
var User = require('../models/User.js');

exports.getPage = function(req, res) {
    if (!req.session.email) {
		res.redirect('/');
	}
    else {
        User.findOne({'email': req.session.email}, function(err, user) {
	        if(err) {
	        	throw err;
	        }
	        else {
                Project.find({ _id : { $in : user.projects } }, function (err, projects) {
                    if(err) {
                        throw err;
                    }
                    else {
                        Experiment.find({ _id : { $in : user.experiments } }, function (err, experiments) {
                            if(err) {
                                throw err;
                            }
                            else {    

                                futureExperiments = [];
                                runningExperiments = [];
                                pastExperiments = [];

                                for(var i = 0; i < experiments.length; i++) {
                                    var currentDate = new Date();
                                    
                                    if(experiments[i].to < currentDate) {
                                        pastExperiments.push(experiments[i]);
                                    }
                                    else if (experiments[i].from > currentDate) {
                                        futureExperiments.push(experiments[i]);
                                    }
                                    else {
                                        runningExperiments.push(experiments[i]);
                                    }
                                }

                                var error = null;
                                if(req.session.error) {
                                    if(req.session.error == 400) {
                                        error = {}
                                        error.head = "Reservation error!"
                                        error.text = "Another reservation is in conflict with yours: Some of the nodes are reserved during the requested time.";
                                    }
                                    else if(req.session.error == 500) {
                                        error = {}
                                        error.head = "Reservation error!"
                                        error.text = "Reservation end time parameter lies in the past!";
                                    }
                                    else {
                                        error = {}
                                        error.head = "Reservation error!"
                                        error.text = "Unknown reservation error! Please check your internet connection.";
                                    }   
                                    delete req.session.error;
                                }

                                res.render('workspace', {
                                    projects : projects,
                                    loading :  {text : '<p>Collect node information from testbed...</p>'},
                                    futureExperiments : futureExperiments,
                                    runningExperiments : runningExperiments,
                                    pastExperiments : pastExperiments,
                                    error : error
                                });
                            }
                        });
                    }
                });
	        }
    	});
	}
};

exports.newProject = function(req, res) {  
    User.findOne({'email': req.session.email}, function(err, user) {
        if(err) {
            throw err;
        }
        else {
            fs.readFile('./public/templates/project.html', function (err, code) {
                if(err) {
                    throw err;
                }
                else {
                    var project = new Project({ 
                        name : req.body.projectName,
                        members : new Array(req.session.email),
                        code : code.toString()
                    });
                    project.save(function(err, emptyProject) {
                        if (err) 
                            throw err;
                        else {
                            var projects = user.projects;
                            projects.push(emptyProject._id);
                            user.update( {projects : projects}, function () {
                                res.redirect('/workspace');  
                            });
                        }
                    });  
                }
            });
        }
    });
}

exports.showProject = function(req, res) {
    User.findOne( { 'email': req.session.email }, function(err, user) {
        if(err) {
            throw err;
        }
        else {
            if(user) { 
                Project.findOne( { _id : req.params.projectId }, function(err, project) {
                    if( user.projects.indexOf(project._id.toString()) > -1 ) {
                        res.render('project', {
                            project : project
                        });
                    }
                    else {
                        res.redirect('/home');
                    }
                }); 
            }
            else {
                res.redirect('/');
            }
        }
    });
}

exports.saveProject = function(req, res) {
    Project.findOne( {_id : req.params.projectId }, function(err, project) {
        project.update( {code : req.body.code}, function () {
            res.redirect('/project/'+req.params.projectId);  
        });
    });
}

exports.saveProjectConfiguration = function (req, res) {
    Project.findOne( {_id : req.params.projectId }, function(err, project) {
        if(err) {
            throw err;
        }
        else {
            project.update({
                name : req.body.projectName
            }, function(err, updatedProject) {
                if(err) {
                    throw err;
                }
                else {
                    res.send({
                        newName : req.body.projectName
                    });
                }
            });
        }
    });
}

exports.addProjectMember = function(req, res) {
    Project.findOne( { _id : req.params.projectId }, function (err, project) {
        if(err) {
            throw err;
        }
        else {
            User.findOne( { email : req.body.userMail }, function (err, user) {
                if(err) {
                    throw err;
                }
                else {
                    if(!user) {
                        res.send({type : "error", content : "User not found! Please check the email adress and try again."});
                    }
                    else {
                        var userProjects = user.projects;
                        
                        if(userProjects.indexOf(req.params.projectId) == -1) {
                            userProjects.push(req.params.projectId);

                            user.update({
                                projects : userProjects
                            },
                            function(err, updatedUser) {
                                if(err) {
                                    res.send({type : "error", content : "Database error! Please try again later."});
                                }
                                else {
                                    projectMembers = project.members;
                                    projectMembers.push(user.email);
                                    project.update({
                                        members : projectMembers                                        
                                    }, function(err, updatedProject) {
                                        if(err) {
                                            res.send({type : "error", content : "Database error! Please try again later."});
                                        }
                                        else {
                                            res.send({type : "success", content : req.body.userMail+" was added to "+project.name});
                                        }
                                    });
                                    
                                }
                            });
                        }
                        else {
                            res.send({type : "warning", content : req.body.userMail+" is already member of "+project.name});
                        }
                    }
                }
            });
        }
    });
}

exports.removeProject = function(req, res) {
    Project.findOne( { _id : req.params.projectId }, function (err, project) {
        if(err) {
            throw err;
        }
        else {;
            if(project.members.indexOf( req.session.email ) > -1) {
                project.members.splice(project.members.indexOf( req.session.email ), 1);
                if(project.members.length == 0) {
                    User.findOne( { email : req.session.email }, function (err, user) {
                        user.projects.splice(user.projects.indexOf( req.params.projectId ), 1);
                        project.remove();
                        user.save(function() {
                            res.redirect('/workspace');
                        });
                    });
                }
                else {
                    User.findOne( {email : req.session.email }, function (err, user) {
                        user.projects.splice(user.projects.indexOf( req.params.projectId ), 1);
                        user.save(function() {
                            project.save(function() {
                                res.redirect('/workspace');
                            });
                        });
                    });
                }
            }
        }
    });
}

exports.showExample = function (req, res) {
    fs.readFile('./public/examples/'+req.params.name+'.html', function (err, example) {
        if (err) {
            redirect('workspace');
        }
        else {
            res.render('example', {
                example : {code : example.toString(), name : req.params.name}
            });
        }
    });
}

exports.cloneExample = function (req, res) {
    User.findOne({'email': req.session.email}, function(err, user) {
        if(err) {
            throw err;
        }
        else {
            fs.readFile('./public/examples/'+req.params.name+'.html', function (err, example) {
                if(err) {
                    throw err;
                }
                else {
                    project = new Project({
                        code: example.toString(),
                        name: req.params.name,
                        members: new Array(user.email)         
                    });

                    project.save(function(err, newProject) {
                        if (err) 
                            throw err;
                        else {
                            var projects = user.projects;
                            projects.push(newProject._id);
                            user.update( {projects : projects}, function () {
                                res.redirect('/workspace');  
                            });
                        }
                    });                    
                }
            });  
        }    
    });
}

exports.viewCode = function(req, res) {
    Experiment.findOne({ _id : req.params.experimentId }, function(err, experiment) {
        if(err) {
            throw err;
        }
        else {
            res.render('editor', {
                experiment : experiment
            });
        }
    });
}