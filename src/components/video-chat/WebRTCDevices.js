define(['DetectRTC'],
function(DetectRTC){

  var instance;

  var WebRTCDevices = function(){
    this._detect = DetectRTC;
    this.callbacks = [];

    this.reg = function(name, callback){
      if(!name || typeof name != 'string'){
        throw new Error('name must be a string.');
      }
      if(!callback || typeof callback != 'function'){
        throw new Error('callback must be a function.');
      }
      this.callbacks.push({
        name:name,
        callback:callback
      });
    }

    this.getCallbackFor = function(name){
      var cbs = this.callbacks;
      for(var i = 0; i < length; i++){
        if(name == cbs[i].name){
          return cbs[i].callback;
        }
      }
    }


    // callback is for dependants of this module.
    // once a callback is executed, dependants can
    // start accessing features of this module.
    this.onLoaded = (function(){
      for(var i = 0; i < this.callbacks.length; i++){
        var cb = this.callbacks[i];
        var capabilities = this.getCapabilties();
        cb.callback(capabilities);
      }
    }).bind(this)
    this._detect.load(this.onLoaded);

    this.getCapabilties = function(){
      if(!this._detect.isWebRTCSupported){
        return {
          hasWebcam:false, hasMicrophone:false
        }
      } else{
        return {
          hasWebcam:this.isWebcamAvailable(),
          hasMicrophone:this.isMicrophoneAvailable()
        }
      }
    }

    this.isWebcamAvailable = function(){
      var hasPermission = this._detect.isWebsiteHasWebcamPermissions
      var exists = this._detect.hasWebcam
      return hasPermission && exists
    }

    this.isMicrophoneAvailable = function(){
      var hasPermission = this._detect.isWebsiteHasMicrophonePermissions
      var exists = this._detect.hasMicrophone
      return hasPermission && exists
    }

  }

  return {
    getInstance:function(){
      if(!instance){
        instance = new WebRTCDevices();
      }
      return instance;
    },
    getNew:function(){
      return new WebRTCDevices();
    }
  }

});
