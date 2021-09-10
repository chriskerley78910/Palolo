define(['course-docs/doc-uploader/Component',
        'course-docs/models/UnsavedDoc',
         'people-models/Prof'],
(Component, UnsavedDoc, Prof) => {
    describe("doc-uploader-test", ()=>{

      let sut
      beforeEach(()=>{
        sut = new Component.viewModel()
      })


      it('onStore => course desciption gets populated', ()=>{
        const m = 'MATH1300 Calculus and Applications'
        spyOn(sut.store,'getGroupCourseInfo').and.returnValue(m)
        expect(sut.courseDescription()).toBe('')
        sut.onStore()
        expect(sut.courseDescription()).toBe(m)
      })

      it('addCourse => dispatches addCourseAndUpload',()=>{
        spyOn(sut.dis,'dispatch')
        spyOn(sut.store,'getUnsavedDoc').and.returnValue({})
        sut.addCourse()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('addCourseAndUpload',jasmine.any(Object))
      })

      it('closeAdder => dispatches closeCourseAdder',()=>{
        spyOn(sut.dis,'dispatch')
        sut.closeAdder()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('closeCourseAdder')
      })


      it('courseAdderVisible() if isCourseAdderOpen()',()=>{
        sut.courseAdderVisible(false)
        spyOn(sut.store,'isCourseAdderVisible').and.returnValue(true)
        sut.onStore()
        expect(sut.courseAdderVisible()).toBeTruthy()
      })

      it(`isVisible() == false`, ()=>{
        expect(sut.isVisible()).toBe(false)
      })

      it('onStore() => isVisible() == isUploaderOpen',()=>{
        sut.store.isUploaderOpen = true
        spyOn(sut.dis,'dispatch')
        sut.onStore()
        expect(sut.isVisible()).toBeTruthy()
      })

      it('onStore(), inputsShouldBeReset => clearInputFields()',()=>{
        spyOn(sut.store,'inputsShouldBeReset').and.returnValue(true)
        spyOn(sut,'clearInputFields')
        sut.onStore()
        expect(sut.clearInputFields).toHaveBeenCalled()
      })

      it('onStore(), inputsShouldBeReset => clearInputFields()',()=>{
        spyOn(sut.store,'inputsShouldBeReset').and.returnValue(false)
        spyOn(sut,'clearInputFields')
        sut.onStore()
        expect(sut.clearInputFields).not.toHaveBeenCalled()
      })

      it('clearInputFields dispatches uploaderHasBeenReset',()=>{
        spyOn(sut.dis,'dispatch')
        sut.clearInputFields()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('uploaderHasBeenReset')
      })

      it('onStore does not show preview if there is no doc',()=>{
        sut.store.getUnsavedDoc = ()=>null
        spyOn(sut,'clearInputFields')
        sut.onStore()
        expect(sut.unsavedDocLoaded()).toBeFalsy()
      })

      it('onStore shows preview if there is a doc to show',()=>{
        sut.store.getUnsavedDoc = () => UnsavedDoc.getFake()
        spyOn(sut,'clearInputFields')
        sut.onStore()
        expect(sut.unsavedDocLoaded()).toBeTruthy()
      })

      it('uploadDoc() dispatches a UnsavedDoc',()=>{
        const f = new File([0,1,0],'name')
        const event = {
          currentTarget:{
            files:[f]
          }
        }
        spyOn(sut.dis,'dispatch')
        sut.selectedProf = null
        sut.uploadDoc(null,event)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('docUpload', f)
      })

      it('unsavedDoc == null => unsavedDocName == null',()=>{
         spyOn(sut.dis,'dispatch')
         sut.unsavedDocName('hello')
         sut.store.getUnsavedDoc =()=>null
         sut.onStore()
         expect(sut.unsavedDocName()).toBe('')
      })

      it('onProf => dispatch getMatchingProfs', ()=>{
        const name = 'Curtis'
        spyOn(sut.dis,'dispatch')
        sut.getMatchingProfs(name)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('getMatchingProfs',name)
      })

      it('selectProf => dispatch selectedProf',()=>{
        const p = Prof.getFake()
        spyOn(sut.dis,'dispatch')
        const evt = {
          preventDefault:()=>{},
          stopPropagation:()=>{}
        }
        sut.selectProf(p, evt)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectedProf',p)
      })

      it('getMatchingProfs(mepty)',()=>{
        const name = ''
        spyOn(sut.dis,'dispatch')
        sut.getMatchingProfs(name)
        expect(sut.dis.dispatch).not.toHaveBeenCalled()
      })

      it('onStore updates the matching profs', ()=>{
        sut.store.matchingProfs = [{id:1,first:'Jeff',last:'Edmunds'},{id:2,first:'Batman',last:'Robin'}]
          spyOn(sut,'clearInputFields')
        sut.onStore()
        expect(sut.matchingProfs().length).toBe(2)
      })



      it('setYear dispatches the year of the doc',()=>{
        const year = 2015
        spyOn(sut.dis,'dispatch')
        sut.setYear(year)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('setDocYear',year)
      })



    })
})
