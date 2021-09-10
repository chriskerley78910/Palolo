
define(['course-docs/container/Component'],
(Component) => {
    describe("course-doc-container", ()=>{

      let sut = null;
      beforeEach(()=>{
        sut = new Component.viewModel()
      })

      it(`isVisible() == false`, ()=>{
        expect(sut.isVisible()).toBe(false)
      })

      it('isJoinPromptVisible == true <= not permitted and docs visible.', ()=>{
        spyOn(sut.store,'isCourseDocsPermitted').and.returnValue(false)
        spyOn(sut.store,'isCourseDocsVisible').and.returnValue(true)
        sut.onStore()
        expect(sut.isJoinPromptVisible()).toBeTruthy()
      })

      it('isJoinPromptVisible == false <= permitted and docs visible.', ()=>{
        spyOn(sut.store,'isCourseDocsPermitted').and.returnValue(true)
        spyOn(sut.store,'isCourseDocsVisible').and.returnValue(true)
        sut.onStore()
        expect(sut.isJoinPromptVisible()).toBeFalsy()
            expect(sut.isVisible()).toBeTruthy()
      })

      it('uploadingAllowed() <=> store.isUploadingAllowed',()=>{
        sut.uploadingAllowed(false)
        sut.store.isUploadingAllowed = true
        sut.onStore()
        expect(sut.uploadingAllowed()).toBe(true)
      })


      it('openUploader => dispatch(openDocUploader)',()=>{
        spyOn(sut.dis,'dispatch')
        sut.openUploader()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('openDocUploader')
      })



    }); // end describe

}); // end define.
