define(['ko',
        'notification/models/Notification',
        'people-models/Person'],
function(ko,
         Notification,
         Person){

  var ForumNotification = function(raw, host){

    Object.setPrototypeOf(this, new Notification(raw, host));

    this.getConstructorName = function(){
      return 'ForumNotification';
    }

    this.getForumName = function(){
      return this.forumName;
    }

    this.setForumName = function(forum){
      this._isValidString(forum,'forum_name must be a attribute.');
      this.forumName = forum;
    }
    // this.setForumName(raw.forum_name);


    this.getGroupId = function(){
      return this.grpId;
    }

    this.setGroupId = function(id){
      if(id && Number.isInteger(id) && id > 0){
        this.grpId = id;
      }
      else{
        throw new Error('group_id must be a positive integer.');
      }
    }
    this.setGroupId(raw.group_id);


  };


    ForumNotification.getFake = function(){
      var raw = ForumNotification.getRaw();
      return new ForumNotification(raw, 'https://host');
    }

    ForumNotification.getRaw = function(){
      var o1 = {
        message_id:2,
        group_id:55,
        text: "message snippet.",
        timestamp: "Dec 12 2019",
        forum_name:"MATH1300 M",
        seen:0,
        type:'forum'
      }
      var o2 = Person.getRaw();
      return Object.assign(o1,o2);
    }



  return ForumNotification;


}); // end define.
