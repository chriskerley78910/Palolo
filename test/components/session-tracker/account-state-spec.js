
 define(['session-tracker/AccountState'],
 function(AccountState){

   describe('account-state tests',()=>{

     let sut = null
     const raw = AccountState.getRaw()

     beforeEach(()=>{
       sut = AccountState.getFake()
     })

     it('sets the time remaining', ()=>{
       expect(sut.getTimeRemaining()).toBe(raw.remaining)
     })

     it('sets time fulfilled', ()=>{
       expect(sut.getTimeFulfilled()).toBe(raw.fulfilled)
     })

     it('sets customerId', ()=>{
       expect(sut.getCustomerId()).toBe(raw.customer_id)
     })


   }); // end describe.
 });
