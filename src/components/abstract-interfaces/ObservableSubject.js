define([],function(){


  /**
   * A interface for subjects who want to
   * be observable.  To be a subject
   * the implementor must be a Call related
   * implementor. i.e: issues the states of calls.
   *
   */
  var CallObservable = function(){

    // all this subjects observers.
    this.observers = [];




    this.clearAll = function(){
      this.observers = [];
    }


    /**
     * Used for attaching a new observer
     * to this observable object.
     * @param  {CallObserver} o
     */
    this.attach = function(o){
      // console.log(o);
      if(!o.isObserver || !o.isObserver()){
        throw Error('Can only attach Observers');
      }
      else{
        this.observers.push(o);
      }
    }
    this.attach = this.attach.bind(this);





    /**
     * Removes the given observer from
     * this subjects list of observers.
     * @param  {CallObserver} o [description]
     */
    this.detach = function(o){

      for(var i = 0; i < this.observers.length; i++){
        if(this.observers[i] == o){
          this.observers.splice(i,1);
        }
      }
    }
    this.detach = this.detach.bind(this);





    /**
     * Notifies all the observers of the change.
     * @return {[type]} [description]
     */
    this.notify = function(message){
      this.observers.forEach(function(observer){
        observer.update(message);
      })
    }
    this.notify = this.notify.bind(this);








    /**
     * Returns the number of observers
     * currently attached to this
     * subject.
     * @return {number}
     */
    this.getObserverCount = function(){
      return this.observers.length;
    }





    this.getObservers = function(){

      var observerNames = [];

      for(var i = 0; i < this.getObserverCount(); i++){
        observerNames.push(this.observers[i].getName());
      }
      return observerNames;
    }






  }


  return CallObservable;


})
