/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define(['auth/states/AuthState'],

function(AuthState){

  function LoginState(context,remoteService){



    Object.setPrototypeOf(this,new AuthState(context));
    this.validateRemoteService(remoteService);
    this.remoteService = remoteService;
    this.constructor = LoginState;
    this.getConstructorName = function(){
      return "LoginState";
    }
    this.isVisible = true;

    this.login = function(){
    var obj =   {
          action:'login',
          email:this.email,
          password:this.password
      }
      this.email = ''
      this.password = ''
      this.context.triggerUpdate()
      $.ajax({
            type:'POST',
            url:this.remoteService.getServerURL(),
            withCredentials: true,
            data:obj,
            success:this.onLoginCallback,
            error:this.onLoginError
          })

    }

    this.login = this.login.bind(this);



    this.onLoginCallback = function(response){
      this.spinner = false;
      try{
        this.context.onTokenAnalyzed(response);
        this.context.triggerUpdate();
      }
      catch(err){
        console.log(err);
      }
    }
    this.onLoginCallback = this.onLoginCallback.bind(this);



    this.onLoginError = function(err){
      this.spinner = false;
      this.errorMessage = err.responseText;
      this.context.triggerUpdate();
    }
    this.onLoginError = this.onLoginError.bind(this);

}; // end LoginState constructor.

  return LoginState;
}); // end define.
