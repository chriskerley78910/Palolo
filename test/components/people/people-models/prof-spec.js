define(['people-models/Prof',
        'people-models/Person',
        'course-docs/models/SavedDoc'],
function(Prof, Person, SavedDoc){

    describe("prof-spec",() => {
      let sut;
      beforeEach(()=>{
        sut = Prof.getFake(SavedDoc)
      })

      it('prof is a person', ()=>{
        const raw = Person.getRaw()
        const p = new Prof(raw, 'host')
        expect(p.getConstructorName()).toBe('Prof');
      })

      it('uses the no-photo image if no url is supplied',()=>{
        const r = Person.getRaw()
        r.small_photo_url = ''
        r.large_photo_url = ''
        const p = new Prof(r, 'host')
        expect(p.getSmallPhotoURL()).toBe(Person.getDefaultPhotoURL())
        expect(p.getConstructorName()).toBe('Prof');
      })

      it('addDoc() throws if its null', ()=>{
        try{
          sut.addDoc(null)
        } catch(err){
          expect(err.message).toBe('expected doc')
        }
      })

      it('addDoc adds a new term if one does not already exist',()=>{
        expect(sut.years.length).toBe(0)
        var d = SavedDoc.getRaw()
        sut.addDoc(d)
        expect(sut.getYearCount()).toBe(1)
        expect(sut.getYearAt(0).docs().length).toBe(1)
      })

      it('addDoc does not add a newterm if on already exists.',()=>{
        expect(sut.getYearCount()).toBe(0)
        var rawDoc = SavedDoc.getRaw()
        sut.addDoc(rawDoc)
        sut.addDoc(rawDoc)
        expect(sut.getYearCount()).toBe(1)
        expect(sut.getYearAt(0).docs().length).toBe(2)
      })

      it('getYear does just that.', ()=>{
        const d = SavedDoc.getRaw()
        const t = sut.getYear(d)
        expect(t).toBeNull()
        sut.addDoc(d)
        expect(sut.getYearAt(0).docs().length).toBe(1)
      })


      it('getYears', ()=>{
        const d = SavedDoc.getRaw()
        sut.addDoc(d)
        expect(sut.getYearCount()).toBe(1)
        expect(sut.getYearAt(0).docs().length).toBe(1)
      })



    }); // end describe

}); // end define.
