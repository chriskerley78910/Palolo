
 define(['search/SearchStore',
         'people-models/PersonCollection',
         'course/models/CourseGroup'],
 function(Store,
          PersonCollection,
          CourseGroup){

   describe('search-store tests',()=>{

     beforeEach(()=>{
       sut = Store.getNew()
     })

     it('onFocusPerson => currentGroup == null',done => {
       sut.currentGroup = {}
       sut.onPub(()=>{
         expect(sut.getCurrentGroupId()).toBeNull()
         done()
       })
       sut.onFocusPerson()
     })

     it('getCurrentGroupId(), currentGroup == null => return null',()=>{
       sut.currentGroup = null
       expect(sut.getCurrentGroupId()).toBeNull()
     })

     it('onClearResults => clear and pub',done =>{
       sut.coursesFound = [1]
       sut.peopleFound = PersonCollection.getFake()
       sut.onPub(()=>{
         expect(sut.getCoursesFound()).toEqual([])
         expect(sut.getPeopleFound()).toEqual([])
         done();
       })
       sut.onClearResults()
     })

     it('onCoursesFound => save and pub',done =>{
       const courses = []
       sut.onPub(()=>{
         expect(sut.getCoursesFound()).toBe(courses)
         done()
       })
      sut.onCoursesFound(courses)
     })

     it('onCourseGroup => set current group', ()=>{
       const g = CourseGroup.getFake()
       const id = g.getId()
       sut.onCourseGroup(g)
       expect(sut.getCurrentGroupId()).toBe(id)
     })

     it('onClearPeopleFound => clear and pub',done =>{
       sut.onPeopleFound(PersonCollection.getFake())
       sut.onPub(()=>{
         expect(sut.getPeopleFound()).toEqual([])
         done()
       })
       sut.onClearPeopleFound()
     })

     it('onClearPeopleFound is reg on dispatcher',()=>{
       const cb = sut.dis.getCallbackById(sut.clearPeopleId)
       expect(cb).toBe(sut.onClearPeopleFound)
     })

     it('onPeopleFound => publish them', done =>{
       expect(sut.getPeopleFound()).toEqual([])
       const c = PersonCollection.getFake()
       sut.onPub(()=>{
         const p = sut.getPeopleFound()
         expect(p).toEqual(c.toArray())
         done()
       })
       sut.onPeopleFound(c)
     })

     it('onPeopleFound is reg on dispatcher',()=>{
       const cb = sut.dis.getCallbackById(sut.peopleFoundId)
       expect(cb).toBe(sut.onPeopleFound)
     })




     it('isVisible() <=> authState is authenticated',done =>{
       expect(sut.isVisible()).toBeFalsy()
       sut.onPub(()=>{
            expect(sut.isVisible()).toBeTruthy()
            done()
       })
       sut.onAuth({state:'authenticated'})
     })

     it('isVisible() <=> authState is authenticated',done =>{
       sut.setVisible()
       sut.onPub(()=>{
            expect(sut.isVisible()).toBeFalsy()
            done()
       })
       sut.onAuth({state:'anonymous'})
     })


   }); // end describe.
 });
