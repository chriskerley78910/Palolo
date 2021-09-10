
define(['video-chat/VideoStore',
        'people-models/Person',
      'people-models/Pal'],
        (Store, Person, Pal) => {

    describe("VideoStore Test", () => {
      let sut = null;
      beforeEach(() => {
        sut = Store.getNew();
      })

      it('shareMicrophone, isSharingMicrophone == false => attachAudioTrack', done => {
        spyOn(sut,'attachAudioTrack').and.returnValue(Promise.resolve())
        spyOn(sut,'isSharingMicrophone').and.returnValue(false)
        sut.onPub(()=>{
              expect(sut.attachAudioTrack).toHaveBeenCalled()
              done()
        })
        sut.shareMicrophone()

      })


      it('showPalHungup()=> palHungupVisible == true', ()=>{
        expect(sut.isPalHungupVisible()).toBeFalsy()
        sut.showPalHungup()
        expect(sut.isPalHungupVisible()).toBeTruthy()
      })


      it('onPalLeftRoom, matches invoter => removes inviter,pub',done => {
        sut.roomInviter = Pal.getFake()
        expect(sut.getRoomInviter()).not.toBeNull()
        sut.receivingRoomInvite = true
        spyOn(sut,'showPalHungup')

        sut.onPub(()=>{
          expect(sut.getRoomInviter()).toBeNull()
          expect(sut.isReceivingRoomInvite()).toBeFalsy()
          expect(sut.showPalHungup).toHaveBeenCalled()
          done()
        })
        const palId = sut.roomInviter.getId()
        sut.onPalLeftRoom(palId)
      })

      it('onInboundRoomInviteErr, from focused person => alert',done => {
        spyOn(window,'alert')
        sut.focusedPerson = Person.getFake()
        const m = {}
        const err = {id:sut.focusedPerson.getId(), err:m}
        sut.waitingForPalToJoin = true
        sut.onPub(()=>{
          expect(window.alert).toHaveBeenCalledWith(m)
          expect(sut.waitingForPalToJoin).toBeFalsy()
          done()
        })
        sut.onInboundRoomInviteErr(err)
      })

      it('onInboundRoomInviteErr, from not focused person => do nothing.',()=>{
        spyOn(window,'alert')
        sut.focusedPerson = Person.getFake()
        const err = {id:sut.focusedPerson.getId() + 1}
        sut.onInboundRoomInviteErr(err)
        expect(window.alert).not.toHaveBeenCalled()
      })

      it('isFocusedPersonOnline()', ()=>{

        sut.focusedPerson = Pal.getFake()
        sut.focusedPerson.setPresent(true)
        expect(sut.isFocusedPersonOnline()).toBeTruthy()
        sut.focusedPerson.setPresent(false)
        expect(sut.isFocusedPersonOnline()).toBeFalsy()
      })

      it('onUpdateFocusPerson, isWaitingForPalToJoin, !isPresent => !isWaitingForPalToJoin, showmessage', done =>{
          const p = Pal.getFake()
          p.setPresent(false)
          sut.waitingForPalToJoin = true
          expect(sut.isWaitingForPalToJoin()).toBeTruthy()
          sut.onPub(()=>{
            expect(sut.isWaitingForPalToJoin()).toBeFalsy()
            done()
          })
          sut.onUpdateFocusPerson(p)
      })

      it('onUpdateFocusPerson => do just that.', done =>{
        const p = Person.getFake()
        const n = p.getFirst()
        expect(sut.getFocusedPersonsName()).not.toBe(n)
        sut.onPub(()=>{
          expect(sut.getFocusedPersonsName()).toBe(n)
          done()
        })
        sut.onUpdateFocusPerson(p)
      })

      it('onUpdateFocusPerson is reg on updateFocusPerson',()=>{
        const f = sut.dis.getCallbackById(sut.updateFPersonId)
        expect(f).toBe(sut.onUpdateFocusPerson)
      })

      it('onProfile => set is tutor, pub', done =>{
        expect(sut.isCurrentUserTutor()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isCurrentUserTutor()).toBeTruthy()
          done()
        })
        sut.onProfile({role:'tutor'})
      })

      it('onInvitePalToRoom => isWaitingForPalToJoin == true', done =>{
        sut.waitingForPalToJoin = false
        sut.onPub(()=>{
            expect(sut.isWaitingForPalToJoin()).toBeTruthy()
            done()
        })
        sut.onInvitePalToRoom()
      })

      it('setParticipant, inviter matches the participant => inviter is the participant.',()=>{
        sut.roomInviter = Person.getFake()
        sut.waitingForPalToJoin = true
        sut.setParticipant({identity:sut.roomInviter.getId()})
        expect(sut.getCurrentParticipant()).toBe(sut.roomInviter)
        expect(sut.isWaitingForPalToJoin()).toBeFalsy()
      })

      it(`setParticipant, !inviter, focusedPerson matches the participant
          => focusedPerson is participant.`,() => {
        sut.roomInviter = null
        sut.focusedPerson = Person.getFake()
        sut.setParticipant({identity:sut.getPalId()})
        expect(sut.getCurrentParticipant()).toBe(sut.focusedPerson)
      })

      it('onParticipantConnected => sets the participant',()=>{
        const participant = {
          tracks:[],
          on:jasmine.createSpy()
        }
        spyOn(sut,'attachAudioTrack')
        spyOn(sut,'setParticipant')
        sut.onParticipantConnected(participant)
        expect(sut.setParticipant).toHaveBeenCalled()
        expect(sut.attachAudioTrack).toHaveBeenCalled()
      })

      it('onRoomToken => isReceivingRoomInvite == false',() => {
        sut.receivingRoomInvite = true
        const room = {
          token:'faketoken',
          room:'fakeroom'
        }

        sut.twilio = {
          connect:jasmine.createSpy().and.returnValue(Promise.resolve())
        }
        sut.onRoomToken(room)
        expect(sut.isReceivingRoomInvite()).toBeFalsy()
      })

      it('onScreenStream => set isSharing, pub',done => {
        const room = {
          localParticipant:{
            publishTrack:jasmine.createSpy()
          }
        }
        const track = {
          onended:null
        }
        const stream = {
          getVideoTracks:()=>{
            return [track]
          }
        }
        spyOn(sut,'getRoom').and.returnValue(room)
        expect(sut.isSharingScreen()).toBeFalsy()
        sut.onPub(()=>{
          expect(track.onended).toBe(sut.stopScreenShareTrack)
          expect(sut.isSharingScreen()).toBeTruthy()
          expect(room.localParticipant.publishTrack).toHaveBeenCalledWith(null)
          done()
        })
        const testing = true
        sut.onScreenStream(stream, testing)
      })

      it('has an instance of WebRTCDevices',()=>{
        expect(sut.RTCDevices.constructor.name).toBe('WebRTCDevices')
      })

      it('onDevicesLoaded => sets capabilities', ()=>{
        expect(sut.getCapabilities()).toBeNull()
        sut.onDevicesLoaded({hasWebcam:true, hasMicrophone:true})
        expect(sut.isVideoAvailable()).toBeTruthy();
        expect(sut.isMicrophoneAvailable()).toBeTruthy()
      })

      it('getOptions return audio false if no microphone exits.', ()=>{
        spyOn(sut,'isVideoAvailable').and.returnValue(true)
        spyOn(sut,'isMicrophoneAvailable').and.returnValue(false)
        const expected = {
          audio:false,
          video:{width:600}
        }
        expect(sut.getConstraints()).toEqual(jasmine.objectContaining(expected))
      })

      it('getOptions return video false if no webcam exists.', ()=>{
        spyOn(sut,'isVideoAvailable').and.returnValue(false)
        spyOn(sut,'isMicrophoneAvailable').and.returnValue(true)
        expect(sut.getConstraints()).toEqual(jasmine.objectContaining({
          audio:true,
          video:false
        }))
      })

      it('getOptions return video and audio if both exist', ()=>{
        spyOn(sut,'isVideoAvailable').and.returnValue(true)
        spyOn(sut,'isMicrophoneAvailable').and.returnValue(true)
        expect(sut.getConstraints()).toEqual(jasmine.objectContaining({
          audio:true,
          video:{width:600}
        }))
      })

      it('onRoomError => isRoomVisible false',done =>{
        sut.isRoomVisible = true
        sut.receivingRoomInvite = true
        spyOn(sut,'disconnect')
        spyOn(window,'alert')
        sut.onPub(()=>{
          expect(sut.disconnect).toHaveBeenCalled()
          expect(sut.isRoomWindowOpen()).toBeFalsy()
          expect(sut.isReceivingRoomInvite()).toBeFalsy()
          done()
        })
        sut.onRoomError({message:'Something went wrong.'})
        expect(window.alert).toHaveBeenCalled()
      })


      it('onJoinRoom -> isSpinnerOn ',done =>{
        sut.onPub(()=>{
          expect(sut.showSpinner()).toBeTruthy()
          done()
        })
        sut.onJoinRoom()
      })

      it('onRoomInvite, twilio.isSupported == false => alert()', ()=>{
        sut.twilio = {
          isSupported:false
        }
        const person = Person.getFake()
        spyOn(window,'alert')
        spyOn(sut.dis,'dispatch')
        sut.onRoomInvite(person)
        expect(window.alert).toHaveBeenCalled()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('roomInviteError', jasmine.any(Object))
      })

      it('onRoomInvite, twilio.isSupported == true => !alert()', ()=>{
        sut.twilio = {
          isSupported:true
        }
        const person = Person.getFake()
        spyOn(window,'alert')
        sut.onRoomInvite(person)
        expect(window.alert).not.toHaveBeenCalled()
      })



      it('onRoomInvite => isReceivingRoomInvite(), and caller set',done => {
        const p = Person.getFake()

        expect(sut.getRoomInviter()).toBeNull()
        sut.onPub(()=>{
          expect(sut.getRoomInviter()).toBe(p)
          expect(sut.isReceivingRoomInvite()).toBeTruthy()
          done()
        })
        sut.onRoomInvite(p)
      })

      it('onRoomInvite is reg on dis',()=>{
        const cb = sut.dis.getCallbackById(sut.onRoomInviteId)
        expect(cb).toBe(sut.onRoomInvite)
      })


      it('onVideoChatDown publishes it',done =>{
        this.isVideoChatDown = false
        sut.onPub(()=>{
          expect(sut.isVideoChatDown()).toBeTruthy()
          done()
        })
        sut.onVideoChatDown()
      })


      it('onVideoDownId',()=>{
        const cb = sut.dis.getCallbackById(sut.onVideoDownId)
        expect(cb).toBe(sut.onVideoChatDown)
      })

      it('has dis',()=>{
        expect(sut.dis.constructor.name).toBe('Dispatcher')
      })

      it('onParticipantTrackUnsubscribed,track == audio => !isParticipantMicrophoneOn()',done => {
          sut.participantMicrophoneOn = true
          expect(sut.isParticipantMicrophoneOn()).toBeTruthy()
          const track = { kind: 'audio' }
          sut.onPub(()=>{
            expect(sut.isParticipantMicrophoneOn()).toBeFalsy()
            done()
          })
          sut.onParticipantTrackUnsubscribed(track)
      })

      it('stopMicrophoneTrack => stoptrack. unpublish it and pub', done => {
        const participant = {
          tracks:[
            {
              track:{
                kind:'audio',
                stop:jasmine.createSpy()
              },
              unpublish:jasmine.createSpy()
            }
          ]
        }
        sut.room = {
          localParticipant:participant
        }
        sut.onPub(()=>{
          expect(participant.tracks[0].unpublish).toHaveBeenCalled()
          expect(participant.tracks[0].track.stop).toHaveBeenCalled()
          done()
        })
        sut.stopMicrophoneTrack(participant)
      })


      it('onParticipantDisconnected => removeMediaDivs',done =>{
        spyOn(sut,'removeMediaDivs')
        sut.room = {disconnect:jasmine.createSpy()}
        spyOn(sut,'updateParticipantCount')
        sut.isCalling = true
        sut.currentParticipant = {}
        spyOn(sut,'stopMicrophoneTrack')
        spyOn(sut,'stopCameraTrack')
        spyOn(sut,'stopScreenShareTrack')

        sut.onPub(()=>{
          expect(sut.getCurrentParticipant()).toBeNull()
          expect(sut.getCurrentParticipant()).toBeNull()
          expect(sut.removeMediaDivs).toHaveBeenCalled()
          expect(sut.updateParticipantCount).toHaveBeenCalledWith(sut.room)
          expect(sut.stopMicrophoneTrack).toHaveBeenCalled()
          expect(sut.stopCameraTrack).toHaveBeenCalled()
          expect(sut.stopScreenShareTrack).toHaveBeenCalled()
          done()
        })
        sut.onParticipantDisconnected({identity:'name'})
      })

      it('onDisconnect => isSharingScreen() == false',done =>{
        sut.sharingScreen = true
        sut.roomInviter = {}
        spyOn(sut,'removeMediaDivs')
        sut.onPub(()=>{
            expect(sut.isSharingScreen()).toBeFalsy()
            expect(sut.getRoomInviter()).toBeNull()
            done()
        })
        sut.onDisconnect()
      })

      it('onDisconnect => removeMediaDivs',()=>{
        spyOn(sut,'removeMediaDivs')
        sut.onDisconnect()
        expect(sut.removeMediaDivs).toHaveBeenCalled()
      })

      it('onFocusPerson does nothing if the room is already open',()=>{
        sut.room = {}
        const p = Person.getFake()
        expect(sut.hasPalId()).toBeFalsy()
        spyOn(sut,'pub')
        sut.onFocusPerson(p)
        expect(sut.hasPalId()).toBeFalsy()
        expect(sut.pub).not.toHaveBeenCalled()
      })

      it('onFocusPerson sets the palId',done =>{
        const p = Person.getFake()
        expect(sut.hasPalId()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.hasPalId()).toBeTruthy()
          expect(sut.getPalId()).toBe(p.getId())
          done()
        })
        sut.onFocusPerson(p)
      })

      it('onGettingToken => showSpinner',done =>{
        sut.isSpinnerOn = false
        expect(sut.isRoomWindowOpen()).toBeFalsy()
        sut.onPub(()=>{
            expect(sut.showSpinner()).toBeTruthy()
            expect(sut.isRoomWindowOpen()).toBeFalsy()
            done()
        })
        sut.onGettingToken()
      })

      it('onRoomConnected => showSpinner false',done => {
        sut.isSpinnerOn = true
        sut.focusedPerson = Person.getFake()
        sut.onPub(()=>{
            expect(sut.showSpinner()).toBeFalsy()
            expect(sut.dis.dispatch).toHaveBeenCalledWith('videoCallRoomConnected')
            done()
        })
        spyOn(sut.dis,'dispatch')
        spyOn(sut,'showParticipantsAlreadyConnected')

        const room = {
          on:jasmine.createSpy(),
          participants:[]
        }
        sut.onRoomConnected(room)
      })

      it('showParticipantsAlreadyConnected => update participant count',done => {
        expect(sut.getParticipantCount()).toBe(0)
        const m = new Map()
        m.set('1','chris')
        const room = {participants:m}
        sut.updateParticipantCount(room)
        expect(sut.getParticipantCount()).toBe(1)
        done()
      })


      it('onDisconnect(room) => isRoomWindowOpen == false',done =>{
        sut.isRoomVisible = true
        sut.focusedPerson = Person.getFake()
        expect(sut.isRoomWindowOpen()).toBeTruthy()
        spyOn(sut,'removeMediaDivs')
        sut.onPub(()=>{
          expect(sut.removeMediaDivs).toHaveBeenCalled()
          expect(sut.isRoomWindowOpen()).toBeFalsy()
          done()
        })
        sut.onDisconnect(null)
      })

      it('onRoomError => isRoomVisible == false and pub',done =>{
        sut.isRoomVisible = true
        const m = 'Could not start video source'
        spyOn(window,'alert')
        sut.onPub(()=>{
              expect(sut.isRoomWindowOpen()).toBeFalsy();
              expect(window.alert).toHaveBeenCalled()
              done()
        })
        sut.onRoomError({message:m})
      })


    }); // end describe

}); // end define.
