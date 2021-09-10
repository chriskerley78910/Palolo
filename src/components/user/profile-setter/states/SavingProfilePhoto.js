/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
 define(['user/profile-setter/states/ProfileState'],
 function(ProfileState){

  function SavingProfilePhoto(params, componentInfo){
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.isSavingPhoto = function(){
      return true;
    }


};
return  SavingProfilePhoto;


}); // end define.
