
define(['right-panel/course-info/text-info/Component',
        'course/models/CourseGroup'],
function(Component,
         CourseGroup){

    describe("text-info Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })


      it('onStoreChange() => isLeaveButtonVisible == isGroupMember', ()=>{
        sut.store.isGroupMember = ()=>{return true}
        sut.onStoreChange();
        expect(sut.isLeaveButtonVisible()).toBeTruthy();

        sut.store.isGroupMember = ()=>{return false}
        sut.onStoreChange();
        expect(sut.isLeaveButtonVisible()).toBeFalsy();
      })

      it('leaveGroup() => dispatch(leaveSelectedCourse)',()=>{
        spyOn(sut.dis,'dispatch');
        sut.leaveGroup();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('leaveSelectedCourse');
      })



    }); // end describe
}); // end define.
