


define(['admin/tutor-list/TutorListRemoteService'], function(RemoteService){

    describe("Test TutorListRemoteService", function(){

      let sut = null;

      beforeEach(()=>{
        sut = new RemoteService();
      })

      it('registerOnTutorsReceived(fn) does just that',() =>{
        let fake = ()=>{}
        sut.registerOnTutorsReceived(fake);
        expect(sut.onTutorsRecieved).toBe(fake);
      })

      it('registerOnGetTutorsError(fn) does just that',() =>{
        let fake = ()=>{}
        sut.registerOnGetTutorsError(fake);
        expect(sut.onGetTutorsError).toBe(fake);
      })




    }); // end describe
}); // end define.
