
define(['course/tab-selector/Component'],
function(Component){

    describe("tab-selector", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel()
      })

      it('isVisible() == false by default', ()=>{
        expect(sut.isVisible()).toBeFalsy()
      })

      it('onStore, isGroupViewVisible() => isVisible()',()=>{
        spyOn(sut.store,'isTabSelectorVisible').and.returnValue(true)
        sut.onStore()
        expect(sut.isVisible()).toBeTruthy()
      })




      it('selectClassList() => dispatch("selectClassList")', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.selectClassList();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('courseFeatureSelection','classList');
      })

      it('selectCourseReviews() => dispatch("courseDocsSelected")', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.selectCourseReviews();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('courseFeatureSelection','courseReviews');
      })

      it('selectCourseForum => dispatch 4 updates', ()=>{
        spyOn(sut.dis,'dispatch')
        sut.selectCourseForum()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('courseFeatureSelection','courseForum');
      })

      it('selectClassList => dispatch 4 updates', ()=>{
        spyOn(sut.dis,'dispatch')
        sut.selectClassList()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('courseFeatureSelection','classList');
      })

      it('selectCourseReviews -> dispatch 4 updates', ()=>{
        spyOn(sut.dis,'dispatch')
        sut.selectCourseReviews()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('courseFeatureSelection','courseReviews');
      })

      it('selectNoteShare => dispatch showNoteShare, hide all others', ()=>{
        spyOn(sut.dis,'dispatch')
        sut.selectNoteShare()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('courseFeatureSelection','noteShare');
      })



    }); // end describe

}); // end define.
