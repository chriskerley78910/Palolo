

define(['blackboard/boards/BlackboardCollection',
        'blackboard/boards/BlackBoard',
        'blackboard/models/Erase',
        'blackboard/models/Line'],
function(BlackboardCollection,
         BlackBoard,
         Erase,
         Line){


  describe('Test BlackboardCollection',function(){

      let sut = null;
      beforeEach(()=>{
        sut = BlackboardCollection.getFake()
      })

      let createSimpleBoard = ()=>{
        return {
          last_loaded:'2017-05-14T18:16:01.001Z',
          board_id:1,
          board_url:'https:/something.com'
        }
      }


      it('appendCommandsToCurrentBoard does just that,', ()=>{
        var commands = [Line.getFake(), Line.getFake()]
        var before = sut.getCurrentBoardDeepCopy()
        expect(before.isDirty()).toBeFalsy()
        expect(before.getCommandCount()).toBe(0)
        sut.appendCommandsToCurrentBoard(commands)
        var after = sut.getCurrentBoardDeepCopy();
        expect(after.getCommandCount()).toBe(2)
      })


      it('getBoardById() == null', ()=>{
        const b = sut.getBoardById(10)
        expect(b).toBeNull()
        const b2 = sut.getBoardById(1)
        expect(b2).not.toBeNull()
      })

      it('appandCommandToAnotherBoard(line) => updates that board.', ()=>{
        const line = Line.getFake()
        const lastBoard = sut.getLastBoard()
        line.setBoardId(lastBoard.getId())
        expect(lastBoard.isDirty()).toBeFalsy()
        expect(lastBoard.getCommandCount()).toBe(0)
        sut.appandCommandToAnotherBoard(line)

        expect(lastBoard.isDirty()).toBeTruthy()
        expect(lastBoard.getId() != sut.getCurrentBoardId())
        expect(lastBoard.getCommandCount()).toBe(1)
      })

      it('pushEraserCallOntoState throw if the command is not Boardable',()=>{
        try{
          spyOn(sut,'isEmpty').and.returnValue(false)
          sut.pushEraserCallOntoState({isBoardable:false})
          expect(false).toBe(true,'Error expected!')
        }catch(err){
          expect(err.message).toBe('Can only add Boardable objects to a Blackboards state.')
        }
      })

      it('getBoards() == [] on initialization', ()=>{
        expect(Array.isArray(sut.getBoards())).toBeTruthy();
        expect(sut.getBoards().length).toBe(2);
      })

      it('setBoards([{last_loaded:datetime}]) does just that.', ()=>{
        let arr = [{last_loaded:'2017-05-14T18:16:01.001Z',board_id:5,board_url:'string'}];
        sut.setBoards(arr);
        expect(sut.getBoards().length).toBe(1);
      })

      it('setBoards([]) makes a entirely new set of boards.',()=>{
        let b1 = createSimpleBoard();
        b1.board_id = 1;
        let b2 = createSimpleBoard();
        b2.board_id = 2;
        sut.setBoards([b1]);
        expect(sut.getCount()).toBe(1);
        sut.setBoards([b2]);
        expect(sut.getCount()).toBe(1);
        expect(sut.getCurrentBoardId()).toBe(2);
      })

      it('setBoards(not array) throws', ()=>{
        expect(()=>{sut.setBoards(null)}).toThrow(new Error("Needs to be an array."));
      })

      it('setBoards([]) throws', ()=>{
        expect(()=>{sut.setBoards([])}).toThrow(new Error("Needs to have at least one element."));
      })


      it(`setBoards([{last_loaded:'2017-05-14T18:16:01.001Z'}])
       => findMostRecentlyLoadedBoard(boards)
        ^ getLastViewedBoardIndex(board)`,()=>{

        let boards = [{last_loaded:'2017-05-14T18:16:01.002Z',board_id:3,board_url:'string'}];
        spyOn(sut,'getLastViewedBoardIndex').and.callThrough();
        sut.setBoards(boards);
        expect(sut.getLastViewedBoardIndex).toHaveBeenCalled();
        expect(sut.getCurrentBoardIndex()).toBe(0);
      })


      it('setCurrentBoardIndex(index) throw if the index is too small.',()=>{
        let index = -1;
        let f = ()=>{
              sut.setCurrentBoardIndex(index);
        }
        expect(f).toThrow(new Error('Invalid index.'));
      })

      it('setCurrentBoardIndex(index) does that if its in bounds.',()=>{

        let board = createSimpleBoard();
        sut.appendBoard(board);
        sut.appendBoard(board);
        let f = ()=>{
          sut.setCurrentBoardIndex(0);
        }
        expect(f).not.toThrow(new Error('Invalid index.'));
        expect(sut.getCurrentBoardIndex()).toBe(0);
      })

      it('setCurrentBoardIndex(index) throw if the index is too large.',()=>{
        let f = ()=>{
          sut.setCurrentBoardIndex(sut.getCount());
        }
        expect(f).toThrow(new Error('Invalid index.'));
      })


      it('getCurrentBoardDeepCopy() returns a deep copy of the currentBoard', ()=>{

        const board = createSimpleBoard();
        sut.appendBoard(board);
        sut.setCurrentBoardIndex(sut.getCount() - 1);
        const copy = sut.getCurrentBoardDeepCopy();
        expect(copy.getLastTimeLoadedISO()).toBe(board.last_loaded);
        expect(copy.getId()).toBe(1);
        expect(copy.getURL()).toBe('https:/something.com');
        copy.setLastTimeLoaded(new Date(42).toISOString());
        let anotherCopy = sut.getCurrentBoardDeepCopy();
        expect(anotherCopy.getLastTimeLoadedISO()).toBe(board.last_loaded);
      })


      it('getCurrentBoardCommands() returns a copy of the state',()=>{
          let board = createSimpleBoard();
          sut.appendBoard(board);
          // sut.setCurrentBoard(board);
          let copy = sut.getCurrentBoardCommands();
          expect(copy.length).toBe(0);
          copy.push(1)
          let anotherCopy = sut.getCurrentBoardCommands();
          expect(anotherCopy.length).toBe(0);
      })

      it('getBoards() returns a copy of boards.', ()=>{
        let boards = [{last_loaded:'2017-05-14T18:16:01.001Z',board_id:5,board_url:'werre'},
                      {last_loaded:'2017-05-14T18:16:01.002Z',board_id:6,board_url:'dfwef'}];
        sut.setBoards(boards);
        let copy = sut.getBoards();
        copy.push(3);
        let anotherCopy = sut.getBoards();
        expect(anotherCopy.length).toBe(2);
      })


      it('getCurrentBoardURL() does just that.',()=>{
        let boards = [{last_loaded:'2017-05-14T18:16:01.001Z', board_id:5, board_url:'dfdsf'}];
        sut.setBoards(boards);
        expect(sut.getCurrentBoardURL()).toBe('dfdsf');
      })

      it('getCurrentBoardId() does just that.', ()=>{
        let boards = [{last_loaded:'2017-05-14T18:16:01.001Z',board_id:5,board_url:'url'}];
        sut.setBoards(boards);
        expect(sut.getCurrentBoardId()).toBe(5);
      })


      it('setCurrentBoardById(board)',()=>{
        const b1 = BlackBoard.getRaw()
        const b2 = BlackBoard.getRaw()
        const boards = [b1,b2];
        expect(b1.board_id != b2.board_id)
        sut.setBoards(boards);
        expect(sut.getCurrentBoardId()).toBe(b1.board_id);
        sut.setCurrentBoardById(b2.board_id);
        expect(sut.getCurrentBoardId()).toBe(b2.board_id);
      })

      it('setCurrentBoardById() throws if the id does not match one in the set.',()=>{

        let f = () =>{
          let board1 = {last_loaded:'2017-05-14T18:16:01.001Z',board_id:5,board_url:'string'}
          let boards = [board1];
          sut.setBoards(boards);
          sut.setCurrentBoardById(-1);
        }
        expect(f).toThrow(new Error("That boardId does not exist in the board set."));
      })
      it('appendBoard(board), index == null =>  index == 0',()=>{
        sut.deleteAll()
        expect(sut.getCurrentBoardIndex()).toBeNull()
        const b = BlackBoard.getRaw()
        sut.appendBoard(b);
        expect(sut.getCurrentBoardIndex()).toBe(0)
      })

      it('appendBoard(board) => inserts at the end.',()=>{
        let boards = [{last_loaded:'2017-05-14T18:16:01.001Z',board_id:5,board_url:'url'}];
        sut.setBoards(boards);
        let board = {last_loaded:'2017-05-14T18:16:01.001Z',board_id:1,board_url:'url'}
        sut.appendBoard(board);
        expect(sut.getLastBoard().getId()).toBe(1)
      })

      it('setIndexToLastBoard(board) does just that.', ()=>{
        const firstBoardId = 5
        let boards = [{last_loaded:'2017-05-14T18:16:01.001Z',board_id:firstBoardId,board_url:'url'}];
        sut.setBoards(boards);
        const lastBoardId = 1
        let board1 = {last_loaded:'2017-05-14T18:16:01.001Z',board_id: lastBoardId, board_url:'url'}
        sut.appendBoard(board1);
        expect(sut.getCurrentBoardId()).toBe(firstBoardId);
        sut.setIndexToLastBoard()
        expect(sut.getCurrentBoardId()).toBe(lastBoardId);
      })


      it('setBoards erases the previous boards.', ()=>{
        expect(sut.getCount()).toBe(2);
        const boards = [BlackBoard.getRaw()];
        sut.setBoards(boards);
        expect(sut.getCount()).toBe(1);
      })

      it('getCount() does just that.',()=>{
        const board = BlackBoard.getRaw()
        expect(sut.getCount()).toBe(2);
        sut.appendBoard(board);
        expect(sut.getCount()).toBe(3);
      })

      it('pushEraserCallOntoState() => state size ++ and boardDirty() == true',()=>{

        let board = createSimpleBoard();
        sut.appendBoard(board);
        expect(sut.isCurrentBoardDirty()).toBeFalsy();
        expect(sut.getCurrentBoardCommandCount()).toBe(0);
        const e = Erase.getFake()
        sut.pushEraserCallOntoState(e);
        expect(sut.isCurrentBoardDirty()).toBeTruthy();
        expect(sut.getCurrentBoardCommandCount()).toBe(1);
      })


      it('currentBoard == null ^ pushEraserCallOntoState() => throws',()=>{
        let f = ()=>{
          sut.pushEraserCallOntoState({})
        }
        expect(f).toThrow(new Error("Can only add Boardable objects to a Blackboards state."));
      })


      it(`pushEraserCallOntoState(eraseCall)
        => _currentBoard.state.length++
         ^ _currentBoardisdirty == true
         ^ Numb has new element`,()=>{
        const b = createSimpleBoard()
        sut.appendBoard(b);
        const r = Erase.getFake()
        sut.pushEraserCallOntoState(r);
        expect(sut.isCurrentBoardDirty()).toBeTruthy();
        expect(sut.getCurrentBoardCommandCount()).toBe(1);
        const c = sut.getCurrentBoardCommands();
        const e = c[0]
        expect(e.getRad()).toBe(0.1);
        expect(e.getX()).toBe(r.x);
        expect(e.getY()).toBe(r.y);
        expect(sut.getCurrentBoardCommands().length).toBe(1);
      })


      it('appendLineToCurrentBoard(none line) throws', ()=>{
        sut._currentBoardIndex = 0
        const b = BlackBoard.getFake()
        sut._boards = [b]
        let f = () => {sut.appendLineToCurrentBoard(''); }
        expect(f).toThrow(new Error('Expected a Boardable command.'));
      })


      it('appendLineToCurrentBoard({p0, p1}) => stateSize++ ^ currentBoardDirty == true', () => {
        sut.appendBoard(createSimpleBoard());
        expect(sut.getCurrentBoardCommandCount()).toBe(0);
        const l = Line.getFake()
        sut.appendLineToCurrentBoard(l);
        expect(sut.isCurrentBoardDirty()).toBeTruthy();
        expect(sut.getCurrentBoardCommandCount()).toBe(1);
        let board = sut.getCurrentBoardDeepCopy();
        expect(board.getCommands().length).toBe(1);
      })


      it('setCurrentBoardCommands(array of line) does just that.', () =>{
        sut.appendBoard(createSimpleBoard());
        let lineCommand = [{p0:1, p1:1},
                           {p0:1, p1:2}];
        sut.setCurrentBoardCommands(lineCommand);
        expect(sut.getCurrentBoardCommandCount()).toBe(2);
      })

      it('_getCurrentBoard() throws if no current board exists.', ()=>{
        let f = ()=>{
          sut.deleteAll()
          sut._getCurrentBoard();
        }
        expect(f).toThrow(new Error('Current board has not been initialized.'));
      })

      it('deleteAll() does just that.', ()=>{
        sut.appendBoard(BlackBoard.getRaw());
        sut.appendBoard(BlackBoard.getRaw());
        expect(sut.getCount()).toBe(4);
        sut.deleteAll();
        expect(sut.getCount()).toBe(0);

      })

  }); // end describe.


});  // end define.
