
define(['admin/tutor-creator/ImageStore'], function(ImageStore){

    describe("Test ImageStore", function(){

      let sut = null;

      beforeEach(()=>{
        sut = new ImageStore();
      })

      it('registerImageSourceSetter(fn) does just that',() =>{
        let fake = ()=>{};
        sut.registerImageSourceSetter(fake);
        expect(sut.imageSourceSetter).toBe(fake);
      })


      it('readUpload(upload) => reader.onload set ^ readAsDataURL()',()=>{
        let upload = {
          files:[]
        }
        let spy = jasmine.createSpy();
        sut.fileReader = {
          onload:null,
          readAsDataURL:spy
        }
        upload.files[0] = 'fake';
        sut.readUpload(upload);
        expect(spy).toHaveBeenCalled();
        expect(sut.fileReader.onload).not.toBeNull();
      })

      it('onFileLoaded(fileLoadedEvent) => imageSourceSetter(data)',()=>{
        let spy = jasmine.createSpy();
        sut.registerImageSourceSetter(spy);
        sut.onFileLoaded({
          target:{
            result:1
          }
        })
        expect(sut.imageSourceSetter).toHaveBeenCalledWith(1);
      })


      it('imageData == null <=> hasStoredImage() == false', ()=>{
          expect(sut.hasStoredImage()).toBeFalsy();
          sut.imageData = 'fake';
          expect(sut.hasStoredImage()).toBeTruthy();
      })

      it('crearStoredImage() => hasStoredImage() == false', ()=>{

        sut.imageData = 'fake';
        sut.clearStoredImage();
        expect(sut.hasStoredImage()).toBeFalsy();
      })


      it('getImageData() == data', ()=>{
        sut.imageData = 'fake';
        expect(sut.getImageData()).toBe('fake');
      })

    }); // end describe
}); // end define.
