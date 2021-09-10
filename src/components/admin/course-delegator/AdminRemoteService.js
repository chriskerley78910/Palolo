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



   this.removeCourse = function(tutorId,courseId){
     var url = this.getServerURL() + '/tutors/' + tutorId + '/courses/remove/' + courseId;
     $.ajax({
       url:url,
       type:"POST",
       beforeSend:this.setAuthorizationHeader,
       success:this.onCourseRemoved,
       error:this.onCourseRemovalError
     })
   }

   this.registerOnCourseRemoved = function(callback){
     this.onCourseRemoved = callback;
   }

   this.registerOnCourseRemovalError = function(callback){
     this.onCourseRemovalError = callback;
   }

   this.addCourse = function(tutorId, courseId){
     var url = this.getServerURL() + "/tutors/" + tutorId + "/courses/add/" + courseId;
     $.ajax({
       url:url,
       type:"POST",
       beforeSend:this.setAuthorizationHeader,
       success:this.onCourseAdded,
       error:this.onCourseAddError
     })
   }

   this.registerOnCourseAdded = function(callback){
     this.onCourseAdded = callback;
   }

   this.registerOnCourseAddError = function(callback){
     this.onCourseAddError = callback;
   }

   this.getCoursesFor = function(id){
     var url = this.getServerURL() + '/tutors/' + id + '/courses';
     $.ajax({
       url:url,
       type:"GET",
       beforeSend:this.setAuthorizationHeader,
       success:this.onCoursesReceived,
       error:this.onGetCoursesError
     })
   }

   this.registerOnCoursesReceived = function(callback){
    this.onCoursesReceived = callback;
   }
   this.registerOnCoursesReceived= this.registerOnCoursesReceived.bind(this);


   this.registerOnGetCoursesError = function(callback){
     this.onGetCoursesError = callback;
   }
   this.registerOnGetCoursesError = this.registerOnGetCoursesError.bind(this);



 }

 return AdminRemoteService;
})
