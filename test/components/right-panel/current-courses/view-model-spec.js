
define(['right-panel/current-courses/Component',
        'course/models/CourseGroup'
      ], function(Component, CourseGroup){

    describe("current-courses Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      let getCourses = function(count){
        let cs = [];
        for(let i = 0; i < count; i++){
          cs.push(CourseGroup.getFake());
        }
        return cs;
      }


      it('onStoreUpdate() ^ no grps => both have no grps.',()=>{

        let courses = [];
        sut.store.getClassmateCourseGroups = ()=>{return courses;}
        sut.onStoreUpdate(courses);
        expect(sut.verboseCourses().length).toBe(0);
        expect(sut.conciseCourses().length).toBe(0);
      })

      it('onStoreUpdate() ^ 3 courses populates both fully',()=>{
        let courses = getCourses(3);
        sut.store.getClassmateCourseGroups = ()=>{return courses;}
        sut.onStoreUpdate(courses);
        expect(sut.verboseCourses().length).toBe(3);
        expect(sut.conciseCourses().length).toBe(3);
      })


      it('onStoreUpdate() ^ 4 courses populates verbose fully, and only 3 for concise',()=>{
        let courses = getCourses(4);
        sut.store.getClassmateCourseGroups = ()=>{return courses;}
        sut.onStoreUpdate(courses);
        expect(sut.verboseCourses().length).toBe(4);
        expect(sut.conciseCourses().length).toBe(3);
      })


      it('onStoreUpdate() and classmateId is even => isVisible() == false', ()=>{
        sut.isVisible(true);
        sut.store.getClassmateCourseGroups = ()=>{return getCourses(4);}
        sut.store.getClassmatesId = ()=>{return 2;}
        sut.onStoreUpdate();
        expect(sut.isVisible()).toBeFalsy();
      })


      it('selectCourse(grp) => dispatch selectedGroupId, grpId', ()=>{
        let grp = getCourses(1)[0];
        spyOn(sut.dis,'dispatch');
        sut.selectCourse(grp);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectedGroupId', grp.getId());
      })


    }); // end describe

}); // end define.
