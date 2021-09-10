/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'croppie',
        'dispatcher/Dispatcher',
        'text!profile-setter/template.html',
        'jquery',
         'user/profile-setter/ProfileStore'],
function(ko,
         Croppie,
         Dispatcher,
         template,
         $,
         ProfileStore){

  function ProfileSetterViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.isFaceErrorVisible = ko.observable(false);
    this.isPhotoCropperVisible = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.photoURL = ko.observable('');
    this.isMissingPhoto = ko.observable(false);
    this.isLargeCameraButtonVisible = ko.observable(false);
    this._successHideFeedbackDelay = 2000;
    this._imageData = null;


    this.getCroppieHolder = function(){
      var node =  $('#img-uploader-preview-img')[0];
      if(!node){
        throw new Error('Expected element with id = img-uploader-preview-img to exist in template.');
      }
      return node;
    }
    this.getCroppieHolder = this.getCroppieHolder.bind(this);

    this.injectStore = function(store){
      this.store = store;
    }

    this.makeBox = function(data, event){
      this.replaceElementWithInputBox(event);
    }


    this.webcamCapture = function(){
      this.dis.dispatch('hidePhotoCropper');
    }


    this.closeErrorMessage = function(vm, event){
      this.dis.dispatch('closeNoFaceError');
    }




    this.onStoreChanged = function(){
      var state = this.store.getCurrentState();
      let userInfo = this.store.getUserInfo();
      this.isPhotoCropperVisible(state.isPhotoCropperVisible());
      this.isVisible(state.isVisible());
      this.isFaceErrorVisible(state.isFaceErrorVisible());
      this.isSpinnerVisible(state.isSavingPhoto());

      if(state.isNewPhotoLoaded()){
        this.isPhotoCropperVisible(true);
        this.photoURL(this.store.getNewPhoto());
        this.refreshCroppie();
      }
      else if(state.isSavingPhoto()){
        this.saveCroppedPhoto();
        this.isSpinnerVisible(true);
      }
      else if(userInfo && userInfo.large_photo_url){
          userInfo.large_photo_url += '?' + (new Date()).getTime();
          this.photoURL(userInfo.large_photo_url);
          this.refreshCroppie();
          this.isLargeCameraButtonVisible(false);
      }
      else{
        this.isMissingPhoto(true);
      }
    }
    this.onStoreChanged = this.onStoreChanged.bind(this);
    this.store.sub(this.onStoreChanged);



    /**
        This should ONLY be called when the profle setter is actually
        visible.  Otherwise the scaling will be all messed up.
    */
    this.refreshCroppie = function(){
      var url = this.photoURL();
      if(this.croppie){
        this.croppie.destroy();
      }
      try{
        if(url && typeof url == 'string'){
          var options = {
                viewport: {
                    width: 450,
                    height: 450
                },
                boundary: {
                  width: '100%',
                  height: '100%'
                },
                showZoomer:false
            }
          var profilePhotoDomNode = this.getCroppieHolder();
          this.croppie = new Croppie(profilePhotoDomNode, options);
          this.bindNewPhoto(url);
        }
      }
      catch(err){
        // source image is probably missing.
        console.log(err);
      }

    }

    this.bindNewPhoto = function(url){
      var topLeftX = 0;
      var topLeftY = 0;
      var bottomRightX = 0;
      var bottomRightY = 0;
      var options = {
        url:url,
        points: [topLeftX, topLeftY, bottomRightX, bottomRightY]
      }

      var promise = this.croppie.bind(options);
      promise.then(this.setPhotoZoomToZero);
    }

    this.setPhotoZoomToZero = function(){
      this.croppie.setZoom(0);
    }
    this.setPhotoZoomToZero = this.setPhotoZoomToZero.bind(this);


    this.saveCroppedPhoto = function(){
      if(this.photoURL()){
        var self = this;
        if(this.croppie){
          this.croppie.result({type:'base64',size:'viewport'})
              .then(function(croppedImg){
                  self.dis.dispatch('saveCroppedPhoto',croppedImg);
              })
              .catch(function(err){
                console.log(err);
              });
        }
        else{
          throw new Error('Croppie has not been initialized.');
        }
      }
      else{
        throw new Error('photoUrl observable has not been set!');
      }
    }
    this.saveCroppedPhoto = this.saveCroppedPhoto.bind(this);

    this.hideProfileSetter = function(){
      this.dis.dispatch('hideProfileSetter');
    }
    this.hideProfileSetter = this.hideProfileSetter.bind(this);




}; // end ProfileSetterViewModel constructor.

return {
    viewModel: ProfileSetterViewModel,
    template :template
};


}); // end define.
