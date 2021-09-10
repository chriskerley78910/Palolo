/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'dispatcher/Dispatcher',
        'text!people-popups/template.html',
        'people-store/PeopleStore'],
function(ko,
         Dispatcher,
         template,
         PeopleStore){

  function ViewModel(params,componentInfo){

    this.dis = new Dispatcher();
    this.store = PeopleStore.getInstance();
    this.isPalRequestSentVisible = ko.observable(false);

    this.onStoreUpdated = function(){
      this.isPalRequestSentVisible(this.store.isPalRequestSent());
    }
    this.onStoreUpdated = this.onStoreUpdated.bind(this);
    this.store.sub(this.onStoreUpdated);

  }; // end viewModel.

  return {
    viewModel: ViewModel,
    template : template
  }

});
