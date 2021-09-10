define(['RemoteService','jquery'],
function(RemoteService, $){

 var AdminRemoteService = function(){

   Object.setPrototypeOf(this,new RemoteService());

   this.constructor = AdminRemoteService;
   this.constructor.name = "AdminRemoteService";
   this.getConstructorName = function(){
     return "AdminRemoteService";
   }

   this.setDevPort('');
   this.setDevHost("admin.");
   this.setDevDomain("localhost");

   this.setLiveHost('www.admin.');
   this.setLivePort('');

   this.getTutors = function(){
     var url = this.getServerURL() + '/tutors'
     $.ajax({
       url:url,
       type:"GET",
       beforeSend:this.setAuthorizationHeader,
       success:this.onTutorsRecieved,
       error:this.onGetTutorsError
     })
   }

   this.registerOnTutorsReceived = function(fn){
     this.onTutorsRecieved = fn;
   }

   this.registerOnGetTutorsError = function(fn){
     this.onGetTutorsError = fn;
   }
 }

 return AdminRemoteService;
})
