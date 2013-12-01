var mongoose = require('mongoose'),
	crypto = require('crypto'),
	request = require('request');

mongoose.connect('mongodb://localhost/wisemote');
var db = mongoose.connection;

var userSchema = mongoose.Schema({
	id: Number,
    username: String,
    password: String
});

var User = mongoose.model('User', userSchema);

exports.verify = function(req, res) {
	console.log("Try to verfy user "+req.body.username);
    User.find({'username': req.body.username}, function(err, user) {
        if(err) {
        	throw err;
        	res.redirect('/');
        }
        else {
	        if (user) {
	        	console.log("found: "+user);
	        	if(user.password == req.body.password) {
	            	req.session.username = req.body.username;
	            	req.session.auth = crypto.createHash('md5').update(req.body.password).digest('hex');
	            }

	            res.redirect('/');

	        } 
	        else {
	        	console.log("username not found.. check wisebed data");
	        	var loginData = { authenticationData : [] };
	        	var testbedId = "uzl";
	        	var wisebedBaseUrl = "http://wisebed.itm.uni-luebeck.de";

	        	loginData.authenticationData[0] = {
					urnPrefix : 'urn:wisebed:uzl1:',
					username  : req.body.username+'@wisebed1.itm.uni-luebeck.de',
					password  : req.body.password
				};

	        	request({
					url: wisebedBaseUrl + "/rest/2.3/" + testbedId + "/login",
		            method: "POST",
		            multipart:
				      [ { 'content-type': 'application/json'
				        ,  body: JSON.stringify(loginData, null, '  ')
				        }
				      ]
	        	}, function (error, response, body) {
				  if (!error && response.statusCode == 200) {
				    console.log(body);
				  }
				});

	            res.redirect('/');
	        }
    	}
    });
};