
define(['right-panel/course-info/course-photos/CoursePhoto',
        'course/models/CourseGroup'],
function(CoursePhoto,
         CourseGroup){

    describe("CoursePhoto Tests", function(){


      it('throws if the groupId or image is misssing.', ()=>{
        try{
          let groupId = null;
          let image = 'text';
          new CoursePhoto(groupId, image);
        }
        catch(err){
          expect(err.message).toBe("group cant be empty.");
        }
      })

      it('throws if the groupId or image is misssing.', ()=>{
        try{
          let groupId = 1;
          let image = null;
          new CoursePhoto(groupId, image);
        }
        catch(err){
          expect(err.message).toBe("image cant be empty.");
        }
      })

      it('create a CoursePhoto object',()=>{
        let groupId = 1;
        let image = 'text';
        let photo = new CoursePhoto(groupId, image);
        expect(photo.getImage()).toBe(image);
        expect(photo.getGroupId()).toBe(groupId);
      })

    }); // end describe
}); // end define.
