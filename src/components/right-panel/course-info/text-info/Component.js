define([
'ko',
'text!right-panel/course-info/text-info/template.html',
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
    this.group = ko.observable(null);
    this.isLeaveButtonVisible = ko.observable(false);

    this.onStoreChange = (function(){
      var g = this.store.getCurrentGroup()
      if(g){
        this.group(g);
      }
      this.isLeaveButtonVisible(this.store.isGroupMember());
    }).bind(this)
    this.store.sub(this.onStoreChange);


    this.leaveGroup = function(){
      this.dis.dispatch('leaveSelectedCourse');
    }

}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});
