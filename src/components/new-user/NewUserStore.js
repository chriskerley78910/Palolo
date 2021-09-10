define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store'],
function(Dispatcher,
         Store){


   var instance = null;
   var NewUserStore  = function(){

     Object.setPrototypeOf(this, new Store())
     this.dis = new Dispatcher()




  } // end

    return {
      getInstance:function(){
        if(!instance){
          instance = new NewUserStore();
        }
        return instance;
      },
      getNew:function(){
        return new NewUserStore();
      }
    }
  })
