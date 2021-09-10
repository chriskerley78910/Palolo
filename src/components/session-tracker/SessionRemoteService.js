define(['ActiveRemoteService',
        'dispatcher/Dispatcher',
        'session-tracker/AccountState'],
function(ActiveRemoteService,
         Dispatcher,
         AccountState){

var SessionRemoteService = function(){

    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("payments");
    this.dis = new Dispatcher()


    this.getAccountInfo = (function(customerId){
      var url = this.getServerURL() + '/getAccountInfo?customer=' + customerId;
      $.ajax({
        url:url,
        type:'get',
        beforeSend:this.setAuthorizationHeader,
        success:this.onAccountInfoReceived,
        error:this.onError
      })
    }).bind(this)
    this.dis.reg('getAccountInfo',this.getAccountInfo)


    this.onSaveSession = (function(data){
      var url = this.getServerURL() + '/saveSessionTime';
      $.ajax({
        url:url,
        type:'post',
        data:data,
        beforeSend:this.setAuthorizationHeader,
        success:this.onAccountInfoReceived,
        error:this.onError
      })
    }).bind(this)
    this.dis.reg('saveSessionTime',this.onSaveSession)

    this.onAccountInfoReceived = (function(data){
      try{
        this.dis.dispatch('accountInfoReceived', new AccountState(data))
      }catch(err){
        this.dis.dispatch('sessionTrackerError',err.message)
      }
    }).bind(this)


    this.onError = (function(err){
      this.dis.dispatch('sessionTrackerError',err.responseText)
    }).bind(this)


}

return SessionRemoteService;
})
