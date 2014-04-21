var express = require('express.io');
var app = express();

app.http().io()

var	swig = require('swig'),
	connect = require('connect'),

	index = require('./routes/index.js'),
	home = require('./routes/home.js'),
	login = require('./routes/login.js'),
	workspace = require('./routes/workspace.js'),
	testbed = require('./routes/testbed.js')(app.io);

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

app.io.route('listen', function(req) {
    testbed.listenExperiment(req.data.experimentId);
})

app.get('/', index.guests);
app.get('/dropDatabase', index.dropDatabase);
app.get('/logout', login.logout);
app.get('/workspace', workspace.getPage);
app.get('/project/:projectId', workspace.showProject);
app.get('/home', home.welcome)
app.get('/testbed/nodes', testbed.getNodes);
app.get('/experiment/:experimentId', testbed.showExperiment);
app.get('/show/example/:name', workspace.showExample);
app.get('/example/:name/clone', workspace.cloneExample);
app.get('/list/examples', home.getExamples);
app.get('/remove/project/:projectId', workspace.removeProject);
app.get('/experiment/view/code/:experimentId', workspace.viewCode);

app.post('/new/project', workspace.newProject);
app.post('/project/:projectId/save', workspace.saveProject);
app.post('/experiment/start', testbed.reserveNodes);
app.post('/login', login.verify);
app.post('/update/project/:projectId/configuration', workspace.saveProjectConfiguration);
app.post('/project/:projectId/add/member', workspace.addProjectMember);
app.post('/experiment/:experimentId/save', testbed.saveExperiment);
app.post('/nodes/message/send/:experimentId', testbed.sendMessage);

/***
Use only in edit mode.
**/

app.listen(3000);
console.log('Listening on port 3000');
