define(['people-models/Stranger',
        'people-models/Person'],
function(Stranger, Person){

    describe("stanger-spec",() => {
      let sut;
      beforeEach(()=>{
        sut = Stranger.getFake()
      })

      it('stanger is a person', ()=>{
        const raw = Person.getRaw()
        const p = new Stranger(raw, 'host')
        expect(p.getConstructorName()).toBe('Stranger');
      })

      it('isAddable() == true',()=>{
        expect(sut.isAddable()).toBeTruthy()
      })


    }); // end describe

}); // end define.
