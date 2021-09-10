define(['course-docs/models/UnsavedDoc',
        'people-models/Prof',
        'course/models/CourseGroup'],
(UnsavedDoc, Prof, CourseGroup) => {
    describe("unsaved-doc-test", ()=>{

      let sut = null;

      beforeEach(()=>{
        sut = UnsavedDoc.getFake()
      })

      it('overrides setTitle to allow the empty string',()=>{
        sut.setTitle('')
        expect(sut.getTitle()).toBe('')
      })


      it(`sets only the file attr`,()=>{
        const doc = UnsavedDoc.getFake()
        expect(doc.getFile() instanceof File).toBeTruthy()
      })


      it('setYear does just that', ()=>{
        sut.setYear(1990)
        expect(sut.getYear()).toBe(1990)
      })

      it(`setTitle throws if its invalid.`,()=>{
        try{
          sut.setTitle(null)
          expect(false).toBe(true)
        }
        catch(err){
          expect(err.message).toBe('title must be a string')
        }
      })

      it('setFile(f) throws if f is not a file',()=>{
        try{
          new UnsavedDoc({})
        }
        catch(err){
          expect(err.message).toBe('must be a file')
        }
      })

      it('isSendable() == false unless all the attr are set',()=>{
        sut.file = null
        expect(sut.isSendable()).toBeFalsy()

        sut.setTitle('Midterm')
        expect(sut.isSendable()).toBeFalsy()

        sut.setShallowProf(Prof.getFake())
        expect(sut.isSendable()).toBeFalsy()

        sut.setYear(2000)
        expect(sut.isSendable()).toBeFalsy()

        sut.setFile(new File([],'title'))
        expect(sut.isSendable()).toBeFalsy()

        sut.setProfId(1)
        expect(sut.isSendable()).toBeTruthy()
        expect(sut.getTitle()).toBe('title')
      })

      it('getFileName() does just that.', ()=>{
        const f = new File([],'fileName')
        sut.setFile(f)
        expect(sut.getFileName()).toBe('fileName')
      })

      it('setGrp does that', ()=>{
        const grp = CourseGroup.getFake()
        sut.setGrp(grp)
        expect(sut.getGrp()).toBe(grp)
        expect(sut.getGrpId()).toBe(grp.getId())
      })

      it('encodeFile does just that',done =>{
        sut.setFile(new File([],'name'))
        sut.encodeFile(()=>{
          expect(sut.getEncodedFile()).toBe('data:')
          done()
        })
      })

      it('throws That file is too large', ()=>{
        sut.MAX_FILE_SIZE = 0
        try{
          sut.setFile(new File([1],'name'))
        }
        catch(err){
          expect(err.message).toBe('That file is too large. (10mb max)')
        }
      })


      it('serialize throws if the file has not been encoded',()=>{

        try{
          // missing
          sut.setYear(2000)
          sut.setProfId(1)
          sut.serialize()
          expect(false).toBe(true)
        }
        catch(err){
          expect(err.message).toBe('cannot serialize if the file has not been encoded yet')
        }
      })

      it('serialize throws if profId is not set',() =>{

        try{
          sut.encodedFile = {}
          sut.setYear(2000)
          // missing set prof
          sut.serialize()
          expect(false).toBe(true)
        }
        catch(err){
          expect(err.message).toBe('to serialize, the profId must be set')
        }
      })

      it('serialize returns an object for sending to the server',() =>{
        const profId = 2
        const year = 2000
        const encodedFile = {}

        sut.encodedFile = encodedFile
        sut.setYear(year)
        sut.setProfId(profId)

        const obj = sut.serialize()
        expect(obj.file).toBe(encodedFile)
        expect(obj.profId).toBe(profId)
        expect(obj.year).toBe(year)
      })


    })
})
