/**
 * @license
 * @Author: Christopher H. Kerley
 * @Last modified time: 2018-10-21
 * @Copyright: Palolo Education Inc. 2019
 */


define([],
function($, ko,   postbox,  template, StateBuilder){

var HttpResonses = {

  verifyToken:{
    success:{
      status:200,
      responseText:JSON.stringify(
        {
          isTokenValid:true
        }
      )
    }
  }
}


return HttpResonses ;


}); // end define.
