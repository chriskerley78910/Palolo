define(['chat/models/ChatMessage',
        'text-utilities'],
function(ChatMessage,
         TextUtilities){
    var InboundChatMessage = function(raw, host){

    Object.setPrototypeOf(this, new ChatMessage(raw, host));

    this.setId(raw.message_id);
    this.sent(true);

    this.setSeen = function(seen){
      if(seen != 1 && seen != 0){
        throw new Error('seen must be 1 or 0');
      }
      this.seen(seen);
    }
    this.setSeen(raw.seen);

    this.setSenderId = function(id){
        if(!id || typeof id != 'number'){
          throw new Error('user_id must be set on each message.');
        }
      this.user_id = id;
    }
    this.setSenderId(raw.user_id);


    this.getSenderId = function(){
      return this.user_id;
    }

    this.setRecipientId = function(id){
      if(!id || typeof id != 'number'){
        throw new Error('recipient_id must be set on each message.');
      }
      this.recipient_id = id;
    }
    this.setRecipientId(raw.recipient_id);


    this.setTimestamp = function(time){
      if(typeof time != 'string' || time.length < 1){
        throw new Error('timestamp must exist.');
      }
      this.timestamp = time;
    }
    this.setTimestamp(raw.timestamp);

    this.isSent = function(){
      return false;
    }

    this.maybeSetAsOwner = function(owner){
      if(owner && owner != 'recipient'){
        this.owner = true;
      }
      else{
        this.owner = false;
      }
    }
    this.maybeSetAsOwner(raw.owner);


    this.isOwner = function(){
      return this.owner === true;
    }

    this.setStyleClass = function(styleClass){
      this.styleClass = styleClass;
    }

    /**
      To be used in a html binding in  knockoutjs.
    */
    this.getHTML = function(){
      if(!this.isOwner()){
        return TextUtilities.wrapLinks(this.text, 'chat-link-friend');
      }
      else{
        return TextUtilities.wrapLinks(this.text, 'chat-link');
      }
    }



  } // end constructor

  InboundChatMessage.getRaw = function(){
    var raw = ChatMessage.getRaw()
    var obj = Object.assign(raw,{
      message_id:1,
      user_id:2,
      recipient_id:3,
      text:'hello',
      timestamp:'moments ago',
      seen:0
    })
    console.log(obj)
    return obj
  }

  InboundChatMessage.getFake = function(){
    var raw = InboundChatMessage.getRaw()
    var host = 'host'
    return new InboundChatMessage(raw, host);
  }
  return InboundChatMessage;
});
