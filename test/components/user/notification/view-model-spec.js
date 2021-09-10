
 define([ 'notification/Component',
          'notification/models/UnseenChatNotification',
          'notification/models/ViewedChatNotification',
          'notification/models/ForumNotification',
          'ko',
          'people-models/Person'],
   function(Component,
            UnseenChatNotification,
            ViewedChatNotification,
            ForumNotification,
            ko,
            Person){

   describe('Notification tests -',()=>{

     let sut = null;

     beforeEach(()=>{
          sut = new Component.viewModel();
     })


     it('onNotificationClicked() => dispatch chatNotifViewed, focusPerson', ()=>{
       let notification = UnseenChatNotification.getFake();
       expect(notification.getHasBeenSeen()).toBeFalsy();
       spyOn(sut.dis,'dispatch');
       spyOn(sut._remoteService,'setChatMsgNotifSeen');
       sut.onNotificationClicked(notification);

       expect(sut.dis.dispatch).toHaveBeenCalled();
       expect(sut.dis.dispatch).toHaveBeenCalledWith('focusPerson',notification.getPerson());
       expect(notification.getHasBeenSeen()).toBeTruthy();
     })


     it('onNotificationClicked() ^ notif is ForumNotification => dispatch(selectedGroupId)', ()=>{
       const rawArr = [ForumNotification.getRaw()];
       sut.onNotifications(rawArr);
       spyOn(sut.dis,'dispatch');
       sut.onNotificationClicked(sut.notifications()[0]);
       expect(sut.dis.dispatch).toHaveBeenCalledWith('selectedGroupId',rawArr[0].group_id);
     })


     it('onNotifications() type == seen message => adds to noticiations', ()=>{
         let rawArr = [UnseenChatNotification.getRaw()];
         expect(sut.isVisible()).toBeFalsy();
         sut.onNotifications(rawArr);
         expect(sut.notifications().length).toBe(1);
         expect(sut.notifications()[0].getConstructorName()).toBe("UnseenChatNotification");
         expect(sut.isVisible()).toBeTruthy();
     })



     it('computeUnseenCount() returns the number of unseen notifications.', ()=>{
       let notif1 = UnseenChatNotification.getFake();
       let notif2 = UnseenChatNotification.getFake();
       sut.notifications([notif1, notif2]);
       let unseenCount = sut.computeUnseenCount();
       expect(unseenCount).toBe(2);
     })


     it('ding() only dings if dingDone is true', ()=>{
       const cb = jasmine.createSpy();
       sut.dingDone = true;
       sut.ding(cb);
       expect(cb).toHaveBeenCalledWith(true);
       sut.dingDone = false;
       sut.ding(cb);
       expect(cb).toHaveBeenCalledWith(false);
     })

     it('onAuth() => registerOnNotifcation callback', ()=>{

       spyOn(sut._remoteService,'registerOnNotificationsUpdate');
       spyOn(sut._remoteService,'initialize');
       spyOn(sut._remoteService,'connect');
       sut.onAuth({state:'authenticated', id:5});
       expect(sut._remoteService.registerOnNotificationsUpdate).toHaveBeenCalledWith(sut.onNotifications);
     })

     getNotifs = ()=>{
       let raw_notifs = [ UnseenChatNotification.getRaw(),
                          UnseenChatNotification.getRaw()];
        return raw_notifs;
     }


     it('onNotifications() unseen notif => notifications stored with hasBeenSeen attached and false.', ()=>{
       let raw = UnseenChatNotification.getRaw();
       sut.onNotifications([raw]);
       let notifs = sut.notifications();
        expect(notifs.length).toBe(1);
        console.log(notifs[0]);
        expect(notifs[0].getHasBeenSeen()).toBeFalsy();
     })

     it('onNotifications() clears notifications everytime its called.', ()=>{

       let notifs = getNotifs();
       sut.onNotifications(notifs);
       sut.onNotifications(notifs);
       expect(sut.notifications().length).toBe(2);
     })

     it('onNotifications() and notifs == null => nothing happens',()=>{
       sut.onNotifications(null);
        expect(sut.notifications().length).toBe(0);
     })



     it('onNotificationClicked and type == chat => dipatch chatNotifViewed', ()=>{
        let notif = UnseenChatNotification.getFake();
        spyOn(sut.dis,'dispatch');
        spyOn(sut,'closeNotifications');
        spyOn(sut._remoteService,'setChatMsgNotifSeen');
        sut.onNotificationClicked(notif);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('focusPerson', notif.getPerson());
        expect(sut.closeNotifications).toHaveBeenCalled();
     })



     it('binNotification( raw ) always has the viewed ones at the end of the list..', ()=>{
       let raw  = ViewedChatNotification.getRaw();
       sut.binNotification(raw);
       let unseen  = UnseenChatNotification.getRaw();
       sut.binNotification(unseen);
       expect(sut.notifications().length).toBe(2);
        expect(sut.notifications()[0].getConstructorName()).toBe('UnseenChatNotification');
       expect(sut.notifications()[1].getConstructorName()).toBe('ViewedChatNotification');
     })

     it('binNotification(raw) ^ type == unkown => throws error', ()=>{
       const raw = ForumNotification.getRaw();
       raw.type = 'unknown';
       try{
          sut.binNotification(raw);
          expect(true).toBeFalsy();
       }
       catch(err){
         expect(err.message).toMatch(/unknown notification type./);
       }
     })

     it('binNotification(raw) ^ type == forum => adds to notifications',()=>{
       const raw = ForumNotification.getRaw();
       expect(sut.notifications().length).toBe(0);
       sut.binNotification(raw);
       expect(sut.notifications().length).toBe(1);
       expect(sut.notifications()[0].getConstructorName() == 'ForumNotification').toBeTruthy();
     })




   }); // end describe.
 });
