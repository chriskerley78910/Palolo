
define(['auth/AuthRemoteService'],
        function(AuthRemoteService){

    describe("Test AuthRemoteService", function(){
      let service = null;
      beforeEach(()=>{
        service = new AuthRemoteService();
      })

      it('getHost() returns www.auth. when in live mode', ()=>{
        expect(service.getHost()).toBe('');
        expect(service.getMicroServer()).toBe('auth.');
      })

      it('getPath() returns /Auth.php in either mode', ()=>{
        expect(service.getPath()).toBe('/Auth.php');
      })

      it('getServerURL() is http://auth.localhost/Auth.php  in devmode', () =>{
        expect(service.getServerURL()).toBe('http://auth.localhost/Auth.php');
      })
    }); // end describe

}); // end define.
