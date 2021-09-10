
define(['right-panel/course-info/Component'],
function(Component){

    describe("course-info Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      it('isVisible() is false initially.',()=>{
        expect(sut.isVisible()).toBeFalsy();
      })

      it('store.isGroupViewVisible() == false => isVisible() == false', () => {
        sut.store.isGroupViewVisible = ()=>{return true;}
        sut.onStoreChanged();
        expect(sut.isVisible()).toBeTruthy();

        sut.store.isGroupViewVisible = ()=>{return false;}
        sut.onStoreChanged();
        expect(sut.isVisible()).toBeFalsy();
      })



    }); // end describe
}); // end define.
