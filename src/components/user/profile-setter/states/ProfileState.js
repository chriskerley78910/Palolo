/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define([],
function(){


  var _isVisible = true;
  var _isPhotoCropperVisible = false;
  var _isWebcamVisible = false;
  var _isSearchingMajors = false;
  var _isSavingPhoto = false;
  var _isNewPhotoLoaded = false;
  var _isFaceErrVisible = false;
  var _isPhotoCropperVisible = false;


  function ProfileState(params, componentInfo){


    this.isVisible = function(){
      return _isVisible;
    }

    this.isPhotoCropperVisible = function(){
      return _isPhotoCropperVisible;
    }

    this.isWebcamVisible = function(){
      return _isWebcamVisible;
    }

    this.isSearchingMajors = function(){
      return _isSearchingMajors;
    }

    this.majorsFound = function(){
      return false
    }

    this.isSavingPhoto = function(){
      return _isSavingPhoto;
    }

    this.isNewPhotoLoaded = function(){
      return _isNewPhotoLoaded;
    }

    this.isFaceErrorVisible = function(){
      return _isFaceErrVisible;
    }

    this.isPermissionErrorVisible = function(){
      return _isPhotoCropperVisible;
    }

    this.isSavingMyInfo = function(){
      return false
    }



}; // end ProfileState constructor.
return  ProfileState;


}); // end define.
