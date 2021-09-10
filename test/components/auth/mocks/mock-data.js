/**
 * @license
 * @Author: Christopher H. Kerley
 * @Last modified time: 2018-10-21
 * @Copyright: Palolo Education Inc. 2019
 */


define([],
function(){



var mocks = {



  getMockVM:function(){


    return {

          constructor:{

            name:"AuthViewModel"
          },

          triggerUpdate:function(){

          }
        }

  },

  getMockJSON:function(){
    return JSON.stringify('mockresult');
  },


  getDecodedMockJSON: function(){
    return 'mockresult';
  },


  getSignupMockJSON:function(){
    return JSON.stringify('Activation email sent.');
  }
}


return mocks;


}); // end define.
