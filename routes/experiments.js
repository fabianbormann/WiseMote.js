var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/wisemote');
var db = mongoose.connection;

var wisebed = require('wisebed.js');

var experimentSchema = mongoose.Schema({
	id: {
        type:Number,
        required: true,
        unique: true
    },
    name: {
        type:String,
        required: true
    },
    code: {
        type:String
    },
    date: {
        type:Date,
        required: true
    }
});

var userSchema = mongoose.Schema({
    username: {
        type:String,
        required: true,
        unique: true
    },
    experiments: {
    	type:String
    }
});

var User = mongoose.model('User', userSchema);
var Experiment = mongoose.model('Experiment', experimentSchema);

exports.showAll = function(req, res) {
	if (!req.session.username) {
		res.redirect('/');
	} else {
		if(req.params.username == req.session.username) {
			
			User.find({'username': req.body.username}, function(err, user) {
		        if(err) {
		        	throw err;
		        }
		        else {
		        	res.render('experiments', {
						username : req.session.username,
						experiments : user.experiments
					});
		        }
	    	}
		}
		else {
			res.redirect('/home');
		}
	}
};