
 define(['notification/models/ForumNotification',
         'notification/models/Notification'],
   function(ForumNotification, Notification){

   describe('ForumNotification tests -',()=>{

     let sut = null;

     beforeEach(()=>{
        sut = ForumNotification.getFake();
     })

     it('sets all the attributes', ()=>{
       expect(sut.getPerson().getId()).toBe(2);
       expect(sut.getFirstName()).toBe('First');
       expect(sut.getLastName()).toBe('Last');
       expect(sut.getPhotoURL()).toMatch(/https:\/\/host\/profile_images\/.*\?.*/);
       expect(sut.getMessageId()).toBe(2);
       expect(sut.getConstructorName()).toBe('ForumNotification');
       expect(sut.getGroupId()).toBe(55);
     })


   }); // end describe.

 });
