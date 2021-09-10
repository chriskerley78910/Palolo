
define(['user/profile-setter/states/SavingMyInfo'],
function(SavingMyInfo){
    describe("SavingMyInfo Spec", function(){
      let sut;
      beforeEach(()=>{
        sut = new SavingMyInfo();
      })

      it('isSavingMyInfo() == true',()=>{
        expect(sut.isSavingMyInfo()).toBeTruthy()
      })

      it('isPhotoCropperVisible() == true',()=>{
        expect(sut.isPhotoCropperVisible()).toBeTruthy();
      })

    }); // end describe

}); // end define.
