define(['ko',
'text!in-another-section-prompt/template.html',
'dispatcher/Dispatcher',
'course/CourseStore'],
function(
  ko,
  template,
  Dispatcher,
  CourseStore){

  function InAnotherSectionViewModel(){
    this.store = CourseStore.getInstance();
    this.dis = new Dispatcher();
    this.sectionLetter = ko.observable('');
    this.courseCode = ko.observable('');
    this.dept = ko.observable('');
    this.isVisible = ko.observable(false);

    this.onStoreChange = function(){
      var grp = this.store.getCurrentGroup();
      var isVisible = grp && !grp.isMember() && grp.inAnotherSection();
      this.isVisible(isVisible);
      if(isVisible){
        this.sectionLetter(grp.getSectionLetter());
        this.dept(grp.getDept());
        this.courseCode(grp.getCourseCode());
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);



    this.switchCourse = function(){
      var grp = this.store.getCurrentGroup();
      this.dis.dispatch('switchToCourseGroup', grp);
    }



}; // end view model.

  return {
    viewModel: InAnotherSectionViewModel,
    template: template
  }
});
