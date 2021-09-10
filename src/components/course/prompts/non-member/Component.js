define(['ko',
'text!non-member-prompt/template.html',
'dispatcher/Dispatcher',
'course/CourseStore'],
function(
  ko,
  template,
  Dispatcher,
  CourseStore){

  function MembershipPromptViewModel(){
    this.store = CourseStore.getInstance();
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.userHasPhoto = ko.observable(true);
    this.profilePhotoURL = './assets/no-photo.jpg';
    this.joinPromptMessage = ko.observable('Upload your photo to join.');
    this.showCourseJoinedMessage = ko.observable(false);
    this.isThankYouMessageVisible = ko.observable(false);
    this.courseCode = ko.observable('');
    this.sectionLetter = ko.observable('');


    this.onStoreChange = (function(){

      var isWaitingToJoin = this.store.isWaitingToJoin();
      if(isWaitingToJoin){
        this.showGroupJoined();
      }
      var grp = this.store.getGroupInfo();
      if(grp && !grp.isMember() && !grp.inAnotherSection()){
        this.isVisible(true);
        this.courseCode(grp.getCourseCode());
        this.sectionLetter(grp.getSectionLetter());
        this.userHasPhoto(this.store.userHasProfilePhoto);
        if(this.store.showThankyouMessage()){
          // console.log('SHOWING THANK YOU!!!!');
          this.isThankYouMessageVisible(true);
          this.dis.dispatch('hideProfileSetter');
        }
      }
      else{
        this.isVisible(false);
      }
    }).bind(this)
    this.store.sub(this.onStoreChange);




    this.joinCourse = function(){
      if(!this.store.getCurrentGroup()){
        throw new Error('groupInfo has not been initialized yet.');
      }
      this.isSpinnerVisible(true);
      var grpId = this.store.getCurrentGroup().getId();
      this.isThankYouMessageVisible(false);
      this.dis.dispatch('joinCourse', grpId);
    }


    this.showGroupJoined = (function(){
      this.isSpinnerVisible(false)
      this.showCourseJoinedMessage(true);
      this.isThankYouMessageVisible(false);
      var self = this;
      window.setTimeout(function(){
        self.showCourseJoinedMessage(false);
        self.isVisible(false);
      },2500);
    }).bind(this)


    this.showProfileSetter = function(){
      this.dis.dispatch('showProfileSetter');
    }



}; // end view model.

  return {
    viewModel: MembershipPromptViewModel,
    template: template
  }
});
