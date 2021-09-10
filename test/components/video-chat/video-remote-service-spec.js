
define(['video-chat/VideoRemoteService',
        'people-models/Person'],
        (VideoRemoteService,
         Person) => {

    describe("VideoRemoteService Test", () => {
      let sut = null;
      beforeEach(() => {
        sut = new VideoRemoteService()
      })



      it('onPalLeftRoom => dispatch palLeftRoom', ()=>{
        spyOn(sut.dis,'dispatch')
        const palId = 2
         sut.onPalLeftRoom(palId)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('palLeftRoom',palId)
      })

      it('onLeaveRoom => emit  leaveRoom, palId', ()=>{
        sut.sock = {
          emit:jasmine.createSpy()
        }
        const palId = 5
        sut.onLeaveRoom(palId)
        expect(sut.sock.emit).toHaveBeenCalledWith('leaveRoom',palId)
      })

      it('onLeaveRoom is reg on leaveRoom topic.',()=>{
        const f = sut.dis.getCallbackById(sut.leaveRoomId)
        expect(f).toBe(sut.onLeaveRoom)
      })

      it('onRoomInviteError => dispatch(inboundRoomInviteError)', ()=>{

        spyOn(sut.dis,'dispatch')
        const err = {}
        sut.onRoomInviteError(err)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('inboundRoomInviteError',err)
      })


      it('emitRoomInviteError emits to the server', ()=>{
       sut.sock = {emit:jasmine.createSpy()}
       const err = {}
       sut.emitRoomInviteError(err)
       expect(sut.sock.emit).toHaveBeenCalledWith('roomInviteError',jasmine.any(Object))
      })

      it('onRoomInviteError is reg on roomInviteError', ()=>{
        const cb = sut.dis.getCallbackById(sut.inviteErrId)
        expect(cb).toBe(sut.emitRoomInviteError)
      })

      it('onDownloadSessionRecording => do that.',()=>{
        spyOn($,'ajax')
        sut.onDownloadSessionRecording()
        expect($.ajax).toHaveBeenCalled()
      })

      it('handleIncomingCall => dispatch incoming call with person',()=>{
        spyOn(sut.dis,'dispatch')
        const raw = Person.getRaw()
        sut.onRoomInvite(raw)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('roomInvite',jasmine.objectContaining({
          first:jasmine.any(String),
          last:jasmine.any(String)
        }))
      })

      it('onAuth => setSock',()=>{
        spyOn(sut,'setSock').and.callThrough()
        sut.onAuth({state:'authenticated'})
        expect(sut.setSock).toHaveBeenCalled()

      })

      it('onRingRecipient does emit',()=>{
        sut.sock = {emit:jasmine.createSpy()}
        const id = 1
        sut.onRingRecipient(id)
        expect(sut.sock.emit).toHaveBeenCalledWith('invitePalToRoom',id)
      })

      it('onRingRecipient is reg in dis',()=>{
        const cb = sut.dis.getCallbackById(sut.ringRecipId)
        expect(cb).toBe(sut.onRingRecipient)
      })

      it('sets its micro server to live',()=>{
        expect(sut.getServerURL()).toBe('http://live.localhost')
      })

      it('getRoomToken does an ajax call with the palId',()=>{
        spyOn($,'ajax')
        const palId = 3
        sut.getRoomToken(palId)
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          url:sut.getServerURL() + '/getRoomToken?palId=' + palId
        }))
      })

      it('onTokenReceived dispatches the token', ()=>{
        spyOn(sut.dis,'dispatch')
        const token = {}
        sut.onTokenReceived(token)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('roomToken',token)
      })

      it('onError => dispatch videoChatDown',()=>{
        spyOn(sut.dis,'dispatch')
        sut.onError()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('videoChatDown')
      })
    }); // end describe

}); // end define.
