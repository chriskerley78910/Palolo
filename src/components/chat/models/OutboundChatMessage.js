define(['ko','chat/models/ChatMessage','text-utilities'],
function(ko,ChatMessage, TextUtilities){
    var OutboundChatMessage = function(raw, host){
    Object.setPrototypeOf(this, new ChatMessage(raw ,host));

    this.owner = true;
    this.token = Date.now();

    this.getConstructorName = function(){
      return "OutboundChatMessage";
    }

    this.setRecipientId = function(id){
      if(!id || Number.isInteger(id) == false){
        throw new Error('recipient_id must be a integer.');
      }
      this.recipient_id = id;
    }
    this.setRecipientId(raw.recipient_id);

    this.setSent = function(token){
      token == this.token ? this.sent(true) : null;
    }

    this.setSeen = function(messageId){
      messageId == this.getId() ? this.seen(true) : null;
    }

    /**
      Overrides
    */
    this.getHTML = function(){
      return TextUtilities.wrapLinks(this.text, 'chat-link');
    }

    this.getToken = function(){
      return this.token;
    }
  } // end constructor

  OutboundChatMessage.constructor = OutboundChatMessage;

  OutboundChatMessage.getFake = function(){
    var raw = ChatMessage.getRaw()
    raw.recipient_id = 1
    return new OutboundChatMessage(raw,'host');
  }
    return OutboundChatMessage;
});
