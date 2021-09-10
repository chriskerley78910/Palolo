define(['ko',
        'text!tutoring-plans/template.html',
        'dispatcher/Dispatcher',
        'payment/PaymentStore'],
function(ko, template, Dis, Store){
  function ViewModel(){

    this.dis = new Dis()
    this.store = Store.getInstance()
    this.isVisible = ko.observable(false)
    this.showSpinner = ko.observable(false)

    this.hourlyRate = ko.observable(0)
    this.hours = ko.observable(1)
    this.total = ko.computed(function(){
      return (this.hourlyRate() * this.hours()).toFixed(2);
    },this)
    this.plans = ko.observableArray([])


    this.onHoursChanged = function(value){
      if (value == '' || value < 1) this.hours(1)
      if (value > 5) this.hours(5)
    }
    this.hours.subscribe(this.onHoursChanged,this)

    this.onStore = (function(){
      var isOpen = this.store.isTutoringPlansOpen()
      this.isVisible(isOpen)
      this.showSpinner(this.store.isWaitingForServer())
      if(isOpen){
        var plans = this.store.getTutoringPlans()
        var packagedPlans = plans.packagedPlans
        var normalPlan = plans.normalPlan
        this.plans(packagedPlans)
        this.hourlyRate(normalPlan.getHourlyRate())
      }
    }).bind(this)
    this.store.sub(this.onStore)


    this.closePaymentOptions = function(){
      this.dis.dispatch('closeTutoringPlans')
    }

    this.buy = (function(){
      var id = this.store.getSelectedTutorId()
      var hours = Number(this.hours())
      if(!hours || typeof hours != 'number' || hours < 1) throw new Error('hours must be a non-negative integer.')
      this.dis.dispatch('buyHours',{tutor:id,hours:hours})
    }).bind(this)

    this.choosePackage = (function(plan){
      var id = this.store.getSelectedTutorId()
      var planId = plan.getId()
      this.dis.dispatch('selectTutoringPlan',{plan:planId, tutor:id})
    }).bind(this)




}; // end view model.

  return {
    viewModel: ViewModel,
    template: template
  }
});
