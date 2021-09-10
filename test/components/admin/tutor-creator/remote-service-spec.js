
define(['admin/tutor-creator/TutorCreatorRemoteService'], function(RemoteService){

    describe("Test Tutor Creator RemoteService", function(){

      let sut = null;

      beforeEach(()=>{
        sut = new RemoteService();
      })

      it('registerOnTutorAdded(fn) does just that',() =>{
        let fake = ()=>{}
        sut.registerOnTutorAdded(fake);
        expect(sut.onTutorAdded).toBe(fake);
      })

      it('registerOnAddTutorError(fn) does just that',() =>{
        let fake = ()=>{}
        sut.registerOnAddTutorError(fake);
        expect(sut.onAddTutorError).toBe(fake);
      })





    }); // end describe
}); // end define.
