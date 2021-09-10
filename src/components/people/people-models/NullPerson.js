
define(['people-models/Person','ko'],
function(Person, ko){

  var NullPerson = function(info){
    var defaultPerson = Person.getFake();
    Object.setPrototypeOf(Object.getPrototypeOf(this), defaultPerson);
    this.constructor = NullPerson;
    this.getConstructorName = function(){
      return "NullPerson";
    }


    this.getId = function(){
      return -1;
    }

    this.isNew = function(){
      return false;
    }

    this.isReal = function(){
      return false
    }

    this.getLastSeen = function(){
      return ''
    }
  }
  return NullPerson;
})
