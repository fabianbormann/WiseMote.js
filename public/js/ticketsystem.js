function TicketSystem() {
    this.ticketIds = new Array();
    this.tickets = new Object();

    this.checkIn = function(ticketId, callback) {
        if(typeof callback != 'function'){
            throw new Error('Illegal argument count!');
        }
        if(this.tickets[ticketId] == null){
            this.ticketIds.push(ticketId);
        }
        this.tickets[ticketId] = callback;
    };

    this.get = function(ticketId) {
        var callback = this.tickets[ticketId];
        return callback;
    };

    this.remove = function(ticketId) {
        this.ticketIds.remove(ticketId);
        this.tickets[ticketId] = null;
    };

    this.each = function(fn){
        if(typeof fn != 'function'){
            return;
        }
        var len = this.ticketIds.length;
        for(var i=0;i<len;i++){
            var k = this.ticketIds[i];
            fn(k,this.tickets[k],i);
        }
    };

    this.entrys = function() {
        var len = this.ticketIds.length;
        var entrys = new Array(len);
        for (var i = 0; i < len; i++) {
            entrys[i] = {
                ticketId : this.ticketIds[i],
                value : this.tickets[i]
            };
        }
        return entrys;
    };

    this.isEmpty = function() {
        return this.ticketIds.length == 0;
    };

    this.size = function(){
        return this.ticketIds.length;
    };
}