define([
'ko',
'dispatcher/Dispatcher',
'abstract-interfaces/Store'],
function(
  ko,
  Dispatcher,
  Store){

      var instance = null;

      var TabSelectorStore = function(){

        Object.setPrototypeOf(this, new Store());
        this.dis = new Dispatcher();
        this.noteShareVisible = false
        this.classListVisible = false
        this.reviewsVisible = false
        this.forumVisible = false
        this.visible = false

        this.isTabSelectorVisible = function(){
          return this.visible
        }

        this.isNoteShareVisible = function(){
          return this.noteShareVisible
        }

        this.isClassListVisible = function(){
          return this.classListVisible
        }

        this.isCourseReviewsVisible = function(){
          return this.reviewsVisible
        }

        this.isCourseForumVisible = function(){
          return this.forumVisible
        }

        this.setCourseForumInvisible = function(){
          this.forumVisible = false
        }

        this.onShowGroupView = (function(){
          this.visible = true
          this.pub()
        }).bind(this)
        this.dis.reg('selectedGroupId',this.onShowGroupView)

        this.onHideGroupView = (function(){
          this.visible = false
          this.pub()
        }).bind(this)
        this.dis.reg('hideGroupView', this.onHideGroupView)

        this.onShowNoteShare = (function(featureName){
          featureName == 'noteShare' ? this.noteShareVisible = true : this.noteShareVisible = false
          this.pub()
        }).bind(this)
        this.dis.reg('courseFeatureSelection', this.onShowNoteShare)


        this.onShowCourseReviews = (function(featureName){
          featureName == 'courseReviews' ? this.reviewsVisible = true : this.reviewsVisible = false
          this.pub()
        }).bind(this)
        this.dis.reg('courseFeatureSelection', this.onShowCourseReviews)


        this.onShowCourseForum = (function(featureName){
          featureName == 'courseForum' ? this.forumVisible = true : this.forumVisible = false
          this.pub()
        }).bind(this)
        this.dis.reg('courseFeatureSelection', this.onShowCourseForum)


       this.onShowClasslist = (function(featureName){
         featureName == 'classList' ? this.classListVisible = true : this.classListVisible = false
         this.pub()
       }).bind(this)
       this.dis.reg('courseFeatureSelection', this.onShowClasslist)

}


  return {
    getNew:function(){
      return new TabSelectorStore();
    },
    getInstance:function(){
      if(!instance){
        instance = new TabSelectorStore()
      }
      return instance;
    }
  };

});
