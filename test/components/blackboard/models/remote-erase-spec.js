
define(['blackboard/models/RemoteErase',
        'blackboard/models/Erase'],
function(RemoteErase, Erase){

    describe("Remotable Tests",() => {

      let sut
      let raw

      beforeEach(()=>{
        sut = RemoteErase.getFake()
        raw = RemoteErase.getRaw()
      })


      it('serialize() converts to sendable',()=>{
        const e = RemoteErase.getFake()
        const s = e.serialize()
        expect(s.x).toBe(e.getX())
        expect(s.y).toBe(e.getY())
        expect(s.r).toBe(e.getRad())
        expect(s.board_id).toBe(e.getBoardId())
        expect(s.friend_id).toBe(e.getFriendId())
      })

        it('create does just that', ()=>{
          const x = 0.5
          const y = 0.6
          const r = 0.2
          const e = RemoteErase.create(x,y,r)
          expect(e.getX()).toBe(x)
          expect(e.getY()).toBe(y)
          expect(e.getRad()).toBe(r)
        })


        it('extends Erase',()=>{
          expect(sut instanceof Erase).toBeTruthy()
        })

      it('throw if x is not normalized', ()=>{
        try{
          sut.setX(2)
          expect(false).toBe(true,'Expected error.')
        }catch(err){
          expect(err.message).toBe('x must be between 0 and 1')
        }
      })

      it('throw if y is not normalized', ()=>{
        try{
          sut.setY(2)
          expect(false).toBe(true,'Expected error.')
        }catch(err){
          expect(err.message).toBe('y must be between 0 and 1')
        }
      })

        it('isForCurrentBoard() == true iff the friend and url match', ()=>{
          const friendId = 1
          const boardId = 2
          sut.setFriendId(friendId)
          sut.setBoardId(boardId)
          const r = sut.isForCurrentBoard(friendId, boardId)
          expect(r).toBeTruthy()
        })

        it('sets boardId',()=>{
          expect(sut.getBoardId()).toBe(raw.board_id)
        })

        it('sets friendId', ()=>{
          expect(sut.getFriendId()).toBe(raw.friend_id)
        })

     })
  })
