define(['LiveRemoteService'],
function(LiveRemoteService){
    describe("Test LiveRemoteService", function(){

      let service = null;
      beforeEach(()=>{
        service = new LiveRemoteService();
      })

      it('isLive() == true',()=>{
        expect(service.isLive()).toBeTruthy()
      })

      it('extends RemoteService', ()=>{
        let proto = Object.getPrototypeOf(service);
        expect(proto.constructor.name).toBe('RemoteService');
      })

      it('getScheme() returns https:// when in live mode', () =>{
        expect(service.getScheme()).toBe('https://');
      })

      it('getHost() returns www. in liveMode', ()=>{
        expect(service.getHost()).toBe('www.');
      })


      it('setHost(host) sets the host.', ()=>{
        service.setHost('hello');
        expect(service.getHost()).toBe('hello.');
      })

      it('getDomain() returns palolo.ca when in live mode', () =>{
        expect(service.getDomain()).toBe('palolo.ca');
      })


      it('getServerURL() returns https://www.palolo.ca:80 when in live mode', ()=>{
        service.setPort(80);
        expect(service.getServerURL()).toBe('https://www.palolo.ca:80');
      })


      it('getServerURL() returns http://127.0.0.1:80 in dev mode', ()=>{
        expect(service.getServerURL()).toBe('https://www.palolo.ca');
      })

    }); // end describe
}); // end define.
