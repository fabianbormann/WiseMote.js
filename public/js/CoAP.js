/**
  * CoAP functions
  **/

var CoAP = new function(){

  var CoAP_VERSION = "01";

  this.sendCoapMessage = function(messageType, payload){

	 switch (messageType) {
      case "CON": 
  			type = "00";
  			break;
  		case "NON":
  			type = "01";
  			break;
  		case "ACK":
  			type	= "10";
  			break;
  		case "RST":
  			type = "11";
  			break;
  		default:
  			return false;
  	}

  	var options = "0000";
  	var code = "0x0F"; // Request
  	var messageId = "0x00,0x00";

  	var message = byteToHex(CoAP_VERSION+type+options)+","+code+","+messageId+getHexString(payload);

  	//return message;
    //alert(message);

    //alert(wisebedBaseUrl);

    //DEBUG values 
    Wisebed.experiments.send("wisebed.itm.uni-luebeck.de", 
      "urn:wisebed:uzl1:,C877307430010AF6FAEC372E828FA15B", "urn:wisebed:uzl1:0x200c",
      message, alert, alert);
}

/**
  * basic functions
  **/

this.getHexString = function(text){

  var hexString = "";

  for (var i = 0; i < text.length; i++) {
    hexString += ","+byteToHex(decToByte(text.charCodeAt(i)));
  };

  return hexString;
}

function decToByte(charInput){

  var exponent = 7;
  var byteOutput = "";
  do {
    if((charInput/Math.pow(2, exponent)) >= 1){
      byteOutput += "1";
      charInput -= Math.pow(2, exponent);
      exponent--;
    }
    else{
      byteOutput += "0";
      exponent--;
    }

  } while ( exponent >= 0 );

  return byteOutput;
}

function byteToHex(Byte){
  var nibble_low = decNibbleToHex(nibbleToDec(Byte.substring(4,8)));
  var nibble_high = decNibbleToHex(nibbleToDec(Byte.substring(0,4)));  

  return "0x"+nibble_high+nibble_low;
}

function decNibbleToHex(decNibble){
    switch(decNibble){
      case 10: decNibble = "A"; break;
      case 11: decNibble = "B"; break;
      case 12: decNibble = "C"; break;
      case 13: decNibble = "D"; break;
      case 14: decNibble = "E"; break;
      case 15: decNibble = "F"; break;
      default: break;
    }

    return decNibble;
}

function nibbleToDec(nibble){
  var dec = (8*parseInt(nibble.charAt(0)))+(4*parseInt(nibble.charAt(1)))+
  (2*parseInt(nibble.charAt(2)))+(1*parseInt(nibble.charAt(3)));
  return dec;
}

function byteToDec(byte){
  var dec = (128*parseInt(nibble.charAt(0)))+(64*parseInt(nibble.charAt(1)))+
  (32*parseInt(nibble.charAt(2)))+(16*parseInt(nibble.charAt(3)))+(8*parseInt(nibble.charAt(4)))+
  (4*parseInt(nibble.charAt(5)))+(2*parseInt(nibble.charAt(6)))+(1*parseInt(nibble.charAt(7)));
  return dec;
}

}