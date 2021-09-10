define([],function(){

  var Observer = function(){

    /**
     *
     * @param  {[type]} message
     * @param  {[type]} subject is the instance which
     *  executed the update.
     */
      this.update = function(message,subject){
         // does nothing, override is optional.
      }

      /**
       * Returns the name of this interface.  this
       * is too get around a limitation of
       * internet explorer, it does not support
       * constructor.name.
       */
      this.isObserver = function(){
        return true;
      }



      this.getName = function(){
        return this.constructor.name;
      }

  }
  // does not work in MS Edge.
  Observer.constructor.name = "Observer";
  return Observer;


})
