
define(['user/ProfileRemoteService'], function(ProfileRemoteService){

    describe("ProfileRemoteService Test", function(){

      let sut = null;

      beforeEach(() => {
        sut = new ProfileRemoteService();
      })

      it('inherits from RemoteService.', () =>{
          expect(sut.getConstructorName()).toBe('DevelopmentRemoteService');
      })


      it('regis saveCroppedPhotoId', ()=>{
        let cb = sut.dis.getCallbackById(sut.saveCroppedPhotoId);
        expect(cb).toBe(sut.saveCroppedPhoto);
      })



      it('getServerURL() == http://images.localhost',()=>{
          expect(sut.getServerURL()).toBe('http://profile.localhost');
      })

      it(`setServerUrl() prefixes the server url when the urls are not null.`, ()=>{

        let info = {
          small_photo_url:'small',
          large_photo_url:'large'
        }
        sut.setServerUrl(info);
        expect(info.small_photo_url).toBe('http://profile.localhost/small')
        expect(info.large_photo_url).toBe('http://profile.localhost/large');
      })


      it('saveCroppedPhoto() throws if accessToken not set', ()=>{
        let error = new Error("object of img must be passed as an argument.");
         expect(()=>{sut.saveCroppedPhoto()}).toThrow(error);
      })

      it('makeForm(changes) == a new form.', ()=>{
          let data = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
          let formData = sut.makeForm(data);
          expect(formData.get('image') instanceof File).toBeTruthy();
      })

      it('registerOnPhotoUploadError(fn) does just that.', ()=>{
        let fake = () =>{}
        sut.registerOnPhotoUploadError(fake);
        expect(sut.onPhotoUploadError).toBe(fake);
      })


      it('onAuthChange is registered on the authState channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.onAuthId);
        expect(cb).toBe(sut.onAuthChange);
      })

      it('onAuthChange(authenticated) => getProfileInfo()',()=>{
        spyOn(sut,'getProfileInfo');
        sut.onAuthChange({state:'authenticated'});
        expect(sut.getProfileInfo).toHaveBeenCalled();
      })


      it('getMajors is registerd in the getMajors channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.getMajorsId);
        expect(cb).toBe(sut.getMajors);
      })


      it('setMajorTo is registered on the selectMajor channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.selectMajorId);
        expect(cb).toBe(sut.setMajorTo);
      })


      it('setYearOfStudy is registered on the selectYear channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.setYearId);
        expect(cb).toBe(sut.setYearOfStudy);
      })

      it('saveAboutMe is registerd on the aboutMe channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.saveAboutId);
        expect(cb).toBe(sut.saveAboutMe);
      })



      it('saveMyInfo does just that', ()=>{
        spyOn($,'ajax')
        sut.saveMyInfo({});
        expect($.ajax).toHaveBeenCalledWith(jasmine.any(Object))
      })

      it('saveMyInfo is reg on the saveMyInfo channel.', ()=>{
        const cb = sut.dis.getCallbackById(sut.saveBdId)
        expect(cb).toBe(sut.saveMyInfo)
      })

    }); // end describe

}); // end define.
