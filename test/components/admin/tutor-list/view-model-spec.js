
define(['ko','admin/tutor-list/Component'], function(ko,Component){

    describe("Test Tutor List ViewModel", function(){

      let sut = null;
      let defaultVisibility = false;

      beforeEach(()=>{
        let visibility = ko.observable(defaultVisibility);
        let componentParams = {
          isVisible:visibility
        }
        sut = new Component.viewModel(componentParams);
      })



      it('componentParams.isVisible(true) => query tutors',() =>{
        spyOn(sut._remoteService, 'getTutors');
        sut.componentParams.isVisible(true);
        expect(sut._remoteService.getTutors).toHaveBeenCalled();
      })

      it('onVisiblePanelChange(othePanelName) => NOT query tutors',() =>{
        spyOn(sut._remoteService,'getTutors');
        sut.componentParams.isVisible(false);
        expect(sut._remoteService.getTutors).not.toHaveBeenCalled();
      })

      it('onTutorsRecieved() => tutors updated', ()=>{
        var jsonTutors = JSON.stringify([1,2]);
        spyOn(sut,'openTutorInfo');
        sut.onTutorsRecieved(jsonTutors);
        expect(sut.tutors().length).toBe(2);
        expect(sut.openTutorInfo).toHaveBeenCalled();
      })

      it('selectTutor({id:7}) => currentTutorId() == 7', ()=>{
        sut.currentTutorId(-1);
        sut.selectTutor({id:7});
        expect(sut.currentTutorId()).toBe(7);
      })

      it('onTutorsRecieved() => currentTutorId() == theFirstTutorId', ()=>{
        let list = [
          {
            id:8,
            name:'Bob'
          }
        ];
        sut.onTutorsRecieved(JSON.stringify(list));
        expect(sut.currentTutorId()).toBe(8);
      })

      it('openTutorDelegator() => currentChildComponent == course-delegator', ()=>{
        sut.currentChildComponent("some other thing");
        sut.openCourseDelegator();
        expect(sut.currentChildComponent()).toBe("course-delegator");
      })

      it('onenTutorCreator() => currentChildComponent == tutor-creator', ()=>{
        sut.currentChildComponent('some other thing');
        sut.openTutorCreator();
        expect(sut.currentChildComponent()).toBe("tutor-creator");
      })

      it('openTutorInfo() => currentChildComponent == tutor-info', ()=>{
        sut.currentChildComponent('some other thing');
        sut.openTutorInfo();
        expect(sut.currentChildComponent()).toBe("tutor-info");
      })

     }); // end describe

}); // end define.
