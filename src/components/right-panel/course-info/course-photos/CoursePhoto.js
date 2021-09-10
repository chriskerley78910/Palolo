define([],
function(){

  var CoursePhoto = function(group, image){

    this.setGroup = function(group){
      if(Number.isInteger(group) == false){
        throw new Error('group cant be empty.');
      }
      this.groupId = group;
    }
    this.setGroup(group);


    this.getGroupId = function(){
      return this.groupId;
    }

    this.setImage = function(image){
      if(!image){
        throw new Error("image cant be empty.");
      }
      this.image = image;
    }
    this.setImage(image);


    this.getImage = function(){
      return this.image;
    }




  }

  return CoursePhoto;
});
