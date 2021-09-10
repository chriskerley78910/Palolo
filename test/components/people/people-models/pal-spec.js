define(['people-models/Pal',
        'people-models/Classmate',
        'people-models/Person'],
function(Pal,
         Classmate,
         Person){
    describe("Pal Tests", function(){

      let sut = null;
      beforeEach(()=>{
        const raw = Classmate.getRaw();
        raw.is_new = 0;
        const host = 'https://host'
        sut = new Pal(raw, host);
      })

      it('unsetIsInvitedToRoom() => isInvitedToRoom() == false', ()=>{
        const roomId = 1
        sut.setIsInvitedToRoom(roomId)
        expect(sut.isInvitedToRoom()).toBeTruthy()
        sut.unsetIsInvitedToRoom()
        expect(sut.isInvitedToRoom()).toBeFalsy()
      })

      it('isInvitedToRoom() => false by default', ()=>{
        expect(sut.isInvitedToRoom()).toBeFalsy()
      })

      it('setIsInvitedToRoom(roomId) does just that.', ()=>{
        const roomId = 4
        expect(sut.getInvitedRoomId()).toBeNull()
        sut.setIsInvitedToRoom(roomId)
        expect(sut.isInvitedToRoom()).toBeTruthy()
        expect(sut.getInvitedRoomId()).toBe(roomId)
      })

      it('instanceof Person', ()=>{
        const prototype = Object.getPrototypeOf(sut)
        expect(prototype.getConstructorName()).toBe('Classmate');
      })

      it('getId() == id of the person,',()=>{
        expect(sut.getId()).toBe(2);
      })

      it('getCopy(p) copies a Person',()=>{
        const copy = Classmate.getCopy(sut);
        expect(copy.getId()).toBe(sut.getId());
      })

      it('setAsNew() does jus that.',()=>{
        expect(sut.isNew()).toBeFalsy();
        expect(sut.getRawNew()).toBeFalsy();
        sut.setAsNew();
        expect(sut.isNew()).toBeTruthy();
        expect(sut.getRawNew()).toBeTruthy();
      })

      it('throws if the is_new attribute is missing.',()=>{
        try{
          let raw = Classmate.getRaw();
          const host = 'https://host'
          new Pal(raw, host);
          expect(true).toBe(false);
        }
        catch(err){
          expect(err.message).toBe('is_new must be 0 or 1.');
        }
      })

      it('isAddable() == true',()=>{
        expect(sut.isAddable()).toBeFalsy();
      })

    }); // end describe

}); // end define.
