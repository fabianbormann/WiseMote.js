var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
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
    },
    members: {
    	type:String
    },
    experiments: {
    	type:String
    }
});

module.exports = mongoose.model('Project', projectSchema);