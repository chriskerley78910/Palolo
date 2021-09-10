
define(['right-panel/person-info/Component',
        'people-models/Person',
        'people-models/Pal',
        'people-models/Classmate',
        'people-models/NullPerson'
      ], function(Component,
                  Person,
                  Pal,
                  Classmate,
                  NullPerson){

    describe("person-info Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      it('onStore, !isConnectedToCallRoom() => dont show ')

      it('isVisible() == false by default', ()=>{
        expect(sut.isVisible()).toBeFalsy();
      })

      it('onStore() && classmate is a tutor => isTutor() == true',()=>{
        const p =  Person.getFake()
        p.setRole('tutor')
        sut.store.getFocusedPerson = () => p
        expect(sut.isTutor()).toBeFalsy()
        sut.onStore()
        expect(sut.isTutor()).toBeTruthy()
      })


      it('onStore() & classmate == null => isVisible() == false', ()=>{
        sut.store.getFocusedPerson = () => new NullPerson()
        sut.onStore();
        expect(sut.isVisible()).toBeFalsy();
      })


      it('onStore() && classmate not null => isVisible and set',()=>{
        const p = Person.getFake()
        sut.store.getFocusedPerson = ()=>{
          return p;
        }
        sut.onStore();
        expect(sut.isVisible()).toBeTruthy();
        expect(sut.selectedClassmate()).toBe(p);
      })





      it('isAddPalVisible() <= p.isAddable()',()=>{
        const p = Classmate.getFake()
        sut.store.getFocusedPerson = ()=> p
        sut.onStore()
        expect(sut.isAddPalVisible()).toBeTruthy()
      })


      it('!isAddPalVisible() <= !p.isAddable()',()=>{
        const p = Pal.getFake()
        sut.store.getFocusedPerson = ()=> p
        sut.onStore()
        expect(sut.isAddPalVisible()).toBeFalsy()
      })


      it('addPal does nothing if the person is not addable', ()=>{
        const p = Pal.getFake()
        spyOn(sut.dis,'dispatch')
        sut.selectedClassmate(p)
        sut.addPal()
        expect(sut.dis.dispatch).not.toHaveBeenCalled()
      })

      it('addPal dispatches addPal if the person is addable.', ()=>{
        const p = Classmate.getFake()
        spyOn(sut.dis,'dispatch')
        sut.selectedClassmate(p)
        sut.addPal()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('addPal',p)
      })

      it('connectToRoom => dispatches getRoomToken',()=> {
        spyOn(sut.dis,'dispatch')
        const p = Person.getFake()
        sut.store.getFocusedPerson = () => p
        sut.connectToRoom()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('getRoomToken',p.getId())
      })

      it('connectToRoom => isCallButtonVisible() == false', () => {
        expect(sut.isCallButtonLoaderVisible()).toBeFalsy()
        spyOn(sut.dis,'dispatch')
        sut.onCallingSupported()
        expect(sut.isCallButtonLoaderVisible()).toBeTruthy()
      })

      it('buyHours => dispatch openTutorPayments',()=>{
        const p = Person.getFake()
        sut.store.getFocusedPerson = () => p
        spyOn(sut.dis,'dispatch')
        sut.buyHours()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('openTutoringPlans',p)
      })




    }); // end describe

}); // end define.
