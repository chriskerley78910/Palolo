define([],
function(){

  var Erase = function(data){

    this.x = null
    this.y = null
    this.r = null

    this.isBoardable = function(){
      return true
    }

    this.isLine = function(){
      return false
    }

    this.getX = function(){
      return this.x
    }

    this.setX = function(x){
      this.x = x
    }
    this.setX(data.x)

    this.getY = function(){
      return this.y
    }

    this.setY = function(y){
      this.y = y
    }
    this.setY(data.y)

    this.getRad = function(){
      return this.rad
    }

    this.setRad = function(rad){
      this.rad = rad
    }
    this.setRad(data.r)

    this.serialize = function(){
      return {
        x:this.x,
        y:this.y,
        r:this.rad
      }
    }
  }

  Erase.getRaw = function(){
    return {
      x:0.2,
      y:0.3,
      r:0.1
    }
  }

  Erase.getFake = function(){
    var r = Erase.getRaw()
    return new Erase(r)
  }


  return Erase;

});
