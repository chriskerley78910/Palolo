define([
'jquery',
'ko',
'course/CourseRemoteService',
'dispatcher/Dispatcher',
'course/models/CourseGroup',
'course/models/CourseSection',
'course/models/ForumMessage',
'course/models/ForumMessageCollection',
'abstract-interfaces/Store'],
function(
  $,
  ko,
  CourseRemoteService,
  Dispatcher,
  CourseGroup,
  CourseSection,
  ForumMessage,
  ForumMessageCollection,
  Store){

      var instance = null;

      var CourseStore = function(){

        Object.setPrototypeOf(this, new Store());
        this.dis = new Dispatcher();
        this.remoteService = new CourseRemoteService();
        this.isWaitingForServer = false;  // used for spinners, (usually waiting for server response.)
        this.waitingToJoin = false;
        this.userHasProfilePhoto = false;
        this.waitingForRequiredPhoto = false;
        this.showThankYouMessage = false;

        this.group = null;
        this.classmatesCourseGroups = [];
        this.classmatesId = null;
        this.isGrpVisible = false;

        this.forumMessages = new ForumMessageCollection();
        this.forumMsgWasFromSelf = false;
        this.isThankYouForUploadingPhotoMessageVisible = ko.observable(false);

        this.selectedFeature = null


          this.getDis = function(){
            return this.dis;
          }


          this.getRemoteService = function(){
            return this.remoteService;
          }

          this.getSelectedFeature = function(){
            return this.selectedFeature
          }

          this.onCourseFeatureSelection = (function(featureName){
            this.selectedFeature = featureName
            this.pub()
          }).bind(this)
          this.dis.reg('courseFeatureSelection',this.onCourseFeatureSelection)


          this.setImageURLPrefix = function(obj){
            var serverPrefix = this.remoteService.getServerURL();
            if(obj. sender_img_url){
              obj.sender_img_url = serverPrefix + '/' + obj. sender_img_url + '?' + (new Date()).getTime();
            }
          }



        this.setExperimentalMode = function(userId){
            var group = userId % 2;
            if(group == 0){   // Don't require photo to join.
              this.isExperimentalGroup = false
            }
            else if(group == 1){ // Require the photo to join.
              this.isExperimentalGroup = true;
            }
        }

      this.setCurrentCourseGroup = function(group){
        if(!group || !group.isGroup || !group.isGroup()){
          throw new Error('group must be an instance of CourseGroup.');
        }
        this.group = group;
      }

      this.onClassmateCourseGroups = (function(grpsAction){
        grpsAction.grps.forEach(function(e){
          if(!e || !e.isGroup || !e.isGroup()){{
            throw new Error('All groups must be a CourseGroup.');
          }}
        })
        this.classmatesCourseGroups = grpsAction.grps;
        this.classmatesId = grpsAction.classmatesId;
        this.pub();
      }).bind(this)
      this.onPalsCoursesId = this.dis.reg('classmateCourses', this.onClassmateCourseGroups);

      this.getClassmatesId = function(){
        return this.classmatesId;
      }


      this.getClassmateCourseGroups = function(){
        return this.classmatesCourseGroups;
      }

      this.isGroupViewVisible = function(){
        return this.isGrpVisible;
      }

      this.setGroupViewVisible = function(){
        this.isGrpVisible = true;
        this.pub();
      }


        this.openGroupView = (function(){
          this.isGrpVisible = true;
          this.pub()
        }).bind(this)
        this.dis.reg('showGroupView', this.openGroupView);



        this.closeGroupView = (function(){
          this.isGrpVisible = false;
          this.pub();
        }).bind(this)
        this.dis.reg('closeGroupView',this.closeGroupView);
        this.dis.reg('openNews',this.closeGroupView)


        this.onFocusPerson = (function(){
          this.isGrpVisible = false;
          this.pub();
        }).bind(this)
        this.dis.reg('focusPerson', this.onFocusPerson);


        this.getGroupId = function(){
          return this.group.getId();
        }


        this.isGroupMember = function(){
          if(this.group && this.group.isMember()){
            return true
          } else {
            return false
          }
        }


        this.onCourseGroupJoined = (function(groupId){
          if(!groupId || isNaN(groupId) || groupId < 1){
            throw new Error('groupId is malformed.');
          }
          if(groupId !== this.group.getId()){
            throw new Error('groupId does not match currently selected groupId');
          }
          this.group.setMembershipStatus(true);
          this.pub();
          this.waitingToJoin = false;
        }).bind(this)
        this.grpJoinedId = this.dis.reg('groupJoined', this.onCourseGroupJoined);


        this.isWaiting = function(){
          return this.isWaitingForServer;
        }

        this.setWaitingForGroup = (function(){
          this.isWaitingForServer = true
          this.pub()
        }).bind(this)
        this.dis.reg('selectedGroupId', this.setWaitingForGroup)


        this.onSaveCoursePhotograph = (function(){
          this.isWaitingForServer = true;
          this.pub();
        }).bind(this)
        this.dis.reg('saveCoursePhotograph', this.onSaveCoursePhotograph);

        this.isWaitingToJoin = function(){
          return this.waitingToJoin;
        }

        this.setWaitingToJoin = function(){
          this.waitingToJoin = true;
        }

        this.onJoinCourse = (function(){
          this.setWaitingToJoin();
          this.pub();
        }).bind(this)
        this.dis.reg('joinCourse', this.onJoinCourse);


        this.onCoursePhotoUpdate = (function(update){
          if(update.groupId == this.group.getId()){
            this.group.setImgUrl(update.imgUrl);
            this.pub();
          }
        }).bind(this)
        this.dis.reg('coursePhotoUpdate',this.onCoursePhotoUpdate);


        this.onLeaveSelectedCourse = (function(){
          var groupId = this.group.getId();
          this.remoteService.leaveCourseGroup(groupId);
        }).bind(this)
        this.dis.reg('leaveSelectedCourse', this.onLeaveSelectedCourse);


        this.onCourseLeft = (function(groupId){
          if(groupId === this.group.getId()){
            this.group.setMembershipStatus(false);
            this.group.setInAnotherSection(false);
            this.pub();
          }
        }).bind(this)
        this.courseLeftId = this.dis.reg('courseLeft',this.onCourseLeft);


        this.getCurrentGroup = function(){
          return this.group;
        }

        this.onCourseGroupReceived = (function(grp){
          this.group = grp;
          this.isWaitingForServer = false
          this.openGroupView();
        }).bind(this)
        this.groupReceivedId = this.dis.reg('groupInfo', this.onCourseGroupReceived);


        this.getGroupInfo = function(){
          return this.group;
        }

        this.onCheckInLocation = (function(location){
          var groupId = this.group.getId();
          this.remoteService.emitLocation(groupId, location);
        }).bind(this)
        this.checkInLocationCallbackId = this.dis.reg('checkInLocation', this.onCheckInLocation);

        /**
          Handles special cases where the user is
          requested to upload a photo to join a group.
        */
        this.onUserInfo = (function(info){

          info.large_photo_url ? this.userHasProfilePhoto = true : this.userHasProfilePhoto = false;
          if(this.userHasProfilePhoto && this.isWaitingForRequiredPhoto()){
            this.setShowThankYouMessage(true);
            this.setWaitingForRequiredPhoto(false);
          }
          this.pub();
        }).bind(this)
        this.dis.reg('profileUpdate', this.onUserInfo);


        this.setUserHasProfilePhoto = function(bool){
          this.userHasProfilePhoto = bool;
        }

        this.isWaitingForRequiredPhoto = function(){
          return this.waitingForRequiredPhoto;
        }

        this.setWaitingForRequiredPhoto = function(bool){
          this.waitingForRequiredPhoto = bool;
        }

        this.setShowThankYouMessage = function(bool){
          this.showThankYouMessage = bool;
        }

        this.showThankyouMessage = function(){
          return this.showThankYouMessage;
        }

        /**
          When the user is prompted to join a grp and
          they do no have a photo yet and they have asked
          to open the profile setter.   we set a special
          flag so that when they do upload it photo it brings
          them back to the join group prompt.
        */
        this.onShowProfileSetter = (function(){
          if(this.userHasProfilePhoto == false){
            this.waitingForRequiredPhoto = true;
          }
        }).bind(this)
        this.dis.reg('showProfileSetter',this.onShowProfileSetter);


        this.userHasProfilePhoto = function(){
          return this.userHasProfilePhoto;
        }


        this.hasJoinedForum = ko.observable(false); // NOT DONE
        this.forumMessagesuccessfullySent = false;


        this.onForumMessageCollectionReceived = (function(msgs){
          if(typeof msgs != 'object' || msgs instanceof ForumMessageCollection == false){
               throw new Error("ForumMessageCollection expected");
          }
          this.forumMessages = msgs;
          this.pub();
        }).bind(this)
        this.forumMessagesId = this.dis.reg('forumMessages', this.onForumMessageCollectionReceived);



        this.setForumMessages = function(msgs){
          if(msgs instanceof ForumMessageCollection){
            this.forumMessages = msgs;
          }
          else{
            throw new Error('msgs is expected to be a ForumMessageCollection!');
          }
        }

        this.getForumMessages = function(){
          return this.forumMessages;
        }

        this.onForumMessageReceived = (function(msg){
          if(typeof msg != 'object' || msg instanceof ForumMessage == false){
            throw new Error("msg must be a ForumMessage");
          }
          if(msg.getGroupId() == this.getCurrentGroup().getId()){
            this.forumMessages.add(msg);
            msg.isSelfMessage() ? this.setWasFromSelf() : this.setWasNotFromSelf();
            this.pub();
          }
        }).bind(this)
        this.forumMessageResId = this.dis.reg('forumMessageReceived', this.onForumMessageReceived);


        this.setWasFromSelf = function(){
          this.forumMsgWasFromSelf = true;
        }

        this.setWasNotFromSelf = function(){
          this.forumMsgWasFromSelf = false;
        }

        this.wasLastMessageFromSelf = function(){
          return this.forumMsgWasFromSelf;
        }
    }


  return {
    getNew:function(){
      return new CourseStore();
    },
    getInstance:function(){
      if(!instance){
        instance = new CourseStore()
      }
      return instance;
    }
  };

});
