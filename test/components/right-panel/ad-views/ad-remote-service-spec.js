
define(['ad-views/AdRemoteService'],
function(RemoteService){

    describe("ad-remote-service Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new RemoteService();
        sut.setFakeToken();
      })

      it('registeredOnAdRecieved(callback) does just that.', ()=>{
          let fn = ()=>{}
          sut.registerOnAdReceived(fn);
          expect(sut.onAdReceived).toBe(fn);
      })


      it('onAdHovered(ad) => post adHovered()', ()=>{
        let cb = sut.dis.getCallbackById(sut.adHoveredId);
        expect(cb).toBe(sut.onAdHovered);
      })

    }); // end describe
}); // end define.
