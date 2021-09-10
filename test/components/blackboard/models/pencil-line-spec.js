
define(['blackboard/models/Line'],
function(Line){

    describe("Line Tests",() => {

      it('getColor returns the set color', ()=>{
        const s = Line.getFake()
        const c = '#111111'
        s.setColor(c)
        expect(s.getColor()).toBe(c)
      })

      it('serialize make it transportable so it can be re-intanciated.',()=>{
        const s = Line.getFake().serialize()
        const r = Line.getRaw()
        expect(s.color).toBe(r.color)
        expect(s.board_id).toBe(r.board_id)
        expect(s.friend_id).toBe(r.friend_id)
        expect(s.x0).toBe(r.x0)
        expect(s.x1).toBe(r.x1)
        expect(s.y0).toBe(r.y0)
        expect(s.y1).toBe(r.y1)
        expect(s.kind).toBe(r.kind)
      })

      it('throws if the line attribute is not there.',()=>{
        try{
          const data = {x0:0, y0:0, x1:0, x2:0}
          new Line(data)
          expect(false).toBe(true,'Error expected!')
        } catch(err){
          expect(err.message).toBe('kind was expected to be of type line.')
        }
      })

      it('getColor() == #fffff1',()=>{
        const line = Line.getFake()
        expect(line.getColor()).toBe(Line.getDefaultColor())
      })

      it('isLine() == true', ()=>{
        const line = Line.getFake()
        expect(line.isLine()).toBeTruthy()
      })

      it('sets the boardId',()=>{
        const r = Line.getRaw()
        const l = new Line(r)
        expect(l.getBoardId()).toBe(r.board_id)
      })

      it('sets the friendId',()=>{
        const r = Line.getRaw()
        const l = new Line(r)
        expect(l.getFriendId()).toBe(r.friend_id)
      })

      it('isOnBoard(num) == true if the num matches the lines board num.',()=>{
        const l = Line.getFake()
        expect(l.isOnBoard(l.getBoardId())).toBeTruthy()
      })

      it('isOnBoard(num) == false if the num does not match the lines board num.',()=>{
        const l = Line.getFake()
        expect(l.isOnBoard(1 + l.getBoardId())).toBeFalsy()
      })

      it('getEndPoint() returns the x and y of the end point',()=>{
        const l = Line.getFake()
        const p = l.getEndPoint()
        expect(p.getX()).toBe(l.getEndX())
        expect(p.getY()).toBe(l.getEndY())
      })

      it('sets x0',()=>{
        const r = Line.getRaw()
        const l = new Line(r)
        expect(l.getStartX()).toBe(r.x0)
      })

      it('sets y0',()=>{
        const r = Line.getRaw()
        const l = new Line(r)
        expect(l.getStartY()).toBe(r.y0)
      })


      it('sets x1',()=>{
        const r = Line.getRaw()
        const l = new Line(r)
        expect(l.getEndX()).toBe(r.x1)
      })

      it('sets y1',()=>{
        const r = Line.getRaw()
        const l = new Line(r)
        expect(l.getEndY()).toBe(r.y1)
      })

      it('getFake() does that.', ()=>{
        const f = Line.getFake()
        expect(f instanceof Line).toBeTruthy()
      })




     })
  })
