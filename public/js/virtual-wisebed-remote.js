var JsMote = (function() {

	var virtualNode = function(config) {
		var ledState = config.led;
		var temperature = config.temperature;
		var light = config.light;
		var delay = config.delay; 

		var request = function(message) {
			switch(message.task) {
				case "switchLed": 
					ledState = message.params;
					response({
						content : message.params,
						callback : message.callback
					});
			}
		}

		function response (message) {
			setTimeout(message.callback(message.params), delay);
		}
	}

	var remote = function() {

		this.start = function(config) {
	    	virtualNode(config);
    	}	

		/**
		* Returns the same message 
		* e.g. alert("hello testbed") will return "hello testbed" from testbed
		*/
		this.alert = function(message, callback){
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered any message"); break;
		        case 1: callback = this.receive;
		        case 2: break;
		        default: throw new Error('Illegal argument count!')
	    	}

			var function_type = CoAP.getHexString("alert");
			var function_args = CoAP.getHexString(message);
			var ticketId = getTicketId("alert"+message);
			var hexTicketId = CoAP.getHexString(ticketId);
			
			tickets.checkIn(ticketId, callback);

			sendMessage(function_type+delimiter+hexTicketId+delimiter+function_args);
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

			var function_type = CoAP.getHexString("getSensorValue");
			var function_args = CoAP.getHexString(sensor);
			var ticketId = getTicketId("getSensorValue"+sensor);
			var hexTicketId = CoAP.getHexString(ticketId);
			
			tickets.checkIn(ticketId, callback);

			sendMessage(function_type+delimiter+hexTicketId+delimiter+function_args);	
		};

		/**
		* Sends a broadcast message to all sensor nodes 
		* in the current experiment
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

			var function_type = CoAP.getHexString("broadcast");
			var function_args = CoAP.getHexString(message);
			var ticketId = getTicketId("broadcast"+message);
			var hexTicketId = CoAP.getHexString(ticketId);

			tickets.checkIn(ticketId, callback);

			sendMessage(function_type+delimiter+hexTicketId+delimiter+function_args);
		};

		/**
		* Switchs the Led state of a virtual wisebed node
		* 
		* @param state {String, bool} on,off,0,1
		* @param callback {function} optional callback function for response 
		*/
		this.switchLed  = function(state, callback){
				
			var message = {};
			message.task = "switchLed";
			message.params = state;
			message.callback = callback;

			virtualNode.request(message);
		};
	}
    return remote;
})();