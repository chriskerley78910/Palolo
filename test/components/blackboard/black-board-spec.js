

define(['blackboard/boards/BlackBoard',
        'blackboard/models/Line'],
function(BlackBoard,
         Line){


  describe('Test BlackBoard',function(){

      let sut = null;
      beforeEach(()=>{
        sut = BlackBoard.getFake()
      })


      it('setLastModified() does just that', ()=>{
        sut.setLastModified(0)
        expect(sut.getLastModifiedMillis()).toBe(0)
      })

      it('append(line) =>  isDirty() == true, updates getLastModifiedMillis', ()=>{
          expect(sut.getLastModifiedMillis()).toBe(0)
          expect(sut.isDirty()).toBeFalsy()
          const line = Line.getFake()
          sut.append(line)
          expect(typeof sut.getLastModifiedMillis() == 'number').toBeTruthy()
          expect(sut.isDirty()).toBeTruthy()
      })


      it('throws if the board_id is not well formed.', ()=>{
        let f = ()=>{
          new BlackBoard();
        }
        expect(f).toThrow(new Error('Board data must be passed to constructor.'));
      })

      it('throews if last_loaded is not a number or negative.' ,()=>{
        let f = ()=>{
          new BlackBoard({});
        }
        expect(f).toThrow(new Error('board_id missing or not a number.'));
      })

      it('throw board_id missing or not a number', ()=>{
        let f = ()=>{
          let board = {
            last_loaded:'2017-05-14T18:16:01.001Z'
          }
          new BlackBoard(board);
        }
        expect(f).toThrow(new Error('board_id missing or not a number.'));
      })

      it('throws board_url missing or not a string.', ()=>{
        let f = ()=>{
          let board = {
            last_loaded:'2017-05-14T18:16:01.001Z',
            board_id:1
          }
          new BlackBoard(board);
        }
       expect(f).toThrow(new Error('board_url missing or not a string.'));
      })

      it('creates a BlackBoard() otherwise' ,()=>{

        let rawData = {
          board_id:1,
          board_url:'string',
          last_loaded:'2017-05-14T18:16:01.001Z'
        }
        let board = new BlackBoard(rawData);
        expect(board.getId()).toBe(1)
        expect(board.getURL()).toBe('string');
        expect(board.getLastTimeLoadedMillis()).toBe(1494785761001);
        expect(board.getCommands().length).toBe(0);

      })



  }); // end describe.


});  // end define.
