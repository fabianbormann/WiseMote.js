var express = require('express'),
	swig = require('swig'),

	welcome = require('./routes/welcome.js');

var app = express();

app.configure(function () {
	app.engine('html', swig.renderFile);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');

	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public/'));
});

app.set('view cache', false);
swig.setDefaults({cache: false});

app.get('/', welcome.login);

app.listen(3000);
console.log('Listening on port 3000');