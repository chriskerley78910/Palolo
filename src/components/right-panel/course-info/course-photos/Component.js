define([
'ko',
'text!right-panel/course-info/course-photos/template.html',
'dispatcher/Dispatcher',
'course/CourseStore',
'right-panel/course-info/course-photos/CoursePhoto'],
function(
  ko,
  template,
  Dispatcher,
  Store,
  CoursePhoto){

  var ViewModel = function(){

  this.currentImageUrl = ko.observable('./assets/missing-group-photo.jpg');
  this.dis = new Dispatcher();
  this.store = Store.getInstance();
  this.isVisible = ko.observable(false);
  this.profsName = ko.observable('Unknown Professor')
  this.profsPhotoURL = ko.observable('./assets/no-photo.jpg')

  this.onStoreChange = function(){
    var g = this.store.getGroupInfo();
    if(g){
      this.profsName(g.getProfsName())
      this.currentImageUrl(g.getImgUrl()  + '?' + (new Date()).getTime());
      this.profsPhotoURL(g.getProfsPhoto())
    }
  }
  this.onStoreChange = this.onStoreChange.bind(this);
  this.store.sub(this.onStoreChange);


    this.uploadPhoto = function(data, event){
      var files = event.currentTarget.files;
      if (files && files[0]) {
          var file = files[0];
          var reader = new FileReader();
          var self = this;
          reader.onload = function(event){
            self.onPhotoReady(event);
          }
          reader.readAsDataURL(file);
      }
    }
    this.uploadPhoto = this.uploadPhoto.bind(this);



    this.onPhotoReady = function (e) {
        var image = e.target.result;
        var groupId = this.store.getGroupId();
        var coursePhoto = new CoursePhoto(groupId, image);
        this.dis.dispatch('saveCoursePhotograph', coursePhoto);
    }
    this.onPhotoReady = this.onPhotoReady.bind(this);



    /**
        Sets the next location. If the end of locations
        is reach it wraps around to beggining again.
    */
    this.nextPhoto = function(){
      // if(this.courseLocations.length > 0){
      //   if(this.currentLocationIndex < this.courseLocations.length - 1){
      //       this.currentLocationIndex++;
      //   }
      //   else{
      //     this.currentLocationIndex = 0;
      //   }
      //   // var location = this.courseLocations[this.currentLocationIndex];
      //   // this.locationImageURL(location.getLocationImageURL());
      //   // this.locationName(location.getLocationName())
      // }
    }
    this.nextPhoto = this.nextPhoto.bind(this);



    }; // end view model.

      return {
        viewModel:ViewModel,
        template: template
      }
    });
