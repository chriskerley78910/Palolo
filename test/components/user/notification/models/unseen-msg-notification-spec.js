
 define(['notification/models/UnseenChatNotification',
        'notification/models/Notification'],
   function(UnseenChatNotification, Notification){

   describe('UnseenChatNotification tests -',()=>{

     let sut = null;

     beforeEach(()=>{
        sut = UnseenChatNotification.getFake();
     })

     it('instanceof Notification', ()=>{
       expect(sut instanceof Notification).toBeTruthy();
     })

     it('getConstructorName() == UnseenChatNotification', ()=>{
       expect(sut.getConstructorName()).toBe('UnseenChatNotification');
     })

     it('setMessageId(id) does just that.', ()=>{
       expect(sut.getMessageId()).toBe(UnseenChatNotification.getRaw().message_id);
     })

     it('setFirstName() does just that.', ()=>{
       console.log(sut.getPerson()  )
       expect(sut.getPerson().getFirst()).toBe('First');
     })

     it('setLastName() does just that.', ()=>{
       expect(sut.getPerson().getLast()).toBe('Last');
     })

     it('setPhotoURL() does just that.', ()=>{
       expect(sut.getPerson().getSmallPhotoURL()).toBe('https://host/profile_images/485s.jpg');
     })

     it('setMessageSnippet() does just that.', ()=>{
       expect(sut.messageSnippet()).toBe("message snippet.");
     })

     it('setMessageTimetamp() does just that.', ()=>{
       expect(sut.getMessageTimestamp()).toBe("Dec 12 2019");
     })

     it('setSenderId() does just that.', ()=>{
       expect(sut.getPerson().getId()).toBe(2);
     })

     it('setHasBeenSeen() does just that.', ()=>{
       expect(sut.getHasBeenSeen()).toBeFalsy();
       sut.setHasBeenSeen();
       expect(sut.getHasBeenSeen()).toBeTruthy();
     })


     it('setHost(host) does just that.', ()=>{
       expect(sut.getHost()).toBe('https://host');
     })

   }); // end describe.

 });
