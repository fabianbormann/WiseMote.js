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
        type: [String]
    },
    name: {
        type: String
    },
    experimentId : {
        type: String
    },
    flashed : {
        type: Boolean,
        default: false
    },
    code : {
        type: String
    }
});

module.exports = mongoose.model('Experiment', experimentSchema);