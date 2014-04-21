var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    date: { 
    	type: Date, 
    	default: Date.now 
    },
    members: {
    	type: [String]
    }
});

module.exports = mongoose.model('Project', projectSchema);