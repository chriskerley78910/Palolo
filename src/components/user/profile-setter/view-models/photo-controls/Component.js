/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'dispatcher/Dispatcher',
        'text!photo-controls/template.html',
        'jquery',
         'user/profile-setter/ProfileStore'],
function(ko,
         Dispatcher,
         template,
         $,
         ProfileStore){

  function PhotoControlsViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.isSaveButtonVisible = ko.observable(false);


    this.onStoreChange = function(){
      var state = this.store.getCurrentState();
      this.isVisible(state.isPhotoCropperVisible());
      this.isSaveButtonVisible(state.isNewPhotoLoaded());
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);

    this.webcamCapture = function(){
      this.dis.dispatch('showWebcam');
    }

    this.uploadPhoto = function(data, event){
      this.readUrl(event.currentTarget);
    }
    this.uploadPhoto = this.uploadPhoto.bind(this);


    this.readUrl = function(input) {

        if (input.files && input.files[0]) {
            var file = input.files[0];
            var reader = new FileReader();
            this.inputElement = input;
            reader.onload = this.onFileLoaded;
            reader.readAsDataURL(file);
        }
    }
    this.readUrl = this.readUrl.bind(this);


    this.onFileLoaded = function(event){
      this.clearFileChooser(this.inputElement);
      var img = event.target.result;
      this.dis.dispatch('newImgUploaded', img);
    }
    this.onFileLoaded = this.onFileLoaded.bind(this);


    this.clearFileChooser = function(inputElement){
      var $el = $(inputElement);
      $el.wrap('<form>').closest('form').get(0).reset();
      $el.unwrap();
    }
    this.clearFileChooser = this.clearFileChooser.bind(this);



    this.saveProfilePhoto = function(){
      this.dis.dispatch('saveProfilePhoto');
    }
    this.saveProfilePhoto = this.saveProfilePhoto.bind(this);


}; // end PhotoControlsViewModel constructor.

return {
    viewModel: PhotoControlsViewModel,
    template :template
};


}); // end define.
