var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/wisemote');
var db = mongoose.connection;

var User = require('../models/User.js');

exports.session = {
  testbed: {},
  setTestbed: function(testbed) {
      this.testbed = testbed;
  },
  getTestbed: function() {
  	return this.testbed;
  }
};

exports.verify = function(req, res) {

	var config =  {
		"rest_api_base_url"  : "http://portal.wisebed.itm.uni-luebeck.de/rest/v1.0",
  		"websocket_base_url" : "ws://portal.wisebed.itm.uni-luebeck.de/ws/v1.0"
  	};

	var testbed = new wisebed.Wisebed(config.rest_api_base_url, config.websocket_base_url);
	var credentials = { "authenticationData" : [
	      {"urnPrefix" : "urn:wisebed:uzl1:",
	      "username"  : req.body.email,
	      "password"  : req.body.password}   
		]
	};
	testbed.login(credentials,login,redirect);

	function login(status) {
		User.find({'email': req.body.email}, function(err, user) {
	        if(err) {
	        	throw err;
	        }
	        else {
		        if (user.length < 1) {
		        	var user = new User({ 
		        		email: req.body.email,
		        		projects: JSON.stringify(new Array())
		        	});
					user.save(function (err) {
					  if (err)
					  	throw err;
					});

					req.session.email = req.body.email;
					exports.session.setTestbed(testbed);	        	
		        }
		        else {
		        	req.session.email = user[0].email;
					exports.session.setTestbed(testbed);
		        }

		        res.redirect('/home');
			}
		});
	}

	function redirect() {
		res.render('index', {
			error : "Login failed! Please check if your password and email is correct."
		});
	}

};

exports.logout = function(req, res) { 
	delete req.session.email;
	delete req.session.password;
  	res.redirect('/');
};

