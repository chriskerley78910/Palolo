
 define([ 'video-chat/incoming-call/Component','people-models/Person'],
   function(Component, Person){
   describe('incoming-call view tests -',()=>{

     let sut = null;
     beforeEach(()=>{
       sut = new Component.viewModel();
     })

     it('onStore, isReceivingRoomInvite => show panle with caller.',()=>{
       const p = Person.getFake()
       spyOn(sut.store,'getRoomInviter').and.returnValue(p)
       spyOn(sut.store,'isReceivingRoomInvite').and.returnValue(true)
       spyOn(sut,'startRinging')
       sut.onStore()
       expect(sut.startRinging).toHaveBeenCalled()
     })


     it('onStore, isReceivingRoomInvite => isVisible()',()=>{
       expect(sut.isVisible()).toBeFalsy()
       const p = Person.getFake()
       spyOn(sut.store,'getRoomInviter').and.returnValue(p)
       spyOn(sut.store,'isReceivingRoomInvite').and.returnValue(true)
       sut.onStore()
       expect(sut.isVisible()).toBeTruthy()
     })

     it('onStore, isReceivingRoomInvite => invitersName, invitersPhoto set',()=>{
       const p = Person.getFake()
       spyOn(sut.store,'getRoomInviter').and.returnValue(p)
       spyOn(sut.store,'isReceivingRoomInvite').and.returnValue(true)
       sut.onStore()
       expect(sut.invitersName()).toBe(p.getFirst() + ' ' + p.getLast())
       expect(sut.invitersPhoto()).toBe(p.getLargePhotoURL())
     })

     it('onStore, !isReceivingRoomInvite => stopRinging',()=>{
       spyOn(sut,'stopRinging')
        spyOn(sut.store,'isReceivingRoomInvite').and.returnValue(false)
       sut.onStore()
       expect(sut.stopRinging).toHaveBeenCalled()
     })

     it('answerCall => dispatch answerCall',()=>{
       spyOn(sut.dis,'dispatch')
       const p = Person.getFake()
       spyOn(sut.store,'getRoomInviter').and.returnValue(p)
       spyOn(sut,'stopRinging')
       sut.join()

       expect(sut.stopRinging).toHaveBeenCalled()
       expect(sut.dis.dispatch).toHaveBeenCalledWith('joinRoom',p.getId())
     })



   }); // end describe.
 });
