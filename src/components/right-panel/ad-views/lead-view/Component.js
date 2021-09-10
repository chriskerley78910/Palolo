define(['ko',
        'dispatcher/Dispatcher',
        'text!ad-views/lead-view/template.html',
         'ad-views/AdStore',
         'ad-views/NullAd'],
function(
  ko,
  Dispatcher,
  template,
  AdStore,
  NullAd){

  var ViewModel = function(){
    this.isVisible = ko.observable(false);
    this.leadMessage = ko.observable('Hi, I’m interested. Please contact me.');
    this.isWaiting = ko.observable(false);
    this.currentAd = ko.observable(new NullAd());
    this.showMessageSent = ko.observable(false);
    this.store = AdStore;
    this.dis = new Dispatcher();



    this.onStoreChanged = function(){
      this.currentAd(this.store.getCurrentAd());
      this.isVisible(this.store.isLeadOpen());
      var wasWaiting = this.isWaiting();
      var isWaiting = this.store.isWaiting();
      if(wasWaiting && !isWaiting){
          this.leadMessage(this.store.getLeadMessage());
          this.showMessageSent(true);
          var self = this;
          setTimeout(function(){
            self.showMessageSent(false);
            self.isVisible(false);
          },1500);
      }
      this.isWaiting(isWaiting);
    }
    this.onStoreChanged = this.onStoreChanged.bind(this);
    this.store.subscribe(this.onStoreChanged);

    /**
      Stops the click event from propagating up to
      the window holder,  this is so the window
      does not close.
      */
    this.dontPropagate = function(a, event){
      event.stopImmediatePropagation();
    }


    this.closeLead = function(e, a){
      this.dis.dispatch('closeLead');
    }
    this.closeLead = this.closeLead.bind(this);


    this.sendMessage = function(){
      var message = this.leadMessage().trim();
      if(message.length > 0){
        this.dis.dispatch('leadMessage', message);
        this.leadMessage('');
      }
      else{
        alert('Messages can\'t be empty');
      }
    }
    this.sendMessage = this.sendMessage.bind(this);

}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});
