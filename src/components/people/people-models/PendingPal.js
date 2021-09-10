define(['people-models/Classmate'],
function(Classmate){

  var PendingPal = function(classmate){
    Object.setPrototypeOf(this, classmate);
    this.constructor = PendingPal;

    this.isAddable = function(){
      return false
    }
  }

  PendingPal.build = function(person){
    return new PendingPal(person)
  }
  
  return PendingPal;

});
