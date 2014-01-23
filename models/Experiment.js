var mongoose = require('mongoose');

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

module.exports = mongoose.model('Experiment', experimentSchema);