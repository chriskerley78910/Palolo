/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'text!session-tracker/template.html',
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

    this.close = (function(){
      this.dis.dispatch('closeSessionTracker')
    }).bind(this)


    this.onStore = (function(){
      this.isVisible(this.store.isVisible())
      var m = this.store.getErrorMessage()
      if(m) alert(m)
    }).bind(this)
    this.store.sub(this.onStore)

  };

  return {
    viewModel: View,
    template : template
  }


});
