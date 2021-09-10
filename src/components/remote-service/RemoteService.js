define(['socketio','dispatcher/Dispatcher'],
function(io, Dispatcher){

  var RemoteService = function(){

  this.proto = Object.getPrototypeOf(this);
  this.io = io;
  this.sock = null;
  this.dis = new Dispatcher();

  this._domain = '';

  this.getConstructorName = function(){
    return "RemoteService";
  }

  this.isLive = function(){
    throw new Error('isLive() must be implemented in subclasses.')
  }


    this.getScheme = function(){
      return this._scheme;
    }

    this.setScheme = function(scheme){
      this._scheme = scheme;
    }
    this.getHost = function(){
      return this._host;
    }

    this.setHost = function(host){
      this._host = host + ".";
    }

    this.setMicroServer = function(microServer){
      if(microServer){
          this._microServer = microServer + '.';
      }

    }

    this.getMicroServer = function(){
      return this._microServer;
    }

    this.setDomain = function(domain){
      if(String(domain).length < 1){
        this._domain = '';
      }
      else{
        this._domain = domain;
      }
    }

    this.getDomain = function(){
      return this._domain;
    }


    this.setPath = function(path){
      if(String(path).length < 1){
        this._path = '';
      }
      else{
          this._path = '/' + path;
      }
    }

    this.getPath = function(){
      return this._path;
    }


  this.setPort = function(port){
    if(String(port).length < 1){
      this._port = port;
    }
    else{
      this._port = ":" + port;
    }
  }

  this.getPort = function(){
    return this._port;
  }

  /**
      sets the socket using the accessToken
      and the server url.

      pre: microserver must be set beforehand.
  */
  this.setSock = function(f){
    if(!this.sock){
      var token = this.getAccessToken();
      var url = this.getServerURL();
      var opt = {
        autoConnect:true,
        reconnection:true,
        query: {token: token}
      };
      this.sock = this.io(url,opt);
      if(typeof f == 'function'){
        f();
      }
    }
  }







  this.getServerURL = function(){

    return this.getScheme() +
           this.getHost() +
           this.getMicroServer() +
           this.getDomain() +
           this.getPort() +
           this.getPath();
  }

  /**
   * Sets the authorization header  Or
   * throws an exception if the token is not set.
   * @return {string} The accessToken for this user.
   */
  this.setAuthorizationHeader = function(xhr){
    var token = this.getAccessToken();
    if(!token){
      throw new Error('accessToken must be set.');
    }
    xhr.setRequestHeader('authorization',token);
  }
  this.setAuthorizationHeader = this.setAuthorizationHeader.bind(this);

  this.missingCookiesMessage =  "This site required cookies because it enables enhanced user experience.  Please change your browsers settings to allow cookies for this site.";

  this.getAccessToken = (function(){
    try{
      var token = localStorage.getItem('accessToken');
      if(!token || token.length <= 0){
        throw new Error("accessToken must be a non-empty string.");
      }
      return token;
    }
    catch(err){
      console.log(err);
      // alert(this.missingCookiesMessage);
    }
  }).bind(this)



  this.setAccessToken = function(token){
    try{
      localStorage.setItem('accessToken',token);
    }
    catch(err){
      alert(this.missingCookiesMessage);
    }
  }
  this.setAccessToken = this.setAccessToken.bind(this);

  this.setFakeToken = function(){
    this.setAccessToken('fakeToken');
  }


  this.deleteToken = function(){
    try{
      window.localStorage.removeItem('accessToken');
    }
    catch(err){
      alert(this.missingCookiesMessage);
    }
  }

  this.flatten = function(obj){
    var result = Object.create(obj);
    for(var key in result) {
        result[key] = result[key];
    }
    return result;
  }


  }

  return RemoteService;
})
