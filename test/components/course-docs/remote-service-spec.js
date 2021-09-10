
define(['course-docs/DocRemoteService',
        'course-docs/models/SavedDoc',
        'course/models/CourseGroup',
        'course-docs/models/DocumentCollection',
        'people-models/Prof',
        'course-docs/models/UnsavedDoc'],
(DocRemoteService,
 SavedDoc,
 CourseGroup,
 DocCollection,
 Prof,
 UnsavedDoc) => {

    describe("DocRemoteService", () => {

      let sut
      beforeEach(() => {
        sut = new DocRemoteService();
      })

      it('host == http://tests/localhost',()=>{
        expect(sut.getServerURL()).toBe('http://tests.localhost');
      })

      it('addCourseAndUpload => ajax with the doc',()=>{
        spyOn($,'ajax')
        const d = UnsavedDoc.getFakeSerializable()
        sut.addCourseAndUpload(d)
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
            data:{json:jasmine.any(String)},
        }))
      })

      it('getDocs is registered on the groupInfo channel',()=>{
        const cb = sut.dis.getCallbackById(sut.onGrpId)
        expect(cb).toBe(sut.getDocs)
      })

      it('getDocs(grp) expects CourseGroup cloudy day case',() => {
        try{
          spyOn(sut,'isAdmin')
          sut.getDocs({})
          expect(false).toBe(true)
        }
        catch(err){
          expect(err.message).toBe('Can only get docs for a group.')
        }
      })

      it('getDocs(grp) expects CourseGroup sunnyday case.',() => {
        try{
          spyOn($,'ajax')
          spyOn(sut,'isAdmin')
          sut.getDocs(CourseGroup.getFake())
          expect(true).toBeTruthy()
          expect($.ajax).toHaveBeenCalled()
        }
        catch(err){
          console.log(err)
          expect(false).toBe(true,'did not expect an exception');
        }
      })

      it('onDocs(no docs) dispatches [ ]',()=>{
        spyOn(sut.dis,'dispatch')
        const json = JSON.stringify([])
          spyOn(sut,'isAdmin')
        sut.onDocs(json)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('courseDocs',jasmine.any(Object))
      })



      it('onDocs(docs) throws if arg is malformed',()=>{
        try{
          sut.onDocs(SavedDoc.getRaw())
        }
        catch(err){
          expect(err.message).toBe('malformed json string')
        }
      })


      it('onSubmitDoc is reg on submitDoc',()=>{
        const cb = sut.dis.getCallbackById(sut.submitDocId)
        expect(cb).toBe(sut.onSubmitDoc)
      })

      it('onDocSubmitted() alerts the docId', ()=>{
        spyOn(sut.dis,'dispatch')
        sut.onDocSubmitted(1)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('docSubmitted',1)
      })

      it('onDocSubmitted(no record of that prof) => dispatch openAddCourse',()=>{
        spyOn(sut.dis,'dispatch')
        sut.onDocSubmitted('no record of that professor')
        expect(sut.dis.dispatch).toHaveBeenCalledWith('openAddCourse')
      })

      it('onError shows an alert',()=>{

        spyOn(window,'alert')
        sut.onError({responseText:'fuck'})
        expect(window.alert).toHaveBeenCalledWith('fuck')
      })


      it('recordDocDownload() is reg',()=>{
        const cb = sut.dis.getCallbackById(sut.recordDownloadId)
        expect(cb).toBe(sut.recordDocDownload)
      })

      it('recordDocDownload() does an ajax request',()=>{
        spyOn($,'ajax')
        sut.recordDocDownload(SavedDoc.getFake())
        expect($.ajax).toHaveBeenCalled()
      })

      it('getMatchingProfs is reg on getMatchingProfs channel',()=>{
        const cb = sut.dis.getCallbackById(sut.getMatchingProfsId)
        expect(cb).toBe(sut.getMatchingProfs)
      })


      it('onMatchingProfs => dispatches array of profs', ()=>{
        spyOn(sut.dis,'dispatch')
        const p1 = Prof.getRaw()
        const p2 = Prof.getRaw()
        sut.onMatchingProfs([p1, p2])
        expect(sut.dis.dispatch).toHaveBeenCalledWith('matchingProfs',jasmine.any(Array))
      })



    }); // end describe

}); // end define.
