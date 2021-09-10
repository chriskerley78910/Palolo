define(['course-docs/doc-list/Component',
        'course-docs/models/SavedDoc'],
(Component, SavedDoc) => {

    describe("doc-list", ()=>{

      let sut = null;
      beforeEach(()=>{
        sut = new Component.viewModel()
      })

      it(`isVisible() == false`,()=>{
        expect(sut.isVisible()).toBeFalsy()
      })

      it(`onStore => list populated`, ()=>{
        const list = [SavedDoc.getFake()]
        sut.store.getPastDocs = ()=>list
        sut.store.isPastDocsSelected = ()=>true
        sut.onStore()
        expect(sut.list()).toBe(list)
        expect(sut.isVisible()).toBeTruthy()
      })


    })
})
