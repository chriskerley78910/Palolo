
define(['ko',
        'text!search/template.html',
        'dispatcher/Dispatcher',
        'search/SearchStore'],

function(ko,
         template,
         Dispatcher,
         Store){

  var MIN_QUERY_LENGTH = 3
  function ViewModel(params, componentInfo){

    this.dis = new Dispatcher();
    this.store = Store.getInstance()
    this.query = ko.observable('')
    this.isSpinnerVisible = ko.observable(false)
    this.coursesFound = ko.observableArray([])
    this.peopleFound = ko.observableArray([])
    this.isVisible = ko.observable(false)

    this.onStore = (function(){
      this.isVisible(this.store.isVisible())
      this.coursesFound(this.store.getCoursesFound())
      this.peopleFound(this.store.getPeopleFound())
    }).bind(this)
    this.store.sub(this.onStore)

    this.selectPerson = (function(p, e){
      this.dis.dispatch('focusPerson',p)
      this.dis.dispatch('clearResults')
      this.query('')
    }).bind(this)


    this.onTyping = (function(text){
      if(text.length >= MIN_QUERY_LENGTH){
        var grpId = this.store.getCurrentGroupId()
        this.dis.dispatch('queryCourse',{query:text, grpId:grpId})
        this.dis.dispatch('queryName',text)
      }
      else if(text.length == MIN_QUERY_LENGTH - 1){
        this.dis.dispatch('clearResults')
      }
    }).bind(this)
    this.query.subscribe(this.onTyping)

    this.selectCourse = (function(course){
      var grpId = course.group_id
      this.dis.dispatch('selectedGroupId',grpId)
      this.clearResults()
    }).bind(this)

    this.clearResults = (function(){
      this.query('')
      this.dis.dispatch('clearResults')
    }).bind(this)


  }; // end viewModel.



  return {
    viewModel: ViewModel,
    template : template
  }


});
