
 define(['user/profile-setter/states/ProfileState'],
 function(ProfileState){

  function MajorsFound(params, componentInfo){
    Object.setPrototypeOf(Object.getPrototypeOf(this), new ProfileState());

    this.majorsFound = function(){
      return true
    }

    this.isPhotoCropperVisible = function(){
      return true;
    }

};
return  MajorsFound;


}); // end define.
