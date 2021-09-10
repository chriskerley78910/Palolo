define(['ko',
        'text!document-plans/template.html',
        'dispatcher/Dispatcher',
        'payment/PaymentStore'],
function(ko, template, Dis, Store){
  function ViewModel(){

    this.dis = new Dis()
    this.store = Store.getInstance()
    this.isVisible = ko.observable(false)


    this.onStore = (function(){
      this.isVisible(this.store.isDocumentPlansOpen())
    }).bind(this)
    this.store.sub(this.onStore)

    this.selectValuePlan = function(){
      this.dis.dispatch('selectDocumentPlan',{plan:5})
    }

    this.selectMediumPlan = function(){
      this.dis.dispatch('selectDocumentPlan',{plan:6})
    }

    this.selectExpensivePlan = function(){
      this.dis.dispatch('selectDocumentPlan',{plan:7})
    }

    this.closePaymentOptions = (function(){
      this.dis.dispatch('closeDocumentPlans')
    }).bind(this)


}; // end view model.

  return {
    viewModel: ViewModel,
    template: template
  }
});
