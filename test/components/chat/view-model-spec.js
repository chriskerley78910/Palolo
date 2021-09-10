
define(['chat/ViewModel',
        'chat/models/ChatMessage',
        'chat/models/InboundChatMessage',
        'chat/models/OutboundChatMessage',
        'people-models/Person'],
function(ViewModel,
         ChatMessage,
         InboundChatMessage,
         OutboundChatMessage,
         Person){

    describe("Test ViewModel",() => {
      let fakeElement = null;

      beforeEach(() => {
        sut = new ViewModel.viewModel();
        fakeElement = {
          scrollTop:null,
          scrollHeight:5,
          clientHeight:1
        }
        spyOn(document,'getElementById').and.returnValue(fakeElement);
      })

      it('sets the remote service to live mode', () =>{
        expect(sut.remoteService.getServerURL()).toBe('http://chat.localhost');
      })

      it('',()=>{
        const cb = sut.dis.getCallbackById(sut.disChatId);
        expect(cb).toBe(sut.onMessage);
      })

      it('send() dispatches (sendMessage, ChatMessage())',()=>{
        spyOn(sut.dis,'dispatch');
        const classmateId = 1;
        sut.selectedClassmateId(classmateId);
        sut.newMessage('hello');
        expect(sut.messages().length).toBe(0);
        sut.send();
        expect(sut.messages().length).toBe(1);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('sendMessage',jasmine.any(ChatMessage));
      })


      it('onMessageSent(ack) sets sent() if token matches.',()=>{
        const m = OutboundChatMessage.getFake();
        sut.messages([m]);
        const ack = {token:m.getToken(), id:5};
        sut.onMessageSent(ack);
        expect(m.getId()).toBe(5);
        expect(m.sent()).toBeTruthy();
      })

      it('onMessageSent(ack), no token match => does nothing.',()=>{
        const m = OutboundChatMessage.getFake();
        sut.messages([m]);
        const ack = {token:m.getToken() + 1, id:5};
        sut.onMessageSent(ack);
        expect(m.sent()).toBeFalsy();
      })

      it('onMessageSent() only works on OutboundChatMessages',()=>{
        const m = InboundChatMessage.getFake();
        spyOn(m,'setId');
        sut.messages([m]);
        const ack = {token:123, id:5};
        sut.onMessageSent(ack);
        expect(m.setId).not.toHaveBeenCalled();
      })


      it('onMessageHistory adds all the messages to the msgs array', () =>{
        let classmateId = 2;
        sut.selectedClassmateId(classmateId);
        const message1 = InboundChatMessage.getFake();
        message1.setSenderId(classmateId);
        const message2 = InboundChatMessage.getFake();
        message2.setSenderId(classmateId);
        const messages = [message1,message2];
        sut.onMessageHistory(messages);
        expect(sut.messages().length).toBe(2);
      })

      it('onMessageHistory() adds messages to the end of msgs',()=>{
        var classmateId = 2;
        sut.selectedClassmateId(classmateId);
        let m1 = InboundChatMessage.getFake();
        m1.setId(1);
        m1.setSenderId(classmateId);
        let m2 = InboundChatMessage.getFake();
        m2.setId(2);
        m2.setSenderId(classmateId);
        sut.onMessageHistory([m1,m2]);
        expect(sut.messages()[0].getId()).toBe(2);
        expect(sut.messages()[1].getId()).toBe(1);
      })


      it('refreshChat(friendId) ^ isMember ^ friendId == -1 => nothing happens.',()=>{
        spyOn(sut,'isSpinnerVisible');
        sut.selectedClassmateId(-1);
        sut.refreshChat();
        expect(sut.isSpinnerVisible).not.toHaveBeenCalled();
      })

      it('refreshChat() => spinnerOn ^ classmateChatConnect', ()=>{
        let friendId = 3;
        sut.selectedClassmateId(friendId);
        spyOn(sut.dis,'dispatch');
        sut.newMessage('hello');
        sut.refreshChat();
        expect(sut.isSpinnerVisible()).toBeTruthy();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('getChatHistory', friendId);
        expect(sut.newMessage()).toBe('');
      })

      it('onClassmateSelected() => refreshChat', ()=>{
        spyOn(sut,'refreshChat');
        sut.onClassmateSelected(Person.getFake())
        expect(sut.refreshChat).toHaveBeenCalled();
      })


      it(`clearChat => msgs are erased`, () => {
        sut.messages([1,2,3]);
        sut.friendTyping(true);
        sut.clearChat();
        expect(sut.messages().length).toBe(0);
        expect(sut.friendTyping()).toBeFalsy();
      })

      it(`isValidInput <=> newMessage() is valid.`, ()=>{
        sut.typingSub.dispose();
        expect(sut.isValidInput()).toBeFalsy();
        sut.selectedClassmateId('5');
        sut.newMessage('some text');
        expect(sut.isValidInput()).toBeTruthy();
        sut.newMessage('');
        expect(sut.isValidInput()).toBeFalsy();
      })


      it('recordPartialText() => dispatch(typing, classmate, text)',()=>{
        spyOn(sut.dis,'dispatch');
        const classmateId = 5;
        const text = 'hell';
        sut.selectedClassmateId(classmateId);
        sut.newMessage(text);
        sut.recordPartialText();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('typing',{recipient_id:classmateId, text:text});
      })

      it(`isValidInput is false when newMessage has invalid text`, ()=>{
        sut.typingSub.dispose();
        expect(sut.isValidInput()).toBeFalsy();
        sut.selectedClassmateId(5);
        sut.newMessage('    ');
        expect(sut.isValidInput()).toBeFalsy();
      })

      it('newMessage is cleared after sendMsg completes', ()=>{
        sut.typingSub.dispose();
        sut.selectedClassmateId(5);
        sut.newMessage('hello');
        spyOn(sut.dis,'dispatch');
        sut.send();
        expect(sut.newMessage().length).toBe(0);
      })

       it('has ChatRemoteService defined upon initialization', () =>{
         expect(sut.remoteService.constructor.name).toBe("ChatRemoteService");
       })

       it('onMessageHistory([]) => attachSendMessagePrompt()', ()=>{
          spyOn(sut,'attachSendMessagePrompt');
          sut.isSpinnerVisible(true);
          sut.onMessageHistory([]);
          expect(sut.attachSendMessagePrompt).toHaveBeenCalled();
          expect(sut.isSpinnerVisible()).toBeFalsy();
       })


       it('onMessageHistory([msgs]) => showSendMsgPrompt(false)', ()=>{
         sut.showSendMsgPrompt(true);
         let msg = InboundChatMessage.getFake();
         sut.onMessageHistory([msg]);
         expect(sut.showSendMsgPrompt()).toBeFalsy();
       })

       it('showSendMsgPrompt() is false by default.', ()=>{
          expect(sut.showSendMsgPrompt()).toBeFalsy();
       })

       it('attachSendMessagePrompt() => showSendMsgPrompt()  === true', ()=>{
         sut.attachSendMessagePrompt();
         expect(sut.showSendMsgPrompt()).toBeTruthy();
       })

       it('onClassmateSelected(null) => throws ', ()=>{
         let f = ()=>{
           sut.onClassmateSelected(null);
         }
         expect(f).toThrow(new Error('Classmate must be an object.'));
       })


       it('onClassmateSelected(Person) => sets selectedClassmateId(Person.getId())', ()=>{
         const p = Person.getFake();
         spyOn(sut.dis,'dispatch');
         sut.onClassmateSelected(p);
         expect(sut.selectedClassmateId()).toBe(p.getId());
       })

       it('onMessage() ^ senderId != currentClassmateId => !emit seen', ()=>{
         let classmateId = 2;
         spyOn(sut.dis,'dispatch');
         sut.selectedClassmateId(classmateId);
         let message = InboundChatMessage.getFake();
         message.setSenderId(classmateId + 1);
         sut.onMessage(message);
         expect(sut.dis.dispatch).not.toHaveBeenCalled();
       })

       it('onOpenGroupView() clears the selectedClassmateId()',()=>{
         sut.selectedClassmateId('54');
         sut.setNoPersonSelected();
         expect(sut.selectedClassmateId()).toBeNull();
       })

       it('onMessage() => adds it to the end of messages', ()=>{
         let friendId = 1;
         sut.selectedClassmateId(friendId);
         let m = InboundChatMessage.getFake();
         m.setSenderId(friendId);
         spyOn(sut.dis,'dispatch');
         sut.friendTyping(true);
         sut.onMessage(m);
         expect(sut.messages()[0].text).toBe('hello');
         expect(sut.dis.dispatch).toHaveBeenCalledWith('messageSeen',m);
         expect(sut.friendTyping()).toBeFalsy();
       })

       it('on(currentUser message) => showSendMsgPrompt() == false', ()=>{
         const m = InboundChatMessage.getFake();
         spyOn(sut.dis,'dispatch');
         sut.selectedClassmateId(m.getSenderId());
         sut.onMessage(m);
         expect(sut.showSendMsgPrompt()).toBeFalsy();
       })

       it('updateTextInputPlaceHolder(info) => sut.firstName() is updated', () =>{
          sut.updateTextInputPlaceHolder(Person.getFake());
          expect(sut.placeholder()).toBe("What would you like to say to First?");
       })


       it('inputClicked() => inputHasFocus() == true', ()=>{
         expect(sut.inputHasFocus()).toBeFalsy();
         sut.inputClicked();
         expect(sut.inputHasFocus()).toBeTruthy();
       })

       it('onMessageHistory(msgs) only adds ones from the selectedClassmate', ()=>{

         let classmateId = 2;
         sut.selectedClassmateId(classmateId);
         let mOwner = InboundChatMessage.getFake();
             mOwner.owner = true;
             mOwner.setId(1);
             mOwner.setSenderId(1);

         let mCurrentFriend = InboundChatMessage.getFake();
             mCurrentFriend.setSenderId(sut.selectedClassmateId());
             mCurrentFriend.setId(2);

         let mStranger = InboundChatMessage.getFake();
             mStranger.setSenderId(sut.selectedClassmateId() + 1);
             mStranger.owner = false;
             mStranger.setId(3);

         let msgs = [mOwner, mCurrentFriend, mStranger];
         sut.onMessageHistory(msgs);
         expect(sut.messages().length).toBe(2);
         expect(sut.messages()[1].getId()).toBe(1);
         expect(sut.messages()[0].getId()).toBe(2);
       })

       it('onMessageSeen(mIds) sets all matches to seen', ()=>{
          let m1 = OutboundChatMessage.getFake();
              m1.setId(1);
          let m2 = OutboundChatMessage.getFake();
              m2.setId(2);
          let m3 = OutboundChatMessage.getFake();
              m3.setId(3);
          sut.messages.push(m1);
          sut.messages.push(m2);
          sut.messages.push(m3);
          const ids = [1,2,4];
          sut.onMessagesSeen(ids);
          expect(m1.seen()).toBeTruthy();
          expect(m2.seen()).toBeTruthy();
          expect(m3.seen()).toBeFalsy();
       })


       it('onTyping(selectedClassmateId) => friendTyping() == true ',()=>{
         const id = 1;
         sut.selectedClassmateId(id);
         expect(sut.friendTyping()).toBeFalsy();
         sut.onTyping(id);
         expect(sut.friendTyping()).toBeTruthy();
       })

       it('onTyping(!selectedClassmateId) => !friendTyping() ',()=>{
         const id = 1;
         sut.selectedClassmateId(id + 1);
         expect(sut.friendTyping()).toBeFalsy();
         sut.onTyping(id);
         expect(sut.friendTyping()).toBeFalsy();
       })

    }); // end describe

}); // end define.
