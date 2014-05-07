/******************************************************************************
	Javascript Interface for Remote Controlling WISEBED Nodes (GSoC)
   	Copyright (C) 2013  Fabian Bormann

   	This program is free software: you can redistribute it and/or modify
    	it under the terms of the GNU General Public License as published by
    	the Free Software Foundation, either version 3 of the License, or
    	(at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

******************************************************************************/

var JsMote = (function() {

	var delimiter = ",0x2f";
	var tickets = new TicketSystem();

	/**
	* Use socket.io for wisebed server communication
	*/

	io = io.connect()

	io.on('incommingMessage', function(data) {
    	var callback = tickets.get(data.message.ticket);
		if(typeof callback == 'function') {
			if(data.message.callback == "alert") {
				callback(data.message.sourceNodeUrn, data.message.payload);
			}
			else if(data.message.callback == "receive") {
				callback(data.message.sourceNodeUrn, data.message.payload, data.message.from, data.message.to, data.message.lqi, data.message.clock);
			}
			else if(data.message.callback == "getLed") {
				callback(data.message.sourceNodeUrn, data.message.state);
			}
			else if(data.message.callback == "switchLed") {
				callback(data.message.sourceNodeUrn, data.message.payload);
			}	
			else if(data.message.callback == "temp") {
				callback(data.message.sourceNodeUrn, data.message.temperature);
			}		
			else if(data.message.callback == "light") {
				callback(data.message.sourceNodeUrn, data.message.light);
			}				
		}    	
	});

	var remote = function() {

		var experimentId;

		this.setExperimentId = function(experiment_id) {
			experimentId = experiment_id;
		}

		/**
		* Returns the same message 
		* e.g. alert("hello testbed") will return "hello testbed" from testbed
		*/
		this.alert = function(message, callback, nodeId) {
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered any message"); break;
		        case 1: 
		        	callback = this.receive;
		        	nodeId = "";
		        	break;
		        case 2: 
		        	if(typeof arguments[1] == 'function') {
		        		nodeId = "";
		        	}
		        	else if(typeof arguments[1] == 'string') {
		        		nodeId = arguments[1];
		        		callback = this.receive;
		        	}
		        	else {
		        		throw new Error('Illegal argument type!');
		        	}
		        	break;
		        case 3:
		        	if(typeof arguments[1] == 'string' && typeof arguments[2] == 'function') {
		        		var helper = arguments[1];
		        		callback = arguments[2];
		        		nodeId = helper;
		        	}
		        	else if(typeof arguments[1] == 'function' && typeof arguments[2] == 'string') {
		        		var callback = arguments[1];
		        		var nodeId = arguments[2];
		        	}
		        	else {
		        		throw new Error('Illegal argument type!');
		        	}
		        	break;
		        default: throw new Error('Illegal argument count!');
	    	}

			var function_type = CoAP.getHexString("alert");
			var function_args = CoAP.getHexString(message);
			var ticketId = getTicketId("alert"+message);
			var hexTicketId = CoAP.getHexString(ticketId);
			var hexNodeId = CoAP.getHexString(nodeId)
			
			tickets.checkIn(ticketId, callback);

			sendMessage(function_type+delimiter+hexTicketId+delimiter+hexNodeId+delimiter+function_args);
		};

		/**
		* Returns a specific sensor value
		* 
		* @param sensor {String} light, temperature
		* @param callback {function} optional callback function for response 
		*/
		this.getSensorValue  = function(sensor, callback) {
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

			sendMessage(function_type+delimiter+hexTicketId+delimiter+delimiter+function_args);	
		};

		/**
		* Sends a broadcast message to all sensor nodes 
		* in the current experiment
		*
		* @param message {String} broadcasting message
		* @param callback {function} optional callback function for response 
		*/
		this.broadcast = function(message, callback) {
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

			sendMessage(function_type+delimiter+hexTicketId+delimiter+delimiter+function_args);
		};

		/**
		* Switchs the Led state of a wisebed node
		* 
		* @param state {String, bool} on,off,0,1
		* @param callback {function} optional callback function for response 
		*/
		this.switchLed  = function(state, callback) {
			switch(arguments.length) {
		        case 0: throw new Error("You haven't entered the new led state (on/off)"); break;
		        case 1: callback = this.receive;
		        case 2: break;
		        default: throw new Error('Illegal argument count!')
	    	}
			
			switch(state) {
		        case 1: state = "on"; break;
		        case 0: state = "off";	break;
		        case "on": state = "on"; break;
		        case "off": state = "off"; break;
		        case true: state = "on"; break;
		        case false: state = "off"; break;
		        default: throw new Error('Unknown led state: Please choose on/off true/false or 1/0 as the new state.')
	    	}

	    	var function_type = CoAP.getHexString("switchLed");
			var function_args = CoAP.getHexString(state);
			var ticketId = getTicketId("switchLed"+state);
			var hexTicketId = CoAP.getHexString(ticketId);

			tickets.checkIn(ticketId, callback);

			sendMessage(function_type+delimiter+hexTicketId+delimiter+delimiter+function_args);
		};

		/**
		* Get the Led state (Boolean) of a wisebed node
		* 
		* @param callback {function} optional callback function for response
		*/
		this.getLedState = function(callback) {
			switch(arguments.length) {
		        case 0: callback = this.receive;
		        case 1: break;
		        default: throw new Error('Illegal argument count!')
	    	}			

			var function_type = CoAP.getHexString("getLedState");
			var ticketId = getTicketId("getLedState");
			var hexTicketId = CoAP.getHexString(ticketId);

			tickets.checkIn(ticketId, callback);

			sendMessage(function_type+delimiter+hexTicketId+delimiter+delimiter);	    	
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

		function getTicketId(functionElements) {
			var time = Date.prototype.getTime();
			var rand = Math.floor(Math.random() * 1000) + 1;
			var ticketId = $.md5($.md5(functionElements)+$.md5(time)+$.md5(rand));

			return ticketId;
		};

		function sendMessage(message) {
			prefix = "0x0A";
			suffix = ",0x00";

			message = prefix+message+suffix; 

			var messageBytes = remote.parseByteArrayFromString(message);
				base64_message = base64_encode(messageBytes);

	        $.post('/nodes/message/send/'+experimentId, { message : base64_message });
		};

	};

	remote.parseByteArrayFromString = function(messageString) {

		var splitMessage = messageString.split(",");
		var messageBytes = [];

		for (var i=0; i < splitMessage.length; i++) {

			splitMessage[i] = splitMessage[i].replace(/ /g, '');

			var radix = 10;

			if (splitMessage[i].indexOf("0x") == 0) {

				radix = 16;
				splitMessage[i] = splitMessage[i].replace("0x","");

			} else if (splitMessage[i].indexOf("0b") == 0) {

				radix = 2;
				splitMessage[i] = splitMessage[i].replace("0b","");

				if (/^(0|1)*$/.exec(splitMessage[i]) == null) {
					return null;
				}

			}

			messageBytes[i] = parseInt(splitMessage[i], radix);

			if (isNaN(messageBytes[i])) {
				return null;
			}
		}

		if (messageBytes.length == 0) {
			return null;
		}

		return messageBytes;
	};

    return remote;
})();