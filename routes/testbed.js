var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
var db = mongoose.connection;

var Project = require('../models/Project.js');
var Experiment = require('../models/Experiment.js');

var config =  {
	"rest_api_base_url"  : "http://portal.wisebed.itm.uni-luebeck.de/rest/v1.0",
	"websocket_base_url" : "ws://portal.wisebed.itm.uni-luebeck.de/ws/v1.0"
};

exports.getNodes = function(req, res) {

	var testbed = new wisebed.Wisebed(config.rest_api_base_url, config.websocket_base_url);

	var credentials = { "authenticationData" : [
		{"urnPrefix" : "urn:wisebed:uzl1:",
		"username"  : req.session.email,
		"password"  : req.session.password}   
	]};

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

			var testbed = new wisebed.Wisebed(config.rest_api_base_url, config.websocket_base_url);
			var credentials = { "authenticationData" : [
				{"urnPrefix" : "urn:wisebed:uzl1:",
				"username"  : req.session.email,
				"password"  : req.session.password}   
			]};

			testbed.reservations.make(from, to, nodes, name, [], 
				function() {
					var experiment = new Experiment({
					   	project: projectId,
					    from: from,
					    to: to,
					    nodeUrns: nodes,
					    name: name
					});

					experiment.save(function(err, new_experiment) {
						res.redirect("/experiment/"+new_experiment._id.toString());
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

exports.showExperiment = function(res, req) {
	res.render("experiment");
}