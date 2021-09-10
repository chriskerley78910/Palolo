
define(['compatability'],
function(Compatability){

    describe("compatability tests", function(){

      let sut = null;
      beforeEach(()=>{
        sut = Compatability;
      })

      it('calls the onTrue callback if it is chrome version 45 or higher.', done =>{
        sut.isVideoCallingSupported(()=>{
          expect(true).toBeTruthy()
          done()
        })
      })

    }); // end describe
}); // end define.
