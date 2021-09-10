
define(['ko',
        'text!pal-request-list/template.html',
        'dispatcher/Dispatcher',
        'people-models/Person',
        'people-store/PeopleStore'],

function(ko,
         template,
         Dispatcher,
         Person,
         Store){

  function ViewModel(){

    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.requests = ko.observableArray([]);


    this.onStoreUpdate = function(){
      var requests = this.store.getPalRequests();
      this.requests(requests);
    }
    this.onStoreUpdate = this.onStoreUpdate.bind(this);
    this.store.sub(this.onStoreUpdate);


    this.acceptRequest = function(person){
      this.dis.dispatch('acceptRequest', person);
    }
    this.acceptRequest = this.acceptRequest.bind(this);

    this.denyRequest = function(person){
      this.dis.dispatch('denyRequest', person);
    }
    this.denyRequest = this.denyRequest.bind(this);

    this.faceClicked  = function(classmate){
      this.dis.dispatch('focusPerson', classmate);
    }
    this.faceClicked = this.faceClicked.bind(this);


  } // end view model.

  return {
    viewModel: ViewModel,
    template : template
  }


});
