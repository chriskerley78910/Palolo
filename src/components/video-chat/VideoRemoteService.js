define(['dispatcher/Dispatcher',
        'ActiveRemoteService',
        'people-models/Person'],
function(Dispatcher,
        ActiveRemoteService,
        Person){

   var VideoRemoteService  = function(){
     Object.setPrototypeOf(this, new ActiveRemoteService());
     this.dis = new Dispatcher();
     this.setMicroServer('live')

     this.onLeaveRoom = (function(palId){
       this.sock.emit('leaveRoom',palId)
     }).bind(this)
     this.leaveRoomId = this.dis.reg('leaveRoom', this.onLeaveRoom)


     this.emitRoomInviteError = (function(err){
       this.sock.emit('roomInviteError',err)
     }).bind(this)
     this.inviteErrId = this.dis.reg('roomInviteError',this.emitRoomInviteError)


     this.onRingRecipient = (function(palId){
       this.sock.emit('invitePalToRoom',palId)
     }).bind(this)
     this.ringRecipId = this.dis.reg('invitePalToRoom',this.onRingRecipient)

     this.onAuth = (function(auth){
       if(auth.state == 'authenticated' && !this.sock){
        this.setSock()
        this.sock.on('roomInvite',this.onRoomInvite)
        this.sock.on('roomInviteError',this.onRoomInviteError)
        this.sock.on('palLeftRoom',this.onPalLeftRoom)

      }
     }).bind(this)
     this.dis.reg('authState',this.onAuth)


     this.onPalLeftRoom = (function(palId){
       this.dis.dispatch('palLeftRoom', palId)
     }).bind(this)

     this.onRoomInviteError = (function(err){
       this.dis.dispatch('inboundRoomInviteError',err)
     }).bind(this)


     this.onRoomInvite = (function(data){
       var host = this.getServerURL()
       var p = new Person(data, host)
       this.dis.dispatch('roomInvite',p)
     }).bind(this)


     this.onDownloadSessionRecording = (function(){
       var url = this.getServerURL() + '/downloadSessionRecording';
       $.ajax({
         url:url,
         type:'get',
         beforeSend:this.setAuthorizationHeader,
         success:function(res){
            console.log(res)
            window.location = res
         },
         error:this.onError
       })
     }).bind(this)
     this.dis.reg('downloadSessionRecording', this.onDownloadSessionRecording)

     this.getRoomToken = (function(palId){
       var url = this.getServerURL() + '/getRoomToken?palId=' + palId;
       $.ajax({
         url:url,
         type:'get',
         beforeSend:this.setAuthorizationHeader,
         success:this.onTokenReceived,
         error:this.onError
       })
     }).bind(this)
     this.dis.reg('getRoomToken',this.getRoomToken)
     this.dis.reg('joinRoom',this.getRoomToken)


     this.onTokenReceived = (function(response){
       this.dis.dispatch('roomToken',response)
     }).bind(this)

     this.onError = (function(err){
       console.log(err)
       this.dis.dispatch('videoChatDown')
     }).bind(this)

  } // end

    return VideoRemoteService
  })
