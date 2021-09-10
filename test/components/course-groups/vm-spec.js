
define(['course-groups/Component',
        'course/models/CourseGroup'],
function(Component, CourseGroup){

    describe("course-groups Tests", function(){
      let sut = null;


      beforeEach(()=>{
        sut = new Component.viewModel();
      })

      it('onStore,isNewsViewSelected() => newsSelected()', ()=>{
        expect(sut.newsSelected()).toBeFalsy()
        spyOn(sut.store,'isNewsViewVisible').and.returnValue(true)
        sut.onStore()
        expect(sut.newsSelected()).toBeTruthy()
      })

      it('newsSelected is false by default', ()=>{
        expect(sut.newsSelected()).toBe(false)
      })



      it('openNews => dispatch openNews', ()=>{
        spyOn(sut.dis,'dispatch')
        sut.openNews()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('openNews')
      })

      it('!isGroupViewVisible(), onStore() => !selectCourseGroup()',()=>{
        sut.currentCourseGroup(CourseGroup.getFake())
        spyOn(sut.store,'isGroupViewVisible').and.returnValue(false)
        sut.onStore()
        expect(sut.currentCourseGroup()).toBeNull()
      })

      it('onStore => getMyCourseGroups', ()=>{
        const courses = []
        spyOn(sut.store,'getMyCourseGroups').and.returnValue(courses)
        sut.onStore()
        expect(sut.courses()).toBe(courses)
      })

      it('selectCourseGroup => dis selectedGroupId',()=>{
        const g = CourseGroup.getFake()
        const id = g.getId()
        spyOn(sut.dis,'dispatch')
        sut.selectCourseGroup(g)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectedGroupId',id)
      })

      //
      // it('openGroupView  dispatches openGroupView',() => {
      //   spyOn(sut.dis,'dispatch');
      //   sut.openGroupView();
      //   expect(sut.dis.dispatch).toHaveBeenCalledWith('showGroupView');
      //   expect(sut.isGroupViewOpen()).toBeTruthy();
      // })
      //
      //
      //
      // it('onStoreChange() => sets getCurrentGroup',()=>{
      //   sut.onStoreChange();
      //   expect(sut.courseGroup()).toBe(sut.store.getCurrentGroup());
      // })

    }); // end describe
}); // end define.
