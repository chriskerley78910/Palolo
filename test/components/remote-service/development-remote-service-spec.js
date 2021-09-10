define(['ActiveRemoteService'],
function(ActiveRemoteService){

    describe("Test DevelopmentRemoteService", function(){

      let service = null;
      beforeEach(()=>{
        service = new ActiveRemoteService();
      })

      it('isLive() == false',()=>{
        expect(service.isLive()).toBeFalsy()
      })

      it('extends RemoteService', ()=>{
        let proto = Object.getPrototypeOf(service);
        expect(proto.constructor.name).toBe('RemoteService');
      })

      it('getScheme() returns http by default', ()=>{
          expect(service.getScheme()).toBe('http://');
      })

      it('setHost(host) sets the host.', ()=>{
        service.setHost('www');
        expect(service.getHost()).toBe('www.');
      })

      it('getMicroServer() == ""',()=>{
        service.setMicroServer('micro');
        expect(service.getMicroServer()).toBe('micro.');
      })

      it('getHost() returns the empty string when in devmode', () =>{
        expect(service.getHost()).toBe('');
      })

      it('getDomain() returns 127.0.0.1 when in dev mode', () =>{
        expect(service.getDomain()).toBe('localhost');
      })

      it('getServerURL() returns http://localhost:80 in dev mode', ()=>{
        service.setHost('www');
        service.setMicroServer('micro');
        expect(service.getServerURL()).toBe('http://www.micro.localhost');
      })




    }); // end describe

}); // end define.
