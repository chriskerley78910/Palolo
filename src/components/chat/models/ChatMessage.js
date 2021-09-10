define(['ko'],
function(ko){
    var ChatMessage = function(data, host){

      this.sent = ko.observable(false);
      this.seen = ko.observable(false);


      this.getConstructorName = function(){
        return "ChatMessage";
      }

      this.setHost = function(host){
        if(typeof host != 'string' || host.lenth < 1)
          throw new Error('host must be set')
        this.host = host
      }
      this.setHost(host)

      this.setId = function(message_id){
        if(!message_id || typeof message_id != 'number'){
          throw new Error('message_id must be specified.');
        }
        this.message_id = message_id;
      }

      this.getId = function(){
        return this.message_id;
      }

      this.setText = function(text){
        if(!text || typeof text != 'string'){
          throw new Error('text property must exist in the message.');
        }
        this.text = text;
      }
      this.setText(data.text);

      this.setSenderImgURL = function(url){
        if(typeof url != 'string' || url.length < 1){
          this.imgURL = "./assets/no-photo.jpg"
        }
        else{
            this.imgURL = url
        }
      }
      this.setSenderImgURL(data.small_photo_url)

      this.getSenderImageURL = function(){
        return this.host + '/' + this.imgURL
      }

      this.getSenderId = function(){

      }

      this.isOwner = function(){

      }

    } // end constructor


    ChatMessage.getRaw = function(user_id){
      var raw = {
        timestamp: "2019-04-09T05:42:56.000Z",
        message_id: 3,
        recipient_id: 2,
        user_id:1,
        text:'default text',
        small_photo_url:'img.jpg'
      };

      if(user_id){
        raw.user_id = user_id;
        return raw
      }
      else{
        return raw;
      }
    }

    ChatMessage.getFake = function(){
      var raw = ChatMessage.getRaw();
      var host = 'fakehost'
      return new ChatMessage(raw, host);
    }

    return ChatMessage;
});
