var wisebed = require('wisebed.js');
var mongoose = require('mongoose');
var request = require('request');
var db = mongoose.connection;
var login = require('../routes/login.js');
var User = require('../models/User.js');
var Project = require('../models/Project.js');
var Experiment = require('../models/Experiment.js');
var fs = require('fs');

var config =  {
	"rest_api_base_url"  : "http://portal.wisebed.itm.uni-luebeck.de/rest/v1.0",
  	"websocket_base_url" : "ws://portal.wisebed.itm.uni-luebeck.de/ws/v1.0"
};

var testbed = new wisebed.Wisebed(config.rest_api_base_url, config.websocket_base_url);

module.exports = function(io) {
	var routes = {};

	routes.getNodes = function(req, res) {

		testbed.getWiseML(null,
		function(wiseml) {
			var nodes = wiseml.setup.node;

			var nodeUrns = nodes.map(function (node) { return node.id;	});
			testbed.experiments.areNodesConnected(nodeUrns, function(nodeStatus) {
				var nodeTable = "";

				for(var node = 0; node < nodes.length; node++) {
					var nodeSensors = "";
					for(var sensor = 0; sensor < nodes[node].capability.length; sensor++) {
	                    var sensorname = nodes[node].capability[sensor].name;
	                    nodes[node].hexId = nodes[node].id.substring(nodes[node].id.indexOf("x"));
	                    sensorname = sensorname.substring(sensorname.indexOf("capability:")+11);
	                    nodeSensors += ','+sensorname;
					}
					
					nodeSensors = nodeSensors.substr(1);

					if(nodeStatus[nodes[node].id].statusCode == 1) {
		                nodeTable += '<tr><td>'+node+'</td><td>'+
		                				nodes[node].id+'</td><td>'+nodes[node].nodeType+'</td><td>'+nodeSensors+
		                				'</td><td><div class="ui large checkbox"><input type="checkbox" id="0'+nodes[node].hexId+
		                				'" name="'+nodes[node].id+'"><label></label></div></td></tr> \n';
	               	}
	            }

	            res.send(nodeTable);
			}, function(err) {console.log("Error: "+err)});
		}, 
		function(err) {
			if(err) {
				console.log('Could not fetch sensor node information form portal server.');
				console.log(JSON.stringify(err));
			}
		},
		"json", null);

	}

	routes.reserveNodes = function(req, res) {
		var nodes = JSON.parse(req.body.nodeSelection);
	    var projectId = req.body.useProject;

	    Project.findOne( {_id : projectId}, function(err, project) {
	        if(err) {
	        	throw err;
	        }
	        else {
			    var startTime = req.body.startTime.split(":");
				var endTime = req.body.endTime.split(":");

			    var startDate = req.body.startDate.split("-");
				var endDate = req.body.endDate.split("-");

				var from = new Date(startDate[0], startDate[1]-1, startDate[2], startTime[0], startTime[1], 0);
				var to = new Date(endDate[0], endDate[1]-1, endDate[2], endTime[0], endTime[1], 0);

				var name = req.body.experimentName;

				if(!name) {
					name = project.name;
				}

				var credentials = [{
					"urnPrefix" : "urn:wisebed:uzl1:",
	           		"username"  : req.session.email,
	            	"password"  : req.session.password
	            }];

				testbed.reservations.make(from, to, nodes, name, [], 
					function(confidentialReservationDataList, textStatus, jqXHR) {
						
						var experiment = new Experiment({
						   	project: projectId,
						    from: from,
						    to: to,
						    nodeUrns: nodes,
						    name: name,
						    experimentId: confidentialReservationDataList.confidentialReservationDataList[0].serializedSecretReservationKeyBase64,
						    code: ""
						});

						var experimentCode = project.code;

						var leftSpiltIndex = experimentCode.indexOf("<!-- Configuration: Please do not remove -->");
						var rightSpiltIndex = experimentCode.indexOf("<!-- End of Configuration -->");
						var preConfigCode = experimentCode.substr(0,leftSpiltIndex);
						var experimentConfig = '<!-- Configuration: Please do not remove -->\n' +
						'<script src="/js/jquery-1.9.1.js"></script>\n' +
						'<script src="/js/jquery.md5.js"></script>\n' +
						'<script src="/js/base64_encode.js"></script>\n' +
						'<script src="/js/base64_decode.js"></script>\n' +
						'<script src="/js/CoAP.js"></script>\n' +
						'<script src="/js/ticketsystem.js"></script>\n' +
						'<script src="/socket.io/socket.io.js"></script>\n' +
						'<script src="/js/wisebed-remote.js"></script>\n' +
						'<script type="text/javascript">\n' +
					    '  jsMote = new JsMote();\n' +
					    '  jsMote.setExperimentId("'+experiment._id.toString()+'");\n' +
					  	'</script>\n';
					  	var postConfigCode = experimentCode.substr(rightSpiltIndex);
					  	
					  	experimentCode = preConfigCode+experimentConfig+postConfigCode;
					  	experiment.code = experimentCode;

						experiment.save(function(err, new_experiment) {
				  			User.findOne({email : req.session.email}, function (err, user) {
								if(err) { 
									throw err;
								}
								else {
									var userExperiments = user.experiments;
									userExperiments.push(new_experiment._id);
									user.update({
										experiments : userExperiments
									}, function (err, updatedUser) {
										var now = new Date();
										if(err) {
											throw err;
										}
										else {
											res.redirect("/workspace");
										}
									});
								}
						  	});
						});
					}
				, reservationError, credentials);
	        }
	    }); 

		function reservationError (jqXHR, textStatus, errorThrown) {
			req.session.error = jqXHR.status;
			res.redirect("/workspace");
		}

	}

	function broadcastFlashingProgress(progress) {
		io.broadcast('flashingProgress', progress);
	}

	function broadcastFinishedFlashing(result) {
		io.broadcast('finishFlashing', {message : JSON.stringify(result)});
	}


	function getNodeTypes(nodeUrns, callback) {
		testbed.getWiseML(null,
			function(wiseml) {
				var nodes = wiseml.setup.node;
				var nodeMap = new Array();	
				var iSense39 = new Array();
				var iSense48 = new Array();		
				var telosB = new Array();
				for(var index = 0; index < nodes.length; index++) {
					if (nodeUrns.indexOf(nodes[index].id) != -1) {
						if (nodes[index].nodeType == "isense39")  {
							iSense39.push(nodes[index].id);
						}
						else if (nodes[index].nodeType == "isense48") {
							iSense48.push(nodes[index].id);
						}
						else if (nodes[index].nodeType == "telosb") {
							telosB.push(nodes[index].id);
						}
					}
		        }
		        nodeMap.push(iSense39);
		        nodeMap.push(iSense48)
		        nodeMap.push(telosB)
		        callback(nodeMap);
			},
			function(err) {
				if(err) {
					console.log('Could not fetch sensor node information form portal server.');
					console.log(JSON.stringify(err));
				}
			}, "json", null
		);
	}

	routes.showExperiment = function(req, res) {
		Experiment.findOne({_id : req.params.experimentId}, function (err, experiment) {
			if(err) {
				throw err;
			}
			else {
				if (experiment) {
					if(!experiment.flashed) {
						getNodeTypes(experiment.nodeUrns, function(nodes) {
							 
							var iSense39Image = new Buffer(fs.readFileSync('./public/apps/iSense39/remote_app.bin')).toString('base64');
							var iSense48Image = new Buffer(fs.readFileSync('./public/apps/iSense48/remote_app.bin')).toString('base64');

							var data = {
								configurations : []
							};

							data.configurations.push({
								nodeUrns : nodes[0],
								image : "data:application/macbinary;base64,"+iSense39Image
							});

							testbed.experiments.flashNodes(
								experiment.experimentId, 
								data, 
								broadcastFinishedFlashing,
								broadcastFlashingProgress,
								function(jqXHR, textStatus, errorThrown) {
									console.log("error! :"); 
									console.log(jqXHR);
									console.log(textStatus);
									console.log(errorThrown);
								}
							);

							var data = {
								configurations : []
							};

							data.configurations.push({
								nodeUrns : nodes[1],
								image : "data:application/macbinary;base64,"+iSense48Image
							});

							testbed.experiments.flashNodes(
								experiment.experimentId, 
								data, 
								broadcastFinishedFlashing,
								broadcastFlashingProgress,
								function(jqXHR, textStatus, errorThrown) {
									console.log("error! :"); 
									console.log(jqXHR);
									console.log(textStatus);
									console.log(errorThrown);
								}
							);

							experiment.update({ $set: { flashed: true }}).exec();

							res.render("experiment", {
								experiment : experiment,
								loading :  {text : 
									'<p>Flashing remote application onto sensor nodes.</p><div class="ui active striped progress"><div id="progressbar" class="bar" style="width: 0%; display:block;"></div></div>'},
							});	
						});
					}
					else {
						res.render("experiment", {
							experiment : experiment
						});	
					}
				}
				else {
					res.redirect("/");
				}
			}
		});
	}

	routes.saveExperiment = function(req, res) {
		Experiment.findOne({_id : req.params.experimentId}, function (err, experiment) {
			if(err) {
				throw err;
			}
			else {
				if(req.body.overrideOption == "on") {
					Project.findOne({ _id : experiment.project }, function (err, project) {
						if(err) {
							throw err;
						}
						else {
							var newProjectCode = req.body.code;
							var oldProjectCode = project.code;

							var experimentLeftSpiltIndex = newProjectCode.indexOf("<!-- Configuration: Please do not remove -->");
							var experimentRightSpiltIndex = newProjectCode.indexOf("<!-- End of Configuration -->");

							var projectLeftSpiltIndex = oldProjectCode.indexOf("<!-- Configuration: Please do not remove -->");
							var projectRightSpiltIndex = oldProjectCode.indexOf("<!-- End of Configuration -->");

							var Configuration = oldProjectCode.slice(projectLeftSpiltIndex, projectRightSpiltIndex);

							var preConfigCode = newProjectCode.substr(0,experimentLeftSpiltIndex);
						  	var postConfigCode = newProjectCode.substr(experimentRightSpiltIndex);
						  	
						  	newProjectCode = preConfigCode+Configuration+postConfigCode;

							project.code = newProjectCode;
							project.save();
						}
					});
				}

				experiment.update({ code: req.body.code }, function() {
					res.redirect('/experiment/'+req.params.experimentId);
				});
			}
		});
	}

	routes.sendMessage = function(req, res) {
		console.log(req.body.message);
		Experiment.findOne({_id : req.params.experimentId}, function (err, experiment) {
			if(err) {
				throw err;
			}
			else {
				testbed.experiments.send(
					experiment.experimentId, 
					experiment.nodeUrns, 
					req.body.message, 
					function(result) {
						res.send();
					}, 
					function(jqXHR, textStatus, errorThrown) {
						console.log(jqXHR);
						console.log(textStatus);
						console.log(errorThrown);
						res.send();
					}
				);
			}
		});
	}

	var testbedSocket = null;

	function closeConnection() {
		if(testbedSocket != null) {
			testbedSocket.close(1000, 'The purpose for which the connection was established has been fulfilled.');
			console.log("Close Socket");
		}
		else {
			console.log("No running WebSocket!");
		}
	}

	function onMessage(event) {
		if(event.type == "upstream") {
			event.ascii = new Buffer(event.payloadBase64, 'base64').toString('ascii');
			event.ticket = event.ascii.substr(1,32);
			event.ascii = event.ascii.substr(33);

			var params = event.ascii.split("/");

			if(params[0] == "receive") {
				event.callback = "receive";
				event.from = params[1];
				event.to = params[2];
				event.lqi = params[3];
				event.clock = params[4];

				var message = event.ascii.substr(0, event.ascii.indexOf("/")+1);
					message = message.substr(0, message.indexOf("/")+1);
					message = message.substr(0, message.indexOf("/")+1);
					message = message.substr(0, message.indexOf("/")+1);
					message = message.substr(0, message.indexOf("/")+1);

				event.payload = message;
			}
			else if(params[0] == "broadcast") {
				event.callback = "broadcast";
				event.clock = params[1];
				event.from = params[2];

				var message = event.ascii.substr(0, event.ascii.indexOf("/")+1);
					message = message.substr(0, message.indexOf("/")+1);
					message = message.substr(0, message.indexOf("/")+1);

				event.payload = message;
			}
			else if(params[0] == "alert") {
				event.callback = "alert";
				event.payload = event.ascii.split("/")[1];		
			}
			else if(params[0] == "ledstate") {
				event.callback = "getLed";
				event.state = (params[1] == "true");		
			}
			else if(params[0] == "switchstate") {
				event.callback = "switchLed";
				event.payload = params[1];

			}
			else if(params[0] == "temp") {
				event.callback ="temp";
				event.temperature = parseInt(params[1]); 				
			}
			else if(params[0] == "light") {
				event.callback ="light";
				event.light = parseInt(params[1]); 
			}


			io.broadcast('incommingMessage', {message : event});
		}
	}

	routes.listenExperiment = function(experimentId) {
		closeConnection();

		Experiment.findOne({_id : experimentId}, function (err, experiment) {
			if(err) {
				throw err;
			}
			else {
				var onOpen = function(event)  {
					console.log("Open WisebedSocket");
				}

				var onClosed = function(event) {
					console.log("Close WisebedSocket");
				}

				testbedSocket = new testbed.WebSocket(experiment.experimentId, onMessage, onOpen, onClosed);
			}
		});
	}

	function dec2hex(i) {
	   return (i+0x100).toString(16).substr(-2).toUpperCase();
	}

	function convertToHexNodeId(nodeId) {
		var hexNodeId = '';
		for(var i=0; i<nodeId.length; i++) {
			hexNodeId += '0x'+nodeId.charCodeAt(i).toString(16)+',';
		}
		return hexNodeId;
	}

	routes.sendMidiFromURL = function(req, res) {
		request({url : req.body.link, encoding : null}, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
				Experiment.findOne({_id : req.params.experimentId}, function (err, experiment) {
					console.log(experiment);
					if(err) {
						throw err;
					}
					else {
						var midi = buildMidiFiles(body);
						console.log(JSON.stringify(midi));

						var messages = [];

						console.log(req.body);


						if(JSON.parse(req.body.seperateTracks).length == 0) {
							//[0A, 70,0x6c,0x61,0x79,0x4d,0x69,0x64,0x69 ,0x2f,     ticket       ,0x2f,   ,0x61, 0x6c, 0x6c   ,0x2f,0x00
							//function_type                                 delimiter hexTicketId  delimiter hexNodeId (all)   delimiter
							var message = {};
								message.header = new Buffer("play/"+req.body.ticket+"/all").toString('base64');
								message.data = []; 
								message.data.concat(midi.header);
							for (var i = 0; i < midi.tracks.length; i++) {
								message.data.concat(midi.tracks[i]);
							};
							messages.push(message);
						}
						else {
							for (var i = 0; i < seperateTracks.length; i++) {
								var trackId = seperateTracks[i].track;

								if(trackId > midi.tracks.length)
									throw new Error('Midifile does not contain '+trackId+' tracks!'); 

								var nodeId = seperateTracks[i].node;
								var hex_node_id = convertToHexNodeId(nodeId);

								var message = {};
									message.header = new Buffer("0x0A,0x70,0x6c,0x61,0x79,0x4d,0x69,0x64,0x69,0x2f"+req.body.ticket+",0x2f,"+hex_node_id+"0x2f,0x00").toString('base64');
									message.data = []; 
									message.data.concat(midi.header);
									message.data.concat(midi.tracks[trackId]);
								messages.push(message);
							};
						}

						for(var i = 0; i < messages.length; i++) {
							console.log("SEND HEADER")
							console.log(messages[i].header)
							testbed.experiments.send(
								experiment.experimentId, 
								experiment.nodeUrns, 
								messages[i].header, // SEND HEADER
								function(result) {
									console.log(result);
								}, 
								function(jqXHR, textStatus, errorThrown) {
									console.log(jqXHR);
									console.log(textStatus);
									console.log(errorThrown);
									
								}
							);
							console.log("SEND MESSAGES")
							for(var j = 0; j < messages[i].data.length; j++) {
								testbed.experiments.send(
									experiment.experimentId, 
									experiment.nodeUrns, 
									new Buffer("0x0A,0x4e,0x45,0x58,0x54,0x2f,0x"+dec2hex(messages[i].data[j])+",0x00").toString('base64'), //SEND DATA
									function(result) {
										console.log(result);
									}, 
									function(jqXHR, textStatus, errorThrown) {
										console.log(jqXHR);
										console.log(textStatus);
										console.log(errorThrown);
									
									}
								);
							}
							console.log("SEND FOOTER")
							testbed.experiments.send(
								experiment.experimentId, 
								experiment.nodeUrns, 
								 // SEND FOOTER
								function(result) {
									console.log(result);
									res.send();
								}, 
								function(jqXHR, textStatus, errorThrown) {
									console.log(jqXHR);
									console.log(textStatus);
									console.log(errorThrown);
									res.send();
								}
							);
						}
					}
				});
			}
		});
	}

	function buildMidiFiles(byteBuffer) {
		var MidiFile = {};
			MidiFile.tracks = [];
		var track_count = 0;

		var data = []
		for(var i = 0; i < byteBuffer.length; i++) {
			if(byteBuffer[i] == 77 && byteBuffer[i+1] == 84 && byteBuffer[i+2] == 114 && byteBuffer[i+3] == 107 && ((i%2) == 0)) {
				if(track_count == 0) {
					MidiFile.header = data;
				}
				else {
					var track = {};
						track.id = track_count-1;
						track.data = data;
					MidiFile.tracks.push(track);
				}
				track_count++;
				data = [77,84,114,107];
				i += 3;
			}
			else {
				data.push(byteBuffer[i])
			}
		}

		MidiFile.trackCount = track_count;
		return MidiFile;
	}

	return routes;
};
