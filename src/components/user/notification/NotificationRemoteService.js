
define(['ActiveRemoteService',
        'socketio',
        'dispatcher/Dispatcher',
        'notification/models/Notification'],
function(ActiveRemoteService,
         io,
         Dispatcher,
         Notification){

  var NotificationRemoteService = function(){
      Object.setPrototypeOf(this,new ActiveRemoteService());
      this.setMicroServer("notifications");
      this._io = io;
      this.dis = new Dispatcher();


      this.initialize = function(){
        this.setSock();
      }


      this.connect = function(){
        if(this.sock){
            this.sock.connect();
        }
      }

      this.registerOnNotificationsUpdate = function(callback){
        this._checkType(callback);
        this.sock.on('notifications', callback);
      }


      this.setChatMsgNotifSeen = function(notif){
        if(notif instanceof Notification == false){
          throw new Error('notif must be a Notification.');
        }

        this.sock.emit('chatNotifSeen',{senderId:notif.getPerson().getId()});
      }


      this._checkType = function(cb){
        if(typeof cb != 'function'){
          throw new Error('callback needs to be a function.');
        }
      }
  }

  return NotificationRemoteService;
})
