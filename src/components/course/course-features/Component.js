define([
'ko',
'dispatcher/Dispatcher',
'text!course/course-features/template.html',
'course/CourseStore'],
function(
  ko,
  Dispatcher,
  template,
  CourseStore
){


    var CourseHolderViewModel = function(){

      this.store = CourseStore.getInstance();
      this.dis = new Dispatcher();
      this.isVisible = ko.observable(false);
      this.isSpinnerVisible = ko.observable(false)

      this.onStoreChanged = (function(){
        this.isSpinnerVisible(this.store.isWaiting())
        this.isVisible(this.store.isGroupViewVisible())
      }).bind(this)
      this.store.sub(this.onStoreChanged);




    } // end view model.

  return {
    viewModel:CourseHolderViewModel,
    template:template
  }

});
