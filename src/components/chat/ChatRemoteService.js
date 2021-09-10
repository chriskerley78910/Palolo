define(['socketio',
        'ActiveRemoteService',
        'dispatcher/Dispatcher',
        'chat/models/InboundChatMessage'],
function(io,
         ActiveRemoteService,
         Dispatcher,
         InboundChatMessage){

var ChatRemoteService = function(){

    this.constructor = ChatRemoteService;
    this.sock = null;
    this.io = io;
    this.dis = new Dispatcher();
    Object.setPrototypeOf(this, new ActiveRemoteService());
    this.setMicroServer("chat");


    this.onAuth = function(change){
      if(change.state == 'authenticated'){
        this.setSock(this.onSock);
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.disAuthId = this.dis.reg('authState', this.onAuth);


    this.onSock = function(){
      this.sock.on('io_error',this.onError);
      this.sock.on('messageSent', this.onMessageSent);
      this.sock.on('chatHistory',this.onMessageHistory);
      this.sock.on('friendTyping',this.onTyping);
      this.sock.on('message', this.onMessage);
      this.sock.on('seen', this.onSeen);
    }
    this.onSock = this.onSock.bind(this);


    this.onError = function(err){
      console.log(err);
    }

    this.onMessageHistory = function(raw){
      var collection = [];
      var host = this.getServerURL()
      raw.forEach(function(e){
        collection.push(new InboundChatMessage(e,host));
      })
      this.dis.dispatch('chatHistory', collection);
    }
    this.onMessageHistory = this.onMessageHistory.bind(this);

    this.onMessage = function(raw){
      var host = this.getServerURL()
      this.dis.dispatch('message', new InboundChatMessage(raw, host));
    }
    this.onMessage = this.onMessage.bind(this);

    this.onMessageSent = function(acknowledgement){
      this.dis.dispatch('messageSent', acknowledgement);
    }
    this.onMessageSent = this.onMessageSent.bind(this);


    this.onSeen = function(messageIds){
      if(!Array.isArray(messageIds)){
        throw new Error('messageIds must be an array.')
      }
      else if(messageIds.length > 0){
        this.dis.dispatch('seen',messageIds);
      }
    }
    this.onSeen = this.onSeen.bind(this);


    this.emitGetHistory = function(classmateId){
      this.sock.emit('getChatHistory',classmateId);
    }
    this.emitGetHistory = this.emitGetHistory.bind(this);
    this.histId = this.dis.reg('getChatHistory', this.emitGetHistory);


    this.emitSeen = function(m){
      this.sock.emit('messageSeen', m);
    }
    this.emitSeen = this.emitSeen.bind(this);
    this.seenId = this.dis.reg('messageSeen', this.emitSeen);


    this.emitMessage = function(m){
      this.sock.emit('sendMessage', m);
    }
    this.emitMessage = this.emitMessage.bind(this);
    this.sendMessageId = this.dis.reg('sendMessage',this.emitMessage);

    this.emitTyping = function(classmatesTyping){
      this.sock.emit('typing',classmatesTyping);
    }
    this.emitTyping = this.emitTyping.bind(this);
    this.typingId = this.dis.reg('typing',this.emitTyping);

    this.onTyping = function(classmateId){
      this.dis.dispatch('friendTyping',classmateId);
    }
    this.onTyping = this.onTyping.bind(this);

}

return ChatRemoteService;
})
