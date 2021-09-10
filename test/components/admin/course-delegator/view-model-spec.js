
define(['ko','admin/course-delegator/Component'], function(ko,Component){

    describe("Test Course Delegator ViewModel", function(){

      let sut = null;
      let tutorId = 7;
      let courseId = 23;
      let currentPanelName = 'course-delegator';

      beforeEach(()=>{
        let visiblePanel = ko.observable(currentPanelName);
        let currentTutorId = ko.observable(-1);
        let componentParams = {
          visiblePanel:visiblePanel,
          currentTutorId:currentTutorId
        }
        sut = new Component.viewModel(componentParams);
      })

      it('visiblePanel("unrecognizedname") => isVisible() == false', ()=>{
        sut.isVisible(true);
        sut.componentParams.visiblePanel('unrecognizedname');
        expect(sut.isVisible()).toBeFalsy();
      })

      it('visiblePanel("course-delegator") => isVisible() == true', ()=>{
        sut.componentParams.visiblePanel('unrecognizedname');
        sut.componentParams.visiblePanel(currentPanelName);
        expect(sut.isVisible()).toBeTruthy();
      })


      it('componentParams.currentTutorId({id:7}) => _remoteService.getCoursesFor(id)',()=>{
        spyOn(sut._remoteService,'getCoursesFor');
        sut.componentParams.currentTutorId(7);
        expect(sut._remoteService.getCoursesFor).toHaveBeenCalledWith(7);
      })


      it('removeCourse({id}) => _remoteService.removeCourse(id)', ()=>{
        spyOn(sut._remoteService,'removeCourse');
        sut.componentParams.currentTutorId(tutorId);
        sut.removeCourse({id:courseId})
        expect(sut._remoteService.removeCourse).toHaveBeenCalledWith(tutorId, courseId);
      })


      it('onCourseRemoved(jsonCourseId)',()=>{
        sut.tutorOptedCourses.push({id:1});
        sut.onCourseRemoved(JSON.stringify(1));
        expect(sut.tutorOptedCourses().length).toBe(0);
        expect(sut.tutorableCourses().length).toBe(1);
      })

      it('addCourse({id}) => _remoteService.addCourse(currentTutorId,id)',()=>{

        sut.componentParams.currentTutorId(tutorId);
        spyOn(sut._remoteService,'addCourse');
        sut.addCourse({id:courseId});
        expect(sut._remoteService.addCourse).toHaveBeenCalledWith(tutorId,courseId);
      })

      it('onCourseAdded(jsonCourseId)',()=>{
        sut.tutorableCourses.push({id:1});
        sut.onCourseAdded(JSON.stringify(1));
        expect(sut.tutorOptedCourses().length).toBe(1);
        expect(sut.tutorableCourses().length).toBe(0);
      })

      it('onVisiblePanelChange(currentPanelName) => query tutors',() =>{
        spyOn(sut._remoteService,'registerOnCoursesReceived');
        spyOn(sut._remoteService,'registerOnGetCoursesError');
        spyOn(sut._remoteService,'registerOnCourseRemoved');
        spyOn(sut._remoteService,'registerOnCourseAdded');
        spyOn(sut._remoteService,'getCoursesFor');
        sut.onVisiblePanelChange(currentPanelName);
        expect(sut._remoteService.registerOnCoursesReceived).toHaveBeenCalled();
        expect(sut._remoteService.registerOnGetCoursesError).toHaveBeenCalled();
        expect(sut._remoteService.registerOnCourseRemoved).toHaveBeenCalled();
        expect(sut._remoteService.registerOnCourseAdded).toHaveBeenCalled();
        expect(sut._remoteService.getCoursesFor).toHaveBeenCalled();
      })





      it('onCoursesReceived({l1,l2}) => tutorableCourses ^ tutorOptedCourses set.', ()=>{

        sut.onCoursesReceived(JSON.stringify({
          tutorable:[2],
          opted:[3]
        }));
        expect(sut.tutorableCourses().length).toBe(1);
        expect(sut.tutorOptedCourses().length).toBe(1);
      })


     }); // end describe

}); // end define.
