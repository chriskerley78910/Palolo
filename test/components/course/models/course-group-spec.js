
define(['course/models/CourseGroup',
        'people-models/Prof'],
function(CourseGroup, Prof){

    describe("Test CourseGroup", function(){

      let sut = null;

      beforeEach(()=>{
        sut = CourseGroup.getFake();
      })





      it('isGroup() == true', ()=>{
        expect(sut.isGroup()).toBeTruthy()
      })

      it('throws if the host is not supplied',()=>{
        const r = CourseGroup.getRaw()
        try{
          new CourseGroup(r)
          expect(false).toBe(true,'expected an exception, but none was thrown.')
        } catch(err){
          expect(err.message).toBe('host is required')
        }
      })

      it('getId() returns a postive integer.',()=>{
        expect(isNaN(sut.getId())).toBeFalsy();
      })

      it('setId(id) does just that.', ()=>{
        sut.setId(52);
        expect(sut.getId()).toBe(52);
      })

      it('inAnotherSection() == false', ()=>{

        expect(sut.inAnotherSection()).toBeFalsy();
        sut.setInAnotherSection(true);
        expect(sut.inAnotherSection()).toBeTruthy();
      })

      it('getImgUrl() returns the url with the host prefixed.', ()=>{
        const prefix = "http://images";
        sut.setHost(prefix);
        expect(sut.getImgUrl()).toBe(prefix + '/' + CourseGroup.getRaw().img_url);
      })


      it('getBuilding() is Accolade', ()=>{
        expect(sut.getBuilding()).toBe('Accolade East');
      })

      it('getDept() does that.', ()=>{
        expect(sut.getDept()).toBe('EECS');
      })

      it('getSectionLetter() returns a single letter', ()=>{
        let letter  = sut.getSectionLetter();
        expect(letter.length).toBe(1);
      })

      it('getCourseCode() returns a non-empty string.', ()=>{
        expect(typeof sut.getCourseCode()).toBe('string');
      })

      it('setCourseCode(c) does just that.', ()=>{
        expect(sut.getCourseCode()).not.toBe("EECS2001");
        sut.setCourseCode('EECS2001');
        expect(sut.getCourseCode()).toBe("EECS2001");
      })

      it('getCourseDescription() returns non-empty string', ()=>{
        expect(typeof sut.getCourseDescription()).toBe('string');
      })

      it('setMembershipStatus(boolean) does just that.', ()=>{
        expect(sut.isMember()).toBeTruthy();
        sut.setMembershipStatus(false);
        expect(sut.isMember()).toBeFalsy();
      })

      it('onCourseGroup(no group_id) throws ',()=>{
        let f = ()=>{
          new CourseGroup({},'host');
        }
        expect(f).toThrow(new Error('groupId must be a postive integer.'));
      })


      it('setProf does just that.', ()=>{
        const p = sut.getProf()
        expect(p.getConstructorName()).toBe('Prof')
      })

      it('getProfsName() does that',()=>{
        expect(sut.getProfsName()).toBe('Nick Weber')
      })


      it('getProfsPhoto() returns their photo url with the host prefixed.',()=>{
        expect(typeof sut.getProfsPhoto()).toBe('string')
        const host = CourseGroup.getFake().getHost()
        expect(sut.getProfsPhoto()).toBe(host + '/small');
      })

    }); // end describe



}); // end define.
