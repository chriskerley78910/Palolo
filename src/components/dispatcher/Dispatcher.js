
define([],
function(){
  // private and only one instance of this.
  var _callbacks = [];
  var _idCounter = 0;
  var _orderedNames = [];

  var Dispatcher = function(){

    this.reg = function(name, callback){
      if(!name || typeof name != 'string' || name.length < 2){
        throw new Error('name must be a non-empty string.');
      }
      if(!callback || typeof callback != 'function'){
        throw new Error('callback must be a function.');
      }
      var callbacksId = _idCounter;
      _callbacks.push({
        name:name,
        callback:callback,
        id:callbacksId
      });
      _idCounter++;
      return callbacksId;
    }

    this.getCallback = function(name){
      var cbs = _callbacks;
      for(var i = 0; i < cbs.length; i++){
        if(cbs[i].name == name){
          return cbs[i].callback;
        }
      }
    }

    this.getCallbackById = function(id){
      if(isNaN(id) || id < 0){
        throw new Error('id must be a positive integer.');
      }
      var cbs = _callbacks;
      for(var i = 0; i < cbs.length; i++){
        if(cbs[i].id == id){
          return cbs[i].callback;
        }
      }
    }

    /**
      moves all the actions with 'name'
      to the front so that are dispatched first.
    */
    this.waitFor = function(name){
      var tmp = [];

      for(var i = 0; i < _callbacks.length; i++){
        var c =  _callbacks[i];
        if(name == c.name){
          tmp.push(c);
        }
      }

      _callbacks = array.filter(function(value, index, arr){
        return value.name == name;
      });

      tmp.forEach(function(t){
        _callbacks.unshift(t);
      })
    }



    this.dispatch = function(name, data){
      for(var i = 0; i < _callbacks.length; i++){
        if(_callbacks[i].name == name){
          _callbacks[i].callback(data);
        }
      }
    }





};

  return Dispatcher;
});
