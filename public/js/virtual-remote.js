var JsMote = (function() {

	var virtualNode;

	function VirtualNode () {
		var ledState = false;
		var temperature = 20;
		var light = 55;
		var delay = 1000; 

		this.configure = function(config) {
			ledState = config.led;
			temperature = config.temperature;
			light = config.light;
			delay = config.delay; 		
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
			setTimeout(function(){ message.callback(message.content) }, delay);
		}
	};

	var remote = function() {

		this.start = function(config) {
	    	if(config) {
	    		virtualNode = new VirtualNode();
	    		virtualNode.configure(config);
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

			virtualNode.request(message);
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

			virtualNode.request(message);
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

			virtualNode.request(message);
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

			virtualNode.request(message);
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