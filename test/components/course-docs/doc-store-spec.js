
define(['course-docs/DocStore',
        'abstract-interfaces/Store',
        'course/models/CourseGroup',
        'people-models/Prof',
        'course-docs/models/UnsavedDoc',
        'course-docs/models/SavedDoc',
        'course-docs/models/DocumentCollection'],
function(Store,
        AbstractStore,
        CourseGroup,
        Prof,
        UnsavedDoc,
        SavedDoc,
        DocCollection){

    describe("doc-store", function(){

      let sut;
      beforeEach(()=>{
        sut = Store.getNew()
      })


      it('getCourseGroupInfo',()=>{
        const g = CourseGroup.getFake()
        sut.onGrp(g)
        expect(sut.getGroupCourseInfo()).toBe('EECSFAKE101 Fake Course')
      })


      it('onAddCourseAndUpload => isWaiting()',done => {
        expect(sut.isWaiting()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isWaiting()).toBeTruthy()
          done()
        })
        sut.onAddCourseAndUpload()
      })

      it('onOpenCourseAdder makes the course adder visible',done =>{
        expect(sut.isCourseAdderVisible()).toBeFalsy();
        sut.onPub(()=>{
            expect(sut.isCourseAdderVisible()).toBeTruthy()
            done()
        })
        sut.onOpenCourseAdder()
      })

      it('instance of Store',()=>{
        const sut = Store.getInstance()
        expect(sut instanceof AbstractStore).toBeTruthy();
      })

      it('DocStore is a singleton',()=>{
        const sut1 = Store.getInstance();
        const sut2 = Store.getInstance()
        expect(sut1 == sut2).toBeTruthy();
      })

      it('onGrp() => set currentGrp', ()=>{
        const grp = CourseGroup.getFake()
        expect(sut.currentGrp).toBeNull()
        spyOn(sut,'onShowCourseDocs');
        sut.onGrp(grp)
        expect(sut.currentGrp).toBe(grp)
        expect(sut.onShowCourseDocs).not.toHaveBeenCalled()
      })



      it('onGrp is registerd on the groupInfo channel',()=>{
        const cb = sut.dis.getCallbackById(sut.onGrpId)
        expect(cb).toBe(sut.onGrp)
      })

      it('onCourseDocs is reg on the courseDocs channel',()=>{
        const cb = sut.dis.getCallbackById(sut.onDocsId)
        expect(cb).toBe(sut.onCourseDocs)
      })

      it('onCourseDocs() clears the existing data', ()=>{
        const curDocs = sut.getCurrentDocs()
        sut.onCourseDocs([])
        expect(sut.getCurrentDocs() != curDocs).toBeTruthy()
      })

      it('onGroupLeft => !courseDocsPermitted, pub()', done => {
        sut.courseDocsPermitted = true
        sut.onPub(()=>{
          expect(sut.isCourseDocsPermitted()).toBeFalsy()
          done()
        })
        sut.onGroupLeft()
      })

      it('onJoined => isCourseDocsPermitted()', done => {
        expect(sut.isCourseDocsPermitted()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isCourseDocsPermitted()).toBeTruthy()
          done()
        })
        sut.onJoined()
      })

      it('onShowCourseDocs(), grp.isMember() => isCourseDocsVisible()', done => {
        expect(sut.isCourseDocsVisible()).toBeFalsy()
        sut.currentGrp = CourseGroup.getFake()
        sut.currentGrp.setMembershipStatus(true)
        sut.onPub(() => {
            expect(sut.isCourseDocsVisible()).toBeTruthy()
            done()
        })
        const featureName = 'noteShare'
        sut.onShowCourseDocs(featureName)
      })

      it('onShowCourseDocs(), !isMember => isCourseDocsPermitted() == false', done => {
        expect(sut.isCourseDocsPermitted()).toBeFalsy()
        sut.currentGrp = CourseGroup.getFake()
        sut.currentGrp.setMembershipStatus(false)
        sut.courseDocsPermitted = true
        sut.onPub(()=>{
          expect(sut.isCourseDocsPermitted()).toBeFalsy()
          done()
        })
        const featureName = 'noteShare'
        sut.onShowCourseDocs(featureName)
      })

      it('onShowCourseDocs(), currentGrp.isMember() => isCourseDocsPermitted(),isCourseDocsVisible()', () => {
        expect(sut.isCourseDocsVisible()).toBeFalsy()
        sut.currentGrp = CourseGroup.getFake()
        sut.currentGrp.setMembershipStatus(true)
        sut.onPub(()=>{
          expect(sut.isCourseDocsVisible()).toBeTruthy()
          expect(sut.isCourseDocsPermitted()).toBeTruthy()
        })
        const featureName = 'noteShare'
        sut.onShowCourseDocs(featureName)
      })

      it('onShowCourseDocs() => isCourseDocsVisible()', done => {
        sut.isDocsVisible = false
        sut.currentGrp = CourseGroup.getFake()
        sut.currentGrp.setMembershipStatus(true)
        sut.onPub(()=>{
            expect(sut.isCourseDocsVisible()).toBeTruthy()
            done()
        })
        const featureName = 'noteShare'
        sut.onShowCourseDocs(featureName)
      })

      it('onShowCourseDocs is reg on showCourseDocs channel', () => {
        const cb = sut.dis.getCallbackById(sut.showDocsId)
        expect(cb).toBe(sut.onShowCourseDocs)
      })



      it('onOpenDocUploader publishes its open',done =>{
        expect(sut.isUploaderOpen).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isUploaderOpen).toBeTruthy()
          done()
        })
        sut.onOpenDocUploader()
      })

      it('onOpenDocUploader subscribes to openDocUploader',()=>{
        const cb = sut.dis.getCallbackById(sut.openUploaderId)
        expect(cb).toBe(sut.onOpenDocUploader)
      })

      it('onInputReset => lastUnsavedDoc == unsavedDoc',()=>{
        sut.lastUnsavedDoc = 1
        sut.unsavedDoc = 2
        sut.onInputReset()
        expect(sut.lastUnsavedDoc).toBe(sut.unsavedDoc)
      })

      it('onCloseDocUploader dispatches its closed',done =>{
        sut.isUploaderOpen = true
        sut.unsavedDoc = '1'
        sut.onPub(()=>{
          expect(sut.isUploaderOpen).toBeFalsy();
          expect(sut.unsavedDoc).toBeNull()
          done()
        })
        sut.onCloseDocUploader()
      })

      it('onCloseDocUploader subscribes to closeDocUploader', ()=>{
        const cb = sut.dis.getCallbackById(sut.closeUploaderId)
        expect(cb).toBe(sut.onCloseDocUploader);
      })

      it('onDocUpload sets the fileToBeSaved to that file.',done =>{
        expect(sut.getUnsavedDoc()).toBeNull()
        const file = new File([1,0],'name')
        sut.currentGrp = CourseGroup.getFake()
        const doc = UnsavedDoc.getFake()
        sut.lastUnsavedDoc = doc
        sut.unsavedDoc = doc
        expect(sut.inputsShouldBeReset()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.getUnsavedDoc()).not.toBeNull()
          expect(sut.inputsShouldBeReset()).toBeTruthy()
          done()
        })
        sut.onDocUpload(file)
      })

      it('onSetDocTitle sets the title of the unsavedDoc', done =>{
        sut.unsavedDoc = UnsavedDoc.getFake()
        const title = "Midterm"
        sut.onPub(()=>{
          expect(sut.getUnsavedDocTitle()).toBe(title)
          done()
        })
        sut.onSetDocTitle(title)
      })


      it('isReadyToSubmit() == false if unsavedDoc == null',()=>{
        expect(sut.isReadyToSubmit()).toBeFalsy();
      })

      it('isReadyToSubmit() == true if unsavedDoc isSendable()',()=>{
        sut.unsavedDoc = {isSendable:()=>true}
        expect(sut.isReadyToSubmit()).toBeTruthy();
      })

      it('onSubmitDoc => isWaiting == true',done => {
        expect(sut.isWaiting()).toBeFalsy();
        const d = UnsavedDoc.getFake()
        sut.onPub(()=>{
          expect(sut.isWaiting()).toBeTruthy();
          done()
        })
        sut.onSubmitDoc(d)

      })

      it('onSubmitDoc is reg on the submitDoc channel',()=>{
        const cb = sut.dis.getCallbackById(sut.submitDocId)
        expect(cb).toBe(sut.onSubmitDoc)
      })


      it('onDocSubmitted() => delete unsavedDoc',done =>{
        sut.unsavedDoc = UnsavedDoc.getFake();
        sut.waiting = true
        spyOn(sut,'showSuccess')
        spyOn(sut.dis,'dispatch')
        sut.onPub(()=>{
            expect(sut.getUnsavedDoc()).toBe(null)
            expect(sut.isWaiting()).toBeFalsy()
            expect(sut.showSuccess).toHaveBeenCalled()
            expect(sut.dis.dispatch).toHaveBeenCalledWith('getDocs',sut.currentGrp)
            done()
        })
        sut.onDocSubmitted()
      })

      it('showSuccess() => isSuccessPopupVisible == true', ()=>{
        sut.showSuccess()
        expect(sut.isSuccessPopupVisible()).toBeTruthy()
      })

      it('onDocSubmitted reg on docSubmitted',()=>{
        const cb = sut.dis.getCallbackById(sut.onSubmitedId)
        expect(cb).toBe(sut.onDocSubmitted)
      })

      it('getCurrentDocs() returns an array of CurrentDocs',()=>{
        expect(sut.getCurrentDocs()).toEqual(jasmine.any(Object))
      })

      it('onCourseDocs() splits the docs into two lists according to their group',done =>{

        sut.currentGrp = CourseGroup.getFake()
        const docs = DocCollection.getFake()
        const d1 = SavedDoc.getRaw()
        const d2 = SavedDoc.getRaw()
        docs.insertDoc(d1)
        sut.onPub(()=>{
          expect(sut.docCount()).toBe(1)
          done()
        })
        sut.onCourseDocs(docs)
      })


      it('onOpenDoc(doc) opens the file url',()=>{
        const d = SavedDoc.getFake()
        spyOn(window,'open')
        sut.onOpenDoc(d)
        expect(window.open).toHaveBeenCalled()
      })

      it('onMatchingProfs sets matching profs', done => {
        const profs = []
        expect(sut.matchingProfs).toBeNull()
        sut.onPub(()=>{
            expect(sut.matchingProfs).toBe(profs)
            done()
        })
        sut.onMatchingProfs(profs)
      })

      it('onMatchingProfs is reg on matchingProfs',()=>{
        const cb = sut.dis.getCallbackById(sut.matchingProfsId)
        expect(cb).toBe(sut.onMatchingProfs)
      })

      it('onSelectedProf => sets the prof of the UnsavedDoc', done => {
        const p = Prof.getFake()
        sut.unsavedDoc = UnsavedDoc.getFake()
        expect(sut.getUnsavedDoc().profId).toBeUndefined()
        sut.onPub(()=>{
            expect(sut.matchingProfs).toEqual([])
            expect(sut.getUnsavedDoc().profId).toBe(p.getId())
            done()
        })
        sut.onSelectedProf(p)
      })

      it('onSelectedProf is reg on selectedProf',()=>{
        const cb = sut.dis.getCallbackById(sut.selectedProfId)
        expect(cb).toBe(sut.onSelectedProf)
      })




      it('onSetDocYear does just that.',done =>{
        const year = 2000
        sut.unsavedDoc = UnsavedDoc.getFake()
        expect(sut.unsavedDoc.getYear()).toBeUndefined()
        sut.onPub(()=>{
          expect(sut.unsavedDoc.getYear()).toBe(year)
          done()
        })
        sut.onSetDocYear(year)
      })

      it('onSetDocTerm reg on setDocYear channel',()=>{
        const cb = sut.dis.getCallbackById(sut.setYearId)
        expect(cb).toBe(sut.onSetDocYear)
      })

      it('onUploadingAllowed(true) => sets isUploadingAllowed',()=>{
        sut.isUploadingAllowed = false
        sut.onUploadingAllowed(true)
        expect(sut.isUploadingAllowed).toBe(true)
      })

    }); // end describe

}); // end define.
