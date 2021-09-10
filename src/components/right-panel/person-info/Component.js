define([
'jquery',
'ko',
'text!right-panel/person-info/template.html',
'dispatcher/Dispatcher',
'people-models/NullPerson',
'people-store/PeopleStore',
'compatability'],
function(
  $,
  ko,
  template,
  Dispatcher,
  NullPerson,
  Store,
  Compatability){

  var ViewModel = function(){

      this.dis = new Dispatcher();
      this.store = Store.getInstance();
      this.isVisible = ko.observable(false);
      this.selectedClassmate = ko.observable(null);
      this.isPhotoVisible = ko.observable(true);
      this.isExperimentalGroup = false;
      this.isAddPalVisible = ko.observable(false)
      this.isTutor = ko.observable(false)
      this.isCallButtonVisible = ko.observable(true)
      this.isCallButtonLoaderVisible = ko.observable(false)




      this.onStore = (function(){
        var p = this.store.getFocusedPerson();
        if(!p.isReal()){
          this.isVisible(false);
        }
        else{
          this.selectedClassmate(p);
          this.isVisible(true);
          this.isAddPalVisible(p.isAddable())
          this.isTutor(p.getRole() == 'tutor')
        }
      }).bind(this)
      this.store.sub(this.onStore);

      this.addPal = (function(){
        var classmate = this.selectedClassmate()
        if(classmate.isAddable()){
          this.dis.dispatch('addPal',classmate)
        }
      }).bind(this)

      this.connectToRoom = (function(){
          Compatability.isVideoCallingSupported(this.onCallingSupported,this.onNoCallingSupported)
      }).bind(this)

      this.onCallingSupported = (function(){
        var palId = this.store.getFocusedPerson().getId()
        this.isCallButtonVisible(false)
        this.isCallButtonLoaderVisible(true)
        var self = this
        setTimeout(function(){
          self.isCallButtonVisible(true)
          self.isCallButtonLoaderVisible(false)
        },1000)
        this.dis.dispatch('getRoomToken',palId)
      }).bind(this)

      this.onNoCallingSupported =  (function(){
        alert('Your browser does not support video calling here. \nPlease use the latest version of one of the following browsers:\n - Google Chrome\n - Firefox\n - Safari\n - Chromium Edge')
      }).bind(this)



      this.buyHours = function(){
        var pal = this.store.getFocusedPerson()
        this.dis.dispatch('openTutoringPlans',pal)
      }


}; // end view model.

  return {
    viewModel:ViewModel,
    template: template
  }
});
