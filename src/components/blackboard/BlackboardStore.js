define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store',
        'blackboard/BlackboardRemoteService'],
function(Dispatcher,
         Store,
         RemoteService){

   new RemoteService()
   var instance = null;
   var BlackboardStore  = function(){

     Object.setPrototypeOf(this, new Store())
     this.dis = new Dispatcher()
     this.blackboardSharerOpen = false

     this.openBlackboardSharer = (function(){
       this.blackboardSharerOpen = true
       this.pub()
     }).bind(this)
     this.dis.reg('openBlackboardSharer',this.openBlackboardSharer)

     this.closeBlackboardSharer = (function(){
       this.blackboardSharerOpen = false
       this.pub()
     }).bind(this)
     this.dis.reg('closeBlackboardSharer',this.closeBlackboardSharer)


     this.isBlackboardSharerOpen = function(){
       return this.blackboardSharerOpen
     }



  } // end

    return {
      getInstance:function(){
        if(!instance){
          instance = new BlackboardStore();
        }
        return instance;
      },
      getNew:function(){
        return new BlackboardStore();
      }
    }
  })
