
define(['chat/models/OutboundChatMessage'],
function(OutboundChatMessage){
    describe("Test OutboundChatMessage", function(){

      let sut;

      beforeEach(()=>{
        const m = OutboundChatMessage.getFake()
        sut = m;
      })

      it('sent == false', ()=>{
        expect(sut.sent()).toBeFalsy();
      })

      it('seen() == false',()=>{
        expect(sut.seen()).toBeFalsy();
      })

      it('setSent() does not work if the token is wrong.', ()=>{
        sut.setSent(sut.token + 1);
        expect(sut.sent()).toBeFalsy();
      })

      it('setSent(token), token matches => sent() == true', ()=>{
        sut.setSent(sut.token);
        expect(sut.sent()).toBeTruthy();
      })

      it('setSeen(mId) <=> messageId == id',()=>{
        expect(sut.seen()).toBeFalsy();
        sut.setSeen(sut.getId());
        expect(sut.seen()).toBeTruthy();
      })

      it('setRecipientId(null) throws',()=>{
        try{
          sut.setRecipientId(null)
          expect(true).toBeFalsy();
        }
        catch(err){
          expect(err.message).toBe('recipient_id must be a integer.');
        }

      })

      it('token is a timestamp', ()=>{
        expect(sut.getToken()).toMatch(/^[0-9]{5,}/);
      })

    }); // end describe

}); // end define.
