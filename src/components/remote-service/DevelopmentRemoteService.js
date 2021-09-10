define(['RemoteService'],
function(RemoteService){

  var DevelopmentRemoteService = function(){

    Object.setPrototypeOf(this, new RemoteService());

    this._scheme = 'http://';
    this._host = '';
    this._microServer = '';
    this._domain = 'localhost';
    this._port = '';
    this._path = '';

    this.isLive = function(){
      return false
    }

    this.getConstructorName = function(){
      return "DevelopmentRemoteService";
    }


  }

  return DevelopmentRemoteService;
})
