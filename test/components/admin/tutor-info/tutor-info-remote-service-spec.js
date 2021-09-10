
define(['admin/tutor-info/TutorInfoRemoteService'], function(RemoteService){

    describe("Test Tutor Info AdminRemoteService", function(){

      let sut = null;

      beforeEach(()=>{
        sut = new RemoteService();
      })

      it('registerOnTutorInfo(fn) does just that.', ()=>{
        let fake = ()=>{}
        sut.registerOnTutorInfo(fake);
        expect(sut.onTutorInfo).toBe(fake);
      })

      it('registerOnTutorInfoError(fn) does just that.', ()=>{
        let fake = ()=>{}
        sut.registerOnTutorInfoError(fake);
        expect(sut.onTutorInfoError).toBe(fake);
      })


    }); // end describe
}); // end define.
