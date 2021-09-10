
define(['file-dropper/FileSharerRemoteService'], function(FileSharerRemoteService){

    describe("file-dropper-remote-service Tests ", function(){

      let sut = null;

      beforeEach(() => {
        sut = new FileSharerRemoteService();
          sut.setFakeToken();
      })

      it('getServerURL() returns http://files.localhost',()=>{
        expect(sut.getServerURL()).toBe('http://files.localhost');
      })


      it('setAuthorizationHeader(xhr) is a function.',()=>{
        expect(typeof sut.setAuthorizationHeader).toBe('function');
      })


      it('registerFileUploadCallback() does just that.', ()=>{
          sut.initSocket();
          let spy = jasmine.createSpy('spy');
          sut.registerFileUploadCallback(spy);
          expect(sut.getFileUploadCallback() == spy).toBeTruthy();
      })


      it('registerUploadProgressCallback() does just that.', ()=>{
          sut.initSocket();
          let spy = jasmine.createSpy('spy');
          sut.registerUploadProgressCallback(spy);
          expect(sut._callbacks.uploadProgressCallback == spy).toBeTruthy();
      })


    }); // end describe

}); // end define.
