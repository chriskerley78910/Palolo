define(['RemoteService'],
function(RemoteService){

    describe("Test RemoteService", function(){
      let sut = null;
      beforeEach(()=>{
        sut = new RemoteService();
      })

      it('isLive() throws an error',()=>{
        try{
          sut.isLive()
          expect(false).toBe(true,'expected an exception.')
        } catch(err){
          expect(err.message).toBe('isLive() must be implemented in subclasses.')
        }
      })

      it('has io set', ()=>{
        expect(sut.io).not.toBeNull();
      })



      it('getAccessToken() does just that.' ,()=>{
        window.localStorage.setItem('accessToken','fake');
        expect(sut.getAccessToken()).toBe('fake');
      })



      it('getPort() ^ none set == empty string', ()=>{
        sut.setPort('');
        expect(sut.getPort()).toBe('');
      })

      it('getPort(80) ^ 80 => :80 ', ()=>{
        sut.setPort('80');
        expect(sut.getPort()).toBe(':80');
      })

      it('setDomain("") => returns domain nothing', ()=>{
        expect(sut.getDomain()).toBe('');
      })

      it('setPath() only adds a / if its not the empty string', ()=>{
        sut.setPath('');
        expect(sut.getPath()).toBe('');
        sut.setPath('Auth.php');
        expect(sut.getPath()).toBe('/Auth.php');
      })


      it('setSock does not do it more than once.',()=>{
        sut.setFakeToken();
        sut.setMicroServer('test');
        sut.setSock();
        const s1 = sut.sock;
        sut.setSock();
        const s2 = sut.sock;
        expect(s1 == s2).toBeTruthy();
      })

      it('flatten does just that.', ()=>{
        var Parent = function(){
          this.parentProp = 5;
        }
        var Child = function(){
          Object.setPrototypeOf(this, new Parent())
          this.childProp = 2;
        }
        var c = new Child()
        var flattened = sut.flatten(c)
        var json = JSON.stringify(flattened)
        var parsed = JSON.parse(json)
        expect(parsed.childProp).toBe(2)
        expect(parsed.parentProp).toBe(5)
      })

    }); // end describe

}); // end define.
