
 define(['account-info/Component'],
 function(Component){

   describe('session-tracker tests',()=>{

     beforeEach(()=>{
       sut = new Component.viewModel()
     })

     it('store.isWaiting => isSpinnerVisible() == true',()=>{
       expect(sut.isSpinnerVisible()).toBeFalsy()
       spyOn(sut.store,'isRefreshingInfo').and.returnValue(true)
       sut.onStore()
       expect(sut.isSpinnerVisible()).toBeTruthy()
     })

     it('refreshAccountInfo => dispatch("getAccountInfo")',()=>{
       spyOn(sut.dis,'dispatch')
       const id = 4
       spyOn(sut.store,'getFocusedPersonId').and.returnValue(id)
       sut.refreshAccountInfo()
       expect(sut.dis.dispatch).toHaveBeenCalledWith('getAccountInfo',id)
     })

     it('onStore sets timeRemaining and timeFulFilled', ()=>{
       const TR = 1
       const TF = 2
       spyOn(sut.store,'getTimeRemaining').and.returnValue(TR)
       spyOn(sut.store,'getTimeFulfilled').and.returnValue(TF)
       sut.onStore()
       expect(sut.timeRemaining()).toBe(TR)
       expect(sut.timeFulfilled()).toBe(TF)
     })


   }); // end describe.
 });
