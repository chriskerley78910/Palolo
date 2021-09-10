
define(['user/ProfileRemoteService',
         'dispatcher/Dispatcher',
         'abstract-interfaces/Store',
         'user/profile-setter/states/ProfileState',
         'user/profile-setter/states/ProfileNotVisible',
         'user/profile-setter/states/PhotoCropperVisible',
         'user/profile-setter/states/SearchingMajors',
         'user/profile-setter/states/WebcamVisible',
         'user/profile-setter/states/NewPhotoUploaded',
         'user/profile-setter/states/SavingProfilePhoto',
         'user/profile-setter/states/NoFaceError',
         'user/profile-setter/states/PermissionError',
         'user/profile-setter/states/SavingMyInfo',
         'user/profile-setter/states/MajorsFound'],
function(ProfileRemoteService,
         Dispatcher,
         AbstractStore,
         ProfileState,
        ProfileNotVisible,
        PhotoCropperVisible,
        SearchingMajors,
        WebcamVisible,
        NewPhotoUploaded,
        SavingProfilePhoto,
        NoFaceError,
        PermissionError,
        SavingMyInfo,
        MajorsFound){

   new ProfileRemoteService();

   var instance = null

  var ProfileStore = function(){

      Object.setPrototypeOf(this, new AbstractStore())
      this.currentState = new ProfileNotVisible();
      this.userInfo = null;
      this.newPhoto = null;
      this.dis = new Dispatcher();
      this.majors = [];

      this.getUserInfo = function(){
        return this.userInfo;
      }

      this.getMajors = function(){
        return this.majors;
      }

      this.getProfilePhotoUrl = function(){
        return this.userInfo.large_photo_url;
      }

      this.getNewPhoto = function(){
        return this.newPhoto;
      }

      this.getCurrentState = function(){
       return this.currentState;
      }

      this.onEvent = function(event){

       switch(event.action){

         case 'showProfileSetter':
            if(this.currentState instanceof ProfileNotVisible){
              this.currentState = new PhotoCropperVisible();
            }
         break;

         case 'hideProfileSetter':
          if(this.currentState instanceof ProfileState){
            this.currentState = new ProfileNotVisible();
          }
          break;

        case 'searchingMajors':
          if(this.currentState instanceof PhotoCropperVisible){
            this.currentState = new SearchingMajors();
          }
        break;

        case 'showWebcam':
          var showIt = this.currentState instanceof PhotoCropperVisible
                     ||this.currentState instanceof NewPhotoUploaded;
          if(showIt){
            this.currentState = new WebcamVisible();
          }
        break;

        case 'newImgUploaded':
          var s = this.currentState;
          if(s instanceof PhotoCropperVisible || s instanceof NewPhotoUploaded){
            this.newPhoto = event.photo;
            this.currentState = new NewPhotoUploaded();
          }
        break;

        case 'majors':
          if(this.currentState instanceof SearchingMajors){
            console.log(event)
            this.majors = event.majors;
            this.currentState = new MajorsFound();
          }
          break;

        case 'webcamCaptured':
          if(this.currentState instanceof WebcamVisible){
            this.newPhoto = event.photo;
            this.currentState = new NewPhotoUploaded();
          }
        break;

        case 'saveProfilePhoto':
          if(this.currentState instanceof NewPhotoUploaded){
            this.currentState = new SavingProfilePhoto();
          }
          break;


          case 'noFaceErr':
            if(this.currentState instanceof SavingProfilePhoto){
              this.currentState = new NoFaceError();
            }
          break;

          case 'croppedPhotoSaved':
            if(this.currentState instanceof SavingProfilePhoto){
              this.currentState = new PhotoCropperVisible();
            }
          break;

          case 'closeNoFaceError':
            if(this.currentState instanceof NoFaceError){
              this.currentState = new PhotoCropperVisible();
            }
          break;

          case 'cameraPermissionError':
            if(this.currentState instanceof WebcamVisible){
              this.currentState = new PermissionError();
            }
          break;

          case 'acknowledgePermissionNeed':
            if(this.currentState instanceof PermissionError){
              this.currentState = new PhotoCropperVisible();
            }
          break;

          case 'profileUpdate':
            this.userInfo = event.update;
            if(this.currentState instanceof SavingProfilePhoto
             || this.currentState instanceof SavingMyInfo
             || this.currentState instanceof MajorsFound){
                this.currentState = new PhotoCropperVisible();
            }
          break;

          case 'saveMyInfo':
            if(this.currentState instanceof PhotoCropperVisible){
              this.currentState = new SavingMyInfo();
            }
          break;

          case 'getStudentMajors':
            if(this.currentState instanceof PhotoCropperVisible
            || this.currentState instanceof MajorsFound){
              this.currentState = new SearchingMajors()
            }
          break;
          default:
            // nothing.
       }
       this.pub();
      }
      this.onEvent = this.onEvent.bind(this)

      // adapter.
      /**
      transition over to the more pure flux pattern.
      */
      this.applyAdapter = function(){
        var self = this
       this.dis.reg('showProfileSetter',function(){
         self.onEvent({action:'showProfileSetter'})
       });

      this.dis.reg('hideProfileSetter', function(){
        self.onEvent({action:'hideProfileSetter'});
      });

      this.dis.reg('showWebcam', function(){
        self.onEvent({action:'showWebcam'});
      })

      this.dis.reg('newImgUploaded', function(photo){
        self.onEvent({action:'newImgUploaded', photo:photo});
      });

      this.dis.reg('webcamCaptured', function(photo){
        self.onEvent({action:'webcamCaptured', photo:photo});
      });

      this.dis.reg('profileUpdate', function(userInfo){
        self.onEvent({action:'profileUpdate', update:userInfo});
      });

      this.dis.reg('saveProfilePhoto', function(){
        self.onEvent({action:'saveProfilePhoto'})
      });

      this.dis.reg('saveCroppedPhoto',function(photo){
        self.onEvent({action:'saveCroppedPhoto', photo:photo});
      })

      this.dis.reg('updatePhotoNoFaceError', function(){
        self.onEvent({action:'noFaceErr'});
      });

      this.dis.reg('closeNoFaceError', function(){
        self.onEvent({action:'closeNoFaceError'});
      });

      this.dis.reg('croppedPhotoSaved', function(){
        self.onEvent({action:'croppedPhotoSaved'});
      });

      this.dis.reg('majors', function(majors){
        self.onEvent({action:'majors', majors:majors});
      });

      this.dis.reg('cameraPermissionError', function(){
        self.onEvent({action:'cameraPermissionError'});
      })

      this.dis.reg('acknowledgePermissionNeed', function(){
        self.onEvent({action:'acknowledgePermissionNeed'});
      })

      this.dis.reg('saveMyInfo', function(){
        self.onEvent({action:'saveMyInfo'})
      })

      this.dis.reg('getStudentMajors', function(){
        self.onEvent({action:'getStudentMajors'})
      })


      }
      this.applyAdapter = this.applyAdapter.bind(this)
      this.applyAdapter();

      this.setCurrentState = function(state){
       if(state instanceof ProfileState){
         this.currentState = state;
       }
       else{
         throw new Error('state must be an instance of ProfileState');
       }
      }

    }

return {
    getInstance:function(){
      if(!instance){
        instance = new ProfileStore()
      }
      return instance
    },
    getNew:function(){
      return new ProfileStore()
    }
}


}); // end define.
