
define(['course/forum/Component',
        'ko',
        'course/models/CourseGroup',
        'course/CourseStore',
        'course/models/ForumMessage',
        'course/models/ForumMessageCollection'],
  (Component,
   ko,
   CourseGroup,
   CourseStore,
   ForumMessage,
    ForumMessageCollection) => {

    describe("forum-view-model", function(){

      let sut = null;



      getMockInfo = ()=>{
        return {
          yourAMember:true,
          id:1
        }
      }

      let group = CourseGroup.getFake();

      beforeEach(() => {
        let info = {
          id:null
        }
        let fakeMessages = [1,2];
        sut = new Component.viewModel();
      })

      it('onStoreChanged() ^ grp == null => do nothing.', ()=>{
        spyOn(sut,'isVisible');
        spyOn(sut.store,'getGroupInfo').and.returnValue(null);
        sut.onStoreChanged();
        expect(sut.isVisible).not.toHaveBeenCalled();
      })

      it('onStoreChanged(isMember) => isVisible() == true', ()=>{
        sut.isVisible(false);
        spyOn(sut.store,'getGroupInfo').and.returnValue(CourseGroup.getFake())
        spyOn(sut.store,'getSelectedFeature').and.returnValue('courseForum')
        sut.onStoreChanged();
        expect(sut.isVisible()).toBeTruthy();
      })

      it('onStoreChanged(yourAMember == false) => !dispatch(membershipPrompt)', () => {
        spyOn(sut.dis,'dispatch');
        group.setMembershipStatus(false);
        sut.store.setCurrentCourseGroup(group);
        sut.onStoreChanged();
        expect(sut.dis.dispatch).not.toHaveBeenCalledWith('membershipPrompt');
      })



      it('onMessageSent() => showSent() == true',()=>{
        sut.isSendingMessageVisible(true);
        sut.onMessageSent();
        expect(sut.showSent()).toBeTruthy();
        expect(sut.isSendingMessageVisible()).toBeFalsy();
      })


      it('sendForumMessage() => newMessage().length == 0',()=>{
        let message = 'hello';
        sut.newMessage(message);
        spyOn(sut.dis,'dispatch');
        let oldLength = sut.messages.length;
        sut.sendForumMessage();


        expect(sut.newMessage().length).toBe(0);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('sendForumMessage', jasmine.any(ForumMessage));
        expect(sut.messages().length).toBe(oldLength + 1);
        let forumMessage = sut.dis.dispatch.calls.first().args[1];
        let gId = forumMessage.getGroupId();
        expect(gId).toBe(sut.store.getCurrentGroup().getId());
        expect(sut.isSendingMessageVisible()).toBeTruthy();
      })


      it('onMessagesReceived(ForumMessageCollection) => messages().length++',()=>{
        sut.isSpinnerVisible(true);
        let col = ForumMessageCollection.getFake();
        col.add(ForumMessage.getFake());
        sut.store.setForumMessages(col);
        sut.populateMessages();

        expect(sut.messages().length).toBe(1);
        expect(sut.isSpinnerVisible()).toBeFalsy();
      })

      it(`populateMessages() clears existing messages before adding the new ones.`,()=>{
        sut.populateMessages();
        sut.store.getForumMessages = ()=>{
          return ForumMessageCollection.getFake()
        }
        sut.populateMessages();
        expect(sut.messages().length).toBe(0);
      })

      it('newMessage(hello) => isValidInput() == true',()=>{
        let message = 'hello';
        sut.newMessage(message);
        expect(sut.isValidInput()).toBeTruthy();
      })

      it('newMessage(         ) => isValidInput() == false',()=>{
        let message = '     ';
        sut.newMessage(message);
        expect(sut.isValidInput()).toBeFalsy();
      })



      it('onStoreChanged() ^ !isMember  => do not dispatch any request for forum data.', ()=>{
        spyOn(sut.dis,'dispatch');
        let group = CourseGroup.getFake();
        group.setMembershipStatus(false);
        sut.store.setCurrentCourseGroup(group);
        sut.onStoreChanged();

        expect(sut.dis.dispatch).not.toHaveBeenCalled();
      })
    }); // end describe

}); // end define.
