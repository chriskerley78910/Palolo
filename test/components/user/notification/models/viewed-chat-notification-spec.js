
 define(['notification/models/ViewedChatNotification', 'notification/models/Notification'],
   function(ViewedChatNotification, Notification){

   describe('ViewedChatNotification tests -',()=>{

     let sut = null;

     beforeEach(()=>{
       sut = ViewedChatNotification.getFake();
     })

     it('instanceof Notification', ()=>{
       expect(sut instanceof Notification).toBeTruthy();
     })


     it('has type set to chat-seen ', ()=>{
        let sut = ViewedChatNotification.getRaw();
        expect(sut.type).toBe('seen-chat');
     })

     it('getHasBeenSeen() == true', ()=>{
       expect(sut.getHasBeenSeen()).toBeTruthy();
     })


   }); // end describe.


 });
