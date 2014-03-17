var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    code: {
        type:String,
        default: "<html>\n<head>\n<style>\nbody {font-family: 'Open Sans', sans-serif;}\n</style>\n</head>\n<body>\n<h1>New project</h1>\n<p>write some code and start a new experiment.</p>\n</body>\n</html>"
    },
    date: { 
    	type: Date, 
    	default: Date.now 
    },
    members: {
    	type:String
    },
    experiments: {
    	type:String
    }, 
    virtualNodeInExperiment: {
        type:Boolean,
        default:false
    }
});

module.exports = mongoose.model('Project', projectSchema);