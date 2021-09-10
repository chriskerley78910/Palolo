
define([
  'course/course-features/Component'],
function(Component){

    describe("Test CourseHolder", function(){

      let sut = null;

      beforeEach(() => {
        sut = new Component.viewModel();
      })




      it('CourseStore.onStoreChanged() ^ isCourseViewSelected() => sut.isVisible() == true', () => {
        sut.isVisible(false);
        sut.store.isGroupViewVisible = ()=>true
        sut.onStoreChanged();
        expect(sut.isVisible()).toBeTruthy();
      })



    }); // end describe

}); // end define.
