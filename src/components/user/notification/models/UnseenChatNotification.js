define(['ko',
        'notification/models/Notification',
        'people-models/Person'],
function(ko,
        Notification,
        Person){

  function UnseenChatNotification(raw, host){

    Object.setPrototypeOf(this, new Notification(raw, host));
    this.getConstructorName = function(){
      return 'UnseenChatNotification';
    }
};


    UnseenChatNotification.getFake = function(){
      var raw = UnseenChatNotification.getRaw();
      return new UnseenChatNotification(raw, 'https://host');
    }

    UnseenChatNotification.getRaw = function(){
      var o1 = {
        message_id:1,
        text: "message snippet.",
        timestamp: "Dec 12 2019",
        seen:0,
        type:'chat'
      }
      var o2 = Person.getRaw();
      return Object.assign(o1,o2);
    }



  return UnseenChatNotification;


}); // end define.
