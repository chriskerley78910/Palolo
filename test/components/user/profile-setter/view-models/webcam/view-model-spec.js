
define(['profile-setter/view-models/webcam/Component'], function(Component){

    describe("Test webcam Component", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      it('onStoreChange() and isWebCaptureVisible() => attachVideoToVideoElement()', ()=>{
        sut.store.getCurrentState().isWebcamVisible = ()=>{return true;}
        spyOn(sut,'attachVideoToVideoElement');
        sut.onStoreChange();
        expect(sut.attachVideoToVideoElement).toHaveBeenCalled();
      })


      it('drawToCanvas() => dispatch webcamCaptured', ()=>{
        spyOn(sut.dis,'dispatch');
        spyOn(sut,'getContext').and.returnValue({drawImage:jasmine.createSpy()})
        const data = 5;
        spyOn(sut,'getCanvas').and.returnValue({widht:1, height:1, toDataURL:()=> data});
        spyOn(sut,'stopCapture');
        sut.drawToCanvas();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('webcamCaptured', data);
      })

      it('attachVideoToVideoElement dispatches cameraPermissionError', () => {
        spyOn(sut.dis,'dispatch');
        const error = {
          message:'Permission error.'
        }
        sut.onCameraError(error);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('cameraPermissionError');
      })

    }); // end describe

}); // end define.
