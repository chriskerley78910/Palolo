define(['search/Component', 'people-models/Person'],
(Component, Person) => {
    describe("search", ()=>{

      beforeEach(()=>{
        sut = new Component.viewModel()
      })


      it('onTyping, text.length == MIN_QUERY_LENGTH - 1 => dispatch clearResults',()=>{
        spyOn(sut.dis,'dispatch')
        sut.onTyping('12')
        expect(sut.dis.dispatch).toHaveBeenCalledWith('clearResults')
      })

      it('onTyping, text.length == MIN_QUERY_LENGTH - 2 => !dispatch clearResults',()=>{
        spyOn(sut.dis,'dispatch')
        sut.onTyping('1')
        expect(sut.dis.dispatch).not.toHaveBeenCalledWith('clearResults')
      })

      it('selectCourse => do that', ()=>{
        var grpId = 1
        spyOn(sut.dis,'dispatch')
        spyOn(sut,'query')
        spyOn(sut,'clearResults')
        sut.selectCourse({group_id:grpId})

        expect(sut.dis.dispatch).toHaveBeenCalledWith('selectedGroupId',grpId)
        expect(sut.clearResults).toHaveBeenCalled()

      })

      it('clearResults() => query()',()=>{
        spyOn(sut,'query')
        spyOn(sut.dis,'dispatch')
        sut.clearResults()

        expect(sut.query).toHaveBeenCalledWith('')
        expect(sut.dis.dispatch).toHaveBeenCalledWith('clearResults')
      })

      it('onStore, courseFound is set.',()=>{
        const courses = [1]
        spyOn(sut.store,'getCoursesFound').and.returnValue(courses)
        sut.onStore()
        expect(sut.coursesFound()).toEqual(courses)
      })


      it('onStore => getPeopleFound, peopleFound == people',()=>{
        const p = {}
        spyOn(sut.store,'getPeopleFound').and.returnValue(p)
        sut.onStore()
        expect(sut.peopleFound()).toBe(p)
      })

      it('selectPerson => focusPerson', ()=>{
        const p = Person.getFake()

        spyOn(sut.dis,'dispatch')
        sut.selectPerson(p)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('focusPerson',p)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('clearResults')
      })

      it('typing => dispatch queryCourse',()=>{
        const text = 'Brenda'
        const grpId = 5
        spyOn(sut.dis,'dispatch')
        spyOn(sut.store,'getCurrentGroupId').and.returnValue(grpId)
        sut.onTyping(text)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('queryCourse',jasmine.objectContaining(
          {query:text,grpId:grpId}
        ))
        expect(sut.dis.dispatch).toHaveBeenCalledWith('queryName', text)
      })

      it('onTyping does nothing if length of query is less than required.',()=>{

        const text = 'bu'
        spyOn(sut.dis,'dispatch')
        sut.onTyping(text)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('clearResults')
      })

      it('onTyping, empty text => !dispatch queryCourse',()=>{
        const text = ''
        spyOn(sut.dis,'dispatch')
        sut.onTyping(text)
        expect(sut.dis.dispatch).not.toHaveBeenCalled()
      })

    })
})
