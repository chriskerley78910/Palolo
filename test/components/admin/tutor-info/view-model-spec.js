
define(['ko','admin/tutor-info/Component'], function(ko,Component){

    describe("Test Tutor Info ViewModel", function(){

      let sut = null;
      let tutorId = 7;

      beforeEach(()=>{
        let componentParams = createComponentParams();
        sut = new Component.viewModel(componentParams);
      })

      let createComponentParams = () => {
        let anotherTutorId = tutorId + 1;
        let tutors = ko.observableArray([{id:tutorId},{id:anotherTutorId}]);
        let currentTutorId = ko.observable(tutorId);
        let currentPanelName = ko.observable('tutor-info');

        let componentParams = {
          currentTutors:tutors,
          currentTutorId:currentTutorId,
          visiblePanel:currentPanelName
        }
        return componentParams;
      }

      it('photoURL() == noPhotoURL by default', ()=>{
        expect(sut.photoURL()).toBe(sut.noPhotoURL);
      })



      it('visiblePanel("tutor-info") => registerOnTutorInfo() ^ isVisible() == true', ()=>{
        sut.componentParams.visiblePanel('course-delegator');
        sut.componentParams.visiblePanel('tutor-info');
        expect(sut.isVisible()).toBeTruthy();
      })

      it('componentParams.currentTutorId() changes = > getTutorInfo()', ()=>{
        spyOn(sut._remoteService,'getTutorInfo');
        sut.componentParams.currentTutorId('8');
        expect(sut._remoteService.getTutorInfo).toHaveBeenCalledWith(sut.getCurrentTutorId());
      })

      it('onTutorInfoReceived(info) => first, last, email pass populated.', ()=>{
        let json = JSON.stringify({
          first:1,
          last:2,
          email:3,
          large_photo_url:4
        });
        sut.onTutorInfoReceived(json);
        expect(sut.firstName()).toBe(1);
        expect(sut.lastName()).toBe(2);
        expect(sut.email()).toBe(3);
        expect(sut.photoURL()).toBe(4);
      })


      it('onTutorInfoReceived(null photo) => noPhotoURL is used.', ()=>{
        let json = JSON.stringify({
          large_photo_url:null
        });
        sut.onTutorInfoReceived(json);
        expect(sut.noPhotoURL).not.toBeNull();
        expect(sut.photoURL()).toBe(sut.noPhotoURL);
      })

      it('onTutorInfoReceived(NOT null photo) => large_photo_url', ()=>{
        let tmp = './assets/something.jpg';
        let json = JSON.stringify({
          large_photo_url:tmp
        });
        sut.onTutorInfoReceived(json);
        expect(sut.photoURL()).toBe(tmp);
      })


      it('componentParams.currentTutorId() changes = > getTutorInfo()', ()=>{
        spyOn(sut._remoteService,'getTutorInfo');
        sut.componentParams.currentTutorId('8');
        expect(sut._remoteService.getTutorInfo).toHaveBeenCalledWith(sut.getCurrentTutorId());
      })


       let populateInput = ()=>{
         sut.firstName('a');
         sut.lastName('b');
         sut.email('c');
         sut.password('d');
       }

       it('deleteTutor() => _remoteService.deleteTutor(getCurrentTutorId())',()=>{
         spyOn(sut._remoteService,'deleteTutor');
         sut.deleteTutor();
         expect(sut._remoteService.deleteTutor).toHaveBeenCalled();
       })

       it('onTutorDeleted() => componentParams.selectAnotherTutor(true)',()=>{
         spyOn(sut,'selectAnotherTutor');
         let deletedTutorId = 8;
         sut.onTutorDeleted(deletedTutorId);
         expect(sut.selectAnotherTutor).toHaveBeenCalled();
       })


       it('selectAnotherTutor(currentTutorId) does just that.', ()=>{
         var anotherTutorId = sut.componentParams.currentTutors()[1].id;
         expect(sut.getCurrentTutorId()).not.toBe(anotherTutorId);
         sut.selectAnotherTutor(JSON.stringify(sut.getCurrentTutorId()));
         expect(sut.getCurrentTutorId()).toBe(anotherTutorId);
         expect(sut.componentParams.currentTutors().length).toBe(1);
       })

       it('selectAnotherTutor(currentTutorId) does just that.', ()=>{
         let firstTutorId = sut.componentParams.currentTutors()[0].id;
         var anotherTutorId = sut.componentParams.currentTutors()[1].id;
         sut.componentParams.currentTutorId(anotherTutorId);
         sut.selectAnotherTutor(JSON.stringify(sut.getCurrentTutorId()));
         expect(sut.getCurrentTutorId()).toBe(firstTutorId);
         expect(sut.componentParams.currentTutors().length).toBe(1);
       })

       it('selectAnotherTutor(currentTutorId) and only one tutors exists.',()=>{
         let firstTutor = sut.componentParams.currentTutors()[0];
         sut.componentParams.currentTutors([firstTutor]);
         let firstTutorId = sut.componentParams.currentTutors()[0].id;
         sut.componentParams.currentTutorId(firstTutorId);
         sut.selectAnotherTutor(JSON.stringify(sut.getCurrentTutorId()));
         expect(sut.getCurrentTutorId()).toBe(-1);
         expect(sut.componentParams.currentTutors().length).toBe(0);
       })

     }); // end describe

}); // end define.
