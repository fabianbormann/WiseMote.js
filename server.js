var express = require('express'),
	swig = require('swig'),
	connect = require('connect'),

	index = require('./routes/index.js'),
	home = require('./routes/home.js'),
	login = require('./routes/login.js'),
	workspace = require('./routes/workspace.js'),
	testbed = require('./routes/testbed.js');

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
app.get('/dropDatabase', index.dropDatabase);
app.get('/logout', login.logout);
app.get('/workspace', workspace.getPage);
app.get('/project/:projectId', workspace.showProject);
app.get('/home', home.welcome)
app.get('/testbed/nodes', testbed.getNodes);
app.get('/experiment/:experimentId', testbed.showExperiment);
app.get('/show/example/:exampleId', workspace.showExample);
app.get('/example/:exampleId/clone', workspace.cloneExample);

app.post('/new/project', workspace.newProject);
app.post('/project/:projectId/save', workspace.saveProject);
app.post('/experiment/start', testbed.reserveNodes);
app.post('/login', login.verify);
app.post('/update/project/:projectId/configuration', workspace.saveProjectConfiguration);
app.post('/project/:projectId/add/member', workspace.addProjectMember);

/***
Use only in edit mode.
**/

app.get('/new/example/:name', workspace.newExample);
app.post('/example/:exampleId/save', workspace.saveExample);
app.get('/admin/login', function (req, res) {
	req.session.email = "bormann@informatik.uni-luebeck.de";
	res.redirect('/home');
});

app.listen(3000);
console.log('Listening on port 3000');
