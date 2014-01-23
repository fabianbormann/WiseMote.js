var mongoose = require('mongoose');

var experimentSchema = mongoose.Schema({
	project: {
        type:String,
        required: true
    },
    duration: {
        type:Number
    },
    offset: {
        type:Number
    },
    date: {
        type:Date,
        required: true
    },
    nodeUrns: {
        type:String
    },
    visitors: {
        type:String
    },
    console: {
        type:String
    }
});

module.exports = mongoose.model('Experiment', experimentSchema);