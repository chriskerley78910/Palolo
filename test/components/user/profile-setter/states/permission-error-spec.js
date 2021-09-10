define(['user/profile-setter/states/PermissionError'],
function(PermissionError){

    describe("PermissionError Spec", function(){
      let sut;
      beforeEach(()=>{
        sut = new PermissionError();
      })

      it('isVisible() == true',()=>{
        expect(sut.isVisible()).toBeTruthy();
      })

      it('noFaceErr => isFaceErrorVisible() == true ', ()=>{
        expect(sut.isPermissionErrorVisible()).toBeTruthy();
      })

    }); // end describe

}); // end define.
