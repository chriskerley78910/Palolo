define([
'ko',
'text!right-panel/current-courses/template.html',
'dispatcher/Dispatcher',
'course/models/CourseGroup',
'course/CourseStore'], function(
  ko,
  template,
  Dispatcher,
  CourseGroup,
  CourseStore){

  var ViewModel = function(){

    this.dis = new Dispatcher();
    this.store = CourseStore.getInstance();
    this.isVisible = ko.observable(false);

    this.isVerboseVisible = ko.observable(false);
    this.verboseCourses = ko.observableArray([]);

    this.isConciseVisible = ko.observable(true);
    this.conciseCourses = ko.observableArray([]);

    this.onStoreUpdate = function(){
      this.maybeSetExperimentalMode();
      var grps = this.store.getClassmateCourseGroups();
      this.verboseCourses(grps);
      var MAX_CONCISE_COURSES = 3;
      var concise = grps.slice(0, MAX_CONCISE_COURSES);
      this.conciseCourses(concise);
    }
    this.onStoreUpdate = this.onStoreUpdate.bind(this);
    this.store.sub(this.onStoreUpdate);


    this.maybeSetExperimentalMode = function(){
      var classmateId = this.store.getClassmatesId();

      if(Number.isInteger(classmateId)){
        if(classmateId % 2 == 0){
          this.isVisible(false);
        }
        else {
          this.isVisible(true);
        }
      }
    }


    this.selectCourse = function(grp){
      this.dis.dispatch('selectedGroupId', grp.getId());
    }
    this.selectCourse = this.selectCourse.bind(this);


    this.showVerboseList = function(){
      this.isVerboseVisible(true);
      this.isConciseVisible(false);
    }

    this.hideVerboseList = function(){
      this.isVerboseVisible(false);
      this.isConciseVisible(true);
    }




  }

  return {
    viewModel:ViewModel,
    template: template
  }

});
