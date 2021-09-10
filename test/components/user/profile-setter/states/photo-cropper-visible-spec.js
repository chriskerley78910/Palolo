
define(['user/profile-setter/states/PhotoCropperVisible'],
function(PhotoCropperVisible){

    describe("PhotoCropperVisible Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new PhotoCropperVisible();
      })

      it('isVisible() == true',()=>{
        expect(sut.isVisible()).toBeTruthy();
      })

      it('isPhotoCropperVisible() == true', ()=>{
        expect(sut.isPhotoCropperVisible()).toBeTruthy();
      })

  



    }); // end describe

}); // end define.
