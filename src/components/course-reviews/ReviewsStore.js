define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store'],
function(Dispatcher,
         Store){


   var instance = null;
   var ReviewsStore  = function(){

     Object.setPrototypeOf(this, new Store())
     this.dis = new Dispatcher()


     this.isReviewsVisible = function(){
       return this.reviewsVisible
     }

     this.onShowCourseReviews = (function(featureName){
       featureName == 'courseReviews' ? this.reviewsVisible = true : this.reviewsVisible = false;
       this.pub()
     }).bind(this)
     this.dis.reg('courseFeatureSelection', this.onShowCourseReviews)



  } // end

    return {
      getInstance:function(){
        if(!instance){
          instance = new ReviewsStore();
        }
        return instance;
      },
      getNew:function(){
        return new ReviewsStore();
      }
    }
  })
