define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store',
        'video-chat/VideoRemoteService',
        'video-chat/WebRTCDevices',
        'window-utilities',
         'people-models/Person'],
function(Dispatcher,
        Store,
        VideoRemoteService,
        WebRTCDevices,
        WindowUtil,
        Person){

   var instance = null;
   var VideoStore  = function(){
     new VideoRemoteService()
     this.twilio = require('twilio-video');
     Object.setPrototypeOf(this, new Store());
     this.dis = new Dispatcher();
     this.focusedPerson = null
     this.isRoomVisible = false
     this.isSpinnerOn = false
     this.currentParticipant = null
     this.participantCount = 0
     this.room = null
     this.videoChatDown = false
     this.roomInviter = null
     this.receivingRoomInvite = false
     this.RTCDevices = WebRTCDevices.getInstance()
     this.capabilities = null
     this.sharingScreen = false
     this.sharingMicrophone = true
     this.participantCameraOn = false
     this.participantMicrophoneOn = false
     this.isTutor = false
     this.palHungupVisible = false

     this.isParticipantMicrophoneOn = (function(){
       return this.participantMicrophoneOn
     }).bind(this)

     this.getFocusedPersonsId = function(){
       if(this.focusedPerson){
        return this.focusedPerson.getId()
      } else {
        return null
      }
     }

     this.onPalLeftRoom = (function(palId){
       if(this.roomInviter && this.roomInviter.getId() == palId){
         this.roomInviter = null
         this.receivingRoomInvite = false
         this.showPalHungup()
         this.pub()
       }
     }).bind(this)
     this.palLeftId = this.dis.reg('palLeftRoom',this.onPalLeftRoom)


     this.showPalHungup = (function(){
       this.palHungupVisible = true
       var self = this
       setTimeout(function(){
         self.palHungupVisible = false
         self.pub()
       },2500)
     }).bind(this)

     this.isPalHungupVisible = function(){
       return this.palHungupVisible
     }

     this.onInboundRoomInviteErr = (function(err){
       if(this.focusedPerson && this.focusedPerson.getId() == err.id){
         this.waitingForPalToJoin = false
         alert(err.err)
         this.pub()
       }
     }).bind(this)
     this.dis.reg('inboundRoomInviteError',this.onInboundRoomInviteErr)

     this.onProfile = (function(info){
       if(info.role == 'tutor'){
         this.isTutor = true
       } else {
         this.isTutor = false
       }
       this.pub()
     }).bind(this)
    this.dis.reg('profileUpdate',this.onProfile)


    this.isCurrentUserTutor = function(){
      return this.isTutor
    }

     this.onInvitePalToRoom = (function(){
       this.waitingForPalToJoin = true
       this.pub()
     }).bind(this)
     this.dis.reg('invitePalToRoom',this.onInvitePalToRoom)



     this.isWaitingForPalToJoin = (function(){
       return this.waitingForPalToJoin
     }).bind(this)


     this.onShareScreen = (function(){
       var room = this.getRoom()
       if(!room) throw new Error('You must be in a room to share your screen.')
       var promise = navigator.mediaDevices.getDisplayMedia()
       promise.then(this.onScreenStream).catch(function(err){
         alert(err.message)
       })
     }).bind(this)
     this.dis.reg('shareScreen',this.onShareScreen)

     /**
        pre: room is set.
      */
     this.onScreenStream = (function(stream, testing){
       var screenTrack = null
       if(!testing){
         var LocalVideoTrack = this.twilio.LocalVideoTrack;
         screenTrack = new LocalVideoTrack(stream.getTracks()[0]);
       }
       stream.getVideoTracks()[0].onended = this.stopScreenShareTrack
       var room = this.getRoom()
       room.localParticipant.publishTrack(screenTrack);
       this.sharingScreen = true
       this.pub()
     }).bind(this)


     this.isSharingScreen = function(){
       return this.sharingScreen
     }


     this.getRoom = function(){
        return this.room
     }


     this.onJoinRoom = (function(){
       this.isSpinnerOn = true
       this.pub()
     }).bind(this)
     this.dis.reg('joinRoom',this.onJoinRoom)

     this.isReceivingRoomInvite = function(){
       return this.receivingRoomInvite
     }

     this.onRoomInvite = (function(person){
       if(this.twilio && this.twilio.isSupported){
         this.roomInviter = person
         this.receivingRoomInvite = true
         this.pub()
       } else {
         var err = 'This persons device does not support video calling.'
         this.dis.dispatch('roomInviteError',{err:err, id:person.getId()})
         var name = person.getFirst()
         var m = name + ' is trying to call you but your browser does not support video calling.\n'
         m = m + 'Please upgrade your browser to its latest version.'
         alert(m)
       }
     }).bind(this)
     this.onRoomInviteId = this.dis.reg('roomInvite',this.onRoomInvite)

     this.getRoomInviter = function(){
       return this.roomInviter
     }

     this.wasInvitedToRoom = function(){
       return this.roomInviter != null
     }

     this.onVideoChatDown = (function(){
       this.videoChatDown = true
       this.pub()
     }).bind(this)
     this.onVideoDownId = this.dis.reg('videoChatDown',this.onVideoChatDown)


     this.isVideoChatDown = function(){
       return this.videoChatDown
     }

     // only update the focused person when
     // there is not already a video chat room
     // open.
     this.onFocusPerson = (function(person){
       if(!this.room){
         this.focusedPerson = person
         this.pub()
       }
     }).bind(this)
     this.FPersonId = this.dis.reg('focusPerson',this.onFocusPerson)

     // updates the state of the currently focused person.
     this.onUpdateFocusPerson = (function(person){
       this.focusedPerson = person
       if(this.focusedPerson.isPresent() == false)
         this.waitingForPalToJoin = false
       this.pub()
     }).bind(this)
     this.updateFPersonId = this.dis.reg('updateFocusPerson',this.onUpdateFocusPerson)



     this.isFocusedPersonOnline = function(){
       return this.focusedPerson && this.focusedPerson.isPresent()
     }

     this.getFocusedPersonsName = function(){
       if(this.focusedPerson)
        return this.focusedPerson.getFirst()
     }

     this.hasPalId = function(){
       return this.focusedPerson != null
     }

     this.getPalId = function(){
       return this.focusedPerson.getId()
     }

     this.showSpinner = function(){
       return this.isSpinnerOn
     }

     this.isRoomWindowOpen = function(){
       return this.isRoomVisible && (this.hasPalId() || this.wasInvitedToRoom())
     }

     this.onGettingToken = (function(){
       this.isSpinnerOn = true
       this.pub()
     }).bind(this)
     this.dis.reg('getRoomToken',this.onGettingToken)


     this.onDevicesLoaded = (function(capabilities){
       // console.log(capabilities)
       this.capabilities = capabilities
     }).bind(this)
     this.RTCDevices.reg('deviceCheck',this.onDevicesLoaded)

     this.getCapabilities = function(){
       return this.capabilities
     }

     this.isVideoAvailable = function(){
       if(!this.capabilities) throw new Error('Devices have not had a chance to load yet.')
       return this.capabilities.hasWebcam
     }

     this.isMicrophoneAvailable = function(){
       if(!this.capabilities) throw new Error('Devices have not had a chance to load yet.')
       return this.capabilities.hasMicrophone
     }

     // a fresh token shoudl be used for each pair.
     this.onRoomToken = (function(roomObject){
       this.isRoomVisible = true
       this.receivingRoomInvite = false
       this.waitingForPalToJoin = false
       var token = roomObject.token
       var roomName = roomObject.room
       var options = { name:roomName, audio:false,video:false}
       this.twilio
           .connect(token, options)
           .then(this.onRoomConnected,this.onRoomError);

     }).bind(this)
     this.roomTokenId = this.dis.reg('roomToken', this.onRoomToken)



     this.onShareVideo = (function(){
       var self = this
       var localMediaContainer = document.getElementById('camera-preview');

       if(localMediaContainer.childElementCount < 1){

         // attach stop button
         var $stop = $('<button id="stop-video-button">stop video</button>')
         $stop.on('click',this.stopCameraTrack)
         localMediaContainer.appendChild($stop[0])

          // attach video
          this.twilio.createLocalVideoTrack({ name: 'camera' }).then(function(localTrack) {
          self.room.localParticipant.publishTrack(localTrack);
          localMediaContainer.appendChild(localTrack.attach());
          self.sharingCamera = true
          self.pub()
        });
      } else{
        console.log('Already sharing your webcam.')
      }
     }).bind(this)
     this.dis.reg('shareVideo',this.onShareVideo)


     this.getConstraints = function(){
       if(this.isVideoAvailable() && this.isMicrophoneAvailable())
        return { audio:true, video: { width: 600 }}
       else if(this.isVideoAvailable() && !this.isMicrophoneAvailable())
        return { audio:false, video: { width: 600 }}
        else if(!this.isVideoAvailable() && this.isMicrophoneAvailable())
         return { audio:true, video: false}
     }


     this.onRoomConnected = (function(room){
        if(!this.focusedPerson && !this.roomInviter)
          throw new Error('if caller then person must be focused,  if recipient, roomInviter must exist!')

        this.isSpinnerOn = false
        this.dis.dispatch('videoCallRoomConnected')
        this.updateParticipantCount(room)
        this.showParticipantsAlreadyConnected(room)
        room.on('participantConnected',this.onParticipantConnected)
        room.on('participantDisconnected', this.onParticipantDisconnected)
        room.on('disconnected',this.onDisconnect)
        this.room = room

        this.pub()

    }).bind(this)

    this.getParticipantCount = function(){
      return this.participantCount
    }

    this.updateParticipantCount = (function(room){
      if(room)
      this.participantCount = room.participants.size
    }).bind(this)

    this.isParticipantsCameraOn = function(){
      return this.participantCameraOn
    }

    /**
      Should append a new element to the media holder
      if the track type is video.  if its audio,
      it just append it to the holder its self.
    */
    this.appendToMediaTrackHolder = (function(track){
      var holder = document.getElementById('remote-media-holder')
      if(track.kind == 'video'){
          if(track.name == 'camera'){
            var e1 = document.getElementById('camera-video-holder')
            e1.appendChild(track.attach());
            e1.childNodes[0].id = 'camera-video'
            this.participantCameraOn = true
          } else  {
            this.attachSharedScreen(track, holder)
          }
      } else if(track.kind == 'audio'){
        holder.appendChild(track.attach())
        this.participantMicrophoneOn = true
      }
      this.pub()
    }).bind(this)



    this.attachSharedScreen = (function(track, holder){
      var e2 = document.createElement('div');

      // attach resizer.
      var resizerButton = document.createElement('span')
      resizerButton.classList.add('resize-window-button')
      WindowUtil.attachResizer(e2,resizerButton)
      e2.appendChild(resizerButton)

      // attach fullscreen button.
      var fullScreenButton = document.createElement('button')
      fullScreenButton.classList.add('toggle-fullscreen-share-button')
      fullScreenButton.innerHTML = 'Toggle Fullscreen'
      var self = this
      fullScreenButton.onclick = function(event){
        WindowUtil.toggleFullscreen(e2)
      }
      e2.appendChild(fullScreenButton)

      e2.classList.add('screen-video-track')
      e2.appendChild(track.attach());
      WindowUtil.makeDragable(e2)
      holder.appendChild(e2)
      this.participantScreenOn = true
    }).bind(this)






    this.isParticipantsScreenShared = function(){
      return this.participantScreenOn
    }


      // Log any Participants already connected to the Room
    this.showParticipantsAlreadyConnected = (function(room){
      var self = this
      room.participants.forEach(function(participant){
        console.log("Participant " + participant.identity + " is connected to the Room");
        self.setParticipant(participant)
        self.attachAudioTrack()
        // show  media tracks of already connected participants
        participant.tracks.forEach(function(publication){
              if (publication.track) {
                self.appendToMediaTrackHolder(track)
              }
            });
            participant.on('trackUnsubscribed',self.onParticipantTrackUnsubscribed);
            participant.on('trackSubscribed', track => {
              self.appendToMediaTrackHolder(track)
            });
      });
    }).bind(this)


    /**
      When the other person stops their camera
      this gets fired and ensures that the attached video
      element is removed.
    */
    this.onParticipantTrackUnsubscribed = (function(track){
      if(track.name == 'camera'){
        $('#camera-video-holder').find('video').remove()
        this.participantCameraOn = false

      } else if (track.kind == 'video'){
        $('.screen-video-track').remove()
        this.participantScreenOn = false
      }
      else if (track.kind == 'audio'){
        this.participantMicrophoneOn = false
      }

      this.pub()
    }).bind(this)


    this.getCurrentParticipant = function(){
      return this.currentParticipant
    }

    this.setParticipant = function(p){
        this.waitingForPalToJoin = false
      if(this.roomInviter && this.roomInviter.getId() == p.identity){
        this.currentParticipant = this.roomInviter
      } else if(this.focusedPerson && this.focusedPerson.getId() == p.identity){
        this.currentParticipant = this.focusedPerson
      }else{
        throw new Error('expected participant to be either inviter or focusedPerson.')
      }
    }


    this.attachAudioTrack = (function(callback){
      var LocalAudioTrack = this.twilio.LocalAudioTrack;
      var self = this
      return navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
        var microphoneTrack = new LocalAudioTrack(stream.getTracks()[0]);
        self.room.localParticipant.publishTrack(microphoneTrack);
        self.sharingMicrophone = true
        if(typeof callback == 'function') callback()
      }).catch(function(err){
        alert(err.message)
      })
    }).bind(this)



    this.shareMicrophone = (function(){
      if(!this.isSharingMicrophone()){
          var self = this
          this.attachAudioTrack().then(function(){
              self.pub()
          })
      }
    }).bind(this)
    this.dis.reg('unmuteMicrophone', this.shareMicrophone)



    this.onParticipantConnected = (function(participant){
      console.log('Participant ' + participant.identity + ' is connected to the Room');
      this.attachAudioTrack()
      this.updateParticipantCount(this.room)
      this.setParticipant(participant)

      participant.tracks.forEach(publication => {
        if (publication.isSubscribed) {
          var track = publication.track;
          this.appendToMediaTrackHolder(track)
        }
      });
      participant.on('trackSubscribed', track => {
        this.appendToMediaTrackHolder(track)
      });
      participant.on('trackUnsubscribed',this.onParticipantTrackUnsubscribed)
      this.pub()
    }).bind(this)




    this.onParticipantDisconnected = (function(participant){
        console.log("Participant " + participant.identity + " has disconnected from the Room");
        this.stopMicrophoneTrack()
        this.stopCameraTrack()
        this.stopScreenShareTrack()
        this.currentParticipant = null
        this.removeMediaDivs()
        this.updateParticipantCount(this.room)
        this.pub()
    }).bind(this)


    this.stopMicrophoneTrack = (function(){
      if(this.room){
        this.room.localParticipant.tracks.forEach(function(publication){
          if(publication.track.kind == 'audio'){
            publication.track.stop()
            publication.unpublish() // stop sharing audio with the room.
            console.log('microphone muted')
          }
        });
        this.sharingMicrophone = false
        this.pub()
      }
    }).bind(this)
    this.dis.reg('muteMicrophone',this.stopMicrophoneTrack)


    this.isSharingMicrophone = function(){
      return this.sharingMicrophone
    }




    this.isSharingCamera = function(){
      return this.sharingCamera
    }

    this.stopCameraTrack = (function(){
      var self = this
      if(this.room)
      this.room.localParticipant.tracks.forEach(function(publication){
        if(publication.track.name == 'camera'){
          publication.track.stop()
          publication.unpublish() // stop sharing with the room.
          $('#camera-preview').empty()
          self.sharingCamera = false
          self.pub()
        }
      });
    }).bind(this)
    this.dis.reg('stopCamera',this.stopCameraTrack)


    this.stopScreenShareTrack = (function(){
      var room = this.getRoom()
      var self = this
      room.localParticipant.tracks.forEach(function(publication){
        if(publication.track.name != 'camera' && publication.track.kind == 'video' ){
          publication.track.stop() // stop it.
          publication.unpublish() // stop sharing with the room.
          self.sharingScreen = false
          self.pub()
        }
      });
    }).bind(this)
    this.dis.reg('stopSharingScreen',this.stopScreenShareTrack)

    this.onDisconnect = (function(room){
      if(room){
        this.stopMicrophoneTrack()
        this.stopScreenShareTrack()
        this.stopCameraTrack()
      }
      this.removeMediaDivs()
      this.room = null
      this.roomInviter = null
      this.isRoomVisible = false
      this.sharingScreen = false
      this.pub()
    }).bind(this)


    this.removeMediaDivs = (function(){
      document.getElementById('remote-media-holder').innerHTML = ''
    }).bind(this)


    this.disconnect = (function(){
      if(this.room){
        this.room.disconnect();
      }
    }).bind(this)
    this.dis.reg('leaveRoom',this.disconnect)
    window.addEventListener('beforeunload',this.disconnect);

    this.onRoomError =  (function(error){
      console.log(error)
      if(/Invalid Access Token/.test(error.message)){
        alert('Video access has been disabled.  Please contact use at 905-808-8791 and we will fix it quickly.')
      }
      else if(/Permission denied/.test(error.message)){
        alert('Please change your browsers permissions\nto allow microphone or webcam access.')
      }
      else if(/Could not start video source/.test(error.message)){
        alert('Video could not start\nCheck that your camera is not already in use.')
      }
      else if(/NotFoundError/.test(error.message)){
        alert('No webcam or microphone detected\nPlease ensure either your webcam or microphone are enabled.')
      }
      else{
        alert('Video calling is currently not working.\n  Please contact support at 905-808-8791 and we will fix it quickly.')
      }
      this.receivingRoomInvite = false
      this.isRoomVisible = false
      this.disconnect()
      this.pub()
     }).bind(this)



  } // end

    return {
      getInstance:function(){
        if(!instance){
          instance = new VideoStore();
        }
        return instance;
      },
      getNew:function(){
        return new VideoStore();
      }
    }
  })
