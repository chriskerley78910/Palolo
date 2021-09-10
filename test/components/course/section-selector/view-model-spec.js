
 define(['section-selector/Component', 'course/models/CourseSection'],
 function(Component, CourseSection){

   describe('ViewModel tests',()=>{

     let sut = null;

     beforeEach(()=>{
       sut = new Component.viewModel();
     })

     it('sections is [] on init',()=>{
       expect(sut.sections().length).toBe(0);
     })

     it('registers onCourseSections on the dispatcher', ()=>{
       let cb = sut._dispatcher.getCallbackById(sut.onCourseSectionsId);
       expect(cb).toBe(sut.onCourseSections);
     })

     it('onCourseSections() => sections == info.sections', ()=>{
       let rawSections = [
         {
           section_id:1,
           section_letter:'A'
         }
       ];
       let sections = CourseSection.makeSectionsArray(rawSections);
       sut.onCourseSections({
         sections:sections,
         selectedSectionId:1,
         courseCode:'MATH1300'
       })
       expect(sut.sections()).toBe(sections);
     })

     getRawSections = ()=>{
       return [
         {
           section_id:1,
           section_letter:"A"
         },
         {
           section_id:2,
           section_letter:'B'
         }
       ]
     }

     it('onCourseSections() => selectedSection() == info.selectedSessionId', ()=>{
       let rawSections = getRawSections();
       let sections = CourseSection.makeSectionsArray(rawSections);
       sut.onCourseSections({
         courseCode:'MATH1300',
         sections:sections,
         selectedSectionId:1
       });
       let selectedSection = sut.selectedSection();
       expect(selectedSection.getConstructorName()).toBe('CourseSection');
       expect(selectedSection.getId()).toBe(1);
       expect(selectedSection.getLetter()).toBe('A');
     })

     it('onCourseSections() ^ selectedSectionId not in sesssions => throws',()=>{

         let sections = [
           {
             sectionId:2,
             sessionLetter:"B"
           }
         ]
         let f = ()=>{
           sut.onCourseSections({
             sections:sections,
             selectedSectionId:1
           });
         }
         expect(f).toThrow(jasmine.any(Error));
     })

     it('selectCourseView() => dispatch(selectCourseView, true)', ()=>{
       spyOn(sut._dispatcher,'dispatch');
       sut.selectCourseView();
       expect(sut._dispatcher.dispatch).toHaveBeenCalledWith('courseViewSelected', true);
     })

     it('registers courseViewSelected on courseViewSelectedId',()=>{
       let cb = sut._dispatcher.getCallbackById(sut.courseViewSelectedId);
       expect(cb).toBe(sut.onCourseViewSelected);
     })

     it('sections.length < 1 => nextSection() throws', ()=>{
       let f = ()=>{
         sut.nextSection();
       }
       expect(f).toThrow(jasmine.any(Error));
     })

     it('nextSection() => dispatch(courseSectionUpdate, newId)', ()=>{
       let rawSections = getRawSections();
       let sections = CourseSection.makeSectionsArray(rawSections);
       let sectionsReceived= {
         courseCode:'MATH1300',
         sections:sections,
         selectedSectionId:1
       }
       let nextSectionId = sections[1].getId();
       sut.onCourseSections(sectionsReceived);
       spyOn(sut._dispatcher,'dispatch');
       sut.nextSection();
       expect(sut._dispatcher.dispatch).toHaveBeenCalledWith('getCourseGroupBySection',nextSectionId);
     })

     it('prevIndex() ^ on the first index => circle around to the last index.', ()=>{
       let rawSections = getRawSections();
       let sections = CourseSection.makeSectionsArray(rawSections);
       let sectionsReceived= {
         courseCode:'Math',
         sections:sections,
         selectedSectionId:1
       }
       sut.onCourseSections(sectionsReceived);

       sut.prevSection();
        expect(sut.currentSectionIndex).toBe(1);
        expect(sut.selectedSection()).toBe(sections[1]);

       sut.prevSection();
        expect(sut.currentSectionIndex).toBe(0);
        expect(sut.selectedSection()).toBe(sections[0]);
     })

     it('nextSection() ^ on the last index, then circle around to the start again.', ()=>{
       let rawSections = getRawSections();
       let sections = CourseSection.makeSectionsArray(rawSections);
       let sectionsReceived= {
         courseCode:'Math',
         sections:sections,
         selectedSectionId:1
       }
       sut.onCourseSections(sectionsReceived);

       sut.nextSection();
        expect(sut.currentSectionIndex).toBe(1);
        expect(sut.selectedSection()).toBe(sections[1]);

       sut.nextSection();
        expect(sut.currentSectionIndex).toBe(0);
        expect(sut.selectedSection()).toBe(sections[0]);
     })

   }); // end describe.
 });
