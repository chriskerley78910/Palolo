/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['user/profile-setter/states/ProfileState'],
function(ProfileState){

  function ProfileNotVisible(){
    // sets the prototype of this to the abstract class ProfileState.
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isVisible = function(){
      return false;
    }

  }; // end ProfileNotVisible constructor.
return  ProfileNotVisible;

}); // end define.
