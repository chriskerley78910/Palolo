define(['ActiveRemoteService','jquery','dispatcher/Dispatcher'],
function(ActiveRemoteService, $, Dispatcher){

  var CourseAdderRemoteService = function(){
      Object.setPrototypeOf(this,new ActiveRemoteService());
      this.setMicroServer('course');
      this.dis = new Dispatcher();

      this.getCoursesMatching = function(courseCode){
        var url = this.getServerURL() + '/courseCodes?code=' + courseCode;
        var self = this;
        return $.ajax({
          url:url,
          type:'get',
          beforeSend:this.setAuthorizationHeader,
          success:function(results){
            self.dis.dispatch('courseAdderCourseResults', results);
          },
          error:function(a,b,err){
            console.log(err);
          }
        });
      }
      this.getCoursesMatching = this.getCoursesMatching.bind(this);
      this.courseSearchId = this.dis.reg('getCoursesMatching',this.getCoursesMatching);

  }
  return CourseAdderRemoteService;

})
