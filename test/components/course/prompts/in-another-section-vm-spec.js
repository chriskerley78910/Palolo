// 'course/Component'
define(['ko',
        'jquery',
        'in-another-section/Component',
        'course/CourseStore',
        'course/models/CourseGroup'],
function(ko,
          $,
          Component,
          CourseStore,
          CourseGroup){

    describe("in-another-section", function(){

      let sut = null;
      let curGrp

      beforeEach(()=>{
        let params = {
          store: CourseStore
        }
        sut = new Component.viewModel(params);
        curGrp = CourseGroup.getFake();
        sut.store.setCurrentCourseGroup(curGrp);
      })


      it('isVisible() == true if grp.isMember() == false and inAnotherSection() == true', ()=>{
        curGrp.setInAnotherSection(true);
        curGrp.setMembershipStatus(false);
        sut.onStoreChange()
        expect(sut.isVisible()).toBeTruthy();
      })


      it('isVisible() == false if grp.isMember() == false and inAnotherSection() == false', ()=>{
        curGrp.setInAnotherSection(false);
        curGrp.setMembershipStatus(false);
        sut.onStoreChange()
        expect(sut.isVisible()).toBeFalsy();
      })


      it('isVisible() => courseText() == EECSFAKE101 A', ()=>{
        curGrp.setInAnotherSection(true);
        curGrp.setMembershipStatus(false);
        sut.onStoreChange();

        expect(sut.courseCode()).toBe('FAKE101');
        expect(sut.sectionLetter()).toBe('A');
        expect(sut.dept()).toBe('EECS');
      })

      it('switchToCourse() dispatches (switchCourse, courseGroup)', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.switchCourse();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('switchToCourseGroup', jasmine.any(CourseGroup));
      })




    }); // end describe

}); // end define.
