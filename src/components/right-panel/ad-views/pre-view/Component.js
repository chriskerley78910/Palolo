define(['ko',
        'dispatcher/Dispatcher',
        'ad-views/AdStore',
        'text!ad-views/pre-view/template.html',
         'ad-views/NullAd'],
function(
  ko,
  Dispatcher,
  AdStore,
  template,
  NullAd){

  var ViewModel = function(){
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.isLeadVisible = ko.observable(false).extend({notify:'always'});
    this.currentAd = ko.observable(new NullAd());
    this.store = AdStore;

    this.onStoreChange = function(){
      this.isVisible(this.store.isAdVisible());
      this.currentAd(this.store.getCurrentAd());
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.subscribe(this.onStoreChange);


    this.openLead = function(){
      this.dis.dispatch('openLead');
    }


    this.onHover = function(){
      this.dis.dispatch('adHovered',this.currentAd());
    }
    this.onHover = this.onHover.bind(this);


}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});
