define(['ko','people-models/Classmate'],
function(ko, Classmate){

  var Pal = function(raw, host){
    Object.setPrototypeOf(this, new Classmate(raw, host));
    this.constructor = Pal;
    this.isNew = ko.observable(false);
    this.isInvitedToRoom = ko.observable(false)
    this.roomId = null
    this.is_new = 0;

    this.getConstructorName = function(){
      return 'Pal'
    }

    this.unsetIsInvitedToRoom = function(){
      this.isInvitedToRoom(false)
    }

    this.setIsInvitedToRoom = function(roomId){
      this.validateId(roomId)
      this.isInvitedToRoom(true)
      this.roomId = roomId
    }

    this.getInvitedRoomId = function(){
      return this.roomId
    }


    this.setIsNew = function(isNew){
      if(isNew != 0 && isNew != 1){
        throw new Error('is_new must be 0 or 1.');
      }
      if(isNew == 1){
        this.isNew(true);
        this.is_new = 1;
      }
      else{
        this.isNew(false);
        this.is_new = 0;
      }
    }
    this.setIsNew(raw.is_new);


    this.getRawNew = function(){
      return this.is_new;
    }


    this.setAsNew = function(){
      this.isNew(true);
      this.is_new = 1;
    }

    this.setAsOld = function(){
      this.isNew(false);
    }

    this.isAddable = function(){
      return false
    }
  }

  Pal.getRaw = function(){
      var raw = Classmate.getRaw();
      raw.is_new = 0;
      return raw;
    }

  Pal.getFake = function(){
    var classmate = Classmate.getRaw()
    classmate.is_new = 0;
    var host = 'host';
    return new Pal(classmate, host);
  }


  return Pal;

});
