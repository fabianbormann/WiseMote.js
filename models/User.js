var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    email: {
        type:String,
        required: true,
        unique: true
    },
    projects: {
    	type:String
    },
    experiments: {
        type:String,
        default: JSON.stringify(new Array())
    },
    date: { 
    	type: Date, 
    	default: Date.now 
    },
});

module.exports = mongoose.model('User', userSchema);