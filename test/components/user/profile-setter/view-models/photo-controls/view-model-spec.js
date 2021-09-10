
define(['profile-setter/view-models/photo-controls/Component'],
function(Component){

    describe("Test photo-controls Component", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      it('onStoreChange() ^ isPhotoCropperVisible() == false => hide', ()=>{
        sut.store = {
          getCurrentState : ()=>{
          return {
            isPhotoCropperVisible : () => false,
            isNewPhotoLoaded:()=> false
          }
        }
      }
        sut.onStoreChange();
        expect(sut.isVisible()).toBeFalsy();
      })

      it('onStoreChange() ^ showPreviewImg => isSaveButtonVisible() == true', ()=>{
        sut.store.getCurrentState().isNewPhotoLoaded = () =>{return true};
        sut.onStoreChange();
        expect(sut.isSaveButtonVisible()).toBeTruthy();
      })


      it('isSaveButtonVisible() == false by default',()=>{
        expect(sut.isSaveButtonVisible()).toBeFalsy();
      })

      it('uploadPhoto calls readUrl(event.currentTarget)', ()=>{
        spyOn(sut,'readUrl');
        sut.uploadPhoto(null, {
          currentTarget:'data'
        })
        expect(sut.readUrl).toHaveBeenCalledWith('data');
      })


      it('webcamCapture() => showWebcam', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.webcamCapture();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('showWebcam');
      })


      it('onFileLoaded() calls clearFileChooser and dispatches imgData', ()=>{
        spyOn(sut.dis,'dispatch');
        spyOn(sut,'clearFileChooser');
        let img = "hello";
        let event = {
          target:{
            result:img
          }
        }
        sut.onFileLoaded(event);
        expect(sut.clearFileChooser).toHaveBeenCalled();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('newImgUploaded', img);
      })


      it('savePhoto dispatches saveProfilePhoto.', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.saveProfilePhoto();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('saveProfilePhoto');
      })



    }); // end describe

}); // end define.
