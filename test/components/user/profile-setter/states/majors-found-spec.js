
define(['user/profile-setter/states/MajorsFound'],
function(MajorsFound){

    describe("MajorsFound Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new MajorsFound();
      })


      it('isMajorsFound() == true', ()=>{
        expect(sut.majorsFound()).toBeTruthy();
      })

      it('isPhotoCropperVisible() == true', ()=>{
        expect(sut.isPhotoCropperVisible()).toBeTruthy();
      })




    }); // end describe

}); // end define.
