define(['course/models/ForumMessage'],
function(ForumMessage){

  var ForumMessageCollection = function(){

    this.msgs = [];

    this.getConstructorName = function(){
      return "ForumMessageCollection";
    }

    this.getSize = function(){
      return this.msgs.length;
    }

    this.add = function(msg){
      if(typeof msg != 'object' || !msg.getConstructorName ||  msg.getConstructorName() != 'ForumMessage'){
        throw new Error('can only add ForumMessages.');
      }
      this.msgs.push(msg);
    }

    this.get = function(i){
      return this.msgs[i];
    }

    /**
    returns an Array<ForumMessage>
    */
    this.toArray = function(){
      return this.msgs;
    }


    this.clear = function(){
      this.msgs = [];
    }

  }; // end view model.

  ForumMessageCollection.getFake = function(){
      return new ForumMessageCollection();
  }


  return ForumMessageCollection;
});
