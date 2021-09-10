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



      this.getTutorInfo = function(tutorId){
        var url = this.getServerURL() + "/tutors/" + tutorId;
        $.ajax({
          url:url,
          beforeSend:this.setAuthorizationHeader,
          success:this.onTutorInfo,
          error:this.onTutorInfoError
        })
      }


      this.registerOnTutorInfo = function(callback){
        this.onTutorInfo = callback;
      }

      this.registerOnTutorInfoError = function(callback){
        this.onTutorInfoError = callback;
      }



      this.deleteTutor = function(tutorId){
        var url = this.getServerURL() + '/tutors/' + tutorId;
        $.ajax({
          url:url,
          beforeSend:this.setAuthorizationHeader,
          type:'DELETE',
          success:this.onTutorDeleted,
          error:this.onDeleteTutorError
        });
      }

      this.registerOnTutorDeleted = function(callback){
        this.onTutorDeleted = callback;
      }

      this.registerOnDeleteTutorError = function(callback){
        this.onDeleteTutorError = callback;
      }

 }

 return AdminRemoteService;
})
