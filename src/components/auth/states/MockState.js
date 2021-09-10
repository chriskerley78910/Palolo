/**
 *
 *
 *  Mock AuthState for testing purposes because
 *  I don't want the States "knowing each other"
 *  directory, (neither in the source code nor
 *   in the test code if possible)
 *
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define(['auth/states/AuthState'],

function(AuthState){

  function MockState(context,remoteService){
    Object.setPrototypeOf(this,new AuthState(context));
    this.constructor = MockState;
}; // end MockState constructor.


  return MockState;


}); // end define.
