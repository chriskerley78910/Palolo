


define(['chat/ChatRemoteService',
        'chat/models/InboundChatMessage'],
function(ChatRemoteService, InboundChatMessage){

    describe("Test ChatRemoteService", function(){


    var sut = null;

    beforeEach(()=>{
      sut = new ChatRemoteService();
      sut.sock = {emit:jasmine.createSpy()}
    })

    it('getServerURL() returns the http://chat.localhost', () =>{
        let server = sut.getServerURL();
        expect(server).toBe("http://chat.localhost");
    })

    it('onAuth({state == authenticated}) => connect', ()=>{
      sut.sock = {
        connect:jasmine.createSpy(),
        on:jasmine.createSpy()
      }
      spyOn(sut,'setSock');
      sut.onAuth({state:'authenticated'});
      expect(sut.setSock).toHaveBeenCalledWith(sut.onSock);
    })

    it('registers onAuth on the auth channel.', ()=>{
      const cb = sut.dis.getCallbackById(sut.disAuthId);
      expect(cb).toBe(sut.onAuth);
    })

    it(`onMessageHistory() dispatches InboundChatMessages`, ()=>{
      const raw = [InboundChatMessage.getRaw(),
                   InboundChatMessage.getRaw()];
      spyOn(sut.dis,'dispatch');
      sut.onMessageHistory(raw);
      expect(sut.dis.dispatch).toHaveBeenCalledWith('chatHistory',jasmine.any(Array));
    })

    it('onMessageHistory')

    it('onNewMessage(raw) dispatches a InboundChatMessage', ()=>{
      const raw = InboundChatMessage.getRaw();
      spyOn(sut.dis,'dispatch');
      sut.onMessage(raw);
      expect(sut.dis.dispatch).toHaveBeenCalledWith('message', jasmine.any(Object));
    })

    it('registers the emitMessage on the sendMessage channel', ()=>{
      const cb = sut.dis.getCallbackById(sut.sendMessageId);
      expect(cb).toBe(sut.emitMessage);
    })

    it('emitGetHistory is registerd on the getChatHistory channel', ()=>{
      const cb = sut.dis.getCallbackById(sut.histId);
      expect(cb).toBe(sut.emitGetHistory);
    })

    it('emitSeen(friendId) emits messageSeen event', ()=>{
      let friendId = 2;
      sut.emitSeen(friendId);
      expect(sut.sock.emit).toHaveBeenCalledWith('messageSeen',friendId);
    })

    it('sendMessage() => socket.emit(msg,and onMessageSent)', ()=>{
      const obj = {recipientId:5, message:'hello'};
      sut.emitMessage(obj);
      expect(sut.sock.emit).toHaveBeenCalledWith('sendMessage',obj);
    })

    it('emitTextTyped(text) does just that.', ()=>{
      const classmatesTyping = {recipient_id:1, text:'hello'}
      sut.emitTyping(classmatesTyping);
      expect(sut.sock.emit).toHaveBeenCalledWith('typing', classmatesTyping);
    })

    it('emitTyping is registerd on the typing channel.',()=>{
      const cb = sut.dis.getCallbackById(sut.typingId);
      expect(cb).toBe(sut.emitTyping);
    })

    it('onTyping() => dispatch(friendTyping,id)', ()=>{
      const id = 1;
      spyOn(sut.dis,'dispatch');
      sut.onTyping(id);
      expect(sut.dis.dispatch).toHaveBeenCalledWith('friendTyping',id);
    })



    }); // end describe

}); // end define.
