
define(['user/profile-setter/states/ProfileNotVisible'],
function(ProfileNotVisible){

    describe("ProfileNotVisible Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new ProfileNotVisible();
      })

      it('isVisible() == false', ()=>{
        expect(sut.isVisible()).toBeFalsy();
      })




    }); // end describe

}); // end define.
