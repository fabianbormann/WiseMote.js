var mongoose = require('mongoose');

var exampleSchema = mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    code: {
        type:String,
        default: "<html>\n<head>\n<style>\nbody {font-family: 'Open Sans', sans-serif;}\n</style>\n</head>\n<body>\n<h1>New project</h1>\n<p>write some code and start a new experiment.</p>\n</body>\n</html>"
    }
});

module.exports = mongoose.model('Example', exampleSchema);