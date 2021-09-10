
 define([
   'course-reviews/ReviewsStore'],
   function(
     Store){

   describe('course-reviews tests -',()=>{

     beforeEach(()=>{
       sut =  Store.getNew()
     })

     it('isCourseReviewsSelected() == false', ()=>{
       expect(sut.isCourseReviewsSelected()).toBeFalsy()
     })

     it('onHideCourseReviews,reviewsVisible => !reviewsVisible, pub', done => {
       sut.reviewsVisible = true
       sut.onPub(()=>{
         expect(sut.isCourseReviewsVisible()).toBeFalsy()
         done()
       })
       expect(sut.isCourseReviewsVisible()).toBeTruthy()
       sut.onHideCourseReviews()
     })

     it('onShowCourseReviews,!reviewsVisible => reviewsVisible, pub', done => {
       sut.reviewsVisible = false
       sut.onPub(()=>{
         expect(sut.isCourseReviewsVisible()).toBeTruthy()
         done()
       })
       expect(sut.isCourseReviewsVisible()).toBeFalsy()
       sut.onShowCourseReviews('courseReviews')
     })

     it('onShowCourseReviews,!reviewsVisible => reviewsVisible, pub', done => {
       sut.reviewsVisible = false
       sut.onPub(()=>{
         expect(sut.isCourseReviewsVisible()).toBeFalsy()
         done()
       })
       expect(sut.isCourseReviewsVisible()).toBeFalsy()
       sut.onShowCourseReviews('unknown')
     })

   }); // end describe.
 });
