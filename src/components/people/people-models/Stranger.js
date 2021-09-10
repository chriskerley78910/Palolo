define(['people-models/Person'],
function(Person){

  var Stranger = function(raw, host){
    Object.setPrototypeOf(this, new Person(raw, host));
    this.constructor = Stranger;

    this.getConstructorName = function(){
      return 'Stranger'
    }

    this.isAddable = function(){
      return true
    }
  }

  Stranger.getRaw = function(){
      return Person.getRaw();
    }

  Stranger.getFake = function(){
    var classmate = Person.getRaw()
    var host = 'host';
    return new Stranger(classmate, host);
  }


  return Stranger;

});
