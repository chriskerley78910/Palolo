
define(['pal-list/Component',
      'people-models/Pal',
      'people-models/Classmate',
      'people-models/Person'],
function(Component, Pal, Classmate, Person){
    describe("pals test",() => {

      beforeEach(()=>{
        sut = new Component.viewModel();
      })





      it('palClicked() dispatches palClicked',()=>{
        spyOn(sut.dis,'dispatch');
        const pal = Pal.getFake();
        expect(sut.selectedPal()).toBe(null);
        sut.palClicked(pal);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('focusPerson',pal);
        expect(sut.selectedPal()).toBe(pal);
      })


      it('initially has a null person in the list.',()=>{
        expect(sut.pals().length).toBe(0)
        expect(sut.isSpinnerVisible()).toBeFalsy()
      })





     })
   })
