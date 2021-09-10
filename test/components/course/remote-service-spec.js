
define(['course/CourseRemoteService',
        'dispatcher/Dispatcher',
        'course/models/CourseGroup',
        'course/models/ForumMessage',
        'course/models/ForumMessageCollection'],
function(RemoteService,
         Dispatcher,
         CourseGroup,
         ForumMessage,
         ForumMessageCollection){

    describe("Test CourseRemoteService", function(){

      let sut = null;


      beforeEach(() => {
        sut = new RemoteService();
        sut.sock = {
          on:jasmine.createSpy(),
          emit:jasmine.createSpy()
        }
      })



      it('joinCourse is registered on the joinCourse channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.joinCourseId);
        expect(cb).toBe(sut.joinCourse);
      })

      it('onCourseLeft dispatches on the courseLeft channel.', ()=>{
        spyOn(sut.dis,'dispatch');
        let grpId = 10;
        sut.onCourseLeft(grpId);
        expect(sut.onCourseLeft.hasOwnProperty('prototype')).toBeFalsy();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('courseLeft', grpId);
      })

      it('onCourseGroupReceived() => dispatch the group', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.onGroupReceived(CourseGroup.getRaw());
        expect(sut.dis.dispatch).toHaveBeenCalledWith('groupInfo', jasmine.any(CourseGroup));
      })

      it('getClassmatesCourses is registered on the giveClassmateFocus channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.onPalFocusId);
        expect(cb).toBe(sut.getClassmatesCourses);
      })

      it('getClassmatesCourses() emit getClassesFor',()=>{
        const classmate = Classmate.getFake();
        sut.getClassmatesCourses(classmate);
        expect(sut.sock.emit).toHaveBeenCalledWith('getCurrentCoursesFor',jasmine.any(Classmate));
      })

      it('onClassmateCourses()=> dispatch(classmateCourses, grps)', ()=>{
        spyOn(sut.dis,'dispatch');
        const rawGrps = [CourseGroup.getRaw()];
        const classmatesId = 5;
        sut.onClassmateCourses({grps:rawGrps, classmatesId:classmatesId});
        expect(sut.dis.dispatch).toHaveBeenCalledWith('classmateCourses', jasmine.any(Object));
      })


      it('sendForumMessage(message) does just that.',()=>{
        let message = 'Hello.';
        sut.sendForumMessage(message);
        expect(sut.sock.emit).toHaveBeenCalledWith('sendForumMessage', message);
      })

      it('onForumMessageReceived(raw) => dispatch(ForumMessage)', ()=>{
        spyOn(sut.dis,'dispatch');
        let raw = ForumMessage.getRaw();
        sut.onForumMessageReceived(raw);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('forumMessageReceived', jasmine.any(ForumMessage));
      })


      it('sendImage() => socket.emit(imageUpload) called', ()=>{
        let socket = {
          emit:jasmine.createSpy()
        }
        sut.sock = socket;
        let blob = 'base64:dfefef';
        let courseId = 52;
        let text = 'text';
        sut.sendImage(courseId, blob, text);
        expect(socket.emit).toHaveBeenCalledWith('imageUpload', jasmine.any(Object), sut.onImageSent);
      })


      it('onSavePhoto() is registered on the saveCoursePhotograph channel.', ()=>{
        let imageData = 'sting';
        let cb = sut.dis.getCallbackById(sut.onPhotoId);
        expect(cb).toBe(sut.onSavePhoto);
      })




      it('onGroupJoined() => dispatch groupJoined', ()=>{
        spyOn(sut.dis,'dispatch');
        let grpId = 5;
        sut.onGroupJoined(grpId);
        expect(sut.dis.dispatch).toHaveBeenCalledWith('groupJoined',grpId);
      })

      it('onCoursePhotoUpdate() => dispatch(coursePhotoUpdate, update)',()=>{
        spyOn(sut.dis,'dispatch');
        sut.onCoursePhotoUpdate({});
        expect(sut.dis.dispatch).toHaveBeenCalledWith('coursePhotoUpdate', jasmine.any(Object));
      })

      it('getCourseGroup() is registered on the selectedGroupId channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.getGroupId);
        expect(cb).toBe(sut.getCourseGroup);
      })


      it(`onForumMessageCollectionReceived(raw)
          ^  wraps the data
          => dispatch ForumMessageCollection`, () => {

        let raw = [ForumMessage.getRaw(), ForumMessage.getRaw()];
        spyOn(sut.dis,'dispatch');
        sut.onForumMessageCollectionReceived(raw);
        let col = sut.dis.dispatch.calls.first().args[1];
        expect(col.get(0).getImgUrl()).toBe('http://course.localhost/123.jpeg');
        expect(sut.dis.dispatch).toHaveBeenCalledWith('forumMessages',jasmine.any(ForumMessageCollection));
      })


      it('sendForumMessage subscribes to the sendForumMessage channel', ()=>{
        let cb = sut.dis.getCallbackById(sut.sendForumMessageId);
        expect(cb).toBe(sut.sendForumMessage);
      })

    }); // end describe

}); // end define.
