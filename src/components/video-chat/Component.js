
define(['ko',
        'text!video-chat/template.html',
        'video-chat/VideoStore',
        'dispatcher/Dispatcher',
        'window-utilities'],
function(ko,
         template,
         Store,
         Dispatcher,
         WindowUtil){

  function ViewModel(params, componentInfo){
    this.dis = new Dispatcher()
    this.store = Store.getInstance()
    this.isVisible = ko.observable(false)
    this.participants = ko.observable(0)
    this.focusedPersonsName = ko.observable('name')
    this.participantsName = ko.observable('')
    this.showCallingRecipient = ko.observable(false)
    this.showWaitingForPalToJoin = ko.observable(false)
    this.isParticipantsCameraOn = ko.observable(false)
    this.isSharingMicrophone = ko.observable(false)
    this.isSharingScreen = ko.observable(false)
    this.isSharingCamera = ko.observable(false)
    this.mediaCenterOpenedAtLeastOnce = false
    this.isSpinnerVisible = ko.observable(false)
    this.isPalOnline = ko.observable(false)
    this.isPalHungupVisible = ko.observable(false)
    this.isParticipantMicrophoneOn = ko.observable(false)


    this.onStore = (function(){
      this.isParticipantMicrophoneOn(this.store.isParticipantMicrophoneOn())
      this.isPalHungupVisible(this.store.isPalHungupVisible())
      this.isSpinnerVisible(this.store.showSpinner())
      var online = this.store.isFocusedPersonOnline()

      this.isPalOnline(online)
      if(!this.store.isVideoChatDown()){
        this.isVisible(this.store.isRoomWindowOpen())
        if(this.store.isRoomWindowOpen() && this.mediaCenterOpenedAtLeastOnce == false){
          this.mediaCenterOpenedAtLeastOnce = true
          var e = document.getElementById('video-chat-control-center')
          WindowUtil.makeDragable(e)
        }
        this.isSharingMicrophone(this.store.isSharingMicrophone())
        this.isSharingScreen(this.store.isSharingScreen())
        this.isSharingCamera(this.store.isSharingCamera())
        this.isParticipantsCameraOn(this.store.isParticipantsCameraOn())
        this.participants(this.store.getParticipantCount())
        var participant = this.store.getCurrentParticipant()
        if(participant){
          this.participantsName(participant.getFirst() + ' ' + participant.getLast())
        }
        this.focusedPersonsName(this.store.getFocusedPersonsName())
        this.showWaitingForPalToJoin(this.store.isWaitingForPalToJoin())
      } else {
        var m = 'Sorry, video chat is currently not working.\n please try again later.'
        alert(m)
      }
    }).bind(this)
    this.store.sub(this.onStore)



    this.download = (function(){
      this.dis.dispatch('downloadSessionRecording')
    })

    this.openSessionTracker = (function(){
      var isTutor = this.store.isCurrentUserTutor();
      this.dis.dispatch('openSessionTracker',isTutor)
    }).bind(this)


    this.attachResizers = function(testing){
      var controlCenter = document.getElementById('video-chat-control-center')
      var resizer = document.getElementById('control-center-resizer')
      WindowUtil.attachResizer(controlCenter, resizer, {
        'min-width':454,
        'min-height':341
      })
    }
    this.attachResizers()


    this.onStopResize = (function(vm, event){
      event.stopPropagation()
    }).bind(this)


    this.invitePal = (function(){
      var palId = this.store.getPalId()
      this.dis.dispatch('invitePalToRoom',palId)
    }).bind(this)


    this.isScreenSharingSupported = function(){
      if(navigator.mediaDevices.getDisplayMedia)
          return true
        else
          return false
    }


    this.shareScreen = (function(){
      var isSharingAlready = this.store.isSharingScreen()
      if(isSharingAlready) return
      var self = this
      if(this.isScreenSharingSupported()){
        self.dis.dispatch('shareScreen')
      }else{
        alert('Please upgrade your browser to its latest versions to support screen share.')
      }
    }).bind(this)


    this.stopScreenShare = (function(){
      this.dis.dispatch('stopSharingScreen')
    }).bind(this)

    this.shareVideo = (function(){
      this.dis.dispatch('shareVideo')
    }).bind(this)

    this.stopCamera = (function(){
      this.dis.dispatch('stopCamera')
    }).bind(this)


    this.toggleMicrophone = (function(){
      if(this.store.isSharingMicrophone())
        this.dis.dispatch('muteMicrophone')
      else
        this.dis.dispatch('unmuteMicrophone')
    }).bind(this)


    this.disconnect = (function(){
      var palId = this.store.getFocusedPersonsId()
      this.dis.dispatch('leaveRoom', palId)
    }).bind(this)

    window.onunload = this.disconnect


  }; // end viewModel.

  return {
    viewModel: ViewModel,
    template : template
  }


});
