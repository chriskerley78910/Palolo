define([
'ko',
'text!right-panel/course-info/template.html',
'dispatcher/Dispatcher',
'course/CourseStore'],
function(
  ko,
  template,
  Dispatcher,
  Store){

  var ViewModel = function(){

    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.isVisible = ko.observable(false);

    this.onStoreChanged = function(){
      this.isVisible(this.store.isGroupViewVisible());
    }
    this.onStoreChanged = this.onStoreChanged.bind(this);
    this.store.sub(this.onStoreChanged);

}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});
