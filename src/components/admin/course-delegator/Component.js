
define(['ko',
        'postbox',
        'text!admin/course-delegator/template.html',
        'admin/course-delegator/AdminRemoteService'],

function(ko,
         postbox,
         template,
         AdminRemoteService){


  function ViewModel(params, componentInfo){

    this.componentParams = params;
    this.isVisible = ko.observable(false);
    this.tutorableCourses = ko.observableArray([]);
    this.tutorOptedCourses = ko.observableArray([]);
    this._remoteService = new AdminRemoteService();


    this.onVisiblePanelChange = function(currentVisiblePanel){

      if(currentVisiblePanel == 'course-delegator'){
        this.isVisible(true);
        this._remoteService.registerOnCoursesReceived(this.onCoursesReceived);
        this._remoteService.registerOnGetCoursesError(this.onGetCoursesError);
        this._remoteService.registerOnCourseRemoved(this.onCourseRemoved);
        this._remoteService.registerOnCourseAdded(this.onCourseAdded);
        this._remoteService.getCoursesFor(this.componentParams.currentTutorId());
      }
      else{
        this.isVisible(false);
      }
    }
    this.onVisiblePanelChange = this.onVisiblePanelChange.bind(this);
    this.componentParams.visiblePanel.subscribe(this.onVisiblePanelChange,this);


    this.componentParams.currentTutorId.subscribe(function(tutorId){
      this._remoteService.getCoursesFor(tutorId);
    },this);


    this.removeCourse = function(data, event){
      this._remoteService.removeCourse(this.componentParams.currentTutorId(),data.id);
    }
    this.removeCourse = this.removeCourse.bind(this);


    this.addCourse = function(data, event){
      this._remoteService.addCourse(this.componentParams.currentTutorId(),data.id);
    }
    this.addCourse = this.addCourse.bind(this);


    this.onCoursesReceived = function(courseLists){
      var parsedLists = JSON.parse(courseLists);
      this.tutorOptedCourses(parsedLists.opted);
      this.tutorableCourses(parsedLists.tutorable);
    }
    this.onCoursesReceived = this.onCoursesReceived.bind(this);


    this.onGetCoursesError = function(err){
      console.log(err);
    }

    this.onCourseRemoved = function(jsonCourseId){
      var courseId = JSON.parse(jsonCourseId);
      var courses = this.tutorOptedCourses.remove( function (course) { return course.id == courseId; } )
      this.tutorableCourses.unshift(courses[0]);
    }
    this.onCourseRemoved = this.onCourseRemoved.bind(this);


    this.onCourseAdded = function(jsonCourseId){
      var courseId = JSON.parse(jsonCourseId);
      var courses = this.tutorableCourses.remove( function (course) { return course.id == courseId; } )
      this.tutorOptedCourses.unshift(courses[0]);
    }
    this.onCourseAdded = this.onCourseAdded.bind(this);

  };

  return {
    viewModel: ViewModel,
    template: template
  }

});
