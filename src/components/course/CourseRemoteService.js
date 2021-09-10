define(['ActiveRemoteService',
        'socketio',
        'dispatcher/Dispatcher',
        'people-models/Pal',
        'course/models/CourseGroup',
        'course/models/ForumMessageCollection',
        'course/models/ForumMessage'],
function(ActiveRemoteService,
         io,
         Dispatcher,
         Pal,
         CourseGroup,
         ForumMessageCollection,
         ForumMessage){


var CourseRemoteService = function(){

    this.dis = new Dispatcher();
    this.constructor = CourseRemoteService;
    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("course");


    this.init = (function(auth){
      this.setSock();
      this.sock.on('io_error',this.somethingBadHappened);
      this.sock.on('error',this.somethingBadHappened);
      this.sock.on('disconnect',this.somethingBadHappened);
      this.sock.on('connect', this.getMyCourseGroups);
      this.sock.on('myCourseGroups', this.onMyCourseGroups)
      this.sock.on('classmateCourses', this.onClassmateCourses);
      this.sock.on('courseLeft', this.onCourseLeft);
      this.sock.on('coursePhotoUpdate',this.onCoursePhotoUpdate);
      this.sock.on('forumMessages', this.onForumMessageCollectionReceived);
      this.sock.on('forumMessageReceived',this.onForumMessageReceived);
      this.sock.on('groupInfo', this.onGroupReceived);
      this.sock.on('groupJoined', this.onGroupJoined);

    }).bind(this)


    this.onAuth = function(auth){
      if(auth && auth.state == 'authenticated'){
        this.init();
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState', this.onAuth);


    this.getMyCourseGroups = (function(){
      this.sock.emit('getMyCourseGroups')
    }).bind(this)

    this.onMyCourseGroups = (function(groups){
      var wrappedGroups = this.wrapCourseGroups(groups)
      this.dis.dispatch('myCourseGroups', wrappedGroups)
    }).bind(this)

    this.somethingBadHappened = function(err){
      console.log('Something bad happened:');
      console.log(err.message)
    }


    this.onCourseLeft = (function(grpId){
      this.dis.dispatch('courseLeft', grpId);
    }).bind(this)



    this.getClassmatesCourses = (function(person){
      this.sock.emit('getCurrentCoursesFor',this.flatten(person));
    }).bind(this)
    this.onPalFocusId = this.dis.reg('focusPerson', this.getClassmatesCourses);

    /**
      raw: an array of course groups.
    */
    this.onClassmateCourses = (function(raw){
      if(!raw.classmatesId || Number.isInteger(raw.classmatesId) == false || raw.classmatesId < 1){
        throw new Error('classmatesId must be a positive integer.');
      }
      var personId = raw.classmatesId;
      var groups = this.wrapCourseGroups(raw.grps)
     this.dis.dispatch('classmateCourses', {classmatesId:personId, grps:groups});
   }).bind(this)




   this.wrapCourseGroups = function(rawGrps){
     var grps = [];
     var host = this.getServerURL()
     rawGrps.forEach(function(rawGrp){
       grps.push(new CourseGroup(rawGrp, host));
     })
     return grps
   }


    this.onSwitchCourse = function(grp){
      this.sock.emit('switchToCourseGroup', grp);
    }
    this.onSwitchCourse = this.onSwitchCourse.bind(this);
    this.dis.reg('switchToCourseGroup', this.onSwitchCourse);


    this.onGroupReceived = (function(data){
      var group = new CourseGroup(data, this.getServerURL());
      this.dis.dispatch('groupInfo', group);
      this.joinGroupForum(group.getId());
    }).bind(this)


    this.getCourseGroup = (function(groupId){
      this.sock.emit('getCourseGroup', groupId);
    }).bind(this)
    this.getGroupId = this.dis.reg('selectedGroupId',this.getCourseGroup);


    this.registerOnIsProfilePhotoSet = function(callback){
      this._checkType(callback);
      this.onIsProfilePhotoSet = callback;
    }


    this.joinCourse = (function(grpId){
      this.sock.emit('joinCourse', grpId);
    }).bind(this)
    this.joinCourseId = this.dis.reg('joinCourse',this.joinCourse);


    this.onGroupJoined = (function(groupId){
      this.dis.dispatch('groupJoined', groupId);
    }).bind(this)


    this.leaveCourseGroup = function(courseId){
      if(isNaN(courseId) || !courseId){
        throw new Error('courseId must be a number');
      }
      this.sock.emit('leaveCourseGroup', courseId);
    }


    this.onForumMessageReceived = (function(rawMessage){
      var msg = new ForumMessage(rawMessage);
      msg.setImgUrlPrefix(this.getServerURL());
      this.dis.dispatch('forumMessageReceived', msg);
    }).bind(this)


    this.sendForumMessage = (function(message){
      this.sock.emit('sendForumMessage',message);
    }).bind(this)
    this.sendForumMessageId = this.dis.reg('sendForumMessage',this.sendForumMessage);


    this.sendImage = function(courseId, base64Image, text){
      if(!courseId || typeof courseId != 'number' || courseId < 1){
        throw new Error("courseId must be a postive integer.");
      }
      var regex = new RegExp('base64');
      if(typeof base64Image != 'string' || regex.test(base64Image) == false){
        throw new Error("base64Image must be a base64 string.");
      }
      var data = {
        courseId: courseId,
        base64:base64Image,
        text:text
      }
      this.sock.emit('imageUpload', data, this.onImageSent);
    }


    this.registerOnImageSent = function(callback){
      this._checkType(callback);
      this.onImageSent = callback;
    }


    this.registerOnMessagesReceived = function(callback){
      this._checkType(callback);
      this.onMessagesReceived = callback;
    }

    this.onGetMessagesError = function(a, b, err){
      console.log(err);
    }


    this.joinGroupForum = function(grpId){
      this.sock.emit('joinGroupForum',grpId);
    }
    this.joinGroupForum = this.joinGroupForum.bind(this);



    this.onForumMessageCollectionReceived = function(raw){
      if(Array.isArray(raw) == false){
        throw new Error('raw is expected to be an array.');
      }
      var col = new ForumMessageCollection();
      for(var i = 0; i < raw.length; i++){
        var msg = new ForumMessage(raw[i]);
        msg.setImgUrlPrefix(this.getServerURL());
        col.add(msg);
      }
      this.dis.dispatch('forumMessages', col);
    }
    this.onForumMessageCollectionReceived = this.onForumMessageCollectionReceived.bind(this);


    this.registerOnCheckedInLocation = function(callback){
      this._checkType(callback);
      this.onCheckInLocation = callback;
    }

    this.emitLocation = function(courseId, position){
      if(typeof location != 'object'){
        throw new Error('location must be an object');
      }
        var tmp = {
          coords:{
            accuracy:position.coords.accuracy,
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
          },
          timestamp:position.timestamp
        }
      this._checkType(this.onCheckInLocation);
      var data = {
        courseId:courseId,
        location:tmp
      }
      var json = JSON.stringify(data);
      this.sock.emit('checkInLocation', json, this.onCheckInLocation);
    }



    this.onSavePhoto = function(coursePhoto){
      this.sock.emit('saveCoursePhotograph', coursePhoto);
    }
    this.onSavePhoto = this.onSavePhoto.bind(this);
    this.onPhotoId = this.dis.reg('saveCoursePhotograph', this.onSavePhoto);


    this.onCoursePhotoUpdate = function(photoUpdate){
      this.dis.dispatch('coursePhotoUpdate',photoUpdate);
    }
    this.onCoursePhotoUpdate = this.onCoursePhotoUpdate.bind(this);



    this._checkType = function(callback){
      if(typeof callback != 'function'){
        throw new Error('callback must be a function.');
      }
    }




}

return CourseRemoteService;
})
