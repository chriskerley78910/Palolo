define(['ko',
        'dispatcher/Dispatcher',
        'text!notification/template.html',
        'notification/NotificationRemoteService',
        'notification/models/ViewedChatNotification',
        'notification/models/UnseenChatNotification',
        'notification/models/ForumNotification',
        'jquery'],
function(ko,
         Dispatcher,
         template,
         NotificationRemoteService,
         ViewedChatNotification,
         UnseenChatNotification,
         ForumNotification,
         $){

  function NotificationViewModel(params, componentInfo){

  this._remoteService = new NotificationRemoteService();
  this.dis = new Dispatcher();
  this.isVisible = ko.observable(false);
  this.notifications = ko.observableArray([]);
  this.isNotifcationsOpen = ko.observable(false);


  this.onAuth = function(auth){
    if(auth.state == 'authenticated'){
      this._remoteService.initialize();
      this._remoteService.registerOnNotificationsUpdate(this.onNotifications);
      this._remoteService.connect();
    }
  }
  this.onAuth = this.onAuth.bind(this);
  this.dis.reg('authState', this.onAuth);


  this.onNotificationClicked = function(notification){
      notification.setHasBeenSeen();
      if(notification.getConstructorName() == 'ForumNotification'){
        this.dis.dispatch('selectedGroupId', notification.getGroupId());
      }
      else{
        var p = notification.getPerson();
        console.log(p);
        console.log(p);
        this.dis.dispatch('focusPerson', p);
        this._remoteService.setChatMsgNotifSeen(notification);
      }
    this.closeNotifications();
  }
  this.onNotificationClicked = this.onNotificationClicked.bind(this);

  this.oldUnseenCount = 0;
  this.computeUnseenCount = function(){
    var unseenCount = 0;
    for(var i = 0; i < this.notifications().length; i++){
      var notif = this.notifications()[i];
      if(notif.getHasBeenSeen() == false){
        unseenCount++;
      }
      if(unseenCount > this.oldUnseenCount && unseenCount > 0){
        this.ding();
      }
    }
    this.oldUnseenCount = unseenCount;
    return unseenCount;
  }
  this.computeUnseenCount = this.computeUnseenCount.bind(this);
  this.unseenCount = ko.computed(this.computeUnseenCount);


  this.dingDone = true;
  this.ding = function(callback){
    var self = this;
    if(self.dingDone){
      var audio = new Audio('./assets/audio/play-ding.mp3');
      self.dingDone = false;
      audio.play().catch(function(err){
        console.log(err);
      }).finally(function(){
        self.dingDone = true;
      });
      if(callback)
        callback(true);
    }
    else if(callback){
      callback(false);
    }
  }
  this.ding = this.ding.bind(this);


  this.onNotifications = function(notifs){
    try{
      this.notifications([]);
      if(!notifs){
        // console.log('no new notifications.');
      }
      for(var i = 0; i < notifs.length; i++){
        this.binNotification(notifs[i]);
      }
      this.isVisible(this.notifications().length > 0);
    }
    catch(err){
      console.log(err);
      console.error('Something went wrong receiving the notifications.');
    }
  }
  this.onNotifications = this.onNotifications.bind(this);


  this.binNotification = function(rawNotif){
    var type = rawNotif.type;
    var wrappedNotif = null;
    var host = this._remoteService.getServerURL();

    switch(type){

        case 'chat':
          wrappedNotif = new UnseenChatNotification(rawNotif, host);
          this.notifications.unshift(wrappedNotif);
          break;

        case 'seen-chat':
          wrappedNotif = new ViewedChatNotification(rawNotif, host);
          this.notifications.push(wrappedNotif);
          break;

        case 'forum':
          wrappedNotif = new ForumNotification(rawNotif, host);
          this.notifications.push(wrappedNotif);
          break;

        default:
            throw new Error(type + ' is an unknown notification type.');
        }
  }



  this.openNotifications = function(){
    this.isNotifcationsOpen(true);
  }


  this.closeNotifications = function(){
    this.isNotifcationsOpen(false);
  }
  this.closeNotifications = this.closeNotifications.bind(this);




}; // end NotificationViewModel constructor.


return {
    viewModel: NotificationViewModel,
    template :template
};

}); // end define.
