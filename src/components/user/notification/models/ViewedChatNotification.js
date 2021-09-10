define(['ko',
        'notification/models/Notification',
        'people-models/Person'],
function(ko,
        AbstractNotification,
        Person){

  function ViewedChatNotification(rawNotification, host){

    Object.setPrototypeOf(this, new AbstractNotification(rawNotification, host));

    this._hasBeenSeen = ko.observable(true);

    this.getConstructorName = function(){
      return 'ViewedChatNotification';
    }

}; // end constructor.


  ViewedChatNotification.getFake =  function(senderId){
      var raw = ViewedChatNotification.getRaw();
      return new ViewedChatNotification(raw, 'http://host.com');
    }


  ViewedChatNotification.getRaw  = function(){
    var o1 = {
     message_id:100,
     text: "message snippet.",
     timestamp: "Dec 12 2019",
     seen:1,
     type:'seen-chat'
   }
   var o2 = Person.getRaw();
   return Object.assign(o1,o2);
  }


  return ViewedChatNotification;


}); // end define.
