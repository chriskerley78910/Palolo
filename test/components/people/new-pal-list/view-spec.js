
define(['new-pal-list/Component',
      'people-models/Pal',
      'people-models/Classmate',
      'people-models/Person',
      'people-models/PersonCollection'],
function(Component, Pal, Classmate, Person, PersonCollection){
    describe("pals test",() => {

      beforeEach(()=>{
        sut = new Component.viewModel();
      })


      it('onStore => getNewPals()', ()=>{
        const list = PersonCollection.getFake()
        const p1 = list.get(0)
        const p2 = list.get(1)
        spyOn(sut.store,'getNewPals').and.returnValue(list)
        sut.onStore()
        expect(sut.newPals()[0].equals(p1)).toBeTruthy()
        expect(sut.newPals()[1].equals(p2)).toBeTruthy()
      })

      it('palClicked() dispatches palClicked',()=>{
        spyOn(sut.dis,'dispatch');
        const pal = Pal.getFake();
        sut.palClicked(pal);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('focusPerson',pal);
      })


      it('initially has no people.',()=>{
        expect(sut.newPals().length).toBe(0)
      })





     })
   })
