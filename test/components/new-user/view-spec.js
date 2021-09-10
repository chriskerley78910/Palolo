
 define([
   'new-user/Component'],
   function(
     Component){

   describe('new-user tests -',()=>{

     beforeEach(()=>{
       sut = new Component.viewModel()
     })

     it('isVisible() == false', ()=>{
       expect(sut.isVisible()).toBeFalsy()
     })

   }); // end describe.
 });
