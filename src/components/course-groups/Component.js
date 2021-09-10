
define(['ko',
        'text!course-groups/template.html',
        'dispatcher/Dispatcher',
        'course-groups/GroupsStore',
        'course/models/CourseGroup'],

function(ko,
         template,
         Dispatcher,
         Store,
        CourseGroup){

  function ViewModel(){

    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.courses = ko.observableArray([])
    this.newsSelected = ko.observable(false)
    this.currentCourseGroup = ko.observable(null)

    this.onStore = (function(){
      this.newsSelected(this.store.isNewsViewVisible())
      this.courses(this.store.getMyCourseGroups())
      this.store.isGroupViewVisible() ? null : this.currentCourseGroup(null)
    }).bind(this)
    this.store.sub(this.onStore)

    this.openNews = (function(){
      this.dis.dispatch('openNews')
    }).bind(this)

    this.selectCourseGroup = (function(cg){
      this.currentCourseGroup(cg)
      if(cg) this.dis.dispatch('selectedGroupId',cg.getId())
    }).bind(this)

  }

  return {
    viewModel: ViewModel,
    template : template
  }


});
