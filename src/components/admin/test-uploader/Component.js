
define(['ko',
        'postbox',
        'text!admin/test-uploader/template.html',
        'admin/test-uploader/TestUploaderRemoteService'],

function(ko,
         postbox,
         template,
         TestUploaderRemoteService){


  function ViewModel(params, componentInfo){

    this.componentParams = params;

  };

  return {
    viewModel: ViewModel,
    template: template
  }

});
