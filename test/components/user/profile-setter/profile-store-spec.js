
define(['user/profile-setter/ProfileStore',
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
function(ProfileStore,
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

    describe("Test ProfileStore", function(){

      let sut = null;
      beforeEach(() => {
        sut = ProfileStore.getNew();
      })


      it('currentState() instanceof ProfileNotVisible',()=>{
        let state = sut.getCurrentState();
        expect(state instanceof ProfileNotVisible).toBeTruthy();
      })

      it('on a recognized event it publishes it.',done => {
        sut.onPub(()=>{
          done();
        })
        sut.onEvent({action:'showProfileSetter'});
      })



      it('showProfileSetter event => ProfileNotVisible to PhotoCropperVisible', ()=>{
        sut.onEvent({action:'showProfileSetter'});
        expect(sut.getCurrentState() instanceof PhotoCropperVisible).toBeTruthy();
      })

      it('setCurrentState(state) does just that.', ()=>{
        sut.setCurrentState(new PhotoCropperVisible());
        expect(sut.getCurrentState() instanceof PhotoCropperVisible).toBeTruthy();
      })

      it('AnyState ^ action == hideProfileSetter => ProfileNotVisible', ()=>{
        sut.setCurrentState(new PhotoCropperVisible());
        sut.onEvent({action:'hideProfileSetter'});
        expect(sut.getCurrentState() instanceof ProfileNotVisible).toBeTruthy();
      })


      it('PhotoCropperVisible ^ action == searchingMajors => SearchingMajors', ()=>{
        sut.setCurrentState(new PhotoCropperVisible());
        sut.onEvent({action:'searchingMajors'});
        expect(sut.getCurrentState() instanceof SearchingMajors).toBeTruthy();
      })

      it('PhotoCropperVisible ^ action == showWebcam => WebcamVisible', ()=>{
        sut.setCurrentState(new PhotoCropperVisible());
        sut.onEvent({action:'showWebcam'});
        expect(sut.getCurrentState() instanceof WebcamVisible).toBeTruthy();
      })

      it('NewPhotoUploaded ^ action == showWebcam => WebcamVisible', ()=>{
        sut.setCurrentState(new NewPhotoUploaded());
        sut.onEvent({action:'showWebcam'});
        expect(sut.getCurrentState() instanceof WebcamVisible).toBeTruthy();
      })


      it('PhotoCropperVisible ^ action == newImgUploaded => NewPhotoUploaded', ()=>{
        sut.setCurrentState(new PhotoCropperVisible());
        const photo = "photo";
        sut.onEvent({action:'newImgUploaded', photo:photo});
        expect(sut.getCurrentState() instanceof NewPhotoUploaded).toBeTruthy();
        expect(sut.getNewPhoto()).toBe(photo);
      })


      it('NewPhotoUploaded ^ action == newImgUploaded => NewPhotoUploaded', ()=>{
        sut.setCurrentState(new NewPhotoUploaded());
        const photo = 'photo2';
        sut.onEvent({action:'newImgUploaded', photo:photo});
        expect(sut.getCurrentState() instanceof NewPhotoUploaded).toBeTruthy();
        expect(sut.getNewPhoto()).toBe(photo);
      })


      it('SearchingMajors ^ action == majors => PhotoCropperVisible, majors set.', ()=>{
        sut.setCurrentState(new SearchingMajors());
        const majors = [1,2,3];
        sut.onEvent({action:'majors', majors:majors});
        expect(sut.getCurrentState() instanceof MajorsFound).toBeTruthy();
        expect(sut.getMajors()).toBe(majors);
      })

      it('WebcamVisible ^ action == webcamCaptured => NewPhotoUploaded', ()=>{
        sut.setCurrentState(new WebcamVisible());
        sut.onEvent({action:'webcamCaptured'});
        expect(sut.getCurrentState() instanceof NewPhotoUploaded).toBeTruthy();
      })


      it('NewPhotoUploaded ^ action == saveProfilePhoto => SavingProfilePhoto', ()=>{
        sut.setCurrentState(new NewPhotoUploaded());
        sut.onEvent({action:'saveProfilePhoto'});
        expect(sut.getCurrentState() instanceof SavingProfilePhoto).toBeTruthy();
      })


      it('SavingProfilePhoto ^ action == noFaceErr => NoFaceError', ()=>{
        sut.setCurrentState(new SavingProfilePhoto());
        sut.onEvent({action:'noFaceErr'});
        expect(sut.getCurrentState() instanceof NoFaceError).toBeTruthy();
      })




      it('SavingProfilePhoto ^ action == croppedPhotoSaved => PhotoCropperVisible', ()=>{
        sut.setCurrentState(new SavingProfilePhoto());
        sut.onEvent({action:'croppedPhotoSaved'});
        expect(sut.getCurrentState() instanceof PhotoCropperVisible).toBeTruthy();
      })

      it(`NoFaceError ^ action == closeNoFaceError => PhotoCropperVisible`, ()=>{
        sut.setCurrentState(new NoFaceError());
        sut.onEvent({action:'closeNoFaceError'});
        expect(sut.getCurrentState() instanceof PhotoCropperVisible).toBeTruthy();
      })


      it(`PhotoCropperVisible ^ action == profileUpdate => no change in state`, ()=>{
        sut.setCurrentState(new PhotoCropperVisible());
        const userInfo = 'data';
        sut.onEvent({action:'profileUpdate', update:userInfo});
        expect(sut.getCurrentState() instanceof PhotoCropperVisible);
        expect(sut.getUserInfo()).toBe(userInfo);
      })

      it(`SavingProfilePhoto ^ action == profileUpdate => PhotoCropperVisible`,()=>{
        sut.setCurrentState(new SavingProfilePhoto());
        const userInfo = 'data';
        sut.onEvent({action:'profileUpdate', update:userInfo});
        expect(sut.getCurrentState() instanceof PhotoCropperVisible);
        expect(sut.getUserInfo()).toBe(userInfo);
      })

      it(`MajorsFound ^ action == profileUpdate => PhotoCropperVisible`,()=>{
        sut.setCurrentState(new MajorsFound());
        const userInfo = 'data';
        sut.onEvent({action:'profileUpdate', update:userInfo});
        expect(sut.getCurrentState() instanceof PhotoCropperVisible);
        expect(sut.getUserInfo()).toBe(userInfo);
      })

      it('getStudentMajors ^ state == MajorsFound => SearchingMajors',()=>{
        sut.setCurrentState(new MajorsFound());
        sut.onEvent({action:'getStudentMajors', update:null});
        expect(sut.getCurrentState() instanceof SearchingMajors);
      })

      it('WebcamVisible ^ action == cameraPermissionError => PermissionError', ()=>{
        sut.setCurrentState(new WebcamVisible());
        sut.onEvent({action:'cameraPermissionError'});
        expect(sut.getCurrentState() instanceof PermissionError).toBeTruthy();
      })

      it('PermissionError ^ action == acknowledgePermissionNeed => PhotoCropperVisible', ()=>{
        sut.setCurrentState(new PermissionError());
        sut.onEvent({action:'acknowledgePermissionNeed'});
        expect(sut.getCurrentState() instanceof PhotoCropperVisible).toBeTruthy();
      })

      it('unrecocogized action => does nothing.', ()=>{
        sut.setCurrentState(new ProfileNotVisible());
        sut.onEvent({action:'blah!'});
        expect(sut.getCurrentState() instanceof ProfileNotVisible).toBeTruthy();
      })

      it('onSaveBirthday => sets showSaveBirthdaySpinner to true',done => {
        sut.setCurrentState(new PhotoCropperVisible())
        expect(sut.getCurrentState().isSavingMyInfo()).toBeFalsy();
        sut.onPub(()=>{
          const after = sut.getCurrentState();
          expect(after.isSavingMyInfo()).toBeTruthy();
          done()
        })
        sut.onEvent({action:'saveMyInfo'})
      })

      it('on birthdaySaved => goes back to PhotoCropperVisible', done => {
        sut.setCurrentState(new SavingMyInfo())
        sut.onPub(()=>{
          const after = sut.getCurrentState()
          expect(after.isSavingMyInfo()).toBeFalsy()
          done()
        })
        sut.onEvent({action:'profileUpdate'})
      })

      it('SavingMyInfo, profileUpdate => PhotoCropperVisible', done => {
        sut.setCurrentState(new SavingMyInfo())
        sut.onPub(()=>{
          const after = sut.getCurrentState()
          expect(after.isSavingMyInfo()).toBeFalsy()
          done()
        })
        sut.onEvent({action:'profileUpdate'})
      })



    }); // end describe

}); // end define.
