var express = require('express'),
	swig = require('swig'),

	index = require('./routes/index.js'),
	login = require('./routes/login.js');

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

app.get('/', index.guests);
app.post('/login', login.verify);


app.listen(3000);
console.log('Listening on port 3000');