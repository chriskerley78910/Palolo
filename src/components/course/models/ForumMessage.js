define(['ko','text-utilities'],
function(
  ko,
  testUtils){

  var ForumMessage = function(message){


      this.getConstructorName = function(){
        return "ForumMessage";
      }

      this.imgTag = ko.observable('');

      this.timestamp = message.timestamp;
      this.first = message.first;
      this.last = message.last;

      this.setFromSelf = function(bool){
        this.isSelf = bool;
      }
      this.setFromSelf(message.from_self);


      this.setFromFriend = function(){
        this.isSelf = false;
      }

      this.setGroupId = function(gId){
        if(!gId || Number.isInteger(gId) == false){
          throw new Error('group_id is missing or malformed.');
        }
        this.groupId = gId;
      }
      this.setGroupId(message.group_id);


      this.getGroupId = function(){
        return this.groupId;
      }


      this.setSenderImgUrl = function(url){
        if(!url || typeof url != 'string' || url.length < 1){
          throw new Error('sender_img_url is malformed.');
        }
        this.sender_img_url = url;
      }
      this.setSenderImgUrl(message.sender_img_url);


      this.setImgUrlPrefix = function(host){
        if(!this.isHostSet){
          this.sender_img_url =  host + "/" + this.sender_img_url;
        }
        else{
          throw new Error('host has already been set on this forum message.');
        }
      }

      this.getImgUrl = function(){
        return this.sender_img_url;
      }


      this.getImgTag = function(){
        return this.imgTag();
      }

      this.hasImage = ko.computed(function(){
          return this.sender_img_url && this.sender_img_url.length > 0;
      },this);

      this.getText = function(){
        return this.text;
      }

      this.setText = function(text){
        if(typeof text == 'string' && text.length > 0){
          this.text = text;
        }
        else{
          throw new Error('text must be non-empty string');
        }
      }
      this.setText(message.text);

      this.isSelfMessage = function(){
        return this.isSelf == true;
      }

      this.setAsFriend = function(){
        this.isSelf = false;
      }

      this.getHTML = function(){
        var text = this.getText();
        if(this.isSelfMessage()){
            return testUtils.wrapLinks(text,'forum-self-msg-link');
        }
        else{
          return testUtils.wrapLinks(text, 'forum-friend-msg-link');
        }
      }



  }; // end view model.


    ForumMessage.getRaw = function(){
      return {
        group_id:1,
        text:'text',
        timestamp:"2 min ago.",
        first:'chris',
        last:'kerley',
        isSelf:true,
        sender_img_url:'123.jpeg'
      };
    }

  ForumMessage.getFake = function(){
    return new ForumMessage(ForumMessage.getRaw(), 'http://forum.localhost');
  }

  ForumMessage.createSelfMessage = function(text, gId){
    return new ForumMessage({
        first: "",
        from_self: true,
        sender_img_url:'http',
        text: text,
        timestamp: "moments ago.",
        group_id:gId
    });
  }

  return ForumMessage;
});
