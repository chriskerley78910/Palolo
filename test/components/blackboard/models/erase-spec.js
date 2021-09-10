
define(['blackboard/models/Erase'],
function(Erase){

    describe("Erase Tests",() => {

      it('serialize does that.',()=>{
        const e = Erase.getFake()
        const s = e.serialize()
        expect(e.x).toBe(e.x)
        expect(e.y).toBe(e.y)
        expect(e.r).toBe(e.r)
      })


      it('isLine() == false', ()=>{
        const e = Erase.getFake()
        expect(e.isLine()).toBeFalsy()
      })

      it('sets y',()=>{
        const r = Erase.getRaw()
        const l = new Erase(r)
        expect(l.getY()).toBe(r.y)
      })


      it('sets x',()=>{
        const r = Erase.getRaw()
        const l = new Erase(r)
        expect(l.getX()).toBe(r.x)
      })

      it('sets rad',()=>{
        const r = Erase.getRaw()
        const l = new Erase(r)
        expect(l.getRad()).toBe(r.r)
      })



      it('getFake() does that.', ()=>{
        const f = Erase.getFake()
        expect(f instanceof Erase).toBeTruthy()
      })




     })
  })
