var mongoose = require('mongoose');

var groupSchema = mongoose.Schema({
    name: {
        type:String,
        required: true,
        unique: true
    },
    member: [String]
});

module.exports = mongoose.model('Group', groupSchema);