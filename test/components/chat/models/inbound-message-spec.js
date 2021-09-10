
define(['chat/models/InboundChatMessage','chat/models/ChatMessage',],
function(InboundChatMessage, ChatMessage){

    describe("Test InboundChatMessage", function(){

      let m;
      beforeEach(()=>{
          m = InboundChatMessage.getFake();
      })

      it('inherits from ChatMessage', ()=>{
        expect(m instanceof ChatMessage).toBeTruthy();
      })

      it('sent() == true', ()=>{
        expect(m.sent()).toBeTruthy();
      })

      it('seen() == false', ()=>{
        expect(m.seen()).toBeFalsy();
      })

      it('seen() == true iff raw.seen == 1', ()=>{
        const r = InboundChatMessage.getRaw();
        r.seen = 1;
        const h = 'h'
        const m = new InboundChatMessage(r, h);
        expect(m.seen()).toBeTruthy();
      })

      it('new InboundChatMessage() ^ no message_id => throws', ()=>{
        const raw = InboundChatMessage.getRaw();
        raw.message_id = null;
        let f = ()=>{
          new InboundChatMessage(raw,'host');
        }
        expect(f).toThrow(new Error('message_id must be specified.'));
      })

      it('new InboundChatMessage() ^ user_id not set => throws error', ()=>{

        let f = ()=>{
            new InboundChatMessage({
              text:'some text',
              small_photo_url:'url'
            },'host');
        }
        expect(f).toThrow(new Error('message_id must be specified.'));
      })

      it('new InboundChatMessage() ^ recipient_id not set => throws error', ()=>{
        let obj = InboundChatMessage.getRaw();
        obj.recipient_id = null;
        try{
          new InboundChatMessage(obj,'host');
        } catch(err){
          expect(err.message).toBe('recipient_id must be set on each message.');
        }
      })

      it('new InboundChatMessage(msg) set the decorated text.', ()=>{
        let obj = InboundChatMessage.getRaw();
        obj.text = 'some text https://hello.com';
        obj.owner = false
        let msg = new InboundChatMessage(obj,'host');
        let expectedHTML = `some text <a target="_blank" class="chat-link-friend" href="https://hello.com">https://hello.com</a>`
        expect(msg.getHTML()).toBe(expectedHTML);
      })

     it('wrapsLinks(message) ^ owner == false => anchor tag has chat-link-friend', ()=>{

       let obj = InboundChatMessage.getRaw();
       obj.text = 'some text https://hello.com';
       obj.owner = false;
       let msg = new InboundChatMessage(obj,'host');
       let html = msg.getHTML();
       expect(html).toBe('some text <a target="_blank" class="chat-link-friend" href="https://hello.com">https://hello.com</a>');
     })

      it('msg.setStyleClass(class) does just that.', ()=>{
        let obj = InboundChatMessage.getRaw();
        obj.owner = true;
        obj.text = 'some text https://hello.com';
        let msg = new InboundChatMessage(obj,'host');
        let expectedHTML = `some text <a target="_blank" class="chat-link" href="https://hello.com">https://hello.com</a>`
        expect(msg.getHTML()).toBe(expectedHTML);
      })


    }); // end describe

}); // end define.
