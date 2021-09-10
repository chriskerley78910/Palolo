
define(['blackboard/ViewModel',
         'blackboard/models/Line',
         'blackboard/models/RemoteErase',
         'blackboard/boards/BlackBoard',
         'blackboard/boards/BlackboardCollection'],
function(ViewModel,
         Line,
         RemoteErase,
         BlackBoard,
         BlackboardCollection){

    var sut = null;

    describe("Test ViewModel",() => {

      let selectedClassmateId = 2;
      beforeEach(() => {
        sut = new ViewModel.viewModel();
        sut.testMode = true;
      })

      let createSimpleBoard = ()=>{
        return {
          last_loaded:'2017-05-14T18:16:01.001Z',
          board_id:5,
          board_url:'fake_url'
        }
      }

      let getPerson = (id) =>{
        let Person = function(){
          this.getId = function(){
            return id;
          }
        }
        return new Person();
      }

      it('onFriendAddedNewBoard, !boards.contains(b) => append', ()=>{
        spyOn(sut.boards,'contains').and.returnValue(false)
        spyOn(sut.boards,'appendBoard')
        const b = {}
        sut.onFriendAddedNewBoard(b)
        expect(sut.boards.appendBoard).toHaveBeenCalledWith(b)
      })

      it('selectBlue changes the tools color', ()=>{
        expect(sut.myToolsColor).toBe(sut.white)
        sut.selectBlue()
        expect(sut.myToolsColor).toBe(sut.blue)
      })

      it('selectYellow changes the tools color', ()=>{
        expect(sut.myToolsColor).toBe(sut.white)
        sut.selectYellow()
        expect(sut.myToolsColor).toBe(sut.yellow)
      })

      it('selectGreen changes the tools color', ()=>{
        expect(sut.myToolsColor).toBe(sut.white)
        sut.selectGreen()
        expect(sut.myToolsColor).toBe(sut.green)
      })

      it('selectPink changes the tools color', ()=>{
        expect(sut.myToolsColor).toBe(sut.white)
        sut.selectPink()
        expect(sut.myToolsColor).toBe(sut.pink)
      })

       it('userState(authenticated) => remoteService.initialize()', () =>{
         spyOn(sut.remoteService,'initialize').and.callThrough();
         sut.onAuth({state:'authenticated', id:'2'});
         expect(sut.remoteService.initialize).toHaveBeenCalled();
       })

       it('userState(authenticated) => remoteService.registerOnFriendRestoredBoard',()=>{
         spyOn(sut.remoteService,'registerOnFriendRestoredBoard');
         sut.onAuth({state:'authenticated', id:'2'});
         expect(sut.remoteService.registerOnFriendRestoredBoard).toHaveBeenCalled();
       })


       it('userState(anonymous) => ~ remoteService.initialize()',()=>{
         spyOn(sut.remoteService,'initialize');
         sut.remoteService.registerGetSharedBoardsCallback(()=>{});
         sut.selectedClassmateId = selectedClassmateId;
         sut.onAuth('anonymous');
         expect(sut.remoteService.initialize).not.toHaveBeenCalled();
       })


       it('toggleVisibility() => canvas.resizeBlackboard()',()=>{
         sut.canvas = {
           resizeBlackboard:jasmine.createSpy()
         }
         sut.blackboardOpen(false);
         sut.toggleVisibility();
         expect(sut.canvas.resizeBlackboard).toHaveBeenCalled();
       })


       it('remoteService.attachOnFriendPositionReceivedHandler is called with a function', ()=>{
         spyOn(sut.remoteService,'attachOnFriendCursorPositionReceivedHandler');
         sut.onAuth({state:'authenticated', id:'2'});
         expect(sut.remoteService.attachOnFriendCursorPositionReceivedHandler).toHaveBeenCalled();
       })



       it('startSlowServerResponseTimer() adds a reference to the timeout references list', ()=>{
         sut.startSlowServerResponseTimer();
         expect(sut.timeoutReferences.length).toBe(1);
       })


       it(`onSharedBoardsReceived(boards)
        => remoteService.getBoardData(currentBoardURL)
         ^ boards.setBoards(boards)`, ()=>{
           const b1 = BlackBoard.getRaw()
           const b2 = BlackBoard.getRaw()
           b2.board_id = b1.board_id + 1
           const raw = [b1,b2]
           const boards = JSON.stringify(raw);
           spyOn(sut.remoteService,'getBoardData');
           spyOn(sut.boards,'setBoards').and.callThrough();
           spyOn(sut.boards,'getCurrentBoardURL').and.returnValue("fake_url");
           sut.onSharedBoardsReceived(boards);

           expect(sut.boards.setBoards).toHaveBeenCalledWith(raw);
           expect(sut.remoteService.getBoardData).toHaveBeenCalledWith(raw[0].board_id, sut.onBoardDataReceived);
       })





      it(`onSharedBoardsReceived(boards)
        ^ currentBoardIndex() == 1
        => prevArrowVisable() == true`, () => {

            sut.prevArrowVisible(false);
            spyOn(sut.boards,'setBoards');
            spyOn(sut,'getCurrentBoardId').and.returnValue(2);
            spyOn(sut.boards,'getCurrentBoardIndex').and.returnValue(1);
            spyOn(sut.remoteService,'getBoardData')
            sut.onSharedBoardsReceived(null);
            expect(sut.prevArrowVisible()).toBeTruthy();
        })

        it(`onSharedBoardsReceived(boards)
          ^ currentBoardIndex == 0
          => prevArrowVisable() == false`, () => {

              sut.prevArrowVisible(true);
              spyOn(sut.boards,'setBoards');
              let boardId = 2;
              spyOn(sut,'getCurrentBoardId').and.returnValue(boardId);
              spyOn(sut.boards,'getCurrentBoardIndex').and.returnValue(0);
              spyOn(sut.remoteService,'getBoardData')
              sut.onSharedBoardsReceived(null);

              expect(sut.prevArrowVisible()).toBeFalsy();
          })


        it(`nextArrowClicked()
        => remoteService.getNextBoard(boardId,friendId)`,()=>{
          var board = {
            board_id:1,
            board_url:'fake_url',
            dirty:true,
            last_loaded:'2017-05-14T18:16:00.004Z'
          }

          sut.boards.appendBoard(board);
          sut.onAuth({state:'authenticated', id:'2'});
          sut.selectedClassmateId = selectedClassmateId;
          spyOn(sut.remoteService,'getNextBoard');
          sut.nextArrowClicked();
          expect(sut.remoteService.getNextBoard)
          .toHaveBeenCalledWith(
              sut.getCurrentBoardId(),
              sut.selectedClassmateId
          );
          expect(sut.spinnerVisible()).toBeTruthy();
        })

        it(`prevArrowClicked() => remoteService.getPreviousBoard(boardId,friendId) ^ saveCurrentBoard()`, ()=>{
          var currentBoard = {
            board_id:1,
            board_url:'fake_url',
            last_loaded:'2017-05-14T18:16:00.004Z',
            dirty:true
          }
          sut.boards.appendBoard(currentBoard);
          sut.onAuth({state:'authenticated', id:'2'});
          sut.selectedClassmateId = selectedClassmateId;
          spyOn(sut.remoteService,'getPreviousBoard');
          sut.prevArrowClicked();
          expect(sut.remoteService.getPreviousBoard).toHaveBeenCalledWith(sut.getCurrentBoardId(),sut.selectedClassmateId);
          expect(sut.spinnerVisible()).toBeTruthy();
        })

        it(`onNextBoardRecieved(jsonBoard)
          ^ board_id not in list
          => append board
          ^  call get board data`, ()=>{

            let initialBoard = JSON.stringify([{
              board_id:52,
              board_url:'fake_url',
              last_loaded:'2017-05-14T18:16:01.001Z',
              dirty:true
            }])
            spyOn(sut.remoteService,'getBoardData')
            sut.onSharedBoardsReceived(initialBoard);

            let board = {
              board_id:55,
              board_url:'fake_url',
              last_loaded:'2017-05-14T18:16:01.001Z'
            }
            sut.onNextBoardRecieved(JSON.stringify(board));
            let currentBoardId = sut.getCurrentBoardId();
            expect(sut.remoteService.getBoardData).toHaveBeenCalledWith(currentBoardId,sut.onBoardDataReceived);
            expect(sut.boards.getCurrentBoardIndex()).toBe(1);
          })


          it(`onPreviousBoardRecieved(jsonBoards)
             ^ both boards have existing board_ids
             => prevArrowVisible == true
             ^  second board becomes the _currentBoard`, ()=>{


             let b0 = {
               board_id:52,
               board_url:'fake_url',
               last_loaded:'2017-05-14T18:16:01.001Z'
             }
             let b1 = {
               board_id:53,
               board_url:'fake_url',
               last_loaded:'2017-05-14T18:16:01.002Z'
             }
             let b2 = {
               board_id:54,
               board_url:'fake_url',
               last_loaded:'2017-05-14T18:16:01.003Z'
             }
              spyOn(sut.remoteService,'getBoardData');
             sut.onSharedBoardsReceived(JSON.stringify([b0,b1,b2]));

            // sets the current board.
             expect(sut.getCurrentBoardId()).toBe(b2.board_id);


             let oldLength = sut.boards.getCount();

             let newBoards = [
               {
                 board_id:52,
                 board_url:'fake_url1',
                 last_loaded:'2017-05-14T18:16:01.004Z'
               },
               { // expected to be the previous board.
                 board_id:53,
                 board_url:'fake_url2',
                 last_loaded:'2017-05-14T18:16:00.004Z'
               }
             ];
             sut.onPreviousBoardRecieved(JSON.stringify(newBoards));
             expect(sut.getCurrentBoardId()).toBe(newBoards[1].board_id);
             expect(sut.remoteService.getBoardData).toHaveBeenCalledWith(newBoards[1].board_id, sut.onBoardDataReceived);
             expect(sut.prevArrowVisible()).toBeTruthy();
           })


           it('onPreviousBoardRecieved([{board_id:-1},{board_id:2}]) => previousArrowVisible() == false', ()=>{
             sut.prevArrowVisible(true);
             spyOn(sut.boards,'isEmpty').and.returnValue(false);
             spyOn(sut.boards,'setCurrentBoardById');
             let boardId = 2;
             spyOn(sut,'getCurrentBoardId').and.returnValue(boardId);
             let boards = JSON.stringify([{board_id:-1},{board_id:2}]);
              spyOn(sut.remoteService,'getBoardData');
             sut.onPreviousBoardRecieved(boards);
             expect(sut.prevArrowVisible()).toBe(false);
           })

           it('onPreviousBoardRecieved([{board_id:-1},{board_id:2}]) ^ boards.isEmpty() => throw', ()=>{
             let boards = JSON.stringify([{board_id:-1},{board_id:2}]);
             let result = expect(()=>{sut.onPreviousBoardRecieved(boards)});
             result.toThrow(new Error("Can't set previous board without its reference existing somewhere in the board set."));
           })


           it('onPreviousBoardRecieved() throws if input isnt valid',()=>{
             let f = ()=>{
               sut.onPreviousBoardRecieved(JSON.stringify({}));
             }
             expect(f).toThrow(new Error('onPreviousBoardRecieved() expects JSON array of length 2 as input.'));
           })

           it('onNextBoardRecieved() => prevArrowVisible() == true ^ getBoardData(boardId called)', ()=>{
             sut.prevArrowVisible(false);
             spyOn(sut.remoteService,'getBoardData');
             var boardId = 5;
             let nextBoard = JSON.stringify({board_id:boardId, board_url:'fake_url',last_loaded:'2017-05-14T18:16:01.001Z'});
             sut.onNextBoardRecieved(nextBoard);
             expect(sut.prevArrowVisible()).toBeTruthy();
             expect(sut.remoteService.getBoardData).toHaveBeenCalledWith(boardId, sut.onBoardDataReceived);
           })

           it('setMyCursorPosition() does nothing if currentBoard is not set.', ()=>{
             sut._currentBoard = null;
             spyOn(sut.boards,'isEmpty');
             spyOn(sut.remoteService,'emitMyCursorPosition');
             sut.setMyCursorPosition({x:1,y:2});
             expect(sut.boards.isEmpty).toHaveBeenCalled();
             expect(sut.remoteService.emitMyCursorPosition).not.toHaveBeenCalled();
           })


           it('setMyCursorPosition(x,y) => remoteService.emitMyCursorPosition()',()=>{
             spyOn(sut.remoteService,'emitMyCursorPosition');
             sut.boards.appendBoard(createSimpleBoard());
             sut.setMyCursorPosition({x:1,y:2});
             let obj = {
               x:1,
               y:2,
               boardId:sut.getCurrentBoardId(),
               friendId:sut.selectedClassmateId
             }
             expect(sut.remoteService.emitMyCursorPosition).toHaveBeenCalled();
             let args = sut.remoteService.emitMyCursorPosition.calls.argsFor(0)[0];
             expect(args.position.x).toBe(1);
             expect(args.position.y).toBe(2);
             expect(args.boardId).toBe(sut.getCurrentBoardId());
             expect(args.friendId).toBe(sut.selectedClassmateId);
           })


           it('setMyPencilPosition(position) => remoteService.emitMyPencilPosition', () => {
              sut.boards.appendBoard(createSimpleBoard());
              spyOn(sut.remoteService,'emitMyPencilPosition');
              spyOn(sut.boards,'isEmpty').and.returnValue(false);
              let pos = {x:0,y:1}
              sut.setMyPencilPosition(pos);
              expect(sut.remoteService.emitMyPencilPosition).toHaveBeenCalled();
              expect(sut.boards.isEmpty).toHaveBeenCalled();
           })


           it('setMyPencilPosition(pos) ^ !sut.currentBoard => nothing',()=>{
              spyOn(sut.remoteService,'emitMyPencilPosition');
              sut._currentBoard = null;
              let pos = {x:0,y:1}
              sut.setMyPencilPosition(pos);
              expect(sut.remoteService.emitMyPencilPosition).not.toHaveBeenCalled();
           })



             it(`drawFriendsCursor({correct_friendId, correct_boardId})
               => canvas is updated`, ()=>{
                 spyOn(sut.canvas,'drawFriendsCursor');
                 sut.boards.appendBoard(createSimpleBoard());
                 let update = {
                               friendId:sut.selectedClassmateId,
                               boardId:5
                             };
                 sut.onFriendsCursorPositionReceived(update);
                 expect(sut.canvas.drawFriendsCursor).toHaveBeenCalled();
               })

             it(`drawFriendsCursor({wrong_friendId, correct_boardId}) => nothing happens`, ()=>{
                 spyOn(sut.canvas,'drawFriendsCursor');
                 sut.boards.appendBoard(createSimpleBoard());
                 let update = {friendId:sut.selectedClassmateId + 1,
                               boardId:sut.getCurrentBoardId()};
                 sut.onFriendsCursorPositionReceived(update);
                 expect(sut.canvas.drawFriendsCursor).not.toHaveBeenCalled();
               })


            it('drawFriendsCursor({correct_friendId, wrong_boardId}) => draw right marker.' , ()=>{
                spyOn(sut.canvas,'drawFriendsCursor');
                spyOn(sut.canvas,'drawFriendRightMarker');
                sut.boards.appendBoard(createSimpleBoard());
                let update = {
                  friendId:sut.selectedClassmateId,
                  boardId:6,
                  position:{y:1}
                }
                sut.onFriendsCursorPositionReceived(update);
                expect(sut.canvas.drawFriendRightMarker).toHaveBeenCalled();
                expect(sut.canvas.drawFriendsCursor).not.toHaveBeenCalled();
            })

            it(`onFriendsCursorPositionReceived()
              ^ correct_friendId
              ^ correct_boardId
              ^ _friendsCurrentTool == cursor
             => drawFriendsCursor`, ()=>{

               spyOn(sut.canvas,'drawFriendsCursor');
               sut.boards.appendBoard(createSimpleBoard());
               let update = {
                 friendId:sut.selectedClassmateId,
                 boardId:5,
                 position:{y:1}
               }
               sut.onFriendsCursorPositionReceived(update);
               expect(sut.canvas.drawFriendsCursor).toHaveBeenCalled();
              })

              it('drawFriendPositionHintMarker => drawFriendLeftMarker',()=>{
                spyOn(sut,'getCurrentBoardId').and.returnValue(2)
                spyOn(sut.canvas,'drawFriendLeftMarker')
                const y = 0.5;
                sut.drawFriendPositionHintMarker({boardId:1, y0:y})
                expect(sut.canvas.drawFriendLeftMarker).toHaveBeenCalledWith(y)
              })

              it('drawFriendPositionHintMarker => drawFriendRightMarker',()=>{
                spyOn(sut,'getCurrentBoardId').and.returnValue(0)
                spyOn(sut.canvas,'drawFriendRightMarker')
                const y = 0.5
                sut.drawFriendPositionHintMarker({boardId:1, y0:y})
                expect(sut.canvas.drawFriendRightMarker).toHaveBeenCalledWith(y)
              })

              it('currentBoard == null ^ onFriendPencilPositionReceived() => nothing happens',()=>{
                spyOn(sut.canvas,'drawFriendsPencil');
                spyOn(sut,'drawFriendPositionHintMarker');
                sut._currentBoard = null;
                expect(sut.canvas.drawFriendsPencil).not.toHaveBeenCalled();
                expect(sut.drawFriendPositionHintMarker).not.toHaveBeenCalled();
              })

             it(`onFriendPencilPositionReceived()
                ^ friendId == selectedClassmateId
                ^ boardId == currentboardId
               => drawFriendsPencil()`, ()=>{

                 sut.boards.appendBoard(createSimpleBoard());
                 spyOn(sut.canvas,'drawFriendsPencil');
                 let update = {
                   friendId:sut.selectedClassmateId,
                   boardId:sut.getCurrentBoardId()
                 }
                 sut.onFriendPencilPositionReceived(update);
                 expect(sut.canvas.drawFriendsPencil).toHaveBeenCalled();
            })


            it(`onFriendPencilPositionReceived()
               ^ friendId == selectedClassmateId
               ^ boardId != currentboardId
              => drawFriendsCursorMarker()`, ()=>{
                spyOn(sut.canvas,'drawFriendsPencil');
                spyOn(sut,'drawFriendPositionHintMarker');
                sut.boards.appendBoard(createSimpleBoard());
                let update = {
                  friendId:sut.selectedClassmateId,
                  boardId:1 + sut.getCurrentBoardId(),
                  position:{y:1}
                }
                sut.onFriendPencilPositionReceived(update);
                expect(sut.canvas.drawFriendsPencil).not.toHaveBeenCalled();
                expect(sut.drawFriendPositionHintMarker).toHaveBeenCalled();
           })


     it(`onFriendPencilLineReceived()
       ^ boardId == currentBoardId
       ^ friendId == selectedClassmateId
      => currentBoardStateSize++
       ^ canvas.drawPencilLine() called`, ()=>{

         sut.boards.appendBoard(createSimpleBoard());
         spyOn(sut.canvas,'drawFriendsPencilLine');
         spyOn(sut,'getCurrentBoardId');
         const line = Line.getRaw()
         line.friend_id = sut.selectedClassmateId
         line.board_id = sut.getCurrentBoardId()
         const oldLength = sut.boards.getCurrentBoardCommandCount();
         sut.onFriendPencilLineReceived(line);
         expect(sut.boards.getCurrentBoardCommandCount()).toBe(oldLength + 1);
         expect(sut.canvas.drawFriendsPencilLine).toHaveBeenCalled();
         expect(sut.getCurrentBoardId).toHaveBeenCalled();
       })

     it('onFriendPencilLineReceived(), friend on different board => draws on that board.', ()=>{

     })

     it(`onFriendPencilLineReceived()
       ^ boardId != _currentBoard.board_id
       ^ friendId == selectedClassmateId
      => drawFriendPositionHintMarker()`, ()=>{
         sut.boards.appendBoard(createSimpleBoard());
         spyOn(sut,'drawFriendPositionHintMarker');
         const r = Line.getRaw()
         const l = Line.getFake()
         r.friend_id = sut.selectedClassmateId
         r.board_id = 1 + sut.getCurrentBoardId()
         sut.onFriendPencilLineReceived(r);
         const endPoint = l.getEndPoint()
         expect(sut.drawFriendPositionHintMarker).toHaveBeenCalledWith(jasmine.any(Object));
       })

      it('registerCallback(selectedClassmate, handleFriendChange)', ()=>{
        let callback= sut.dis.getCallbackById(sut.classmateCallbackId);
        expect(callback).toBe(sut.handleFriendChange);
      })


      it('handleCourseViewSelected(true) => isToggleVisible() == false', ()=>{
        sut.isToggleVisible(true);
        sut.blackboardOpen(true);
        sut.hideBlackboard(true);

        expect(sut.isToggleVisible()).toBeFalsy();
        expect(sut.blackboardOpen()).toBeFalsy();
      })


      it('handleFriendChange(Person) => canvas.clearToolContext()', ()=>{
        spyOn(sut.remoteService,'getSharedBoards');
        spyOn(sut.remoteService,'joinFriend');
        spyOn(sut.canvas,'clear');
        spyOn(sut,'possiblySaveState');
        sut.recentlyTrashedBoards([1,2]);
        sut.isToggleVisible(false);
        sut.handleFriendChange(getPerson(selectedClassmateId));

        expect(sut.isToggleVisible()).toBeTruthy();
        expect(sut.canvas.clear).toHaveBeenCalled();
        expect(sut.spinnerVisible()).toBeTruthy();
        expect(sut.possiblySaveState).toHaveBeenCalled();
        expect(sut.recentlyTrashedBoards().length).toBe(0);
        expect(sut.remoteService.getSharedBoards).toHaveBeenCalledWith(selectedClassmateId);
        expect(sut.remoteService.joinFriend).toHaveBeenCalledWith(selectedClassmateId, sut._myCurrentTool);
      })

      it('onOpenGroupView is registerd on the openGroupView channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.openGroupId);
        expect(cb).toBe(sut.hideBlackboard);
      })

      it('handleFriendChange(NullPerson) => isVisible() == false', ()=>{
        sut.blackboardOpen(true);
        sut.handleFriendChange(null);
        expect(sut.blackboardOpen()).toBeFalsy();
      })


      it(`onBoardDataReceived(data)
      ^  data.board_id == _currentBoard.board_id
      => saveBoardState(lines)
      ^  canvas.draw(data.lines)`,() => {

        sut.boards.appendBoard(createSimpleBoard());
        spyOn(sut.canvas,'drawEntireBoard');
        sut.spinnerVisible(true);
        expect(sut.boards.getCurrentBoardCommandCount()).toBe(0);
        const r = BlackBoard.getRaw()
        r.board_id = sut.getCurrentBoardId()
        r.commands.push(Line.getRaw())
        r.commands.push(Line.getRaw())
        const json = JSON.stringify(r);
        sut.onBoardDataReceived(json);

        expect(sut.canvas.drawEntireBoard).toHaveBeenCalledWith(jasmine.any(Array));
        expect(sut.spinnerVisible()).toBeFalsy();
        expect(sut.boards.getCurrentBoardCommandCount()).toBe(2);
      })


      it(`onBoardDataReceived(data)
      ^  data.board_id != _currentBoard.board_id
      => nothing happens`,()=>{

        sut.boards.appendBoard(createSimpleBoard());
        expect(sut.boards.getCurrentBoardCommandCount()).toBe(0);
        const r = BlackBoard.getRaw()
        r.board_id = sut.getCurrentBoardId() + 1
        sut.onBoardDataReceived(JSON.stringify(r));
        expect(sut.boards.getCurrentBoardCommandCount()).toBe(0);
      })






      it('createNewSaveTimer() ^ time = time + 1 => rs.saveCurrentBoard()',done => {
        sut.SAVING_DELAY = 1;
        sut.boards.appendBoard(createSimpleBoard());
        spyOn(sut.remoteService,'saveCurrentBoard');
        sut.createNewSaveTimer(result =>{
          expect(result).toBeTruthy();
          done();
        });
      })

      it(`onFriendToolUpdated(friendId)
        ^ friendId != selectedClassmateId
       => do nothing`,()=>{

         sut._friendsCurrentTool = 'cursor';
         sut.onFriendToolUpdated({friendId:selectedClassmateId,currentTool:'pencil'});
         expect(sut._friendsCurrentTool).toBe('cursor');
      })


      it(`onFriendToolUpdated(friendId, currentTool)
        ^ friendId == selectedClassmateId
        ^ currentTool == pencil
        => friendsCurrentTool == pencil`,()=>{

          sut._friendsCurrentTool = 'cursor';
          sut.selectedClassmateId = selectedClassmateId;
          sut.onFriendToolUpdated({friendId:selectedClassmateId,currentTool:'pencil'});
          expect(sut._friendsCurrentTool).toBe('pencil');
      })


      it('getCurrentTool() returns the users current tool', ()=>{
        expect(sut.getMyCurrentTool()).toBe('cursor');
      })


      it('setMyPencilLine() => remoteService.emitMyPencilLine()', ()=>{
        sut.boards.appendBoard(createSimpleBoard());
        spyOn(sut.remoteService,'emitMyPencilLine');
        sut.setMyPencilLine(Line.getFake());
        expect(sut.remoteService.emitMyPencilLine).toHaveBeenCalledWith(jasmine.objectContaining({
          friend_id:sut.selectedClassmateId,
          board_id:jasmine.any(Number),
          color:sut.white
        }), jasmine.any(Function));
      })


      it('onPencilLineSent() => drawPencilLine()',()=>{
        spyOn(sut.canvas, 'drawMyPencilLine');
        spyOn(sut.boards,'appendLineToCurrentBoard');
        const l = Line.getFake()
        sut.onPencilLineSent(l);
        expect(sut.canvas.drawMyPencilLine).toHaveBeenCalled();
        expect(sut.boards.appendLineToCurrentBoard).toHaveBeenCalled();
      })


      it('setPencilTool() => canvas.setMyToolToPencil() ^ _currentTool == pencil',()=>{
        spyOn(sut.canvas,'setMyToolToPencil');
        sut.setPencilTool();
        expect(sut.canvas.setMyToolToPencil).toHaveBeenCalled();
        expect(sut._myCurrentTool).toBe('pencil');
      })


      it('setEraserTool() => setMyToolToEraser()',()=>{
        spyOn(sut.canvas,'setMyToolToEraser');
        sut.setEraserTool();
        expect(sut.getMyCurrentTool()).toBe('eraser');
        expect(sut.canvas.setMyToolToEraser).toHaveBeenCalled();
      })


      it('setMyEraserPosition(point) => remoteService.emitMyEraserPosition()',()=>{

        sut.boards.appendBoard(createSimpleBoard());
        let point = {
                    x:0.3,
                    y:0.4,
                    };

        let modifiedPoint = {
          x:0.3,
          y:0.4,
          boardId:sut.getCurrentBoardId(),
          friendId:sut.selectedClassmateId
        }

        spyOn(sut.remoteService,'emitMyEraserPosition');
        sut.setMyEraserPosition(point);
        expect(sut.remoteService.emitMyEraserPosition).toHaveBeenCalledWith(modifiedPoint);
      })


      it('initialize() => attachOnFriendsEraserPositionUpdateCallback', ()=>{
        spyOn(sut.remoteService,'attachOnFriendsEraserPositionUpdateCallback');
        sut.onAuth({state:'authenticated', id:'2'});
        expect(sut.remoteService.attachOnFriendsEraserPositionUpdateCallback).toHaveBeenCalled();
      })

      it(`onFriendsEraserPositionReceived() ^ matching friendIds ^ matching boardIds => drawFriendsEraser`, ()=>{
        spyOn(sut.canvas,'drawFriendsEraser');
        sut.boards.appendBoard(createSimpleBoard());
        let update = {
          friendId:sut.selectedClassmateId,
          boardId:sut.getCurrentBoardId(),
          position:{x:0,y:1}
        }
        sut.onFriendsEraserPositionReceived(update);
        expect(sut.canvas.drawFriendsEraser).toHaveBeenCalled();
      })


      it(`onFriendsEraserPositionUpdate() ^ matching friendIds ^ Not mathcing boardIds => drawFriendPositionHintMarker()`, ()=>{
        spyOn(sut,'drawFriendPositionHintMarker');
        spyOn(sut.canvas,'drawFriendsEraser');
        sut.boards.appendBoard(createSimpleBoard());

        let update = {
          friendId:sut.selectedClassmateId,
          boardId:sut.getCurrentBoardId() + 1,
          position:{x:0,y:1}
        }
        sut.onFriendsEraserPositionReceived(update);
        expect(sut.drawFriendPositionHintMarker).toHaveBeenCalled();
      })


      it('setMyEraserDown(point) => remoteService.emitMyEraserDown',()=>{

        spyOn(sut.remoteService,'emitMyEraserDown');
        spyOn(sut.boards,'getCurrentBoardId');
        sut.boards.appendBoard(createSimpleBoard());
        let point = {x:0,y:1};
        sut.setMyEraserDown(point);
        expect(sut.remoteService.emitMyEraserDown).toHaveBeenCalled();
        expect(sut.boards.getCurrentBoardId).toHaveBeenCalled();
      })


      it('onMyEraserDown() => .canvas.eraserArea(radius, center)',()=>{
        spyOn(sut.canvas,'eraseArea');
        spyOn(sut.boards,'pushEraserCallOntoState');
        let point = {x:1,y:2};
        sut.onEraseSent(point);
        expect(sut.canvas.eraseArea).toHaveBeenCalledWith(jasmine.any(Object));
      })


      it('initialize() => attachFriendsEraserDownCallback(cb)',()=>{
        spyOn(sut.remoteService,'attachFriendsEraserDownCallback');
        sut.onAuth({state:'authenticated', id:'2'});
        expect(sut.remoteService.attachFriendsEraserDownCallback).toHaveBeenCalled();
      })

      it('onUserStateChange(authenticated) => registerOnNewSharedBoardRecievedCallback(fn)', ()=>{
        spyOn(sut.remoteService,'registerOnBoardTrashedCallback');
        sut.onAuth({state:'authenticated', id:'2'});
        expect(sut.remoteService.registerOnBoardTrashedCallback).toHaveBeenCalled();
      })

      it('onUserStateChange(authenticated) => registerOnFriendTrashedBoard',()=>{
        spyOn(sut.remoteService,'registerOnFriendTrashedBoard');
        sut.onAuth({state:'authenticated', id:'2'});
        expect(sut.remoteService.registerOnFriendTrashedBoard).toHaveBeenCalled();
      })

      it('onUserStateChange(authenticated) => setPencilTool()',()=>{
        spyOn(sut,'setPencilTool');
        sut.onAuth({state:'authenticated', id:'2'});
        expect(sut.setPencilTool).toHaveBeenCalled();
      })

      it('onUserStateChange(authenticated) => registerOnTrashBoardUndone(callback)',()=>{
        spyOn(sut.remoteService,'registerOnTrashBoardUndone');
        sut.onAuth({state:'authenticated', id:'2'});
        expect(sut.remoteService.registerOnTrashBoardUndone).toHaveBeenCalled();
      })


      it('onFriendsEraserDown(update) => cavnas.eraseArea', ()=>{

          const boardId = 1
          const c = BlackboardCollection.getFake()
          sut.setBoardCollection(c)
          const f = sut.selectedClassmateId
          const b = sut.getCurrentBoardId()
          const e = RemoteErase.getRaw()

          spyOn(sut.canvas,'friendEraseArea');
          spyOn(sut.boards,'pushEraserCallOntoState');
          spyOn(sut,'getCurrentBoardId').and.returnValue(boardId)


          e.friend_id = f
          e.board_id = b
          sut.onFriendsEraserDown(e);
          expect(sut.canvas.friendEraseArea).toHaveBeenCalled();
          expect(sut.getCurrentBoardId).toHaveBeenCalled();
      })

      let getEraserObject = ()=>{
        return {
                point:{x:1,y:2},
                radius:0.1
              }
      }

    it('possiblySaveState() ^ currentBoardExists ^ _currentBoard.dirty == true => save',()=>{
        let board = createSimpleBoard();
        sut.boards.appendBoard(board);
        sut.boards._getCurrentBoard().setDirty();
        spyOn(sut.boards,'isNotEmpty').and.returnValue(true);
        spyOn(sut.remoteService,'saveCurrentBoard');
        sut.possiblySaveState();
        expect(sut.remoteService.saveCurrentBoard).toHaveBeenCalledWith(jasmine.any(Object));
        expect(sut.boards.isNotEmpty).toHaveBeenCalled();
    })


    it('possiblySaveState() ^ isEmpty == true => do nothing.',()=>{
        let board = createSimpleBoard();
        sut.boards.appendBoard(board);
        sut.boards._getCurrentBoard().setDirty();
        spyOn(sut.boards,'isNotEmpty').and.returnValue(false);
        spyOn(sut.remoteService,'saveCurrentBoard');
        sut.possiblySaveState();
        expect(sut.remoteService.saveCurrentBoard).not.toHaveBeenCalled();
        expect(sut.boards.isNotEmpty).toHaveBeenCalled();
    })

   it('trashCurrentBoard() ^ boards.isEmpty == false => remoteService.trashBoard(boardId)', () => {
     spyOn(sut.remoteService,'trashBoard');
     let boardId = 2;
     spyOn(sut,'getCurrentBoardId').and.returnValue(boardId);

     sut.spinnerVisible(false);
     let friendId = 3;
     sut.selectedClassmateId = friendId;
    spyOn(sut,'possiblySaveState');

     sut.trashCurrentBoard();
     expect(sut.remoteService.trashBoard).toHaveBeenCalledWith(boardId,friendId);
     expect(sut.spinnerVisible()).toBeTruthy();
     expect(sut.recentlyTrashedBoards().length).toBe(0);
     expect(sut.possiblySaveState).toHaveBeenCalled();
   })

   it('onBoardTrashed(json) => push undo stack ^ remoteService.getSharedBoards(friendId)',() => {
     spyOn(sut.remoteService,'getSharedBoards');
     let boardId = 52;
     let json = JSON.stringify({boardId:boardId});
     sut.onBoardTrashed(json);
     expect(sut.remoteService.getSharedBoards).toHaveBeenCalled();
     expect(sut.recentlyTrashedBoards().length).toBe(1);
     expect(sut.recentlyTrashedBoards()[0]).toBe(boardId);
   })

   it('undoTrashBoard() ^ recentlyTrashedBoards.length == 0 => throw', ()=>{

     let f = ()=>{
       sut.undoTrashBoard();
     }
     expect(f).toThrow(new Error('Cannot undo because there is no recently trashed boards.'));
   })

   it('emailBoard does just that',()=>{
      const png = {}
      sut.currentFriendId = 1

      spyOn(sut.canvas,'getPNG').and.returnValue(png)
      spyOn(sut.remoteService,'emailBlackboard')
      expect(sut.isWaitingForEmail()).toBeFalsy()
      sut.emailBoard(png)

      const expected = {friendId:1, img:png}
      expect(sut.remoteService.emailBlackboard).toHaveBeenCalledWith(jasmine.any(Object), sut.onBlackboardEmailed)
      expect(sut.isWaitingForEmail()).toBeTruthy()
   })

   it('onBlackboardEmailed => showEmailCheckmark()',()=>{
    expect(sut.showEmailCheckmark()).toBeFalsy()
    sut.isWaitingForEmail(true)
    sut.onBlackboardEmailed()
    expect(sut.isWaitingForEmail()).toBeFalsy()
    expect(sut.showEmailCheckmark()).toBeTruthy()
   })


   it('undoTrashBoard() => remoteService.undoTrashBoard(mostRecentBoardTrashed, friendId)',()=>{
     let boardId = 3;
     sut.recentlyTrashedBoards.push(boardId);
     let boardId2 = 4;
     sut.recentlyTrashedBoards.push(boardId2);
     let friendId = 5;
     sut.selectedClassmateId = friendId;
     spyOn(sut.remoteService,'undoTrashBoard');
     spyOn(sut,'possiblySaveState')
      sut.undoTrashBoard();

      expect(sut.possiblySaveState).toHaveBeenCalled()
      expect(sut.remoteService.undoTrashBoard).toHaveBeenCalledWith(boardId2,friendId);
   })


         it('onTrashBoardUndone() => getSharedBoards(currentFriendId)', ()=>{
           spyOn(sut.remoteService,'getSharedBoards');
           sut.onTrashBoardUndone();
           expect(sut.remoteService.getSharedBoards).toHaveBeenCalled();
         })

         it('onFriendTrashedBoard(invalidId) throws ', ()=>{
           let f = ()=>{
             sut.onFriendTrashedBoard(null);
           }
           expect(f).toThrow(new Error("Invalid trash board command,  friendId is required."));
         })

         it('onFriendTrashedBoard(fId == currentId && curBoardId == boardID) => getSharedBoards', ()=>{
           spyOn(sut.remoteService,'getSharedBoards');
           let boardId = 5;
           spyOn(sut,'getCurrentBoardId').and.returnValue(boardId);
           sut.selectedClassmateId = 4;
           let info = {
             friendId:4,
             boardId:boardId
           }
           sut.onFriendTrashedBoard(JSON.stringify(info));
           expect(sut.remoteService.getSharedBoards).toHaveBeenCalled();
         })

         it('onFriendTrashedBoard(fId != currentId) => do nothing.', ()=>{
           spyOn(sut.remoteService,'getSharedBoards');
           let friendId = 4;
           sut.selectedClassmateId = friendId;
           let boardId = 5;
           spyOn(sut,'getCurrentBoardId').and.returnValue(boardId);
           let info = {
             friendId:friendId + 1,
             boardId:boardId
           }
           sut.onFriendTrashedBoard(JSON.stringify(info));
           expect(sut.remoteService.getSharedBoards).not.toHaveBeenCalled();
         })


         it('onFriendTrashedBoard(boardId != currentBoardId) => do nothing.', ()=>{
           spyOn(sut.remoteService,'getSharedBoards');
           let boardId = 20;
           spyOn(sut,'getCurrentBoardId').and.returnValue(boardId);
           let friendId = 4;
           sut.selectedClassmateId = friendId;
           let info = {
             friendId:friendId,
             boardId:boardId + 1
           }
           sut.onFriendTrashedBoard(JSON.stringify(info));
           expect(sut.remoteService.getSharedBoards).not.toHaveBeenCalled();
         })


         it(`onFriendRestoredBoard(valid info)
           ^ friendId == selectedClassmateId
          => getSelectedBoards(friendId)`,()=>{

           spyOn(sut.remoteService,'getSharedBoards');
           let friendId = 5;
           sut.selectedClassmateId = friendId;
           let info = {
             friendId:friendId,
             boardId:6
           }
           sut.onFriendRestoredBoard(info);
           expect(sut.remoteService.getSharedBoards).toHaveBeenCalled();
         })


     })

   })
