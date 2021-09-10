/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'dispatcher/Dispatcher',
        'text!environment/template.html'],
function(ko,
         Dispatcher,
         template){

  function InternetHeartBeatViewModel(params, componentInfo){

    this.dis = new Dispatcher();
    this.showConnectionLost = ko.observable(false);
    this.showDeviceNotSupportedMessage = ko.observable(false);
    this.MIN_WIDTH = 500;

    this.onAuthUpdate = (function(update){
      if(update.state == 'authenticated'){
        this.isSupportedDevice() ? this.showDeviceNotSupportedMessage(false) : this.showDeviceNotSupportedMessage(false);
      }
    }).bind(this)
    this.authStateId = this.dis.reg('authState', this.onAuthUpdate);

    this.onOffline = function(){
      this.showConnectionLost(true);
    }
    this.onOffline = this.onOffline.bind(this);
    window.addEventListener('offline',this.onOffline);

    this.onOnline = function(){
      this.showConnectionLost(false);
    }
    this.onOnline = this.onOnline.bind(this);
    window.addEventListener('online', this.onOnline);

    this.getWindowWidth = function(){
      return window.innerWidth;
    }

    this.isSupportedDevice = function() {
      var device = navigator.userAgent;
      var width = this.getWindowWidth();
      // console.log('innerWidth:' + width);

     if(device.match(/iPod/i)){
        return false;
      }
      else if(width < this.MIN_WIDTH){
        return false;
      }
     else {
        return true;
      }
    }

};

return {
    viewModel: InternetHeartBeatViewModel,
    template :template
};


}); // end define.
