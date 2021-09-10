
define(['class-list/Component',
        'MockResponses',
        'people-models/Person',
        'people-models/NullPerson',
        'people-models/Classmate',
        'course/models/CourseGroup'],
function(Component,
         MockResponses,
         Person,
         NullPerson,
         Classmate,
         CourseGroup){

    describe("Test Component", function(){

      var sut = null;
      var mockResponse = null;


      beforeEach(() =>{
        sut = new Component.viewModel();
        mockResponse = (new MockResponses()).getMockResponse();
        window.localStorage.setItem('accessToken','dummycode');
      })



      it('onStoreUpdated() => classmateList is populated by store.', ()=>{

        const p1 = Person.getFake();
        const p2 = Person.getFake();
        sut.store.getClassList = ()=>{
          return [p1,p2];
        }
        sut.store.isClassListVisible = ()=>{return true;}
        sut.onStoreUpdated();
        expect(sut.getClassmateCount()).toBe(2);
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
        expect(selectedPerson instanceof Person).toBeTruthy();
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
