
define(['ko',
        'postbox',
        'text!admin/template.html'],

function(ko,
         postbox,
         template){


  function ViewModel(params,componentInfo){

    this.adminVisible = ko.observable(false).syncWith('isAdminVisible');

    this.closeAdmin = function(){
      this.adminVisible(false);
    }
    this.closeAdmin = this.closeAdmin.bind(this);

  };

  return {
    viewModel: ViewModel,
    template: template
  }

});
