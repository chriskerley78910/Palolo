/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'text!punch-clock/template.html',
        'dispatcher/Dispatcher',
        'session-tracker/SessionStore'],
function(ko,
         template,
         Dispatcher,
         Store){

  function View(){

    this.store = Store.getInstance()
    this.dis = new Dispatcher()
    this.isVisible = ko.observable(false)
    this.showSessionRecordSaved = ko.observable(false)
    this.sessionDate = ko.observable('')
    this.sessionDuration = ko.observable('1')
    this.isSavingSession = ko.observable(false)
    this.isDateValid = ko.observable(false)
    this.maxDate = ko.observable('')
    this.maxDuration = ko.observable('')




    this.setMaxDuration = (function(remaining){
      if(remaining >= 10) this.maxDuration(9.5)
      else if(remaining >= 1.0) this.maxDuration(remaining)
      else if(remaining < 1) this.maxDuration(0)
    }).bind(this)



    this.getToday = function(){
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = today.getFullYear();
      return yyyy + '-' +  mm + '-' + dd;
    }
    this.maxDate(this.getToday())

    var e = document.getElementById('session-tracker')
    if(e)
    e.addEventListener('mousedown', function(event){
      event.stopPropagation() // so that the drag event does not occur.
    })

    this.close = (function(){
      this.dis.dispatch('closeSessionTracker')
    }).bind(this)

    this.checkDate = (function(date){
      if(date.length > 0)
        this.isDateValid(true)
      else
        this.isDateValid(false)
    }).bind(this)
    this.sessionDate.subscribe(this.checkDate,this)

    this.onStore = (function(){
      this.showSessionRecordSaved(this.store.isRecordSavedShowing())
      this.isVisible(this.store.isTutor() && this.store.isVisible())
      this.isSavingSession(this.store.isSavingSession())
      this.setMaxDuration(this.store.getTimeRemaining())
      this.sessionDate('')
      if(this.store.getTimeRemaining() >= 1)
        this.sessionDuration(1)
      else
        this.sessionDuration(0)

    }).bind(this)
    this.store.sub(this.onStore)

    this.saveTime = (function(){
      if(this.isDateValid())
        this.dis.dispatch('saveSessionTime',{
          customerId:this.store.getFocusedPersonId(),
          date:this.sessionDate(),
          duration:this.sessionDuration(),
        })
    }).bind(this)





  };

  return {
    viewModel: View,
    template : template
  }


});
