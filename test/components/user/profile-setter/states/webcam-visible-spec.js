
define(['user/profile-setter/states/WebcamVisible'],
function(WebcamVisible){

    describe("WebcamVisible Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new WebcamVisible();
      })


      it('isWebcamVisible() == true', ()=>{
        expect(sut.isWebcamVisible()).toBeTruthy();
      })

    }); // end describe

}); // end define.
