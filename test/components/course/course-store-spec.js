
define(['ko',
        'text-utilities',
        'course/CourseStore',
        'course/models/CourseGroup',
        'course/models/ForumMessageCollection',
        'course/models/ForumMessage'],

        (ko,
         textUtils,
         CourseStore,
         CourseGroup,
         ForumMessageCollection,
         ForumMessage) => {

    describe("Test CourseStore", function(){

      let sut = null;
      beforeEach(() => {
        sut = CourseStore.getNew();
        sut.setForumMessages(ForumMessageCollection.getFake());
      })


      getMockSocket = () =>{
        return {
          on:jasmine.createSpy(),
          connect:jasmine. createSpy()
        }
      }




      mockRemoteService = ()=>{
        spyOn(sut.getRemoteService(),'sendForumMessage');
        spyOn(sut.getRemoteService(),'emitLocation');
        spyOn(sut.getRemoteService(),'onSavePhoto');
      }

      it('onCourseFeatureSelection => set selectedFeature, pub()', done =>{
        const featureName = 'fakeName'
        expect(sut.getSelectedFeature()).toBeNull()
        sut.onPub(()=>{
          expect(sut.getSelectedFeature()).toBe(featureName)
          done()
        })
        sut.onCourseFeatureSelection(featureName)

      })


      it('setWaitingForGroup => do something', done => {
        expect(sut.isWaiting()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isWaiting()).toBeTruthy()
          done()
        })
        sut.setWaitingForGroup()
      })

      it('onJoinCourse() => _isWaitingToJoin == true',done => {
        expect(sut.isWaitingToJoin()).toBeFalsy();
        sut.onPub(()=>{
            expect(sut.isWaitingToJoin()).toBeTruthy();
            done();
        })
        sut.onJoinCourse();
      })

      it('onClassmateCourses => set classmatesCourses ^ pub', done => {
        const grps = [CourseGroup.getFake()];
        const classmatesId = 5;
        sut.onPub(()=>{
          expect(sut.getClassmateCourseGroups()).toBe(grps);
          done();
        })
        sut.onClassmateCourseGroups({grps:grps, classmatesId:classmatesId});
      })


      it('onCourseGroupReceived() => setGroup and publish',()=>{
        let grp = CourseGroup.getFake();
        spyOn(sut,'openGroupView');
        sut.onCourseGroupReceived(grp);
        expect(sut.getGroupInfo()).toBe(grp);

      })

      it('onCourseGroupReceived() => isWaiting() == false',()=>{
        const g = CourseGroup.getFake();
        spyOn(sut,'openGroupView');
        sut.isWaitingForServer = false
        sut.onCourseGroupReceived(g);
        expect(sut.isWaiting()).toBeFalsy()
      })

      it('registers onCourseGroupReceived() on the groupInfo channel', ()=>{
        let cb = sut.getDis().getCallbackById(sut.groupReceivedId);
        expect(cb).toBe(sut.onCourseGroupReceived);
      })


      it('getClassmateCourseGroups() returns an array of CourseGroups', done =>{

        let grpsPop = [CourseGroup.getFake(), CourseGroup.getFake()];
        const classmatesId  = 5;
        sut.onPub(()=>{
            expect(sut.getClassmateCourseGroups().length).toBe(2);
            expect(sut.getClassmatesId()).toBe(classmatesId);
            done();
        })
        sut.onClassmateCourseGroups({grps:grpsPop, classmatesId:classmatesId});
      })

      it('onClassmateCourseGroups is registered on the classmatesCourses channel.', () => {
        let cb = sut.getDis().getCallbackById(sut.onPalsCoursesId);
        expect(cb).toBe(sut.onClassmateCourseGroups);
      })






      it('onFocusPerson() => publish and isCourseViewVisible == false', (done)=>{
        sut.setGroupViewVisible();
        sut.onPub(()=>{
          expect(sut.isGroupViewVisible()).toBeFalsy();
          done();
        })
        sut.onFocusPerson();
      })

      it('inits _remoteService', ()=>{
        expect(sut.getRemoteService()).toBeDefined();
      })

      it('empty forumMessages on init', ()=>{
        expect(sut.getForumMessages().getSize()).toBe(0);
      })

      it('onForumMessageCollectionReceived({}) throws expected ForumMessageCollection', ()=>{
        try{
          sut.onForumMessageCollectionReceived({});
        }
        catch(err){
          expect(err.message).toBe("ForumMessageCollection expected");
        }
      })

      it('onForumMessageCollectionReceived subs the forumMessages channel', ()=>{
        let cb = sut.getDis().getCallbackById(sut.forumMessagesId);
        expect(cb).toBe(sut.onForumMessageCollectionReceived);
      })

      it('onForumMessageReceived() adds the message if its group_id matches the current group.', done =>{
        let grp = CourseGroup.getFake();
        sut.setCurrentCourseGroup(grp);
        sut.onPub(()=>{
          expect(sut.getForumMessages().getSize()).toBe(1);
          done();
        })
        let msg = ForumMessage.getFake();
        msg.setGroupId(grp.getId());
        sut.onForumMessageReceived(msg);
      })

      it('onForumMessageReceived subscribes to the forumMessageReceived channel.', ()=>{
        let cb = sut.getDis().getCallbackById(sut.forumMessageResId);
        expect(cb).toBe(sut.onForumMessageReceived);
      })

      it(`onForumMessageReceived() DOES NOT add the message
          if its group_id DOES NOT match the current group.`, () =>{
        let grp = CourseGroup.getFake();

        sut.setCurrentCourseGroup(grp);
        let msg = ForumMessage.getFake();
        msg.setGroupId(grp.getId() + 1);
        sut.onForumMessageReceived(msg);
        expect(sut.getForumMessages().getSize()).toBe(0);
      })

      it('onForumMessageReceived() and isSelfMessage => onForumMessageSent()',done =>{
        let grp = CourseGroup.getFake();
        sut.setCurrentCourseGroup(grp);
        let msg = ForumMessage.getFake();
        msg.setFromSelf(true);
        msg.setGroupId(grp.getId());
        spyOn(sut,'setWasFromSelf');
        sut.onPub(()=>{
            expect(sut.setWasFromSelf).toHaveBeenCalled();
            done();
        })
        sut.onForumMessageReceived(msg);
      })


      it('onForumMessageReceived() and isSelfMessage == false => NOT onForumMessageSent()',done =>{
        let grp = CourseGroup.getFake();
        sut.setCurrentCourseGroup(grp);
        let msg = ForumMessage.getFake();
        msg.setFromSelf(false);
        msg.setGroupId(grp.getId());
        spyOn(sut,'setWasNotFromSelf');
        sut.onPub(()=>{
            expect(sut.setWasNotFromSelf).toHaveBeenCalled();
            done();
        })
        sut.onForumMessageReceived(msg);
      })

      it('onForumMessageCollectionReceived() clears all previous messages before adding.',done =>{
        sut.setCurrentCourseGroup(CourseGroup.getFake());
        let originalMessages = sut.getForumMessages();
        sut.onPub(()=>{
          expect(sut.getForumMessages()).not.toBe(originalMessages);
          done();
        })
        sut.onForumMessageCollectionReceived(ForumMessageCollection.getFake());
      })





      it('register onCourseLeft on the courseLeft channel', ()=>{
        let cb = sut.getDis().getCallbackById(sut.courseLeftId);
        expect(cb).toBe(sut.onCourseLeft);
      })



      it('setExperimentalMode() => even is control,  odd is experimental', ()=>{
        sut.setExperimentalMode(0);
        expect(sut.isExperimentalGroup).toBeFalsy();
        sut.setExperimentalMode(1);
        expect(sut.isExperimentalGroup).toBeTruthy();
      })

      it('openGroupView(true) => dispatch(forumInfo,true)', done => {
          spyOn(sut.getDis(),'dispatch');
          sut.onPub(()=>{
            expect(sut.isGroupViewVisible()).toBeTruthy();
            done();
          })
         sut.openGroupView(true);
      })


      it('closeGroupView(false) => set isGroupViewVisible to false',(done)=>{
        spyOn(sut.getDis(),'dispatch');
        sut.onPub(()=>{
          expect(sut.isGroupViewVisible()).toBeFalsy();
          done();
        })
        sut.closeGroupView();
      })

      it('openGroupView(NONE boolean) => dispatch(forumInfo,true)', done => {
          spyOn(sut.getDis(),'dispatch');
          sut.onPub(()=>{
              expect(sut.isGroupViewVisible()).toBeTruthy();
              done();
          })
          sut.openGroupView();
      })



      it('onCourseGroupJoined(groupId) => update group membership and publish()',done => {
        let group = CourseGroup.getFake();
        group.setMembershipStatus(false);
        sut.setCurrentCourseGroup(group);
        sut.setWaitingToJoin();
        expect(sut.getGroupInfo().isMember()).toBeFalsy();
        sut.onPub(()=>{
          expect(sut.getGroupInfo().isMember()).toBeTruthy();
          expect(sut.isWaitingToJoin()).toBeTruthy();
          done();
        })
        sut.onCourseGroupJoined(group.getId());
      })

      it('onCourseGroupJoined() => isWaitingToJoin == false after publishing.', ()=>{
        let group = CourseGroup.getFake();
        group.setMembershipStatus(false);
        sut.setCurrentCourseGroup(group);
        sut.setWaitingToJoin();
        sut.onCourseGroupJoined(group.getId());
        expect(sut.isWaitingToJoin()).toBeFalsy();
      })

      it('onCourseGroupJoined() is registered on the groupJoined channel.', ()=>{
        let cb = sut.getDis().getCallbackById(sut.grpJoinedId);
        expect(cb).toBe(sut.onCourseGroupJoined);
      })


      it('onLeaveSelectedCourse() => rs.leaveCourse(id)', ()=>{
        const grp = CourseGroup.getFake();
        sut.group = grp;
        spyOn(sut.getRemoteService(),'leaveCourseGroup');
        sut.onLeaveSelectedCourse();
        expect(sut.getRemoteService().leaveCourseGroup).toHaveBeenCalledWith(grp.getId());
      })

      it('onCourseLeft(groupId) => getMembershipStatus() == false',done => {
        const grp = CourseGroup.getFake();
        sut.setCurrentCourseGroup(grp);
        sut.onPub(()=>{
            expect(sut.group.isMember()).toBeFalsy();
            done();
        })
        sut.onCourseLeft(grp.getId());

      })
      //



      it('onUserInfo(large_photo_url != null ^ isPhotoRequired() == true) => show thank you message', ()=>{
        sut.showThankYouMessage = false;
        sut.waitingForRequiredPhoto = true;
        sut.onUserInfo({
          large_photo_url:'someurl that is not null'
        })
        expect(sut.showThankyouMessage()).toBeTruthy();
        expect(sut.isWaitingForRequiredPhoto()).toBeFalsy();
      })

      it('onUserInfo() ^ large_photo_url === null => userHasProfilePhoto == false',done =>{
        sut.onPub(()=>{
          expect(sut.userHasProfilePhoto).toBeFalsy();
          done();
        })
        sut.onUserInfo({
          large_photo_url:null
        });
      })

      it('onUserInfo() ^ large_photo_url is a string => userHasProfilePhoto == true',done => {
        sut.onPub(()=>{
          expect(sut.userHasProfilePhoto).toBeTruthy();
          done();
        })
        sut.onUserInfo({
          large_photo_url:'http:/x.com'
        });
      })

      it(`userHasProfilePhoto == false
        ^ showProfileSetter dispatch received
        => isWaitingForRequiredPhoto == true`,()=>{
          expect(sut.isWaitingForRequiredPhoto()).toBeFalsy();
          sut.setUserHasProfilePhoto(false);
          sut.onShowProfileSetter();
          expect(sut.isWaitingForRequiredPhoto()).toBeTruthy();
      })


    it(`profileUpdate
        ^ photo_url exists
        ^ isWaitingForRequiredPhoto
        => showThankyouMessage
        ^ isWaitingForRequiredPhoto == false`, () => {

          sut.setWaitingForRequiredPhoto(true);
          sut.onUserInfo({large_photo_url:'url'});
          expect(sut.showThankyouMessage()).toBeTruthy();
          expect(sut.isWaitingForRequiredPhoto()).toBeFalsy();
        })


      it('registers checkInLocation on dispatcher', ()=>{
        let cb = sut.getDis().getCallbackById(sut.checkInLocationCallbackId);
        expect(cb).toBe(sut.onCheckInLocation);
      })


      it('onSaveCoursePhotograph() => isWaiting == true', done => {
        expect(sut.isWaiting()).toBeFalsy();
        sut.onPub(()=>{
          expect(sut.isWaiting()).toBeTruthy();
          done();
        })
        sut.onSaveCoursePhotograph('image');
      })


      it('getGroupId() returns the current groupId', ()=>{
        let group = CourseGroup.getFake();
        sut.setCurrentCourseGroup(group);
        let groupId = sut.getGroupId();
        expect(groupId).toBe(group.getId());
      })

      it('onCoursePhotoUpdate() updates group and publish', done => {

        let imgUrl = 'new.jpg';
        let group = CourseGroup.getFake();
        sut.setCurrentCourseGroup(group);
        let update = {
          groupId: group.getId(),
          imgUrl:imgUrl
        }
        sut.onPub(()=>{
          expect(sut.getCurrentGroup().getImgUrl()).toBe(group.getHost() + "/" + imgUrl);
          done();
        })
        sut.onCoursePhotoUpdate(update);
      })


      it('isGroupMember() == false iff the group.isMember() == false', ()=>{
        let g = CourseGroup.getFake();
        g.setMembershipStatus(false);
        sut.setCurrentCourseGroup(g);
        expect(sut.isGroupMember()).toBeFalsy();
        g.setMembershipStatus(true);
        expect(sut.isGroupMember()).toBeTruthy();
      })


    }); // end describe

}); // end define.
