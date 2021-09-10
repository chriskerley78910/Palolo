
define(['right-panel/course-info/course-photos/Component',
        'course/models/CourseGroup'],
function(Component,
         CourseGroup){

    describe("course-photos Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
        sut.store.setCurrentCourseGroup(CourseGroup.getFake());
      })

      it('isVisible() == false by default', ()=>{
        expect(sut.isVisible()).toBeFalsy();
      })


      it('onStoreChange() => updates the currentImageUrl', ()=>{
        let group = CourseGroup.getFake();
        sut.store.getCourseGroup = ()=>{
          return group;
        }
        sut.onStoreChange();
        expect(sut.currentImageUrl()).toMatch(group.getImgUrl() + ".*");
      })


      it('onPhotoReady() => dispatch saveCoursePhotograph, data', ()=>{
        spyOn(sut.dis,'dispatch');
        let imageData = 'something';
        let info = CourseGroup.getFake();
        sut.onPhotoReady({
          target:{
            result:imageData
          }
        });
        expect(sut.dis.dispatch)
        .toHaveBeenCalledWith('saveCoursePhotograph',jasmine.any(Object));
      })

    }); // end describe
}); // end define.
