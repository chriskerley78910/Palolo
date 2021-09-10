
define(['user/profile-setter/states/NewPhotoUploaded'],
function(NewPhotoUploaded){

    describe("NewPhotoUploaded Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new NewPhotoUploaded();
      })

      it('isSavable() == true', ()=>{
        expect(sut.isNewPhotoLoaded()).toBeTruthy();
      })

      it('isPhotoCropperVisible() == true', ()=>{
        expect(sut.isPhotoCropperVisible()).toBeTruthy();
      })

    }); // end describe

}); // end define.
