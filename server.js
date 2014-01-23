var express = require('express'),
	swig = require('swig'),
	connect = require('connect'),

	index = require('./routes/index.js'),
	home = require('./routes/home.js'),
	login = require('./routes/login.js'),
	experiments = require('./routes/experiments.js')

var app = express();

app.configure(function () {
	app.engine('html', swig.renderFile);
	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');

	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public/'));
	app.use(express.cookieParser('whatever'));
  	app.use(connect.cookieSession({ cookie: { maxAge: 60 * 60 * 1000 }}));
});

app.set('view cache', false);
swig.setDefaults({cache: false});

app.get('/', index.guests);

app.post('/login', login.verify);
app.get('/logout', login.logout);

app.get('/experiments/:username', experiments.showAll);
app.post('/:username/experiment/new', experiments.newExperiment);

app.get('/home', home.welcome)


app.listen(3000);
console.log('Listening on port 3000');
