var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
var db = mongoose.connection;
var login = require('../routes/login.js');
var User = require('../models/User.js');
var Project = require('../models/Project.js');
var Experiment = require('../models/Experiment.js');
var fs = require('fs');

var config =  {
	"rest_api_base_url"  : "http://portal.wisebed.itm.uni-luebeck.de/rest/v1.0",
  	"websocket_base_url" : "ws://portal.wisebed.itm.uni-luebeck.de/ws/v1.0"
};

var testbed = new wisebed.Wisebed(config.rest_api_base_url, config.websocket_base_url);

exports.getNodes = function(req, res) {

	testbed.getWiseML(null,
	function(wiseml) {
		res.send(JSON.stringify(wiseml.setup.node));
	}, 
	function(err) {
		if(err) {
			console.log('Could not fetch sensor node information form portal server.');
			console.log(JSON.stringify(err));
		}
	},
	"json", null);

}

exports.reserveNodes = function(req, res) {

    var nodes = JSON.parse(req.body.nodeSelection);
    var projectId = req.body.useProject;

    Project.findOne( {_id : projectId}, function(err, project) {
        if(err) {
        	throw err;
        }
        else {
		    var startTime = req.body.startTime.split(":");
			var endTime = req.body.endTime.split(":");

		    var startDate = req.body.startDate.split("-");
			var endDate = req.body.endDate.split("-");

			var from = new Date(startDate[0], startDate[1]-1, startDate[2], startTime[0], startTime[1], 0);
			var to = new Date(endDate[0], endDate[1]-1, endDate[2], endTime[0], endTime[1], 0);

			var name = req.body.experimentName;

			if(!name) {
				name = project.name;
			}

			var credentials = [{
				"urnPrefix" : "urn:wisebed:uzl1:",
           		"username"  : req.session.email,
            	"password"  : req.session.password
            }];

			testbed.reservations.make(from, to, nodes, name, [], 
				function(confidentialReservationDataList, textStatus, jqXHR) {
					
					var experiment = new Experiment({
					   	project: projectId,
					    from: from,
					    to: to,
					    nodeUrns: nodes,
					    name: name,
					    experimentId: confidentialReservationDataList.confidentialReservationDataList[0].serializedSecretReservationKeyBase64
					});

					experiment.save(function(err, new_experiment) {
						User.findOne({email : req.session.email}, function (err, user) {
							if(err) { 
								throw err;
							}
							else {
								var userExperiments = JSON.parse(user.experiments);
								userExperiments.push(new_experiment._id);
								user.update({
									experiments : JSON.stringify(userExperiments)
								}, function (err, updatedUser) {
									if(err) {
										throw err;
									}
									else {
										res.redirect("/experiment/"+new_experiment._id.toString());
									}
								});
							}
						})
					});
				}
			, reservationError, credentials);
        }
    }); 

	function reservationError (jqXHR, textStatus, errorThrown) {
		console.log(JSON.stringify(jqXHR));
		console.log(textStatus);
		console.log(errorThrown);
		res.redirect("/workspace");
	}

}

exports.showExperiment = function(req, res) {
	Experiment.findOne({_id : req.params.experimentId}, function (err, experiment) {
		if(err) {
			throw err;
		}
		else {
			if (experiment) {
				Project.findOne({_id : experiment.project}, function (err, project) {
					if(err) {
						throw err;
					}
					else {

						fs.readFile('./public/apps/remote_app.bin', function (err, image) {
							if (err) { 
								throw err;
							}
							else {

								var data = {
									configurations : []
								};

								data.configurations.push({
									nodeUrns : experiment.nodeUrns.split(","),
									image : new Buffer(image).toString('base64')
								});

								testbed.experiments.flashNodes(
									experiment.experimentId, 
									data, 
									function(result) {
										console.log("MyResult : "+result);
									},
									function(progress) {
										console.log("MyProgress : "+progress);
									},
									function(jqXHR, textStatus, errorThrown) {
										console.log("error! :"); 
										console.log(jqXHR);
										console.log(textStatus);
										console.log(errorThrown);
									}
								);

								console.log(res);

								res.render("experiment", {
									experiment : experiment,
									project : project
								});	
							}
						});
					}
				})
			}
			else {
				res.redirect("/");
			}
		}
	})
}

exports.sendMessage = function(req, res) {
	Experiment.findOne({_id : req.body.experimentId}, function (err, experiment) {
		if(err) {
			throw err;
		}
		else {
			testbed.experiments.send(
				experiment.experimentId, 
				req.body.nodeUrns, 
				req.body.message, 
				function() {
					alert("send");
				}, 
				function() {
					alert("error");
				}
			);
		}
	});
}