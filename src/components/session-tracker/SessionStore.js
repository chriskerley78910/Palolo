define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store',
        'session-tracker/SessionRemoteService'],
function(Dispatcher,
         Store,
         RemoteService){

   new RemoteService()
   var instance = null;
   var SessionStore  = function(){

     Object.setPrototypeOf(this, new Store())
     this.dis = new Dispatcher()
     this.visible = false
     this.focusedPersonId = null
     this.savingSession = false
     this.errorMessage = null
     this.recordSavedShowing = false


     this.isRecordSavedShowing = (function(){
       return this.recordSavedShowing
     }).bind(this)


     this.onError = (function(m){
       this.savingSession = false
       this.errorMessage = m
       this.pub()
     }).bind(this)
     this.dis.reg('sessionTrackerError', this.onError)

     this.getErrorMessage = function(){
       return this.errorMessage
     }

     this.isRefreshingInfo = function(){
       return this.refreshing;
     }

     this.isVisible = function(){
       return this.visible
     }

     this.closeSessionTracker = (function(){
       this.visible = false
       this.pub()
     }).bind(this)
     this.dis.reg('closeSessionTracker',this.closeSessionTracker)


     this.openSessionTracker = (function(isTutor){
       if(typeof isTutor != 'boolean') throw new Error('isTutor must be boolean.')
       this.tutor = isTutor
       this.visible = true
       this.pub()
     }).bind(this)
     this.openerId = this.dis.reg('openSessionTracker',this.openSessionTracker)


     this.isTutor = function(){
       return this.tutor
     }

     this.getCustomersName = function(){
       return this.customersName
     }

     this.setFocusedPersonId = (function(person){
       this.focusedPersonId = person.getId()
       this.dis.dispatch('getAccountInfo',this.focusedPersonId)
     }).bind(this)
     this.dis.reg('focusPerson',this.setFocusedPersonId)

     this.getFocusedPersonId = function(){
       return this.focusedPersonId
     }

     this.onSaveSession = (function(){
       this.savingSession = true
       this.pub()
     }).bind(this)
     this.dis.reg('saveSessionTime', this.onSaveSession)

     this.isSavingSession = function(){
       return this.savingSession;
     }

     this.getTimeFulfilled = function(){
       return this.timeFulfilled
     }

     this.getTimeRemaining = function(){
       return this.timeRemaining
     }

     this.showRecordSavedMessage = function(){
       this.recordSavedShowing = true
       var self = this
       setTimeout(function(){
         self.recordSavedShowing = false
         self.pub()
       },2500)
     }

     this.onGetAcccountInfo = (function(){
       this.refreshing = true
       this.pub()
     }).bind(this)
     this.dis.reg('getAccountInfo', this.onGetAcccountInfo)

     this.onAccountInfoReceived = (function(data){
       this.timeRemaining = data.remaining
       this.timeFulfilled = data.fulfilled
       if(this.savingSession) this.showRecordSavedMessage()
       this.savingSession = false
       this.refreshing = false
       this.pub()
     }).bind(this)
     this.dis.reg('accountInfoReceived', this.onAccountInfoReceived)


  } // end

    return {
      getInstance:function(){
        if(!instance){
          instance = new SessionStore();
        }
        return instance;
      },
      getNew:function(){
        return new SessionStore();
      }
    }
  })
