/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'text!account-info/template.html',
        'dispatcher/Dispatcher',
        'session-tracker/SessionStore'],
function(ko,
         template,
         Dispatcher,
         Store){

  function View(){

    this.store = Store.getInstance()
    this.dis = new Dispatcher()
    this.timeRemaining = ko.observable('0')
    this.timeFulfilled = ko.observable('0')
    this.isSpinnerVisible = ko.observable(false)


    this.refreshAccountInfo = (function(){
      var customerId = this.store.getFocusedPersonId()
      this.dis.dispatch('getAccountInfo',customerId)
    }).bind(this)

    this.onStore = (function(){
      this.isSpinnerVisible(this.store.isRefreshingInfo())
      this.timeRemaining(this.store.getTimeRemaining())
      this.timeFulfilled(this.store.getTimeFulfilled())
    }).bind(this)
    this.store.sub(this.onStore)

  };

  return {
    viewModel: View,
    template : template
  }


});
