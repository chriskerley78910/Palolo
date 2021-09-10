
 define([ 'video-chat/Component','people-models/Person'],
   function(Component, Person){
     // note, do NOT replacea function to mock it.
     // use a jasmine SPY because it will get released in-between
     // unit tests, where as redefining the function will not get
     // reset.
   describe('video-chat view model tests -',()=>{

     let sut = null;
     beforeEach(()=>{
          sut = new Component.viewModel();
     })


     it('onStore, isParticipantMicrophoneOn() <=> isParticipantMicrophoneOn()',()=>{
       expect(sut.isParticipantMicrophoneOn()).toBeFalsy()
       spyOn(sut,'isParticipantMicrophoneOn').and.returnValue(true)
       sut.onStore()
       expect(sut.isParticipantMicrophoneOn()).toBeTruthy()

       sut.isParticipantMicrophoneOn.and.returnValue(false)
       sut.onStore()
       expect(sut.isParticipantMicrophoneOn()).toBeFalsy()
     })


     it('onStore, isPalHungupVisible() => isPalHungupVisible()',()=>{
       spyOn(sut.store,'isPalHungupVisible').and.returnValue(true)
       expect(sut.isPalHungupVisible()).toBeFalsy()
       sut.onStore()
       expect(sut.isPalHungupVisible()).toBeTruthy()
     })

     it('palOnline == false by default', ()=>{
       expect(sut.isPalOnline() == false).toBeTruthy()
     })

     it('onStore, isFocusedPersonOnline() => isPalOnline() == true',()=>{
       expect(sut.isPalOnline()).toBeFalsy()
       spyOn(sut.store,'isFocusedPersonOnline').and.returnValue(true)
       sut.onStore()
       expect(sut.isPalOnline()).toBeTruthy()
     })

     it('onStore, showSpinner() => isSpinnerVisible() == true', ()=>{
       spyOn(sut.store,'showSpinner').and.returnValue(true)
       expect(sut.isSpinnerVisible()).toBeFalsy()
       sut.onStore()
       expect(sut.isSpinnerVisible()).toBeTruthy()
     })

     it('openSessionTracker => dispatch(openSessionTracker)', ()=>{
       spyOn(sut.dis,'dispatch')
       spyOn(sut.store,'isCurrentUserTutor').and.returnValue(true)
       sut.openSessionTracker()
       expect(sut.dis.dispatch).toHaveBeenCalledWith('openSessionTracker',true)
     })


     it('onStore, isWaitingForPalToJoin => showWaitingForPalToJoin',()=>{
       spyOn(sut.store,'isWaitingForPalToJoin').and.returnValue(true)
       sut.onStore()
       expect(sut.showWaitingForPalToJoin()).toBeTruthy()

       sut.store.isWaitingForPalToJoin.and.returnValue(false)
       sut.onStore()
       expect(sut.showWaitingForPalToJoin()).toBeFalsy()
     })

     it('onStore ^ isVideoChatDown == true => alert',()=>{
       spyOn(sut.store,'isVideoChatDown').and.returnValue(true)
       spyOn(window,'alert')
       sut.onStore()
       expect(window.alert).toHaveBeenCalled()
     })

     it('shareVideo => dispatch shareVideo', () => {
       spyOn(sut.dis,'dispatch')
       sut.shareVideo()
       expect(sut.dis.dispatch).toHaveBeenCalledWith('shareVideo')
     })

     it('invitePal => dispatches invitePalToRoom, palId',()=>{
       const palId = 2;
       spyOn(sut.store,'getPalId').and.returnValue(palId)
       spyOn(sut.dis,'dispatch')
       sut.invitePal()
       expect(sut.dis.dispatch).toHaveBeenCalledWith('invitePalToRoom',palId)
     })

     it('shareScreen dispatched shareScreen, room',()=>{
       spyOn(sut.dis,'dispatch')
       sut.shareScreen()
       expect(sut.dis.dispatch).toHaveBeenCalledWith('shareScreen')
     })

     it('participantName is set too whatever the current participants first and last name is.',()=>{
       sut.participantsName('')
       const p = Person.getFake()
       spyOn(sut.store,'getCurrentParticipant').and.returnValue(p)
       sut.onStore()
       expect(sut.participantsName()).toBe('First Last')
     })

     it('participants gets updated by the store',()=>{
       const count = 1
       spyOn(sut.store,'getParticipantCount').and.returnValue(count)
       sut.onStore()
       expect(sut.participants()).toBe(count)
     })

     it('isVisible() <=> isRoomWindowOpen',()=>{
       spyOn(sut.store,'hasPalId').and.returnValue(true)
       expect(sut.isVisible()).toBeFalsy()

       spyOn(sut.store,'isRoomWindowOpen').and.returnValue(false)
       sut.onStore()
       expect(sut.isVisible()).toBeFalsy()

       sut.store.isRoomWindowOpen.and.returnValue(true)
       sut.onStore()
       expect(sut.isVisible()).toBeTruthy()
     })
    //

    //
    it('disconnect => dispatch(leaveRoom)',()=>{
      spyOn(sut.dis,'dispatch')
      const palId = 4
      spyOn(sut.store,'getFocusedPersonsId').and.returnValue(palId)
      sut.disconnect()
      expect(sut.dis.dispatch).toHaveBeenCalledWith('leaveRoom', palId)
    })


   }); // end describe.
 });
