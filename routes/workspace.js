var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
var db = mongoose.connection;

var Project = require('../models/Project.js');
var Example = require('../models/Example.js');
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
                Project.find({ _id : { $in : JSON.parse(user.projects) } }, function (err, projects) {
                    if(err) {
                        throw err;
                    }
                    else {
                        Experiment.find({ _id : { $in : JSON.parse(user.experiments) } }, function (err, experiments) {
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
            var project = new Project({ 
                name: req.body.projectName,
                members: JSON.stringify([req.session.email])        
            });

            project.save(function(err, emptyProject) {
                if (err) 
                    throw err;
                else {
                    var projects = JSON.parse(user.projects);
                    projects.push(emptyProject._id);
                    user.update( {projects : JSON.stringify(projects)}, function () {
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

                Project.findOne( {_id : req.params.projectId}, function(err, project) {
                    projects.contains(project._id.toString(), function(pass) {
                        if (pass) {
                            res.render('project', {
                                project : project
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

exports.saveProjectConfiguration = function (req, res) {
    var virtualNodeOption = false;
    /*if(req.body.virtualNodeOption == "on")
        virtualNodeOption = true;
    else
        virtualNodeOption = false;*/

    Project.findOne( {_id : req.params.projectId }, function(err, project) {
        if(err) {
            throw err;
        }
        else {
            project.update({
                name : req.body.projectName,
                virtualNodeInExperiment : virtualNodeOption
            }, function(err, updatedProject) {
                if(err) {
                    throw err;
                }
                else {
                    res.send({
                        newName : req.body.projectName, 
                        option : virtualNodeOption
                    });
                }
            });
        }
    });
}

exports.addProjectMember = function(req, res) {
    Project.findOne( {_id : req.params.projectId }, function (err, project) {
        if(err) {
            throw err;
        }
        else {
            User.findOne( {email : req.body.userMail }, function (err, user) {
                if(err) {
                    throw err;
                }
                else {
                    if(!user) {
                        res.send({type : "error", content : "User not found! Please check the email adress and try again."});
                    }
                    else {
                        var userProjects = JSON.parse(user.projects);
                        
                        if(userProjects.indexOf(req.params.projectId) == -1) {
                            userProjects.push(req.params.projectId);

                            user.update({
                                projects : JSON.stringify(userProjects)
                            },
                            function(err, updatedUser) {
                                if(err) {
                                    res.send({type : "error", content : "Database error! Please try again later."});
                                }
                                else {
                                    projectMembers = JSON.parse(project.members);
                                    projectMembers.push(user.email);
                                    project.update({
                                        members : JSON.stringify(projectMembers)                                        
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

exports.newExample = function (req, res) {
    var example = new Example({
        name : req.params.name
    });

    example.save(function (err, example) {
        if (err) 
            throw err;
        else {  
            console.log(example._id);
            res.redirect('/');
        }       
    })
}

exports.showExample = function (req, res) {
    Example.findOne({ _id : req.params.exampleId }, function (err, example) {
        if(err) {
            throw err;
        }
        else {
            res.render('example', {
                example : example
            });
        }
    });
}

exports.saveExample = function (req, res) {
    Example.findOne({ _id : req.params.exampleId }, function (err, example) {
        if(err) {
            throw err;
        }
        else {
            example.update( {code : req.body.code}, function () {
                res.render('example', {
                    example : example
                });
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
            Example.findOne({ _id : req.params.exampleId }, function (err, example) {
                if(err) {
                    throw err;
                }
                else {
                    project = new Project({
                        code: example.code,
                        name: example.name,
                        members: JSON.stringify([user.email])          
                    });

                    project.save(function(err, newProject) {
                        if (err) 
                            throw err;
                        else {
                            var projects = JSON.parse(user.projects);
                            projects.push(newProject._id);
                            user.update( {projects : JSON.stringify(projects)}, function () {
                                res.redirect('/workspace');  
                            });
                        }
                    });                    
                }
            });  
        }    
    });
}