/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define(['auth/states/AuthState'],

function(AuthState){

  function PasswordResetState(context,remoteService){

    Object.setPrototypeOf(this,new AuthState(context));
    this.validateRemoteService(remoteService);
    this.remoteService = remoteService;
    this.constructor = PasswordResetState;

    this.getConstructorName = function(){
      return "PasswordResetState";
    }
    /**
     * To be performed when the response from the server is recieved.
     * on 200 OK responses only.
     */
    this.onResetPasswordCallback = function(jsonResponse){
      var response = JSON.parse(jsonResponse);
      console.log(response);
      if(response == 'success'){
        this.spinner = false;
        this.context.gotoSentResetEmailState();
      }
    }
    this.onResetPasswordCallback = this.onResetPasswordCallback.bind(this);

    /**
     * Handles what happens if the response status isn't 200.
     */
    this.onResetPasswordError = function(xhr,b,c,testMode){
        this.spinner = false;
        console.log(xhr.responseText);
        this.localErrorMessage.wrongEmail = xhr.responseText;
        this.context.triggerUpdate();
    }
    this.onResetPasswordError = this.onResetPasswordError.bind(this);


    /**
     * Asks the server to send a password reset email to the owner
     * of the given email address.
     */
    this.submitResetEmail = function(){
      var obj = {
        action:'resetPassword',
        email:this.email
      }
      // console.log("attempting to reset password for:" + obj.email);
      $.ajax({
            type:'POST',
            url:this.remoteService.getServerURL(),
            withCredentials: true,
            data:obj,
            success:this.onResetPasswordCallback,
            error:this.onResetPasswordError
          })
        this.spinner = true;
        this.context.triggerUpdate();
    }



}; // end PasswordResetState constructor.

  return PasswordResetState;
}); // end define.
