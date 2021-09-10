
define(['ActiveRemoteService',
        'format-converter',
        'dispatcher/Dispatcher'],
function(ActiveRemoteService,
         FormatConverter,
         Dispatcher){

  var ProfileRemoteService = function(){
      Object.setPrototypeOf(Object.getPrototypeOf(this),new ActiveRemoteService());
      this.setMicroServer("profile");
      this.dis = new Dispatcher();


      this.getProfileInfo = function(){
        var self = this;
        var url = this.getServerURL() + '/getProfileInfo';
        $.ajax({
          url:url,
          type:"GET",
          cache:false,
          contentType:"application/x-www-form-urlencoded; charset=UTF-8",
          beforeSend:this.setAuthorizationHeader,
          success:function(info){
            self.dis.dispatch('profileUpdate',self.setServerUrl(info));
          },
          error:function(jq,status,err){
            console.log(err);
          }
        })
      }
      this.getProfileInfo = this.getProfileInfo.bind(this);


      /**
          handles what happens when the user is authenticated.
      */
      this.onAuthChange = (function(update){
        if(update.state == 'authenticated'){
          this.getProfileInfo();
        }
      }).bind(this)
      this.onAuthId = this.dis.reg('authState', this.onAuthChange);



      this.setServerUrl = function(info){
        var urlPrefix = this.getServerURL();
        if(info.large_photo_url){
           info.large_photo_url = urlPrefix + '/' + info.large_photo_url;
        }
        if(info.small_photo_url){
           info.small_photo_url = urlPrefix + '/' + info.small_photo_url;
        }
        return info;
      }


      /**
       * @param  {[type]} imageData is the image in base64 format.
       * @param {Function} callback is called on successful upload of the imageData.
       */
      this.saveCroppedPhoto = function(img){
        if(!img || typeof img != 'string' || img.length < 1){
          throw new Error('object of img must be passed as an argument.');
        }
        var formData = this.makeForm(img);
        var self = this;
        $.ajax({
          url:this.getServerURL() + '/updatePhoto',
          type:"POST",
          cache:false,
          contentType:false,
          processData:false,
          data:formData,
          beforeSend:this.setAuthorizationHeader,
          success:function(){
            self.getProfileInfo();
          },
          error:function(ajax,status,err){
            console.log("No Face error?");
            console.log(ajax);
            if(ajax.responseText == "NoFace"){
              self.dis.dispatch('updatePhotoNoFaceError');
            }
            else{
              self.onPhotoUploadError(err);
            }
          }
        })
      }
      this.saveCroppedPhoto = this.saveCroppedPhoto.bind(this);
      this.saveCroppedPhotoId = this.dis.reg('saveCroppedPhoto', this.saveCroppedPhoto);



      this.registerOnPhotoUploadError = function(fn){
        this.onPhotoUploadError = fn;
      }


      this.makeForm = function(imageData){
        var formData = new FormData();
        if(imageData){
          var base64Data = imageData;
          var blob = FormatConverter.base64ToBlob(base64Data, 'image/png');
          formData.append('image', blob);
        }
        return formData;
      }


      this.saveMyInfo = function(obj){
        var url = this.getServerURL() + '/saveMyInfo'
        var self = this
        $.ajax({
          url:url,
          beforeSend:this.setAuthorizationHeader,
          type:'POST',
          data:obj,
          success:function(){
            self.getProfileInfo()
          },
          error:function(a, b, err){
            console.log(err);
          }
        })
      }
      this.saveMyInfo = this.saveMyInfo.bind(this)
      this.saveBdId = this.dis.reg('saveMyInfo',this.saveMyInfo)

      this.saveAboutMe = function(text){
        var url = this.getServerURL() + '/saveAboutMe';
        $.ajax({
          url:url,
          beforeSend:this.setAuthorizationHeader,
          type:'POST',
          data:{text:text},
          success:this.getProfileInfo,
          error:function(a, b, err){
            console.log(err);
          }
        })
      }
      this.saveAboutMe = this.saveAboutMe.bind(this);
      this.saveAboutId = this.dis.reg('aboutMe', this.saveAboutMe);


      this.setYearOfStudy = (function(year){
        var url = this.getServerURL() + '/yearOfStudy/' + year;
        var self = this;
        $.ajax({
          url:url,
          beforeSend:this.setAuthorizationHeader,
          type:'POST',
          success:this.getProfileInfo,
          error:function(a, b, err){
            console.log(err);
          }
        })
      }).bind(this)
      this.setYearId = this.dis.reg('selectYear',this.setYearOfStudy);


      this.getMajors = function(input){
        if(!input || typeof input != 'string'){
          throw new Error('input must be a non-empty string.');
        }
        var url = this.getServerURL() + '/majors/' + input;
        var self = this;
        $.ajax({
          url:url,
          type:"GET",
          beforeSend:this.setAuthorizationHeader,
          success:function(json){
            var majors = JSON.parse(json);
            self.dis.dispatch('majors',majors);
          },
          error:function(err){
            console.log(err);
          }
        });
      }
      this.getMajors = this.getMajors.bind(this);
      this.getMajorsId = this.dis.reg('getStudentMajors', this.getMajors);



      this.setMajorTo = function(majorId){
        var url = this.getServerURL() + '/major/' + majorId;
        var self = this;
        $.ajax({
          url:url,
          type:'post',
          beforeSend:this.setAuthorizationHeader,
          success:function(){
            self.getProfileInfo();
          },
          error:function(err){
            console.log(err);
          }
        });
      }
      this.setMajorTo = this.setMajorTo.bind(this);
      this.selectMajorId = this.dis.reg('selectMajor', this.setMajorTo);



      this.recordProfileSetterOpened = function(){
        var url = this.getServerURL() + '/profile_setter_opened';
        $.ajax({
          url:url,
          type:'post',
          beforeSend:this.setAuthorizationHeader,
          success:function(){
              // console.log('success');
          },
          error:function(err){
            console.log(err);
          }
        })
      }


      this._checkType = function(cb){
        if(typeof cb != 'function'){
          throw new Error('callback needs to be a function.');
        }
      }
  }
  return ProfileRemoteService;
})
