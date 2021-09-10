// 'course/Component'
define(['ko',
        'jquery',
        'non-member/Component',
        'course/CourseStore',
        'course/models/CourseGroup'],
function(ko,
          $,
          MembershipComponent,
          CourseStore,
          CourseGroup){

    describe("non-member", function(){

      let sut = null;

      beforeEach(()=>{
        let params = {
          store: CourseStore
        }
        sut = new MembershipComponent.viewModel(params);
        sut.store.setCurrentCourseGroup(CourseGroup.getFake());
      })

      it('isVisible() is false by default', ()=>{
        expect(sut.isVisible()).toBeFalsy();
      })


      it(`onStoreChange()
          ^ showThankyouMessage() == true
          ^ userHasProfilePhoto() == true
          => isThankYouMessageVisible() == true
          ^ dispatch hideProfileSetter`,()=>{
            let grp = CourseGroup.getFake();
            grp.setMembershipStatus(false);
            sut.store.getGroupInfo = ()=>{return grp;}
            sut.store.showThankyouMessage = ()=>{return true;}
            sut.store.userHasProfilePhoto = ()=>{return true;}
            spyOn(sut.dis,'dispatch');
            sut.onStoreChange();
            expect(sut.isThankYouMessageVisible()).toBeTruthy();
            expect(sut.dis.dispatch).toHaveBeenCalledWith('hideProfileSetter');
      })



      it('onStoreChange( not a member)  => isVisible() == true',()=>{
        let group = CourseGroup.getFake();
        group.setMembershipStatus(false);
        sut.store.getGroupInfo = ()=>{
          return group;
        }

        sut.onStoreChange();
        expect(sut.isVisible()).toBeTruthy();
        expect(sut.sectionLetter()).toBe(group.getSectionLetter());
        expect(sut.courseCode()).toBe(group.getCourseCode());
      })

      it('onStoreChange() && store.isWaitingToJoin() => showGroupJoined()', ()=>{
        let group = CourseGroup.getFake();
        group.setMembershipStatus(false);
        sut.store.getGroupInfo = ()=>{
          return group;
        }
        sut.store.isWaitingToJoin = ()=>{return true;};
        spyOn(sut,'showGroupJoined');
        sut.onStoreChange();
        expect(sut.showGroupJoined).toHaveBeenCalled();
      })


      it('onStoreChange(yourAMember == true) => isVisible() == false', ()=>{
        let group = CourseGroup.getFake();
        group.setMembershipStatus(true);
        sut.store.getGroupInfo = ()=>{
          return group;
        }
        sut.onStoreChange(group);
        expect(sut.isVisible()).toBeFalsy();
      })


      it('onStoreChange(isMember() == false) => ',()=>{
        let grp = CourseGroup.getFake();
        grp.setMembershipStatus(false);
        sut.store.getGroupInfo = ()=>{return grp};
        sut.store.userHasProfilePhoto = ()=>{return true;}
        sut.onStoreChange();
        expect(sut.userHasPhoto()).toBeTruthy();
      })


      it('joinCourse() => rs.joinCourse({courseId, sectionId})', ()=>{
        spyOn(sut.dis,'dispatch');
        let group = CourseGroup.getFake();
        sut.store.courseGroupInfo = ()=>{
          return group;
        }
        sut.isThankYouMessageVisible(true);
        sut.joinCourse();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('joinCourse',group.getId());
        expect(sut.isSpinnerVisible()).toBeTruthy();
        expect(sut.isThankYouMessageVisible()).toBeFalsy();
      })

      it('showGroupJoined() => isVisible() == false', ()=>{
        sut.isVisible(true);
        sut.isSpinnerVisible(true);
        sut.showGroupJoined(true);
        expect(sut.isSpinnerVisible()).toBeFalsy();
        expect(sut.showCourseJoinedMessage()).toBeTruthy();
      })


      it('showProfileSetter() dispatches that.', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.showProfileSetter();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('showProfileSetter');
      })

    }); // end describe

}); // end define.
