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

	var remote = function() {
		
		var experimentId = "";
		var socket;
		var nodes;
		var testbedId;
		var tickets = new TicketSystem();
		var lastMessage = "";

		this.start = function() {
			this.testbedId = "uzl";
	    	this.getExperimentId(reservationKey);
	    	this.callInit(this);
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
		* Switchs the Led state of a wisebed node
		* 
		* @param state {String, bool} on,off,0,1
		* @param callback {function} optional callback function for response 
		*/
		this.switchLed  = function(state, callback){
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

			sendMessage(function_type+delimiter+hexTicketId+delimiter+function_args);
		};

		this.callInit = function(self){
			if(experimentId != ""){
				self.init();
			}
			else{
				setTimeout(function(){self.callInit(self);},200);
			}
		};

		this.init = function(){
	    	//TODO nodetextbox need a ID or a Class to get the innerHTML and node Array
	    	//this.nodes = ["urn:wisebed:uzl1:0x200c"];
	    	initSocket(testbedId, experimentId, this.decodeIncommingMessage, this.reconnect);
	    };

		function initSocket(testbedId, experimentId, onmessage, onclosed){
	        this.giveFeedback = function(event){
	    		//alert(window.event.type+ "\n" + JSON.stringify(event));
	    	}

	        this.onmessage = onmessage;
	        this.onopen = this.giveFeedback;
	        this.onclosed = onclosed;

	        window.WebSocket = window.MozWebSocket || window.WebSocket;

	        var self = this;

	        this.socket = new WebSocket('ws://wisebed.itm.uni-luebeck.de' + '/ws/experiments/' + experimentId);
	        this.socket.onmessage = function(event) {
	            self.onmessage(JSON.parse(event.data));
	        };
	        this.socket.onopen = function(event) {
	            self.onopen(event);
	        };
	        this.socket.onclose = function(event) {
	            self.onclosed(event);
	        };

	        this.send = function(message) {
	            this.socket.send(JSON.stringify(message, null, '  '));
	        };

	        this.close = function(code, reason) {
	            this.socket.close(code !== undefined ? code : 1000, reason !== undefined ? reason : '');
	        };
	    };

	    this.getExperimentId = function(reservationKey){
				var secretReservationKeys = {reservations : [] };
				var splittedKey = reservationKey.split(",");

				secretReservationKeys.reservations[0] = {
						urnPrefix : splittedKey[0],
						secretReservationKey : splittedKey[1]
				};

				$.ajax({
					url         : wisebedBaseUrl + "/rest/2.3/" + this.testbedId + "/experiments",
					type        : "POST",
					data        : JSON.stringify(secretReservationKeys, null, '  '),
					contentType : "application/json; charset=utf-8",
					success     : setExperimentId,
					error       : console.log,
					xhrFields   : { withCredentials: true }
				});
	    };

	    function setExperimentId(data, textStatus, jqXHR){
	    	var experimentUrl = jqXHR.responseText;
	    	experimentId = experimentUrl.substr(experimentUrl.lastIndexOf('/') + 1);
	    };

	    this.decodeIncommingMessage = function(event){
	    	var message = base64_decode(event.payloadBase64);
		    	if(message.length > 33){
			    	var id = message.substr(1,32);
			    	var payload = message.substr(33);

			    	var callback = tickets.get(id);
					
			    	if(!(payload == lastMessage)){
			    		lastMessage = payload;

			    		if(typeof callback == 'function'){
		            		callback(payload);
		        		}
			    	}
		    	}
	    };

		this.receive = function(message){
			alert(message);
		};

	    this.reconnect = function(event){
	    	initSocket(this.testbedId, this.experimentId, this.decodeIncommingMessage, function(){this.reconnect();});
	    };

		function getTicketId(functionElements){
			var time = Date.prototype.getTime();
			var rand = Math.floor(Math.random() * 1000) + 1;
			var ticketId = $.md5($.md5(functionElements)+$.md5(time)+$.md5(rand));
			return ticketId;
		};

		function sendMessage(message){
			
			prefix = "0x0A";
			suffix = ",0x00";

			message = prefix+message+suffix; 

			var messageBytes = remote.parseByteArrayFromString(message);
			
			base64_message = base64_encode(messageBytes);

			this.socket.send(JSON.stringify({
	                    type: 'upstream',
	                    targetNodeUrn: targetNode,
	                    payloadBase64: base64_message
	        }));
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