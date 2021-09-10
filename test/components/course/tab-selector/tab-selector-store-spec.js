
define(['course/tab-selector/TabSelectorStore',
        'dispatcher/Dispatcher'],
function(Store,
         Dispatcher){

    describe("tab-seletor-store tests", function(){

      let sut = null;

      beforeEach(() => {
        sut = Store.getNew()
      })


      it('isNoteshareVisible() == false',()=>{
        expect(sut.isNoteShareVisible()).toBeFalsy()
      })

      it('isClassListVisible() == false', ()=>{
        expect(sut.isClassListVisible()).toBeFalsy()
      })

      it('isCourseReviewsVisible() == false', ()=>{
        expect(sut.isCourseReviewsVisible()).toBeFalsy()
      })

      it('isCourseForumVisible() == false', ()=>{
        expect(sut.isCourseForumVisible()).toBeFalsy()
      })

      it('onShowGroupView => pub', done => {
        expect(sut.isTabSelectorVisible()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isTabSelectorVisible()).toBeTruthy()
          done()
        })
        sut.onShowGroupView()
      })


      it('onHideGroupView => pub', done =>{

        sut.visible = true
        sut.onPub(()=>{
          expect(sut.isTabSelectorVisible()).toBeFalsy()
          done()
        })
        sut.onHideGroupView()
      })



      it('onShowCourseForum => update and pub()', done =>{
        sut.onPub(()=>{
          expect(sut.isCourseForumVisible()).toBeTruthy()
          done()
        })
        sut.onShowCourseForum('courseForum')
      })

      it('onShowClasslist => update,pub', done => {
        sut.classListVisible = false
        sut.onPub(()=>{
          expect(sut.isClassListVisible()).toBeTruthy()
          done()
        })
        sut.onShowClasslist('classList')
      })


      it('onShowNoteShare() =>update and pub', done => {
        sut.noteShareVisible = false
        sut.onPub(()=>{
          expect(sut.isNoteShareVisible()).toBeTruthy()
          done()
        })
        sut.onShowNoteShare('noteShare')
      })


      it('onShowCourseReviews => update and pub()', done => {
        sut.courseReviewsVisible = false
        sut.onPub(()=>{
          expect(sut.isCourseReviewsVisible()).toBeTruthy()
          done()
        })
        sut.onShowCourseReviews('courseReviews')
      })


    }); // end describe

}); // end define.
