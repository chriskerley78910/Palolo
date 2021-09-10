
define(['user/profile-setter/states/SavingProfilePhoto'],
function(SavingProfilePhoto){

    describe("SavingProfilePhoto Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new SavingProfilePhoto();
      })


      it('isSavingPhoto() == true', ()=>{
        expect(sut.isSavingPhoto()).toBeTruthy();
      })



    }); // end describe

}); // end define.
