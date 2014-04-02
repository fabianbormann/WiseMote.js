var mongoose = require('mongoose');

var experimentSchema = mongoose.Schema({
	project: {
        type:String,
        required: true
    },
    from: {
        type: Date
    },
    to: {
        type: Date
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    nodeUrns: {
        type:String
    },
    name: {
        type:String
    },
    console: {
        type:String
    },
    experimentId : {
        type:String
    }
});

module.exports = mongoose.model('Experiment', experimentSchema);