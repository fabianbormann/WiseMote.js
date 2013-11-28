mongoose = require('mongoose');

var db = mongoose.connection;

var userSchema = mongoose.Schema({
	id: Number,
    username: String,
    password: String
});

var User = mongoose.model('User', userSchema);

exports.verify = function(req, res) {

	console.log("Try to verfy user "+req.body.username);
    User.findOne({'username': req.body.username}, function(err, user) {
        if(err) {
        	throw err;
        	res.redirect('/');
        }
        else {
	        if (user) {

	        	if(user.password == req.body.password) {
	            	//set cookie
	            }

	            res.redirect('/');

	        } 
	        else {
	        	console.log("Unknown username!")
	            res.redirect('/');
	        }
    	}
    });
};