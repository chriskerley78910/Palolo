define(['course-docs/models/SavedDoc',
        'people-models/Prof'],
(SavedDoc, Prof) => {
    describe("saved-doc-test", ()=>{

      beforeEach(()=>{
        sut = SavedDoc.getFake()
      })

      it(`sets all attributes`,()=>{
        const raw = SavedDoc.getRaw()
        const doc = SavedDoc.getFake()
        expect(doc.getId()).toBe(raw.doc_id)
        expect(doc.getProfId()).toBe(raw.id)
        expect(doc.getTitle()).toBe(raw.title)
        expect(doc.getCourseId()).toBe(raw.course_id)
        expect(doc.getFileURL()).toBe(doc.getHost() + '/' + raw.file_url)
        expect(doc.getHost()).toBe('fakehost')
        expect(doc.getLastOpened()).toBe('April 5, 2020')
        expect(doc.isLocked()).toBeFalsy()
      })

      it('setCourseId() throws if the grpId()',()=>{
        try{
        sut.setCourseId(null)
        expect(false).toBeTruthy()
        }
        catch(err){
          expect(err.message).toBe('id malformed')
        }

      })



      it('setYear does just that', ()=>{
        sut.setYear(1990)
        expect(sut.getYear()).toBe(1990)
      })

      it(`setTitle throws if its invalid.`,()=>{
        try{
          sut.setTitle('')
          expect(false).toBe(true)
        }
        catch(err){
          expect(err.message).toBe('must be a non-empty string')
        }
      })

      it('setFileURL(null) throws',()=>{
        try{
        sut.setFileURL(null)
        expect(false).toBeTruthy()
        }
        catch(err){
          expect(err.message).toBe('must be a non-empty string')
        }
      })

      it('setLastOpened(null) => getLastOpened() == never',()=>{
        sut.setLastOpened(null)
        expect(sut.getLastOpened()).toBe('never')
      })

      it('setLocked(locked) does that.',()=>{
        expect(sut.isLocked()).toBeFalsy()
        sut.setLocked(1)
        expect(sut.isLocked()).toBeTruthy()
        sut.setLocked(0)
        expect(sut.isLocked()).toBeFalsy()
      })

      it('setFileURL only cares if the file is not locked.x',()=>{
        sut.setLocked(1)
        try{
          sut.setFileURL(null)
          expect(true).toBeTruthy()
        }catch(err){
          expect(false).toBeTruthy()
        }


        sut.setLocked(0)
        try{
          sut.setFileURL('')
          expect(false).toBe(true)
        }
        catch(err){
          expect(err.message).toBe('must be a non-empty string')
        }
      })


    })
})
