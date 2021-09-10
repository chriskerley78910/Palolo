define(['ko',
        'text!doc-uploader/template.html',
        'dispatcher/Dispatcher',
        'course-docs/DocStore',
        'people-models/Prof'],
function(ko, template, Dis, Store, Prof){
  function ViewModel(){

    this.dis = new Dis()
    this.store = Store.getInstance()
    this.isVisible = ko.observable(false)
    this.courseDescription = ko.observable('')
    this.unsavedDocLoaded = ko.observable(false)
    this.unsavedDocName = ko.observable('')
    var y = [
      2000,2001,2002,2003,2004,
      2005,2006,2007,2008,2009,
      2010,2011,2012,2013,2014,
      2015,2016,2017,2018,2019,2020
    ]
    this.years = ko.observableArray(y.sort().reverse())
    this.selectedYear = ko.observable('year')
    this.profName = ko.observable('')
    this.matchingProfs = ko.observableArray([])
    this.showUploadSuccess = ko.observable(false)
    this.submittable = ko.observable(false);
    this.courseAdderVisible = ko.observable(false)



    this.onStore = (function(){
      this.courseDescription(this.store.getGroupCourseInfo())
      this.isVisible(this.store.isUploaderOpen)
      this.courseAdderVisible(this.store.isCourseAdderVisible())
      this.submittable(this.store.isReadyToSubmit())
      this.matchingProfs(this.store.matchingProfs)
      if(this.store.inputsShouldBeReset())
        this.clearInputFields()
      var unsavedDoc = this.store.getUnsavedDoc()
      if(unsavedDoc){
        this.unsavedDocLoaded(true)
        this.unsavedDocName(this.store.getUnsavedDocTitle())
      }
      else{
        this.unsavedDocLoaded(false)
        this.unsavedDocName('')
      }
      this.showUploadSuccess(this.store.isSuccessPopupVisible())
    }).bind(this)
    this.store.sub(this.onStore)


    this.closeAdder = function(){
      this.dis.dispatch('closeCourseAdder')
    }

    this.addCourse = function(){
      var d = this.store.getUnsavedDoc()
      this.dis.dispatch('addCourseAndUpload',d)
    }


    this.close = (function(e){
      this.dis.dispatch('closeDocUploader')
    }).bind(this)


    this.getMatchingProfs = (function(name){
      if(name.length > 0){
          this.dis.dispatch('getMatchingProfs',name)
      }
      else{
        this.matchingProfs([])
      }
    }).bind(this)
    this.profNameId = this.profName.subscribe(this.getMatchingProfs)


    this.selectProf = (function(e, evt){
      evt.preventDefault()
      evt.stopPropagation()
      this.profName(e.getFirst() + ' ' + e.getLast())
      this.dis.dispatch('selectedProf',e)
    }).bind(this)


    this.setTitle = (function(title){
      if(title.length > 0)
        this.dis.dispatch('setDocTitle',title)
    }).bind(this)
    this.subTit = this.unsavedDocName.subscribe(this.setTitle)

    this.setYear = (function(year){
      if(String(year).length > 0)
        this.dis.dispatch('setDocYear',year)
    }).bind(this)
    this.subYearId = this.selectedYear.subscribe(this.setYear)

    this.clearInputFields = (function(){
      this.profName('')
      this.selectedYear('')
      this.dis.dispatch('uploaderHasBeenReset')
    }).bind(this)

    this.uploadDoc = (function(vm,event){
      var file = event.currentTarget.files[0]
      $("#doc-uploader-input").val('')
      this.dis.dispatch('docUpload',file)
    }).bind(this)


    this.submitDoc = function(){
      if(this.store.isReadyToSubmit()){
        this.dis.dispatch('submitDoc',this.store.getUnsavedDoc())
      }
    }

}; // end view model.

  return {
    viewModel: ViewModel,
    template: template
  }
});
