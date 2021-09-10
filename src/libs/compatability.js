define([], function(){

  var Compatability = function(){}

  Compatability.isVideoCallingSupported = function(onTrue, onFalse) {
    var twilio = require('twilio-video')
    if(twilio.isSupported) onTrue()
    else onFalse()
  }

return Compatability;
});
