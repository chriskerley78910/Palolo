/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'dispatcher/Dispatcher',
        'text!profile-setter/view-models/webcam/template.html',
         'user/profile-setter/ProfileStore'],
function(ko,
         Dispatcher,
         template,
         ProfileStore){

  function WebcamCaptureViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    const player = document.getElementById('profile-photo-player');
    const canvas = document.getElementById('profile-photo-canvas');


    const constraints = {
      video: true,
    };

    this.getContext = function(){
      return canvas.getContext('2d');
    }

    this.getCanvas = function(){
      return canvas;
    }


    this.onStoreChange = function(){
      var state = this.store.getCurrentState()

      var isVisible = state.isWebcamVisible();
      if(isVisible){
        this.isVisible(true);
        this.attachVideoToVideoElement();
      }
      else{
        this.isVisible(false);
        this.stopCapture();
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);



    this.drawToCanvas = function(){
      var canvas = this.getCanvas();
      this.getContext().drawImage(player, 0, 0, canvas.width, canvas.height);
      var img = canvas.toDataURL('image/jpeg', 1.0);
      this.dis.dispatch('webcamCaptured', img);
      this.stopCapture();
    }
    this.drawToCanvas = this.drawToCanvas.bind(this);


    this.stopCapture = function() {
      const stream = player.srcObject;
      if(stream){
        const tracks = stream.getTracks();
        tracks.forEach(function(track) {
          track.stop();
        });
        player.srcObject = null;
      }
    }

    this.attachVideoToVideoElement = function(callback){
      var self = this;
      var nav = this.getNavigatorReference();
      nav.mediaDevices.getUserMedia(constraints)
         .then(this.onCameraStarted)
         .catch(this.onCameraError);
    }

    this.getNavigatorReference = function(){
      return navigator;
    }

    this.onCameraStarted = function(stream){
        player.srcObject = stream;
    }
    this.onCameraStarted = this.onCameraStarted.bind(this);

    this.onCameraError = function(err){
      if(/Permission/.test(err.message)){
        this.dis.dispatch('cameraPermissionError');
      }
    }
    this.onCameraError = this.onCameraError.bind(this);


}; // end WebcamCaptureViewModel constructor.

return {
    viewModel: WebcamCaptureViewModel,
    template :template
};


}); // end define.
