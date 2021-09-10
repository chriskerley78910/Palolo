
define(['dispatcher/Dispatcher'], function(Dispatcher){

    describe("Test Dispacher", function(){

      it('registerCallback(name, cb) does just that.', ()=>{
        let cb = ()=>{}
        let dis = new Dispatcher();
        dis.reg('name',cb);
        let result = dis.getCallback('name');
        expect(result).toBe(cb);
      })

      it('registerCallback() returns a unqiue id number for that callback', ()=>{
        let dis = new Dispatcher();
        let f1 = () => {}
        let f2 = () => {}
        let id1 = dis.reg('cb1',f1);
        let id2 = dis.reg('cb2',f2);
        expect(dis.getCallback('cb1')).toBe(f1);
        expect(dis.getCallbackById(id1)).toBe(f1);
        expect(dis.getCallbackById(id2)).toBe(f2);
        expect(dis.getCallbackById(id1)).not.toBe(f2);
      })

      it('dispatch(name, data) => forall cbs | cb.name == name => cb(data)',()=>{
        let cb1 = jasmine.createSpy();
        let cb2 = jasmine.createSpy();
        let cb3 = jasmine.createSpy();
        let dis = new Dispatcher();
        dis.reg('name',cb1);
        dis.reg('name',cb2);
        dis.reg('something else',cb3);
        dis.dispatch('name','data');
        expect(cb1).toHaveBeenCalledWith('data');
        expect(cb2).toHaveBeenCalledWith('data');
        expect(cb3).not.toHaveBeenCalledWith('data');
      })





    }); // end describe

}); // end define.
