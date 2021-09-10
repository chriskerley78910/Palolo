
define(['class-list/Component',
        'MockResponses',
        'people-models/Person',
        'people-models/NullPerson',
        'people-models/Classmate',
        'people-models/PersonCollection',
        'course/models/CourseGroup'],
function(Component,
         MockResponses,
         Person,
         NullPerson,
         Classmate,
         PersonCollection,
         CourseGroup){

    describe("class-list", function(){

      var sut = null;
      var mockResponse = null;


      beforeEach(() =>{
        sut = new Component.viewModel();
        mockResponse = (new MockResponses()).getMockResponse();
        window.localStorage.setItem('accessToken','dummycode');
      })



      it('onStoreUpdated() => classmateList is populated by store.', ()=>{
        const c = PersonCollection.getFake()
        sut.store.getClassList = ()=> c
        sut.store.isClassListVisible = ()=>{return true;}
        sut.onStoreUpdated();
        expect(sut.getClassmateCount()).toBe(c.getSize());
      })

      it('isVisible() == isClassListVisible()',()=>{
        sut.store.isClassListVisible = ()=>{return true;}
        sut.isVisible(false);
        sut.onStoreUpdated();
        expect(sut.isVisible()).toBeTruthy();
      })

      it('isVisible() == isClassListVisible()',()=>{
        sut.store.isClassListVisible = ()=>{return false;}
        sut.isVisible(true);
        sut.onStoreUpdated();
        expect(sut.isVisible()).toBeFalsy();
      })

      it('onCourseViewSelected(true) => selectedClassmate() == NullPerson', ()=>{
        sut.selectedClassmate(null);
        sut.onCourseViewSelected(true);
        let selectedPerson = sut.selectedClassmate();
        expect(selectedPerson.getConstructorName()).toBe('NullPerson');
      })

      it(`classmateClicked() => currentFriendId(frienId) ^ msgsSeen == true.`, () => {
          let friend = Person.getFake();
          spyOn(sut.dis,'dispatch');
          sut.classmateClicked(friend);
          expect(sut.selectedClassmate()).toBe(friend);
          expect(sut.dis.dispatch).toHaveBeenCalledWith('focusPerson',jasmine.any(Object));
      })

      it('add pal dispatches addPal',()=>{
        const p = Classmate.getFake();
        spyOn(sut.dis,'dispatch');
        const e = {stopPropagation:jasmine.createSpy()}
        sut.addPal(p, e);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('addPal',p);
        expect(e.stopPropagation).toHaveBeenCalled();
      })




    }); // end describe

}); // end define.
