
define(['ko',
        'text!new-pal-list/template.html',
        'dispatcher/Dispatcher',
        'people-models/NullPerson',
        'people-store/PeopleStore'],

function(ko,
         template,
         Dispatcher,
         NullPerson,
         Store){

  function ViewModel(){

    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.newPals = ko.observableArray([]);
    this.selectedPal = ko.observable(null);

    this.onStore = (function(){
      var pals = this.store.getNewPals().toArray()
      this.newPals(pals)
    }).bind(this)
    this.store.sub(this.onStore)

    this.palClicked = (function(p){
      this.selectedPal(p)
      this.dis.dispatch('focusPerson',p)
    }).bind(this)


  } // end view model.

  return {
    viewModel: ViewModel,
    template : template
  }


});
