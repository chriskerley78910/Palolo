
 define(['notification/NotificationRemoteService',
         'notification/models/UnseenChatNotification'],
   function(NotificationRemoteService,
             UnseenChatNotification){

   describe('NotificationRemoteService tests',()=>{

     it('setChatMsgNotifSeen() emits chatNotifSeen to the server.', done =>{
       const sut = new NotificationRemoteService();
       sut.sock = {
          emit:jasmine.createSpy()
        }
       const notif = UnseenChatNotification.getFake();
       sut.setChatMsgNotifSeen(notif);
       expect(sut.sock.emit).toHaveBeenCalledWith('chatNotifSeen',jasmine.any(Object));
       done();
     })

   }); // end describe.


 });
