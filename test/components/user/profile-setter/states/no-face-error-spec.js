


define(['user/profile-setter/states/NoFaceError'],
function(NoFaceError){

    describe("NoFaceError Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new NoFaceError();
      })

      it('isVisible() == true',()=>{
        expect(sut.isVisible()).toBeTruthy();
      })

      it('noFaceErr => isFaceErrorVisible() == true ', ()=>{
        expect(sut.isFaceErrorVisible()).toBeTruthy();
      })

    }); // end describe

}); // end define.
