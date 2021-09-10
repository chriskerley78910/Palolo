
define(['ko','admin/tutor-creator/Component'], function(ko,Component){

    describe("Test Tutor Creator ViewModel", function(){

      let sut = null;
      let currentPanelName = 'tutor-creator';

      beforeEach(()=>{
        let visiblePanel = ko.observable(currentPanelName);
        let currentTutorId = ko.observable('7');
        let tutors = ko.observableArray([{id:1, name:'bob'}]);
        let componentParams = {
          visiblePanel:visiblePanel,
          currentTutorId:currentTutorId,
          currentTutors:tutors
        }
        sut = new Component.viewModel(componentParams);
      })

      it('visiblePanel("unrecognizedname") => isVisible() == false', ()=>{
        sut.isVisible(true);
        sut.componentParams.visiblePanel('unrecognizedname');
        expect(sut.isVisible()).toBeFalsy();
      })

      it('visiblePanel("tutor-creator") => isVisible() == true', ()=>{
        sut.componentParams.visiblePanel('unrecognizedname');
        spyOn(sut._imageStore,'registerImageSourceSetter');
        sut.componentParams.visiblePanel(currentPanelName);
        expect(sut.isVisible()).toBeTruthy();
        expect(sut._imageStore.registerImageSourceSetter).toHaveBeenCalled();
      })

      it(`visiblePanel("tutor-creator
       => registerOnTutorAdded
        ^ registerOnAddTutorError`, ()=>{

         spyOn(sut._remoteService, 'registerOnTutorAdded');
         spyOn(sut._remoteService,'registerOnAddTutorError');
         sut.componentParams.visiblePanel('unrecognizedname');
         sut.componentParams.visiblePanel(currentPanelName);
         expect(sut._remoteService.registerOnTutorAdded).toHaveBeenCalled();
         expect(sut._remoteService.registerOnAddTutorError).toHaveBeenCalled();

       })

       let populateInput = ()=>{
         sut.firstName('a');
         sut.lastName('b');
         sut.email('c');
         sut.password('d');
       }

       it('saveTutor() => post has all 4 requirements sent to RemoteService', ()=>{
         spyOn(sut._remoteService,'addTutor');
         spyOn(sut._imageStore,'hasStoredImage').and.returnValue(true);
         spyOn(sut._imageStore,'getImageData');
         populateInput();
         sut.saveTutor();
         expect(sut._remoteService.addTutor).toHaveBeenCalled();
         expect(sut._imageStore.getImageData).toHaveBeenCalled();
       })


       it('saveTutor() throws if any of the inputs are missing', ()=>{
         spyOn(sut._remoteService,'addTutor');
         spyOn(sut,'showErrorMessage');
         sut.saveTutor();
         expect(sut.showErrorMessage).toHaveBeenCalledWith("All fields must be filled in.");
       })


       it('saveTutor() throws if there isnt a photo uploaded.',()=>{
         spyOn(sut,'showErrorMessage');
         populateInput();
         sut.saveTutor();
         expect(sut.showErrorMessage).toHaveBeenCalledWith('You must upload an image for the tutor.');
       })


       it('onTutorAdded() => showSuccessMessage() ^ input cleared', ()=>{

         spyOn(sut,'showSuccessMessage');
         spyOn(sut._imageStore,'clearStoredImage');
         populateInput();
         sut.photoURL('fakeurl');
         let jsonTutor = JSON.stringify({
           id:2,
           name:"Batman and Robin"
         });
         sut.onTutorAdded(jsonTutor);
         expect(sut.showSuccessMessage).toHaveBeenCalled();
         expect(sut.firstName().length).toBe(0);
         expect(sut.lastName().length).toBe(0);
         expect(sut.email().length).toBe(0);
         expect(sut.password().length).toBe(0);
         expect(sut.photoURL()).toBe(sut.noPhotoURL);
         expect(sut.componentParams.currentTutors().length).toBe(2);
         expect(sut._imageStore.clearStoredImage).toHaveBeenCalled();
       })



       it('showSuccessMessage() ^ time++ =>  ', done =>{
        sut.messageLingerTime = 50;
        sut.showSuccessMessage(()=>{
          expect(sut.isSuccessMessageVisible()).toBeFalsy();
          done();
        });
       })


       it('onAddTutorError(xhr) => showErrorMessage(xhr.responseText)', ()=>{
         let msg = "msg";
         spyOn(sut,'showErrorMessage');
         sut.onAddTutorError({
           responseText:msg
         })
         expect(sut.showErrorMessage).toHaveBeenCalledWith(msg);
       })


       it('showErrorMessage(message) => ',done =>{

         let message = "hello";
         sut.messageLingerTime = 20;
         sut.showErrorMessage(message);

         expect(sut.isErrorMessageVisible()).toBeTruthy();
         expect(sut.errorMessage()).toBe(message);
         setTimeout(()=>{
           expect(sut.errorMessage()).toBe('');
           expect(sut.isErrorMessageVisible()).toBeFalsy();
           done();
         },sut.messageLingerTime * 2);
       })



       // it('')

     }); // end describe

}); // end define.
