 define(['ActiveRemoteService'],
function(ActiveRemoteService){

  var AuthRemoteService = function(){

    Object.setPrototypeOf(this, new ActiveRemoteService());

    this.constructor = AuthRemoteService;
    this.constructor.name = "AuthRemoteService";
    this.getConstructorName = function(){
      return "AuthRemoteService";
    }

    this.setMicroServer('auth');
    this.setPath('Auth.php');
    this.setPort('');


      /**
        expects json return which contains
        the userId and token.
      */
      this.checkIfCurrentTokenIsValid = function(){
        var token = this.getAccessToken();
        if(typeof this.onTokenAnalyzed != 'function'){
          throw new Error('Callback has not been set.');
        }
        if(!token || token == 'null'){
          this.onTokenAnalyzed(false);
        }
        var url  = this.getServerURL();
        $.ajax({
            type:'POST',
            url:url,
            withCredentials: true,
            data:{
              action:'verifyToken',
              token:token
            },
            success:this.onTokenAnalyzed,
            error:function(err){
              console.log(err);
            }
          })
      } // end function.


      this.registerOnTokenVerified = function(callback){
        if(typeof callback != 'function'){
          throw new Error('callback must be function.');
        }
        this.onTokenAnalyzed = callback;
      }



  }


  return AuthRemoteService;
})
