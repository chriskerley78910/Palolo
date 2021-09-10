
define(['user/profile-setter/states/SearchingMajors'],
function(SearchingMajors){

    describe("SearchingMajors Spec", function(){

      let sut;

      beforeEach(()=>{
        sut = new SearchingMajors();
      })


      it('isSearchingMajors() == true', ()=>{
        expect(sut.isSearchingMajors()).toBeTruthy();
      })

      it('isPhotoCropperVisible() == true', ()=>{
        expect(sut.isPhotoCropperVisible()).toBeTruthy();
      })



    }); // end describe

}); // end define.
