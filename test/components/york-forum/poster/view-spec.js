
define(['york-forum/poster/Component',
        'york-forum/models/ForumPost'],
  function(Component, ForumPost){

    describe("forum-poster tests", function(){

      let sut = null;

      beforeEach(() => {
        sut = new Component.viewModel();
        spyOn(sut,'initEditor')
        spyOn(sut,'refreshPoster')
      })

      it('onBodyChange, length 2 => isValidBodyLength() == false',()=>{
        sut.isValidBodyLength(true)
        spyOn(sut,'getEditorText').and.returnValue('11')
        sut.onBodyChange()
        expect(sut.isValidBodyLength()).toBeFalsy()
        expect(sut.bodyErrorMessage()).toBe('Your message is too short.')
      })

      it('onBodyChange, length  => isValidBodyLength() == false',()=>{
        sut.isValidBodyLength(true)
        spyOn(sut,'getEditorText').and.returnValue('1111')
        spyOn(sut,'getMaxLength').and.returnValue(3)
        sut.onBodyChange()
        expect(sut.isValidBodyLength()).toBeFalsy()
        expect(sut.bodyErrorMessage()).toBe('Your message is too long.')
      })

      it('onBodyChange( valid len )  => isValidBodyLength() == true',()=>{
        sut.isValidBodyLength(true)
        spyOn(sut,'getEditorText').and.returnValue('1111')
        spyOn(sut,'getMaxLength').and.returnValue(10)
        sut.bodyErrorMessage('some message')
        sut.onBodyChange()
        expect(sut.isValidBodyLength()).toBeTruthy()
        expect(sut.bodyErrorMessage()).toBe('')
      })

      it('getPostError() != "" => alert error', ()=>{
        const err = 'err'
        spyOn(sut.store,'getPostError').and.returnValue(err)
        spyOn(sut.store,'isSpinnerOn').and.returnValue(true)
        spyOn(window,'alert')
        spyOn(sut.dis,'dispatch');


        sut.onStore()
        expect(window.alert).toHaveBeenCalledWith(err)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('clearPosterError')
      })

      it('onStore, isPostSuccessful => show success', ()=>{
    
        spyOn(sut.store,'getPostError').and.returnValue('')
        spyOn(sut.store,'isSpinnerOn').and.returnValue(true)
        spyOn(sut.store,'isPostSuccessful').and.returnValue(true)
        sut.onStore()
        expect(sut.isPostSuccessful()).toBeTruthy()

      })

      it('isVisible() == false by default.', () =>{
          expect(sut.isVisible()).toBeFalsy()
      })

      it('isPostSuccessful() == true => updates ko', ()=>{
        expect(sut.isPostSuccessful()).toBeFalsy()
        spyOn(sut.store,'isPostSuccessful').and.returnValue(true)

        sut.onStore()
        expect(sut.isPostSuccessful()).toBeTruthy()
      })

      it('isSpinnerOn() == true => updates ko', ()=>{
        expect(sut.isPostSuccessful()).toBeFalsy()
        spyOn(sut.store,'isPostSuccessful').and.returnValue(true)
        sut.onStore()
        expect(sut.isPostSuccessful()).toBeTruthy()
      })

      it('post() => dispatched postForumMessage, text',()=>{
        const title = 'title'
        const text = 'message'
        spyOn(sut,'getEditorText').and.returnValue(text)
        spyOn(sut,'getTitle').and.returnValue(title)
        spyOn(sut,'clear')
        spyOn(sut.dis,'dispatch')

        sut.post()

        expect(sut.dis.dispatch).toHaveBeenCalledWith('postForumMessage',jasmine.any(Object))
        expect(sut.clear).toHaveBeenCalled()
      })



    }); // end describe

}); // end define.
