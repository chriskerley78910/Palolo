define(['course-docs/models/DocumentCollection'],
(DocCollection) => {
    describe("doc-collection-test", ()=>{

      beforeEach(()=>{
      })

      it('throws if the rawDocs is not an array', ()=>{
        try{
          new DocCollection(null,'host')
          expect(false).toBe(true)
        } catch(err){
          expect(err.message).toBe('expected an array.')
        }
      })

      it('getProfs returns the collection', ()=>{
        const d = new DocCollection([],'host')
        expect(d.getProfs()).toBe(d.profs)
      })

      it('appends to the collection',()=>{
        const d = new DocCollection([],'host')
        expect(d.getSize()).toBe(0)
      })

    })
})
