define([
'ko',
'text!course-reviews/template.html',
'dispatcher/Dispatcher',
'course-reviews/ReviewsStore'],
function(
  ko,
  template,
  Dispatcher,
  CourseStore){

  function ForumViewModel(){

    this.dis = new Dispatcher();
    this.store = CourseStore.getInstance();
    this.isVisible = ko.observable(false);
    this.reviews = ko.observableArray([
      {
        name:'Chris Kerley',
        image:'./assets/no-img.jpg',
        title:'Summer 2013 with Suprakash Datta',
        body:`Its math so its basically just practice. I personally never found lectures that useful in math related courses. I think you will be okay. PSYC2021 is easy stats math. Grade school level stuff like mean median mode, then t-tests and normal distributions and confidence intervals. When I took it in 2016 it was very enjoyable, Richard Murray is great. The course is very well designed. A bit of formula memorization, but if you do the homework you should be fine. Easy A+`,
        votes:23
      },
      {
        name:'Mike Kerley',
        image:'./assets/no-img.jpg',
        title:'Fall 2002 with Jeffery Edmunds',
        body:`Its math so its basically just practice. I personally never found lectures that useful in math related courses. I think you will be okay. PSYC2021 is easy stats math. Grade school level stuff like mean median mode, then t-tests and normal distributions and confidence intervals. When I took it in 2016 it was very enjoyable, Richard Murray is great. The course is very well designed. A bit of formula memorization, but if you do the homework you should be fine. Easy A+`,
        votes:102
      }
    ])


    this.onStore = (function(){
      this.isVisible(this.store.isReviewsVisible())
    }).bind(this)
    this.store.sub(this.onStore)

}; // end view model.

  return {
    viewModel: ForumViewModel,
    template: template
  }
});
