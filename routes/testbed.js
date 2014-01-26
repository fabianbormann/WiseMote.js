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
		"username"  : "user1",
		"password"  : "user1"}   
	]};

	testbed.getWiseML(null,
	function(wiseml) {
		res.send(JSON.stringify(wiseml.setup.node));
	}, 
	function(err) {
		if(err) throw err;
	},
	"json", null);

}

exports.reserveNodes = function(req, res) {
    var username = req.session.username;
    var nodes = JSON.parse(req.body.nodeSelection);
    var experimentDuration = req.body.duration;
    var experimentOffset = req.body.offset;
    var projectId = req.body.useProject;

    var now = new Date(milliseconds);
    var randomize = Math.floor((Math.random()*100)+1);

    var link = md5(now+projectId+randomize);

    var experiment = new Experiment({
    	project: projectId,
    	duration: experimentDuration,
    	offset: experimentOffset,
    	nodeUrns: nodes,
    	publicLink: link
    });
    
}