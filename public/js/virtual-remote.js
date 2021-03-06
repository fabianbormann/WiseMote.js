var JsMote = (function() {

	var virtualNodes = [];

	function VirtualNode () {
		var id = "urn:virtual:uzl:0x0000";
		var ledState = false;
		var temperature = 20;
		var light = 55;
		var delay = 1000; 
		var metric = Math.floor(Math.random() * 200)+1

		this.configure = function(config) {
			id = "urn:virtual:uzl:"+config.id;
			ledState = config.led;
			temperature = config.temperature;
			light = config.light;
			delay = config.delay;
			if(config.metric) {
				metric = config.metric;
			}	
		}

		this.getId = function() {
			return id;
		}

		this.getDelay = function() {
			return delay;
		}

		this.receiveRadioMessage = function(from, message, callback, radioDelay) {
			setTimeout(function(){ 
				callback(id, message ,from.split(":")[3], id.split(":")[3], (metric+Math.floor(Math.random() * 20)+1), (Math.floor(Math.random() * 1000)+1)); 
			}, radioDelay);
		}

		this.request = function(message) {
			var result = {};
			switch(message.task) {
				case 0:
					result.callback = "switchLed";
					if(ledState == message.params && message.params == true) {
						result.payload = "already on";
					}
					else if(ledState == message.params && message.params == false) {
						result.payload = "already off"
					}
					else if(message.params == false) {
						result.payload = "turned off"
					}
					else if(message.params == true) {
						result.payload = "turned on"
					}
					ledState = message.params;
					response({
						content : result,
						callback : message.callback
					});
					break;
				case 1:
					result.callback = "alert";
					result.payload =  message.params;
					response({
						content : result,
						callback : message.callback
					});
					break;
				case 2:
					result.callback = "sensor";
					if(message.params == "light") {
						result.light = light;
					}
					else if(message.params == "temperature") {
						result.temperature = temperature;
					}
					else {
						throw new Error("Unknown sensor "+message.params)
					}
					response({
						content : result,
						callback : message.callback
					});
					break;
				case 3:
					result.callback = "getLed";
					result.state = ledState;
					response({
						content : result,
						callback : message.callback
					});
					break;
				default: throw new Error('Illegal arguments!')
			}
		}

		function response (message) {
			setTimeout(function() { 

				if (message.content.callback == "getLed") {
					message.callback(id, message.content.state);
				}
				else if (message.content.callback == "sensor") {
					message.callback(id, message.content.light ? message.content.light : message.content.temperature);
				}
				else if (message.content.callback == "alert") {
					message.callback(id, message.content.payload);
				}
				else if (message.content.callback == "switchLed") {
					message.callback(id, message.content.payload);
				}
			}, 
			delay);
		}
	};

	var remote = function() {

		this.addNode = function(config) {
	    	if(config) {
	    		var virtualNode = new VirtualNode();
	    		virtualNode.configure(config);
	    		virtualNodes.push(virtualNode);
	    	}
    	}	

		/**
		* Returns the same message 
		* e.g. alert("hello testbed") will return "hello testbed" from virtual node
		*/
		this.alert = function(message, callback, nodeId){
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered any message"); break;
		        case 1: 
		        	callback = this.receive;
		        	nodeId = "all";
		        	break;
		        case 2: 
		        	var optionalParams = handleOptionalParams([callback]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        case 3:
		       		var optionalParams = handleOptionalParams([callback, nodeId]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        default: throw new Error('Illegal argument count!');
	    	}

			var message = {
				task : 1,
				params : message,
				callback : callback
			};
			
			$.each(virtualNodes, function(index, virtualNode) {
				if((nodeId == "all") || (nodeId.indexOf(virtualNode.getId().split(":")[3]) != -1)) {
					virtualNode.request(message);
				}
			});
		};

		/**
		* Returns a specific sensor value
		* 
		* @param sensor {String} light, temperature
		* @param callback {function} optional callback function for response 
		*/
		this.getSensorValue  = function(sensor, callback, nodeId){
			switch(arguments.length) {
		        case 0: throw new Error("Enter a sensor name like light or temperature!"); break;
		        case 1: 
		        	callback = this.receive;
		        	nodeId = "all";
		        	break;
		        case 2: 
		        	var optionalParams = handleOptionalParams([callback]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        case 3:
		       		var optionalParams = handleOptionalParams([callback, nodeId]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        default: throw new Error('Illegal argument count!');
	    	}

			var message = {
				task : 2,
				params : sensor,
				callback : callback
			};

			$.each(virtualNodes, function(index, virtualNode) {
				if((nodeId == "all") || (nodeId.indexOf(virtualNode.getId().split(":")[3]) != -1)) {
					virtualNode.request(message);
				}
			});
		};

		/**
		* Sends a broadcast message to all sensor nodes 
		* in the current experiment (does not work in testmode)
		*
		* @param message {String} broadcasting message
		* @param callback {function} optional callback function for response 
		*/
		this.broadcast = function(message, callback, nodeId){
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered any message"); break;
		        case 1: 
		        	callback = this.receive;
		        	nodeId = "all";
		        	break;
		        case 2: 
		        	var optionalParams = handleOptionalParams([callback]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        case 3:
		       		var optionalParams = handleOptionalParams([callback, nodeId]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        default: throw new Error('Illegal argument count!');
	    	}

			var message = {
				params : message,
				callback : callback
			};

			$.each(virtualNodes, function(index, virtualNode) {	
				$.each(virtualNodes, function(broadcastIndex, otherNode) {
					if((virtualNode.getId() != otherNode.getId()) && ((nodeId == "all") || (nodeId.indexOf(virtualNode.getId().split(":")[3]) != -1))) {
						//Try to simulate broken message probability 
						if((Math.random()*100) < 80) {
							otherNode.receiveRadioMessage(virtualNode.getId(), message.params, message.callback, virtualNode.getDelay()+200);
						}
					}
				});
			});
		};

		/**
		* Switchs the Led state of a virtual wisebed node
		* 
		* @param state {String, bool} on,off,0,1
		* @param callback {function} optional callback function for response 
		*/
		this.switchLed  = function(state, callback, nodeId){
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered the new led state (on/off)"); break;
		        case 1: 
		        	callback = this.receive;
		        	nodeId = "all";
		        	break;
		        case 2: 
		        	var optionalParams = handleOptionalParams([callback]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        case 3:
		       		var optionalParams = handleOptionalParams([callback, nodeId]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        default: throw new Error('Illegal argument count!');
	    	}
			
			switch(state) {
		        case 1: state = true; break;
		        case 0: state = false;	break;
		        case "on": state = true; break;
		        case "off": state = false; break;
		        case true: state = true; break;
		        case false: state = false; break;
		        default: throw new Error('Unknown led state: Please choose on/off true/false or 1/0 as the new state.')
	    	}
			
			var message = {
				task : 0,
				params : state,
				callback : callback
			};

			$.each(virtualNodes, function(index, virtualNode) {
				if((nodeId == "all") || (nodeId.indexOf(virtualNode.getId().split(":")[3]) != -1)) {
					virtualNode.request(message);
				}
			});
		};

		/**
		* Returns the Led state
		*/
		this.getLedState  = function(callback, nodeId){
			switch(arguments.length) {
		        case 0: 
		        	callback = this.receive;
		        	nodeId = "all";
		        	break;
		        case 1: 
		        	var optionalParams = handleOptionalParams([callback]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        case 2:
		       		var optionalParams = handleOptionalParams([callback, nodeId]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        default: throw new Error('Illegal argument count!');
	    	}	
			
			var message = {
				task : 3,
				callback : callback
			};

			$.each(virtualNodes, function(index, virtualNode) {
				if((nodeId == "all") || (nodeId.indexOf(virtualNode.getId().split(":")[3]) != -1)) {
					virtualNode.request(message);
				}
			});

		};

		this.play = function(sound_url, callback, nodeId) {
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered a URL!"); break;
		        case 1: 
		        	callback = this.receive;
		        	nodeId = "all";
		        	break;
		        case 2: 
		        	var optionalParams = handleOptionalParams([callback]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        case 3:
		       		var optionalParams = handleOptionalParams([callback, nodeId]);
		        	if(optionalParams.length < 1) {
		        		throw new Error('Illegal argument type!');
		        	}
		        	else {
		        		callback = optionalParams[0];
		        		nodeId = optionalParams[1];
		        	}
		        	break;
		        default: throw new Error('Illegal argument count!');
	    	}

	    	//$.post('/sendMidiFromURL/test', { link : sound_url }); 		
		}

		/**
		* Default callback function for response (alert arguments)
		*/
		this.receive = function(argument1, argument2, argument3, argument4, argument5, argument6) {
			response = "";
			for(var i = 0; i < arguments.length; i++) {
				response += arguments[i]+" ";
			}
			alert(response);
		}

		var self = this;

		function handleOptionalParams(params) {
			result = new Array();
			if(params.length == 1) {
				if(typeof params[0] == 'function') {
	        		result.push(params[0]);
	        		result.push("all");
	        	}
	        	else if(typeof params[0] == 'object') {
	        		result.push(self.receive);
	        		result.push(params[0]);
	        	}
		    }
	    	else if(params.length == 2) {
	    		if(typeof params[0] == 'object' && typeof params[1] == 'function') {
	        		result.push(params[1]);
	        		result.push(params[0]);
	        	}
	        	else if(typeof params[0] == 'function' && typeof params[1] == 'object') {
	        		result.push(params[0]);
	        		result.push(params[1]);
	        	}
	        }
	        return result;

		}
	}
    return remote;
})();