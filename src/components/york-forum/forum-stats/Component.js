define([
'ko',
'text!york-forum/forum-stats/template.html',
'dispatcher/Dispatcher',
'york-forum/YorkForumStore'],
function(
  ko,
  template,
  Dispatcher,
  Store){

  var ViewModel = function(){

      this.dis = new Dispatcher();
      this.store = Store.getInstance();
      this.isVisible = ko.observable(false);
      this.memberCount = ko.observable(0)

      this.onStore = (function(){
        this.memberCount(this.store.getMemberCount())
        this.isVisible(this.store.isVisible())
      }).bind(this)
      this.store.sub(this.onStore);



}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});
