this.checkInLocation = function(){
    if (navigator.geolocation) {
      var options = {
        enableHighAccuracy: true, //uses GPS if it is available.
        timeout: 5000,
        maximumAge: 0
      }
      navigator.geolocation.getCurrentPosition(this.onGPSPosition, this.onGPSError, options);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
}
this.checkInLocation = this.checkInLocation.bind(this);

this.onGPSPosition = function(gpsPosition){
  this._dispatcher.dispatch('checkInLocation', gpsPosition);
}
this.onGPSPosition = this.onGPSPosition.bind(this);

this.onGPSError = function(){
  console.log('Error getting position.');
}
