define(['ko','people-models/Person'],
function(ko, Person){

  function Notification(raw, host){

    this._hasBeenSeen = ko.observable(false);
    this.messageSnippet = ko.observable('');
    this.person = new Person(raw, host);


    this.getPerson = function(){
      return this.person;
    }

    this.getFirstName = function(){
      return this.person.getFirst();
    }

    this.getLastName = function(){
      return this.person.getLast();
    }

    this.getPhotoURL = function(){
      return this.person.getSmallPhotoURL() + "?=" + Date.now();
    }
    this.getPhotoURL = this.getPhotoURL.bind(this);

    this._isValidString = function(attr){
      if(!attr || typeof attr != 'string' || attr.length < 1){
        throw new Error('attribute must be a non-empty string.');
      }
    }

    this.getMessageId = function(){
      return this.id;
    }


    this.setMessageId = function(id){
      if(!id || Number.isInteger(id) == false || id < 1){
        throw new Error('message_id must be a positive integer.');
      }
      this.id = id;
    }
    this.setMessageId(raw.message_id);



    this.setHost = function(host){
      this._isValidString(host);
      this._host = host;
    }
    this.setHost(host);

    this.getHost = function(){
      return this._host;
    }


    this.setMessageSnippet = function(snippet){
      this._isValidString(snippet);
      this.messageSnippet(snippet);
    }
    this.setMessageSnippet = this.setMessageSnippet.bind(this);
    this.setMessageSnippet(raw.text);


    this.setMessageTimetamp = function(timestamp){
      this._isValidString(timestamp);
      this._timestamp = timestamp;
    }
    this.setMessageTimetamp(raw.timestamp);


    this.getMessageTimestamp = function(){
      return this._timestamp;
    }

    this.setHasBeenSeen = function(){
      this._hasBeenSeen(true);
    }

    this.setSeenTo = function(bool){
      if(typeof bool != 'number' || (bool != 0 && bool != 1)){
        throw new Error('seen must be 0 or 1.');
      }
      if(bool == 1){
        this._hasBeenSeen(true);
      }
      else{
        this._hasBeenSeen(false);
      }
    }
    this.setSeenTo(raw.seen);




    this.getHasBeenSeen = function(){
      return this._hasBeenSeen();
    }





}; // end consturctor


return Notification;

}); // end define.
