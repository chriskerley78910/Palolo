
define(['course-groups/GroupsStore', 'course/models/CourseGroup'],
function(Store, CourseGroup){

    describe("course-groups store tests",() => {

      beforeEach(() => {
        sut = Store.getNew()
      })

      it('onGroupInfo, isNewsViewVisible() => isNewsViewVisible() == false', done => {
        sut.newsSelected = true
        expect(sut.isNewsViewVisible()).toBeTruthy()
        sut.onPub(()=>{
            expect(sut.isNewsViewVisible()).toBeFalsy()
            done()
        })
        sut.onGroupInfo()
      })

      it('onOpenNews => isGroupViewVisible() == false and pub', done => {
        sut.groupViewVisible = true
        sut.newsSelected = false
        sut.onPub(()=>{
          expect(sut.isGroupViewVisible()).toBeFalsy()
          expect(sut.isNewsViewVisible()).toBeTruthy()
          done()
        })
        sut.onOpenNews()
      })


      it('onGroupInfo and selectedGroup != group => do nothing', () => {
        expect(sut.getSelectedGroup()).toBeNull()
        const grp = CourseGroup.getFake()
        sut.onGroupJoined(grp.getId())
        expect(sut.getSelectedGroup()).toBeNull()
        expect(sut.getMyCourseGroups().length).toBe(0)
      })

      it('onGroupInfo and selectedGroup == group => add to courseGroups', done => {
        const grp = CourseGroup.getFake()
        sut.selectedGroup = grp
        sut.onPub(()=>{
          expect(sut.getSelectedGroup()).toBe(grp)
          expect(sut.getMyCourseGroups().length).toBe(1)
          done()
        })
        sut.onGroupJoined(grp.getId())
      })

      it('onGroupLeft => removes the matching remove and pubs()', done => {
        const g1 = CourseGroup.getFake()
        const g2 = CourseGroup.getFake()
        g2.setId(g1.getId() + 1)
        sut.courseGroups = [g1, g2]
        sut.onPub(()=>{
          const result = sut.getMyCourseGroups()
          expect(result.length).toBe(1)
          expect(result[0].getId()).toBe(g1.getId())
          done()
        })
        expect(sut.getMyCourseGroups().length).toBe(2)
        const grpIdToRemove = g2.getId()
        sut.onGroupLeft(grpIdToRemove)
      })



      it('onGroupInfo() => isGroupViewVisible()',()=>{
        sut.groupViewVisible = false
        sut.onGroupInfo()
        expect(sut.isGroupViewVisible()).toBeTruthy()
      })

      it('onFocusPerson() => isGroupViewVisible() == false', ()=>{
        sut.groupViewVisible = true
        sut.onFocusPerson()
        expect(sut.isGroupViewVisible()).toBeFalsy()
      })

    }); // end describe

}); // end define.
