define(['people-store/PeopleStore',
        'abstract-interfaces/Store',
        'people-models/Classmate',
        'people-models/Person',
        'people-models/Pal',
        'people-models/PersonCollection',
        'course/models/CourseGroup'],
function(PeopleStore, Store, Classmate,
         Person,
         Pal,
         PersonCollection,
         CourseGroup){

  describe("PeopleStore Tests", function(){

      let sut = null;

      beforeEach(()=>{
        sut = PeopleStore.getNew();
      })



      it('onShowClassList(classList) => classListVisible == true', done => {
        expect(sut.isClassListVisible()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isClassListVisible()).toBeTruthy()
          done()
        })
        sut.onShowClassList('classList')
      })

      it('onShowClassList(classList) => classListVisible == true', done => {
        expect(sut.isClassListVisible()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isClassListVisible()).toBeFalsy()
          done()
        })
        sut.onShowClassList('unknown feature')
      })


      it('onPalList => isSpinnerVisible() ', done => {

        expect(sut.isSpinnerVisible()).toBeTruthy()
        sut.onPub(()=>{
          expect(sut.isSpinnerVisible()).toBeFalsy()
          done()
        })
        const col = PersonCollection.getFake()
        col.clear()
        sut.onPalList(col)
      })

      it('onPalList => puts the new pals into a seperate list', done =>{

        const col = new PersonCollection()

        const c1 = Pal.getFake()
        c1.setIsNew(0)
        col.add(c1);

        const c2 = Pal.getFake()
        c2.setIsNew(1)
        c2.setId(c1.getId() + 1)
        col.add(c2)

        sut.onPub(()=>{
          expect(sut.getNewPals().getSize()).toBe(1)
          expect(sut.getPalList().getSize()).toBe(1)
          done()
        })
        sut.onPalList(col)


      })

      it('onAddPal sets the focused person ad a pending pal and pubs', done =>{
        const p = Classmate.getFake()
        sut.setFocusedPerson(p)
        expect(sut.getFocusedPerson().isAddable()).toBeTruthy()
        sut.onPub(()=>{
          expect(sut.getFocusedPerson().isAddable()).toBeFalsy()
          done()
        })
        sut.onAddPal()
      })

      it('onAddPal is reg on dis', ()=>{
        const cb = sut.dis.getCallbackById(sut.addPalId)
        expect(cb).toBe(sut.onAddPal)
      })

      it('instanceof Store', ()=>{
        expect(sut instanceof Store).toBeTruthy();
      })

      it('is a singleton',()=>{
        const sut1 = PeopleStore.getInstance();
        const sut2 = PeopleStore.getInstance();
        expect(sut1 == sut2).toBeTruthy();
      })

      it('zero subscribers at first', ()=>{
        expect(sut.getSubs().length).toBe(0);
      })

      it('classList and palList are empty', ()=>{
        expect(sut.getPalList().getSize()).toBe(0);
        expect(sut.getClassList().getSize()).toBe(0);
      })

      it('palRequests is empty', ()=>{
        expect(sut.getPalRequests().length).toBe(0);
      })

      it('registers onPalList() on the palList channel', ()=>{
        const cb = sut.getDis().getCallbackById(sut.onPalsId);
        expect(cb).toBe(sut.onPalList);
      })


      it('onPalList publishes to subscribers', done =>{
        sut.onPub(()=>{
          expect(true).toBeTruthy();
          done();
        })
        spyOn(sut,'updateFocusedPerson')
        const c = PersonCollection.getFake()
        sut.onPalList(c);
      })

      it('onPalList sets the pals',()=>{
        const pals = PersonCollection.getFake()
        expect(sut.getPalList().getSize()).toBe(0);
        sut.onPalList(pals);
        expect(sut.getPalList().getSize()).toBe(2);
      })

      it('onPalList => updateFocusedPerson', ()=>{
        spyOn(sut,'updateFocusedPerson')
        sut.onPalList(PersonCollection.getFake())
        expect(sut.updateFocusedPerson).toHaveBeenCalled()
      })

      it('updateFocusedPerson updates the status of the focused person.', ()=>{
        // current focused person
        const p = Pal.getFake()
        expect(p.isPresent()).toBeTruthy()
        spyOn(sut,'getFocusedPerson').and.returnValue(p)

        // fresh version.
        const away = Pal.getFake()
        away.setPresent(false)
        expect(away.isPresent()).toBeFalsy()
        spyOn(sut.palList,'getPersonById').and.returnValue(away)
        spyOn(sut.dis,'dispatch')

        sut.updateFocusedPerson()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('updateFocusPerson',sut.focusedPerson)
        expect(sut.focusedPerson.isPresent()).toBeFalsy()
      })

      it('registers onClassList() on the classList channel',()=>{
        const cb = sut.getDis().getCallbackById(sut.onClassListId);
        expect(cb).toBe(sut.onClassList);
      })

      it('onClassList() sets the classList',()=>{
        const list = new PersonCollection()
        sut.onClassList(list);
        expect(sut.getClassList().equals(list)).toBeTruthy();
      })


      it('onClassList publishes to subscribers', done =>{
        sut.onPub(()=>{
          expect(true).toBeTruthy();
          done();
        })
        sut.onClassList(new PersonCollection());
      })

      it('isClassListVisible() == false by default', ()=>{
        expect(sut.isClassListVisible()).toBeFalsy();
      })


      it('onGrpInfo() dispatches request to getClassList if not already loaded.',()=>{
        const g = CourseGroup.getFake();
        spyOn(sut.dis,'dispatch');
        sut.onGrpInfo(g);
        expect(sut.getFocusedPerson().getConstructorName() == 'NullPerson').toBeTruthy();
      })

      it('onGrpInfo() does nothing if its the same grp.',()=>{
        const g = CourseGroup.getFake();
        sut.currentGrpId = g.getId();
        spyOn(sut.dis,'dispatch');
        sut.onGrpInfo(g);
        expect(sut.dis.dispatch).not.toHaveBeenCalled();
      })

      it('onGrpInfo is reg on groupInfo channel',()=>{
        const cb = sut.dis.getCallbackById(sut.onGrpInfoId);
        expect(cb).toBe(sut.onGrpInfo);
      })


      it('onShowGroupView() => focusedPerson == null',done => {
        sut.focusedPerson = 1;
        sut.onPub(()=>{
          expect(sut.focusedPerson.constructor.name).toBe('NullPerson');
          done();
        })
        sut.onShowGroupView();
      })

      it('onPalRequestSent => showPalRequestSent == true',done => {
        expect(sut.isPalRequestSent()).toBeFalsy();
        const p = Classmate.getFake();
        spyOn(sut,'showPalRequestSent').and.callThrough()
        sut.onPub(()=>{
          expect(sut.showPalRequestSent).toHaveBeenCalled()
          expect(sut.isPalRequestSent()).toBeTruthy();
          expect(sut.lastPalRequestPal()).toBe(p);
          done();
        })
        sut.onPalRequestSent(p);
      })

      it('onPalRequestSent => sets a timer which will hide it ',()=>{

        expect(typeof sut.timerId).toBe('undefined');
        sut.onPalRequestSent(Classmate.getFake());
        expect(typeof sut.timerId).toBe('number');
      })

      it('onPalRequestSent is registered on palRequestSent channel',()=>{
        const cb = sut.dis.getCallbackById(sut.palRequestSentId);
        expect(cb).toBe(sut.onPalRequestSent);
      })

      it('onPalRequestSent(classmate) => removes the classmate from the classList.',()=>{
        const p = Classmate.getFake();
        sut.classList.add(p)
        sut.onPalRequestSent(p);
        expect(sut.classList.getSize()).toBe(0);
      })

      it('onPalRequestSent(classmate) ^ classmate is the focusedPerson => change classmate into a PendingPal',done =>{
        const c = Classmate.getFake()
        sut.focusedPerson = c
        expect(sut.focusedPerson.isAddable()).toBeTruthy()
        sut.onPub(()=>{
          expect(sut.focusedPerson.getId()).toBe(c.getId())
          expect(sut.focusedPerson.isAddable()).toBeFalsy()
          done()
        })
        sut.onPalRequestSent(c)
      })


      it('onPalRequestReceived',done =>{
        const p = Classmate.getFake();
        expect(sut.getPalRequests().length).toBe(0);
        sut.onPub(()=>{
            expect(sut.getPalRequests().length).toBe(1);
            done();
        })
        sut.onPalRequestReceived(p);
      })

      it('onPalRequestReceived is registered on the palRequestReceived channcel',()=>{
        const cb = sut.dis.getCallbackById(sut.palRequestReceivedId);
        expect(cb).toBe(sut.onPalRequestReceived);
      })


      it('onPalRequestAccepted = showPalRequestAccepted == true', done => {
        const p = Classmate.getFake();
        expect(sut.getPalList().getSize()).toBe(0);
        sut.onPub(()=>{
          expect(sut.getPalList().getSize()).toBe(1);
          done();
        })
        sut.onPalRequestAccepted(p);
      })


      it('onPalRequestList sets the palRequests attr',done =>{
        const p = Person.getFake();
        expect(sut.getPalRequestList().length).toBe(0);
        sut.onPub(()=>{
              expect(sut.getPalRequestList()[0]).toBe(p);
              done();
        })
        sut.onPalRequestList([p]);
      })

      it('onAcceptRequest moves that person to the palList',done => {
        const p = Person.getFake();
        sut.palRequests.push(p);
        expect(sut.getPalRequestList().length).toBe(1);
        expect(sut.getPalList().getSize()).toBe(0);
        sut.onPub(()=>{
          expect(sut.getPalRequestList().length).toBe(0);
          expect(sut.getPalList().getSize()).toBe(1);
          done();
        })
        sut.onAcceptRequest(p);
      })

      it('onAcceptRequest is registered on the acceptRequest channel.',()=>{
        const cb = sut.dis.getCallbackById(sut.acceptRequestId);
        expect(cb).toBe(sut.onAcceptRequest);
      })

      it('focusPerson will acknowledgeNewPal',()=>{

        const p = Pal.getFake();
        spyOn(sut,'onAcknowledgeNewPal');
        sut.onFocusPerson(p);
        expect(sut.onAcknowledgeNewPal).toHaveBeenCalledWith(p);
      })

      it('onAcknowledgeNewPal => set isNew to false for that pal.',() => {
        const p = Pal.getFake();
        p.setAsNew();
        sut.palList.add(p);
        sut.addPal(p);
        sut.onAcknowledgeNewPal(p);
        expect(p.isNew()).toBeFalsy();
      })

      it('addPal() does nothing if its not a Pal instance',() => {
        const p = Person.getFake();
        expect(sut.getPalList().getSize()).toBe(0);
        sut.addPal(p);
        expect(sut.getPalList().getSize()).toBe(0);
      })

      it('onDenyRequest(p) => removes only that p from palRequests',done => {
        const p1 = Person.getFake()
        const p2 = Person.getFake()
        p2.setId(p1.getId() + 1)
        sut.palRequests.push(p1)
        sut.palRequests.push(p2)
        sut.onPub(()=>{
          expect(sut.palRequests.length).toBe(1)
          expect(sut.palRequests[0].getId()).toBe(p2.getId())
          done();
        })
        sut.onDenyRequest(p1);
      })

      it('onDenyRequest(p) => does nothing if that p does not exist in palRequests',() => {
        const p1 = Person.getFake()
        const p2 = Person.getFake()
        p2.setId(p1.getId() + 1)
        sut.palRequests.push(p2)
        sut.onDenyRequest(p1);
        expect(sut.palRequests.length).toBe(1)
        expect(sut.palRequests[0].getId()).toBe(p2.getId())
      })


      it(`onDenyRequest() is registered on the denyRequest channel`,()=>{
        const cb = sut.dis.getCallbackById(sut.denyRequestId)
        expect(cb).toBe(sut.onDenyRequest)
      })


  }); // end describe

}); // end define.
