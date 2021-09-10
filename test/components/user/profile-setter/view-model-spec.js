
define(['profile-setter/ViewModel'], function(ViewModel){

    describe("profile-setter", function(){

      let sut = null;
      beforeEach(() => {
        sut = new ViewModel.viewModel();
        var e = document.createElement("div");
        spyOn(sut,'getCroppieHolder').and.returnValue(e);
        state = sut.store.getCurrentState();
      })



      it('hideProfileSetter() => dispatch(closeProfileSetter)',()=>{
        spyOn(sut.dis,'dispatch');
        sut.hideProfileSetter();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('hideProfileSetter');
      })


      it('webcamCapture()=>dispatch hidePhotoCropper', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.webcamCapture();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('hidePhotoCropper');
      })

      it('closeErrorMessage() => dispatch(closeNoFaceError)', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.closeErrorMessage();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('closeNoFaceError');
      })

      it('onStoreChanged() ^ isSavingPhoto() == true => isSpinnerVisible() == true', ()=>{
        spyOn(state,'isNewPhotoLoaded').and.returnValue(false);
        spyOn(state,'isPhotoCropperVisible').and.returnValue(false);
        spyOn(state,'isSavingPhoto').and.returnValue(true);
        spyOn(state,'isVisible').and.returnValue(true);
        spyOn(sut,'saveCroppedPhoto');
        sut.onStoreChanged();

        expect(sut.isSpinnerVisible()).toBeTruthy();
        expect(sut.saveCroppedPhoto).toHaveBeenCalled();
      })

      it('onStoreChanged() ^ isFaceErrorVisible() == true => show the no face error.', ()=>{
        spyOn(state,'isFaceErrorVisible').and.returnValue(true);
        spyOn(state,'isVisible').and.returnValue(true);
        expect(sut.isFaceErrorVisible()).toBeFalsy();
        sut.onStoreChanged();
        expect(sut.isFaceErrorVisible()).toBeTruthy();
      })

      it('onStoreChanged() ^ isVisible() == false => isVisible() == false', ()=>{
        sut.isVisible(true);
        spyOn(state,'isVisible').and.returnValue(false);
        sut.onStoreChanged();
        expect(sut.isVisible()).toBeFalsy();
      })

      it('onStoreChanged() => isVisible() == true => isVisible() == true', ()=>{
        sut.isVisible(false);
        spyOn(state,'isVisible').and.returnValue(true);
        sut.onStoreChanged();
        expect(sut.isVisible()).toBeTruthy();
      })

      it('onStoreChanged() and last resport refresh info.', () =>{

        spyOn(sut.store,'getUserInfo').and.returnValue({large_photo_url:'photo.jpg'});
        spyOn(state,'isSavingPhoto').and.returnValue(false);
        spyOn(state,'isPhotoCropperVisible').and.returnValue(false);
        spyOn(state,'isVisible').and.returnValue(true);
        spyOn(sut,'refreshCroppie');
        sut.isSpinnerVisible(false);

        sut.onStoreChanged();
        expect(sut.store.getUserInfo).toHaveBeenCalled();
        expect(sut.refreshCroppie).toHaveBeenCalled();
        expect(sut.isSpinnerVisible()).toBeFalsy();

      })

      it('onStoreChanged() ^ large_photo_url == null => isMissingPhoto() == true', ()=>{
        spyOn(sut.store,'getUserInfo').and.returnValue({large_photo_url:null});
        spyOn(state,'isNewPhotoLoaded').and.returnValue(false);
        spyOn(state,'isSavingPhoto').and.returnValue(false);
        spyOn(state,'isPhotoCropperVisible').and.returnValue(false);
        spyOn(state,'isVisible').and.returnValue(true);
        spyOn(sut,'refreshCroppie');
        expect(sut.isMissingPhoto()).toBeFalsy();
        sut.onStoreChanged();
        expect(sut.isMissingPhoto()).toBeTruthy();
      })


      it('setPhotoZoomToZero() => croppie.setZoom()', ()=>{
        sut.croppie = getMockCroppie();
        sut.setPhotoZoomToZero();
        expect(sut.croppie.setZoom).toHaveBeenCalled();
      })

      getMockCroppie = ()=>{
        return {
          bind:()=>{
            return new Promise((resolve, reject)=>{
              resolve(true);
            })
          },
          destroy:jasmine.createSpy(),
          setZoom:jasmine.createSpy()
        }
      }





      it('isSavingPhoto() throws if the photoURL() has not been set.',()=>{
        sut.photoURL('');
        try{
          sut.saveCroppedPhoto();
        }
        catch(err){
          expect(err.message).toBe('photoUrl observable has not been set!');
        }
      })

      let makeRawProfileInfo = (id) => {
        let info = {
          id:id,
          large_photo_url:'url',
          major_name:'name',
          year_of_study:'4',
          first:'Chris',
          last:'Kerley'
        }
        return info;
      }

      it('refreshCroppie() ^ photoURL() == null => do nothing.',()=>{
          sut.photoURL(null);
          spyOn(sut,'bindNewPhoto');
          sut.refreshCroppie();
          expect(sut.bindNewPhoto).not.toHaveBeenCalled();
      })



    }); // end describe

}); // end define.
