
define(['admin/course-delegator/AdminRemoteService'], function(AdminRemoteService){

    describe("Test Course Delegator RemoteService", function(){

      let sut = null;

      beforeEach(()=>{
        sut = new AdminRemoteService();
      })

      it('devmode ^ getServerURL() == http://admin.localhost',()=>{
        sut.switchToDevMode();
        expect(sut.getServerURL()).toBe('http://admin.localhost');
      })

      it('getServerURL() == https://www.admin.palolo.ca',()=>{
        sut.switchToLiveMode();
        expect(sut.getServerURL()).toBe('https://www.admin.palolo.ca');
      })


    }); // end describe
}); // end define.
