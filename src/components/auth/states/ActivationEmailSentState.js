/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define(['auth/states/AuthState'],

function(AuthState){

  function ActivationEmailSentState(context,remoteService){



    Object.setPrototypeOf(this,new AuthState(context));
    this.validateRemoteService(remoteService);
    this.remoteService = remoteService;
    this.constructor = ActivationEmailSentState;

    this.getConstructorName = function(){
      return "ActivationEmailSentState";
    }
    this.isVisible = true;
    // override.
    this.activationEmailSent = true;



}; // end ActivationEmailSentState constructor.


  return ActivationEmailSentState;


}); // end define.
