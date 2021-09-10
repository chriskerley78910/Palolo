define(['RemoteService'],
function(RemoteService){

  var LiveRemoteService = function(){

    Object.setPrototypeOf(this, new RemoteService());

    this._scheme = "https://";
    this._host = "www.";
    this._microServer = ''
    this._domain = "palolo.ca";
    this._port = '';
    this._path = '';

    this.isLive = function(){
      return true
    }

    this.getConstructorName = function(){
      return "LiveRemoteService";
    }

  }

  return LiveRemoteService;
})
