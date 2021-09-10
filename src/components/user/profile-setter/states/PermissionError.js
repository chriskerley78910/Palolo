/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['user/profile-setter/states/ProfileState'],
function(ProfileState){

  function PermissionError(){

    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isPermissionErrorVisible = function(){
      return true;
    }
}; // end PermissionError constructor.
return  PermissionError;
}); // end define.
