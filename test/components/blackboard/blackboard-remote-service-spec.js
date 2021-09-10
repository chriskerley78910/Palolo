

define(['blackboard/BlackboardRemoteService'],
         function(
         RemoteService)
         {


  describe('Test BlackboardRemoteService',function(){

        let service = null;
        let selectedFriendId = 1;

        beforeEach(()=>{
          window.localStorage.setItem('accessToken','token');
          service = new RemoteService();
        })

        it('onFriendAddedNewBoard => dispatch friendAddedNewBoard',()=>{

          spyOn(sut.dis,'dispatch')
          const board = {}
          sut.onFriendAddedNewBoard(JSON.stringify(board))
          expect(sut.dis.dispatch).toHaveBeenCalledWith(board)
        })


        it('getAdditionalBoardData => does that.', ()=>{
          sut.sock = { emit:jasmine.createSpy() }
          const boardId = 1;
          sut.getAdditionalBoardData(boardId)
          expect(sut.sock.emit).toHaveBeenCalledWith('getAdditionalBoardData',)
        })



        it('emailBlackboard => emits the img',()=>{

          const arg = {}
          sut.sock = {
            emit:jasmine.createSpy()
          }
          sut.emailBlackboard(arg)
          expect(sut.sock.emit).toHaveBeenCalledWith('emailBoard',arg)
        })


        it('extends RemoteService',()=>{
          expect(Object.getPrototypeOf(service).getConstructorName()).toBe("DevelopmentRemoteService");
        })

        it('initialize connects the service', ()=>{
          service.initialize();
          expect(service._socket).not.toBeNull();
        })



        it('devMode ^ getServerURL() == https://blackboard.localhost',() => {
          expect(service.getServerURL()).toBe('http://blackboard.localhost');
        })

        it('initialize() => _connect() is called.', ()=>{
          service.initialize();
          expect(service.sock).not.toBeUndefined()
        })

        it('getSharedBoards(friendId) throws if friendId is not a positive number.',()=>{
          expect(()=>{service.getSharedBoards(-1)}).toThrow(new Error('friendId must be a positive integer.'));
        })

        it('getSharedBoards(friendId) throws if onSharedBoardsReceived is not a callback',()=>{
            expect(()=>{service.getSharedBoards(selectedFriendId)}).toThrow(new Error('onSharedBoardsReceived callback has not been registered.'));
        })



        it('registerGetSharedBoardsCallback(fn) saves fn in the callback list.', ()=>{
          let fn = ()=>{};
          service.registerGetSharedBoardsCallback(fn);
          expect(typeof service._callbacks['onSharedBoardsReceived']).toBe('function');
        })



        it('getBoardData(null) throws', ()=>{

          let f = ()=>{
            service.getBoardData(null);
          }
          expect(f).toThrow(new Error("boardId must be a positive integer."));
        })

        it('registerOnBoardDataCallback(fn) saves fn in the callback list', ()=>{
          let fn = () => {}
          service.registerOnBoardDataCallback(fn);
          let setFn = service._callbacks['onBoardDataReceived'];
          expect(setFn == fn).toBeTruthy();
        })

        it('registerOnNextBoardRecievedCallback(cb) does just that',()=>{
          let fn = ()=>{}
          service.registerOnNextBoardRecievedCallback(fn);
          expect(service._callbacks['onNextBoardRecieved'] == fn).toBeTruthy();
        })

        it('registerOnPreviousBoardRecievedCallback(cb) does just that.',()=>{
          let fn = ()=>{}
          service.registerOnPreviousBoardRecievedCallback(fn);
          expect(service._callbacks['onPreviousBoardRecieved'] == fn).toBeTruthy();
        })

        it('joinFriend(friendId) => socket.emit(joinRoom,friendId)', ()=>{
          service.initialize();
          spyOn(service._socket,'emit');
          service.joinFriend(selectedFriendId);
          expect(service._socket.emit).toHaveBeenCalled();
        })


        it('attachOnFriendCursorPositionReceivedHandler(fn) does just that.', ()=>{
          let fn = ()=>{};
          service.initialize();
          service.attachOnFriendCursorPositionReceivedHandler(fn);
          expect(service._socket._callbacks.$friendsCursorPosition[0]).toBe(fn);
        })


        it('attachFriendJoinedBlackboardHandler(cb) does just that.',()=>{
          let f = () => {};
          service.initialize();
          service.attachFriendJoinedBlackboardHandler(f);
          let cb = service._socket._callbacks['$friendJoinedBlackboard'];
          expect(cb[0]).toBe(f);
        })

        it('attachOnFriendPencilPositionCallback(cb) does just that.', ()=>{
          let f = () => {};
          service.initialize();
          service.attachOnFriendPencilPositionCallback(f);
          let cb = service._socket._callbacks['$friendPencilPositionUpdate'];
          expect(cb[0]).toBe(f);
        })


        it('registerOnSaveCallback(not function) throws.',()=>{
          let f = () =>{
              service.registerOnSaveCallback('not a function');
          }
          expect(f).toThrow(new Error("Save board callback needs to be a function."));
        });


        it('saveCurrentBoard() => emit(saveBoardState, object, function)',()=>{
          let callback = jasmine.createSpy();
          service.registerOnSaveCallback(callback);
          let object = {};
          service._socket = {
            emit:jasmine.createSpy()
          }
          service.saveCurrentBoard(object);
          expect(service._socket.emit).toHaveBeenCalledWith('saveBoardState', jasmine.any(Object), callback);
        });


        it('trashBoard() throw if friendid or boardId is malformed.', ()=>{
          service._socket = {
            emit:jasmine.createSpy()
          }
          let f = ()=>{
            let boardId = 2;
            service.trashBoard(boardId);
          }
          expect(f).toThrow(new Error('boardId and friendId must be specified.'));
        })

        it('trashBoard() ^ good params => emit(trashBoard).', ()=>{
          service._socket = {
            emit:jasmine.createSpy()
          }
          let boardId = '2';
          let friendId = '3';
          service.trashBoard(boardId,friendId);
          expect(service._socket.emit).toHaveBeenCalledWith('relayTrashBoard',jasmine.any(Object));
        })

        it('undoTrashBoard() => socket.emit("relayRestoreBoard")', ()=>{
          let boardId = 1;
          let friendId = 2;
          service._socket = {
            emit:jasmine.createSpy()
          }
          service.undoTrashBoard(boardId, friendId);
          expect(service._socket.emit).toHaveBeenCalledWith('relayRestoreBoard', jasmine.any(Object));
        })

        it('registerOnFriendRestoredBoard(callback) does just that.', ()=>{
          service._socket = {
            on:jasmine.createSpy()
          }
          let callback = ()=>{}
          service.registerOnFriendRestoredBoard(callback);
          expect(service._socket.on).toHaveBeenCalledWith('boardRestored',callback);
        })

  }); // end describe.
});  // end define.
