var mongoose = require('mongoose');

var projectSchema = mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    code: {
        type:String,
        default: '<html>\n<head>\n<style>\n\tbody {font-family: \'Open Sans\', sans-serif;}\n</style>\n<!-- Configuration: Please do not remove -->\n<script src="/js/virtual-remote.js"></script>\n<script type="text/javascript">\n\tvar config = {\n\t\tled : true,\n\t\tlight : 30,\n\t\ttemperature : 25,\n\t\tdelay : 500\n\t};\n\tjsMote = new JsMote();\n\tjsMote.start(config);\n</script>\n<!-- End of Configuration -->\n\n<script type="text/javascript">\n\t//Define turnLedOn function including a simple callback function \n\tfunction turnLedOn() {\n\t\tjsMote.switchLed(true, function(state) {\n\t\talert("State is: "+state)\n\t\t});\n\t}\n\t//Function without a callback parameter use a custom (alert) function\n\tfunction turnLedOff() {\n\t\tjsMote.switchLed(false);\n\t}\n</script>\n</head>\n<body>\n\t<h1>New project</h1>\n\t<p>Click on these buttons below to change the led state.</p>\n\t<button onclick="turnLedOn();">Led on</button><br>\n\t<button onclick="turnLedOff();">Led off</button>\n</body>\n</html>\n'
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