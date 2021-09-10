
 define(['session-tracker/Component'],
 function(Component){

   describe('session-tracker tests',()=>{

     beforeEach(()=>{
       sut = new Component.viewModel()
     })


     it('close dispatches the closeSessionTracker command', ()=>{
       spyOn(sut.dis,'dispatch')
       sut.close()
       expect(sut.dis.dispatch).toHaveBeenCalledWith('closeSessionTracker')
     })


     it('onStore, isVisible() => isVisible() == true', ()=>{
       expect(sut.isVisible()).toBeFalsy()
       spyOn(sut.store,'isVisible').and.returnValue(true)
       sut.onStore()
       expect(sut.isVisible()).toBeTruthy()
     })




   }); // end describe.
 });
