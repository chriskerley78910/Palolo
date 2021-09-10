define([],
function(){
  var ValidObject = function(data, host){

    this.validateId = function(id){
      if(Number.isInteger(id) == false || id < 0)
        throw new Error('id malformed')
    }

    this.validateStr = function(str){
      if(typeof str != 'string' || str.length < 1){
        throw new Error('must be a non-empty string')
      }
    }

    this.validateBool = function(bool){
      var n = Number(bool)
      if(n !== 1 && n !== 0){
        throw new Error('must be 1 or 0')
      }
    }

  }
  return ValidObject;
});
