/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define(['auth/states/AuthState'],

function(AuthState){

  function SentResetEmailState(context,remoteService){



    Object.setPrototypeOf(this,new AuthState(context));

    this.validateRemoteService(remoteService);

    this.remoteService = remoteService;

    this.constructor = SentResetEmailState;

    this.getConstructorName = function(){
      return "SentResetEmailState";
    }

    this.isVisible = true;




}; // end SentResetEmailState constructor.


  return SentResetEmailState;


}); // end define.
