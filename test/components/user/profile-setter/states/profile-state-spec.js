
define(['user/profile-setter/states/ProfileState'],
function(ProfileState){

    describe("ProfileState Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new ProfileState();
      })

      it('defaults for the profile states.', ()=>{
        expect(sut.isVisible()).toBeTruthy();
        expect(sut.isSearchingMajors()).toBeFalsy();
        expect(sut.isWebcamVisible()).toBeFalsy();
        expect(sut.isFaceErrorVisible()).toBeFalsy();
        expect(sut.isPhotoCropperVisible()).toBeFalsy();
        expect(sut.isWebcamVisible()).toBeFalsy();
        expect(sut.isSavingPhoto()).toBeFalsy();
        expect(sut.isPermissionErrorVisible()).toBeFalsy();
        expect(sut.isSavingMyInfo()).toBeFalsy()
        expect(sut.majorsFound()).toBeFalsy()
      })

    }); // end describe

}); // end define.
