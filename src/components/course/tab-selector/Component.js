define([
'ko',
'text!course/tab-selector/template.html',
'dispatcher/Dispatcher',
'course/tab-selector/TabSelectorStore'],
function(
  ko,
  template,
  Dispatcher,
  CourseStore){

  function TabSelectorViewModel(){

    this.dis = new Dispatcher();
    this.store = CourseStore.getInstance();
    this.isVisible = ko.observable(false)
    this.forumSelected = ko.observable(false)
    this.classListSelected = ko.observable(false)
    this.courseReviewsSelected = ko.observable(false)
    this.noteShareSelected = ko.observable(false)

    this.onStore = (function(){
      var visible = this.store.isTabSelectorVisible()
      this.isVisible(visible)
      if(visible){
        this.forumSelected(this.store.isCourseForumVisible());
        this.classListSelected(this.store.isClassListVisible());
        this.courseReviewsSelected(this.store.isCourseReviewsVisible());
        this.noteShareSelected(this.store.isNoteShareVisible())
      }
    }).bind(this)
    this.store.sub(this.onStore)


    this.selectCourseForum = (function(){
      this.dis.dispatch('courseFeatureSelection','courseForum')
    }).bind(this)

    this.selectClassList = (function(){
      this.dis.dispatch('courseFeatureSelection','classList')
    }).bind(this)

    this.selectCourseReviews = (function(){
      this.dis.dispatch('courseFeatureSelection','courseReviews')
    }).bind(this)

    this.selectNoteShare = (function(){
      this.dis.dispatch('courseFeatureSelection','noteShare')
    }).bind(this)



}; // end view model.

  return {
    viewModel: TabSelectorViewModel,
    template: template
  }
});
