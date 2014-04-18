var JsMote = (function() {

	var virtualNodes = [];

	function VirtualNode () {
		var id = "0x0000";
		var ledState = false;
		var temperature = 20;
		var light = 55;
		var delay = 1000; 

		this.configure = function(config) {
			id = config.id;
			ledState = config.led;
			temperature = config.temperature;
			light = config.light;
			delay = config.delay; 		
		}

		this.getId = function() {
			return id;
		}

		this.getDelay = function() {
			return delay;
		}

		this.receiveRadioMessage = function(from, message, metrics) {
			setTimeout(function(){ alert(id+': received Message "'+message+'" from '+from) }, metrics);
		}

		this.request = function(message) {
			switch(message.task) {
				case 0:
					ledState = message.params;
					response({
						content : message.params,
						callback : message.callback
					});
					break;
				case 1:
					response({
						content : message.params,
						callback : message.callback
					});
					break;
				case 2:
					var result;
					if(message.params == "light") {
						result = light;
					}
					else if(message.params == "temperature") {
						result = temperature;
					}
					else {
						result = "error: unknown sensor "+message.params 
					}
					response({
						content : result,
						callback : message.callback
					});
					break;
				case 3:
					response({
						content : "broadcasting: "+message.params,
						callback : message.callback
					});
					break;
				default: throw new Error('Illegal arguments!')
			}
		}

		function response (message) {
			setTimeout(function(){ message.callback(id+":"+message.content) }, delay);
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
		this.alert = function(message, callback){
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered any message"); break;
		        case 1: callback = this.receive;
		        case 2: break;
		        default: throw new Error('Illegal argument count!')
	    	}

			var message = {
				task : 1,
				params : message,
				callback : callback
			};
			
			$.each(virtualNodes, function(index, virtualNode) {
				virtualNode.request(message);
			});
		};

		/**
		* Returns a specific sensor value
		* 
		* @param sensor {String} light, temperature
		* @param callback {function} optional callback function for response 
		*/
		this.getSensorValue  = function(sensor, callback){
			switch(arguments.length) {
		        case 0: throw new Error("Enter a sensor name like light or temperature!"); break;
		        case 1: callback = this.receive;
		        case 2: break;
		        default: throw new Error('Illegal argument count!')
	    	}

			var message = {
				task : 2,
				params : sensor,
				callback : callback
			};

			$.each(virtualNodes, function(index, virtualNode) {
				virtualNode.request(message);
			});
		};

		/**
		* Sends a broadcast message to all sensor nodes 
		* in the current experiment (does not work in testmode)
		*
		* @param message {String} broadcasting message
		* @param callback {function} optional callback function for response 
		*/
		this.broadcast = function(message, callback){
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered any message"); break;
		        case 1: callback = this.receive;
		        case 2: break;
		        default: throw new Error('Illegal argument count!')
	    	}

			var message = {
				task : 3,
				params : message,
				callback : callback
			};

			$.each(virtualNodes, function(index, virtualNode) {
				virtualNode.request(message);

				$.each(virtualNodes, function(broadcastIndex, otherNode) {
					if(virtualNode.getId() != otherNode.getId())
						otherNode.receiveRadioMessage(virtualNode.getId(), message.params, virtualNode.getDelay()+200);
				})
			});
		};

		/**
		* Switchs the Led state of a virtual wisebed node
		* 
		* @param state {String, bool} on,off,0,1
		* @param callback {function} optional callback function for response 
		*/
		this.switchLed  = function(state, callback){
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered a state"); break;
		        case 1: callback = this.receive;
		        case 2: break;
		        default: throw new Error('Illegal argument count!')
	    	}
			
			var message = {
				task : 0,
				params : state,
				callback : callback
			};

			$.each(virtualNodes, function(index, virtualNode) {
				virtualNode.request(message);
			});
		};

		/**
		* Default callback function for response
		*
		* @param text {String, Number, bool} will be used for alert
		*/
		this.receive = function(text) {
			alert(text);
		}
	}
    return remote;
})();