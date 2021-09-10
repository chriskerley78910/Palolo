
define(['course/models/CourseSection'], function(CourseSection){

    describe("Test CourseSection", function(){

      it('getConstructorName() == "CourseSection"', ()=>{
        let section = new CourseSection({
          section_id:2,
          section_letter:'A'
        });
        expect(section.getConstructorName()).toBe('CourseSection');
      })

      it('setSectionId() throws if the sectionid is NaN', ()=>{
        let f = ()=>{
          new CourseSection({});
        }
        expect(f).toThrow(new Error('sectionId must be a postive integer.'))
      })

      it('setSectionLetter() throws if the sectionLetter is not a string.', ()=>{
        let f = ()=>{
          new CourseSection({
            section_id:1
          });
        }
        expect(f).toThrow(new Error('sectionLetter must be a non empty string.'))
      })

      it('creates a CourseSection object if the arg are properly formed.', ()=>{
        let section = new CourseSection({
          section_id:2,
          section_letter:'A'
        });
        expect(section.getLetter()).toBe('A');
        expect(section.getId()).toBe(2);
      })

      it('makeSectionsArray(not an array) => throws. ', ()=>{

        let f = ()=>{
          CourseSection.makeSectionsArray([]);
        }
        expect(f).toThrow(new Error('sections must be a non-empty array.'));
      })

      it('makeSectionsArray() makes a list of sections', ()=>{
        let rawSections = [
          {
            section_id:2,
            section_letter:'A'
          },
          {
            section_id:3,
            section_letter:'B'
          }
        ];

        let list = CourseSection.makeSectionsArray(rawSections);
        expect(list[0].getId()).toBe(2);
        expect(list[0].getLetter()).toBe('A');
        expect(list[1].getId()).toBe(3);
        expect(list[1].getLetter()).toBe('B');
      })

    }); // end describe

}); // end define.
