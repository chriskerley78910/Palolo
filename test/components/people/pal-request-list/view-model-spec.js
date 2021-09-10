
define(['pal-request-list/Component',
      'people-models/Person'],
function(Component, Person){
    describe("pals test",() => {

      beforeEach(()=>{
        sut = new Component.viewModel();
      })

      it('onStoreUpdate => getPalRequestList',()=>{
        expect(sut.requests().length).toBe(0);
        sut.store.getPalRequests = ()=> [Person.getFake()]
        sut.onStoreUpdate();
        expect(sut.requests().length).toBe(1);
      })

      it('dispatches acceptRequest',()=>{
        const p = Person.getFake();
        spyOn(sut.dis,'dispatch');
        sut.acceptRequest(p);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('acceptRequest',p);
      })

      it('dispatches denyRequest', ()=>{
        const p = Person.getFake();
        spyOn(sut.dis,'dispatch');
        sut.denyRequest(p);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('denyRequest',p);
      })

      it('faceClicked => dispatches focusPerson', ()=>{
        const p = Person.getFake();
        spyOn(sut.dis,'dispatch');
        sut.faceClicked(p);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('focusPerson',p);
      })


      it(`denyRequest => dispatch(denyRequest, person)`,()=>{
        const p = Person.getFake();
        spyOn(sut.dis,'dispatch');
        sut.denyRequest(p);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('denyRequest',p);
      })

     })
   })
