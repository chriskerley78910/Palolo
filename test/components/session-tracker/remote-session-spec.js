
 define(['session-tracker/SessionRemoteService',
         'session-tracker/AccountState'],
 function(RemoteService,
          AccountState){

   describe('session-remote-service tests',()=>{

     let sut = null

     beforeEach(()=>{
       sut = new RemoteService()
     })


     it('getAccountInfo()', ()=>{
       spyOn($,'ajax')
       const customerId = 1
       sut.getAccountInfo(customerId)
       expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
         success:sut.onAccountInfoReceived,
         error:sut.onError
       }))
     })


     it('onSaveSession => ajax with data object', ()=>{
       spyOn($,'ajax')
       const data = {}
       sut.onSaveSession(data)
       expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
         data:data,
         success:sut.onAccountInfoReceived
       }))
     })


     it('onAccountInfoReceived dispatch data', ()=>{
       const data = AccountState.getRaw()
       spyOn(sut.dis,'dispatch')
       sut.onAccountInfoReceived(data)
       expect(sut.dis.dispatch).toHaveBeenCalledWith('accountInfoReceived',jasmine.any(Object))
     })

     it('onAccountInfoReceived dispatch error if the data is malformed.', ()=>{
       const data = AccountState.getRaw()
       data.remaining = -1
       spyOn(sut.dis,'dispatch')
       sut.onAccountInfoReceived(data)
       expect(sut.dis.dispatch).toHaveBeenCalledWith('sessionTrackerError',jasmine.any(String))
     })


     it('onError => dispatch sessionTrackerError', ()=>{
       const m = 'Customer has no time left on account.'
       spyOn(sut.dis,'dispatch')
       sut.onError({responseText:m})
       expect(sut.dis.dispatch).toHaveBeenCalledWith('sessionTrackerError', m)
     })


   }); // end describe.
 });
