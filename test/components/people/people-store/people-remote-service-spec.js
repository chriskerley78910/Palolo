define(['people-store/PeopleRemoteService',
        'RemoteService',
        'people-models/Person',
        'people-models/Pal',
        'people-models/Classmate',
        'people-models/PersonCollection',
        'course/models/CourseGroup'],
 function(PeopleRemoteService,
          RemoteService,
          Person,
          Pal,
          Classmate,
          PersonCollection,
          CourseGroup){

  describe("PeopleRemoteService Tests", () => {

    beforeEach(() => {
      sut = PeopleRemoteService.getNew();
    })

    it('implements RemoteService', () =>{
      expect(sut instanceof RemoteService).toBeTruthy();
    })

    it('is a singleton',()=>{
      const r1 = PeopleRemoteService.getInstance();
      const r2 = PeopleRemoteService.getInstance();
      expect(r1 == r2).toBeTruthy();
    })

    it('connectes too the pal microserver',()=>{
      expect(sut.getMicroServer()).toBe('friends.');
    });

    it('io is set', ()=>{
      expect(typeof sut.io).toBe('function');
    })

    it('getPalList() does that.',()=>{
      sut.sock = {emit:jasmine.createSpy()}
      sut.getPalList();
      expect(sut.sock.emit).toHaveBeenCalledWith('getPalList');
      expect(Number.isInteger(sut.timerId)).toBeTruthy();
    })


    it('init inits the sock', ()=>{
      expect(sut.sock).toBeNull();
      sut.init();
      expect(sut.sock).not.toBeNull();
    })

    it('registers palList on the sock',()=>{
      sut.init();
      expect(sut.sock._callbacks['$palList'][0]).toBe(sut.onPalList);
    })

    it('onPalList() dispatches palList', ()=>{
      spyOn(sut.dis,'dispatch');
      const p1 = Pal.getRaw();
      const p2 = Pal.getRaw();
      p2.id = p1.id + 1
      const pals = [p1,p2];
      sut.onPalList(pals);
      expect(sut.dis.dispatch).toHaveBeenCalledWith('palList',jasmine.any(PersonCollection));
    })

    it('registers palList on the sock',()=>{
      sut.init();
      expect(sut.sock._callbacks['$palList'][0]).toBe(sut.onPalList);
    })

    it('onGroupInfo() => emit(getClassList,grpId)',()=>{
      sut.init();
      spyOn(sut.sock,'emit');
      const g = CourseGroup.getFake();
      sut.getClassTimerId = 5;
      spyOn(window,'clearTimeout');
      sut.onGroupInfo(g);
      expect(sut.sock.emit).toHaveBeenCalledWith('getClassList',g.getId());
      expect(window.clearTimeout).toHaveBeenCalled();
    })

    it('onClassList() dispatches classList', ()=>{
      spyOn(sut.dis,'dispatch');
      const p1 = Classmate.getRaw();
      const p2 = Classmate.getRaw();
      p2.id = p2.id + 1
      const pals = [p1,p2];
      sut.onClassList(pals);
      expect(sut.dis.dispatch).toHaveBeenCalledWith('classList',jasmine.any(PersonCollection));
    })


    it('registers classList on the sock',()=>{
      sut.init();
      expect(sut.sock._callbacks['$classList'][0]).toBe(sut.onClassList);
    })

    it('onFocusPerson(p) => emit(p)',()=>{
      sut.sock = {emit:jasmine.createSpy()};
      const p = Pal.getFake();
      sut.recordFriendClick(p);
      expect(sut.sock.emit).toHaveBeenCalledWith('recordFriendClick',jasmine.any(Object));
    })

    it('onFocusPerson is registered on the focusPerson channel',()=>{
      const cb = sut.dis.getCallbackById(sut.focusPersonId);
      expect(cb).toBe(sut.recordFriendClick);
    })

    it('onAddPal emits addPal',()=>{
      const classmate = Classmate.getFake();
      const p = Pal.getFake();
      Object.setPrototypeOf(p, classmate);
      sut.sock = {emit:jasmine.createSpy()}
      sut.onAddPal(p);
      expect(sut.sock.emit).toHaveBeenCalledWith('addPal',jasmine.any(Object));
    })

    it('addPalId is reg on addPal channel',()=>{
      const cb = sut.dis.getCallbackById(sut.addPalId);
      expect(cb).toBe(sut.onAddPal);
    })

    it('onPalRequestSent dispatched palRequestSent',()=>{
      spyOn(sut.dis,'dispatch');
      const p = Classmate.getFake();
      sut.onPalRequestSent(p);
      expect(sut.dis.dispatch).toHaveBeenCalledWith('palRequestSent',jasmine.any(Object));
    })


    it('onPalRequestRecieved',()=>{
      spyOn(sut.dis,'dispatch');
      const p = Pal.getRaw();
      sut.onPalRequestRecieved(p);
      expect(sut.dis.dispatch).toHaveBeenCalledWith('palRequestReceived',jasmine.any(Object));
    })

    it('acceptRequest() => emit(acceptPalRequest)',()=>{
      sut.sock = {emit:jasmine.createSpy()}
      const p = Pal.getFake();
      sut.acceptRequest(p);
      expect(sut.sock.emit).toHaveBeenCalledWith('acceptPalRequest',p);
    })

    it('onPalRequestAccepted throws if the host is not set.',()=>{

      try{
        spyOn(sut,'getServerURL').and.returnValue(null);
        sut.onPalRequestAccepted(Pal.getRaw())
        expect(true).toBe(false);
      }
      catch(err){
        expect(err.message).toBe('must be a non-empty string');
      }
    })


    it('onPalRequestAccepted => dispatch palRequestAccepted',()=>{
      const p = Pal.getRaw();
      spyOn(sut.dis,'dispatch')
      sut.onPalRequestAccepted(p)
      expect(sut.dis.dispatch).toHaveBeenCalledWith('palRequestAccepted',jasmine.any(Object));
    })


    it('getPalRequestList does just that',()=>{
      expect(typeof sut.palRequestTimerId == 'number').toBeFalsy();
      sut.sock = {emit:jasmine.createSpy()}
      sut.getPalRequestList();
      expect(typeof sut.palRequestTimerId == 'number').toBeTruthy();
      expect(sut.sock.emit).toHaveBeenCalledWith('getPalRequestList');
    })

    it('onPalRequestList => dispatch(palRequestList, people)',()=>{
      spyOn(sut.dis,'dispatch');
      const raw = [Person.getRaw()]
      sut.onPalRequestList(raw);
      expect(sut.dis.dispatch).toHaveBeenCalledWith('palRequestList',jasmine.any(Array));
    })

    it(`onDenyRequest(p) => emit(denyRequest)`,()=>{
      const p = Person.getFake();
      sut.sock = {emit:jasmine.createSpy()}
      sut.onDenyRequest(p)
      expect(sut.sock.emit).toHaveBeenCalledWith('denyRequest',p);
    })

    it('onDenyRequest is reg on the denyRequest channel',()=>{
      const cb = sut.dis.getCallbackById(sut.denyRequestId)
      expect(cb).toBe(sut.onDenyRequest)
    })




  });
});
