/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'dispatcher/Dispatcher',
        'text!user-info/template.html',
        'jquery',
         'user/profile-setter/ProfileStore'],
function(ko,
         Dispatcher,
         template,
         $,
         ProfileStore){

  function UserInfoViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();
    this.dis = new Dispatcher();
    this.fullName = ko.observable('');
    this.yearOfStudy = ko.observable('1st');
    this.yearOfStudyInput = ko.observable('1');
    this.isYearOfStudyInputVisible = ko.observable(false);
    this.isYearOfStudyTextVisible = ko.observable(true);
    this.isYearOfStudyInputFocused = ko.observable(false);

    this.majorText = ko.observable('Student');
    this.isMajorInputVisible = ko.observable(false);
    this.isMajorInputFocused = ko.observable(false);
    this.isMajorTextVisible = ko.observable(true);
    this.partialMajor = ko.observable('');
    this.suggestedMajors = ko.observableArray([]);
    this.isSpinnerVisible = ko.observable(false)

    this.gender = ko.observable('female')
    this.birthDay = ko.observable('15')
    this.birthMonth = ko.observable('4')
    this.birthYear = ko.observable('2001')
    this.residenceOptions = ko.observable([])
    this.selectedRes = ko.observable(null)
    this.aboutMe = ko.observable("About me");

    this.showSaveButton = ko.observable(false);

    this.onProfileChange = function(){
      this.showSaveButton(true)
    }
    this.onProfileChange = this.onProfileChange.bind(this)

    this.gender.subscribe(this.onProfileChange);
    this.birthDay.subscribe(this.onProfileChange)
    this.birthMonth.subscribe(this.onProfileChange)
    this.birthYear.subscribe(this.onProfileChange)
    this.aboutMe.subscribe(this.onProfileChange)
    this.selectedRes.subscribe(this.onProfileChange)



    this.favMusicArtist = ko.observable('Favourite Musical Artist');
    this.favMusicArtist.subscribe(this.onProfileChange);





    this.onStoreChange = function(){
      try{
        var state = this.store.getCurrentState();
        if(state.isSavingMyInfo() || state.isSearchingMajors()){
          this.isSpinnerVisible(true)
        }
        else if(state.majorsFound()){
          this.isSpinnerVisible(false)
          this.suggestedMajors(this.store.getMajors())
        }
        else{
          var info = this.store.getUserInfo();
          this.fullName(info.first + " " + info.last);
          var date = new Date(Date.parse(info.birthday));
          this.birthDay(date.getDate())
          this.birthMonth(date.getMonth() + 1)
          this.birthYear(date.getFullYear())
          this.gender(info.sex)
          this.selectedRes(info.res)
          this.residenceOptions(info.res_arr)
          this.setYearOfStudyObservable(info.year_of_study);
          this.hideYearOfStudyInputField();
          this.setMajor(info.major_name);
          this.aboutMe(info.about_me);
          this.favMusicArtist(info.music);
          this.isSpinnerVisible(false)
        }
        this.showSaveButton(false)
      }
      catch(err){
        console.log("## Something went wrong setting profile info ##")
        console.log(err)
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);



    this.showYearOfStudyInput = function(){
      this.isYearOfStudyInputVisible(true);
      this.isYearOfStudyInputFocused(true);
      this.isYearOfStudyTextVisible(false);
    }

    this.hideYearOfStudyInputField = function(){
      this.isYearOfStudyInputVisible(false);
      this.isYearOfStudyTextVisible(true);
    }

    this.onYearOfStudyLostFocus = function(state){
      if(!state){
        var year = this.yearOfStudyInput();
        this.dis.dispatch('selectYear', year);
      }
    }
    this.isYearOfStudyInputFocused.subscribe(this.onYearOfStudyLostFocus, this);


    this.setYearOfStudyObservable = function(year){
      year = Number(year);
      switch (year) {
        case 1:
          this.yearOfStudy('1st');
          break;

        case 2:
          this.yearOfStudy('2nd');
          break;

        case 3:
          this.yearOfStudy('3rd');
          break;

        case 4:
          this.yearOfStudy('4th');
          break;

        default:
          throw new Error('Bad Year.');
      }
    }


    this.showMajorInput = function(){
      this.isMajorInputVisible(true);
      this.isMajorInputFocused(true);
      this.isMajorTextVisible(false);
      this.partialMajor('');
    }

    this.getMajors = function(query){

      if(query.length > 0){
        this.dis.dispatch('getStudentMajors', query);
      }
      else{
        this.suggestedMajors([]);
      }
    }
    this.partialMajor.subscribe(this.getMajors,this);



    this.selectSuggestedMajor = function(data, event){
      if(!data.major_id || isNaN(data.major_id)){
        throw new Error("major_id is expected to be an attribute of majors.");
      }
      var majorId = data.major_id;
      this.dis.dispatch('selectMajor', majorId);
      this.suggestedMajors([]);
    }
    this.selectSuggestedMajor = this.selectSuggestedMajor.bind(this);


    this.setMajor = function(major){
      this.hideMajorInput();
      this.majorText(major);
    }
    this.setMajor = this.setMajor.bind(this);

    this.hideMajorInput = function(){
      this.suggestedMajors([]);
      this.isMajorInputVisible(false);
      this.isMajorTextVisible(true);
    }


    this.clearMajorResults = function(){
      this.suggestedMajors([]);
    }
    this.clearMajorResults = this.clearMajorResults.bind(this);

    this.saveMyInfo = function(vm, event){
      event.preventDefault()
      event.stopPropagation()
      var profileInfo = this.getProfileInfo()
      this.dis.dispatch('saveMyInfo',profileInfo)
    }
    this.saveMyInfo = this.saveMyInfo.bind(this)


    this.getProfileInfo = function(){
      var a = this.aboutMe()
      var g = this.gender()
      var m = this.birthMonth()
      var d = this.birthDay()
      var y = this.birthYear()
      var r = this.selectedRes()
      var music = this.favMusicArtist()
      return {a:a,g:g,d:d,m:m,y:y,r:r,music:music}
    }
    this.getProfileInfo = this.getProfileInfo.bind(this);

}

return {
    viewModel: UserInfoViewModel,
    template :template
};


}); // end define.
