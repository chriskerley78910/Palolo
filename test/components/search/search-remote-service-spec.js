
 define(['search/SearchRemoteService',
         'people-models/PersonCollection',
         'people-models/Stranger'],
 function(SystemUnderTest,
          PersonCollection,
          Stranger){

   describe('search-remote-service tests',()=>{

     beforeEach(()=>{
       sut = new SystemUnderTest()
     })


     it('onCoursesFound => dispatch results',()=>{
       spyOn(sut.dis,'dispatch')
       const response = [{group_id:1, dept: 'MATH', code:'1300', section:'M', prof:'Yun Gao'}]
       sut.onCoursesFound(response)
       expect(sut.dis.dispatch).toHaveBeenCalledWith('coursesFound',response)
     })

     it('onQueryCourse is reg on dis',()=>{
       const cb = sut.dis.getCallbackById(sut.queryCourseId)
       expect(cb).toBe(sut.onQueryCourse)
     })

     it('onQueryName is reg on dispatcher',()=>{
       const cb = sut.dis.getCallbackById(sut.queryNameId)
       expect(cb).toBe(sut.onQueryName)
     })

     it('onQueryName does an ajax request',()=>{
       const query = 'chris'
       spyOn($,'ajax')
       sut.onQueryName(query)
       expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
         url:'http://search.localhost/queryName?query=' + query
       }))
     })

     it('onPeopleFound => dispatch person collection',()=>{
       const arr = []
       spyOn(sut.dis,'dispatch')
       sut.onPeopleFound(arr)
       expect(sut.dis.dispatch).toHaveBeenCalledWith('peopleFound',jasmine.any(PersonCollection))
     })

     it('onPeopleFound => dispatch person collection (non empty case)',()=>{
       const p1 = Stranger.getRaw()
       spyOn(sut.dis,'dispatch')
       sut.onPeopleFound([p1])
       expect(sut.dis.dispatch).toHaveBeenCalledWith('peopleFound',jasmine.any(PersonCollection))
     })

   }); // end describe.
 });
