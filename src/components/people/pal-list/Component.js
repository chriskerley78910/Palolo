
define(['ko',
        'text!pal-list/template.html',
        'dispatcher/Dispatcher',
        'people-models/Pal',
        'people-store/PeopleStore'],

function(ko,
         template,
         Dispatcher,
         Pal,
         Store){

  function ViewModel(){

    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.pals = ko.observableArray([]);
    this.selectedPal = ko.observable(null);
    this.palCount = ko.observable(0)
    this.isSpinnerVisible = ko.observable(false)


    this.onStoreUpdate = (function(){
      this.isSpinnerVisible(this.store.isSpinnerVisible())
      this.palCount(this.store.getPalCount())
      this.pals(this.store.getPalList().toArray());
      this.selectedPal(this.store.getFocusedPerson())
    }).bind(this)
    this.store.sub(this.onStoreUpdate);

    this.palClicked = (function(pal){
      this.selectedPal(pal);
      this.dis.dispatch('focusPerson',pal);
    }).bind(this)

  } // end view model.

  return {
    viewModel: ViewModel,
    template : template
  }


});
