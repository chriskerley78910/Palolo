
define(['chat/models/ChatMessage'],
function(ChatMessage){
    describe("Test ChatMessage", function(){

        it('new ChatMessage() throws if there is no text in it.', ()=>{
          let f = ()=>{
            let obj = {}
            new ChatMessage(obj,'host');
          }
          expect(f).toThrow(new Error('text property must exist in the message.'));
        })

        it('new ChatMessage(msg) sets rawText property', ()=>{
          const m = new ChatMessage({text:'hello',small_photo_url:'img'},'host');
          expect(m.text).toBe('hello');
        })

        it('throws if img url not passed in', ()=>{
          try{
            new ChatMessage({text:'text',small_photo_url:null},'host')
          }
          catch(err){
            expect(err.message).toBe('senders img url required')
          }
        })

        it('getImageURL() does just that.',()=>{
          const raw = {text:'text',small_photo_url:'img'}
          const m = new ChatMessage(raw,'host')
          expect(m.getSenderImageURL()).toBe('host/img')
        })


    }); // end describe

}); // end define.
