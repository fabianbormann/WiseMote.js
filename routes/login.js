var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/wisemote');
var db = mongoose.connection;

var User = require('../models/User.js');

exports.verify = function(req, res) {

	var config =  {
		"rest_api_base_url"  : "http://portal.wisebed.itm.uni-luebeck.de/rest/v1.0",
  		"websocket_base_url" : "ws://portal.wisebed.itm.uni-luebeck.de/ws/v1.0"
  	};

	var testbed = new wisebed.Wisebed(config.rest_api_base_url, config.websocket_base_url);
	
	var credentials = { "authenticationData" : [
	      {"urnPrefix" : "urn:wisebed:uzl1:",
	      "username"  : "user1",
	      "password"  : "user1"}   
		]
	};

	testbed.login(credentials,login,redirect);

	function login(status) {
		User.find({'username': req.body.username}, function(err, user) {
	        if(err) {
	        	throw err;
	        }
	        else {
		        if (user.length < 1) {
		        	var user = new User({ 
		        		username: req.body.username,
		        		projects: JSON.stringify(new Array())
		        	});
					user.save(function (err) {
					  if (err)
					  	throw err;
					});

					req.session.username = req.body.username;
		        	
		        }
		        else {
		        	req.session.username = user[0].username;
		        }

		        res.redirect('/home');
			}
		});
	}

	function redirect() {
		res.redirect('/');
	}

};

exports.logout = function(req, res) { 
	delete req.session.username;
  	res.redirect('/');
};

