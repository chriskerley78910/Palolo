define(['course-docs/doc-list-current/Component',
        'course-docs/models/SavedDoc',
        'course-docs/models/DocumentCollection'
      ],
(Component, SavedDoc, DocCollection) => {

    describe("doc-list-current", ()=>{

      let sut = null;
      beforeEach(()=>{
        sut = new Component.viewModel()
      })

      it('isVisible() if store.isCurrentDocsSelected()',()=>{
        sut.store.isCurrentDocsSelected = ()=>true
        const fakeCol = DocCollection.getFake()
        sut.store.getCurrentDocs = ()=>fakeCol
        sut.onStore()
        expect(sut.isVisible()).toBeTruthy()
        expect(sut.profs()).toBe(fakeCol.getProfs())
      })

      it('openDoc() dispatches that',()=>{
        const d = SavedDoc.getFake()
        spyOn(sut.dis,'dispatch')
        sut.openDoc(d)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('openDoc',d)
      })
    })
})
