
 define([
   'course-reviews/Component'],
   function(
     Component){

   describe('course-reviews tests -',()=>{

     beforeEach(()=>{
       sut = new Component.viewModel()
     })

     it('isVisible() == false', ()=>{
       expect(sut.isVisible()).toBeFalsy()
     })


     it('onStore, isReviewsVisible => isVisible()', ()=>{
       spyOn(sut.store,'isReviewsVisible').and.returnValue(true)
       sut.onStore()
       expect(sut.isVisible()).toBeTruthy()
     })

   }); // end describe.
 });
