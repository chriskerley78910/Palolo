/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'dispatcher/Dispatcher',
         'text!permission-error/template.html',
         'user/profile-setter/ProfileStore'],
function(ko,
         Dispatcher,
         template,
         ProfileStore){

  function PermissionErrorViewModel(params, componentInfo){
    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);

    this.onStoreChange = function(){
      var isVisible = this.store.getCurrentState().isPermissionErrorVisible();
      this.isVisible(isVisible);
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);


    this.onOkay = function(){
      this.dis.dispatch('acknowledgePermissionNeed');
    }

    this.onMaybeLater = function(){
      this.dis.dispatch('hideProfileSetter');
    }

}; // end PermissionErrorViewModel constructor.

return {
    viewModel: PermissionErrorViewModel,
    template :template
};


}); // end define.
