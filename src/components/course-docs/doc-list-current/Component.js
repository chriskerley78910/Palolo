define(['text!course-docs/doc-list-current/template.html',
        'course-docs/DocStore',
        'course-docs/models/SavedDoc',
        'ko',
        'dispatcher/Dispatcher'],
function(template,
         Store,
         SavedDoc,
         ko,
         Dis){
  function View(){
    this.dis = new Dis()
    this.store = Store.getInstance()
    this.isVisible = ko.observable(true)
    this.profs = ko.observableArray([])
    this.askProfMessageVisible = ko.observable(false)

    this.onStore = (function(){
      var profs = this.store.getCurrentDocs().getProfs()
      this.profs(profs)
    }).bind(this)
    this.store.sub(this.onStore)

    this.closeAskProf = (function(){
      this.askProfMessageVisible(false)
    }).bind(this)

    this.openDoc = (function(d){
      if(d.isLocked()){
        // this.dis.dispatch('openDocumentPlans')
        this.askProfMessageVisible(true)
      }
      else{
        this.dis.dispatch('openDoc',d)
      }
    }).bind(this)
  }

  return {
    viewModel: View,
    template: template
  }

})
