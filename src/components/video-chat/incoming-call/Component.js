
define(['ko',
        'text!video-chat/incoming-call/template.html',
        'video-chat/VideoStore',
        'dispatcher/Dispatcher'],

function(ko,
         template,
         Store,
         Dispatcher){

  function View(){
      this.dis = new Dispatcher()
      this.store = Store.getInstance()
      this.isVisible = ko.observable(false)
      this.invitersName = ko.observable('')
      this.invitersPhoto = ko.observable('')
      this.audio = new Audio('./assets/audio/cutering.mp3');

      this.onStore = (function(){
        var isBeingInvited = this.store.isReceivingRoomInvite()
        this.isVisible(isBeingInvited)
        if(isBeingInvited){
            var inviter = this.store.getRoomInviter()
            this.invitersName(inviter.getFirst() + ' ' + inviter.getLast())
            this.invitersPhoto(inviter.getLargePhotoURL())
            this.startRinging()
        }else{
          this.stopRinging()
        }
      }).bind(this)
      this.store.sub(this.onStore)

      this.startRinging = function(){
        this.audio.loop = true;
        this.audio.play();
      }

      this.stopRinging = function(){
        this.audio.pause();
        this.audio.currentTime = 0;
      }

      this.join = (function(){
        this.stopRinging()
        var p = this.store.getRoomInviter()
        this.dis.dispatch('joinRoom',p.getId())
      }).bind(this)

  }; // end viewModel.

  return {
    viewModel: View,
    template : template
  }


});
