define(['abstract-interfaces/Store',
        'dispatcher/Dispatcher',
        'payment/PaymentRemoteService'],
function(AbstractStore,
         Dispatcher,
        PaymentRemoteService){

  var instance = null;
  new PaymentRemoteService()

var PaymentStore = function(){
  Object.setPrototypeOf(this,new AbstractStore())
  this.dis = new Dispatcher()
  this.selectedPlan = null
  this.tutorPlansOpen = false
  this.isCreditCardInfoOpen = false
  this.isWaiting = false
  this.showPaymentSuccess = false
  this.isProcessingPayment = false
  this.clientSecret
  this.productDescription = ''
  this.selectedTutor = null
  this.documentPlansOpen = false
  this.orderInfo = null
  this.tutoringPlans = []


  this.getTutoringPlans = function(){
    var normalPlan = null
    var packagedPlans = []
    this.tutoringPlans.forEach(function(p){
      if(p.getHours() == 1){
        normalPlan = p
      } else {
        packagedPlans.push(p)
      }
    })
    return {
      normalPlan:normalPlan,
      packagedPlans:packagedPlans
    }
  }

  this.onTutoringPlans = (function(plans){
    this.tutoringPlans = plans
  }).bind(this)
  this.dis.reg('tutoringPlans',this.onTutoringPlans)


  this.onSelectDocumentPlan =(function(plan){
    if(!plan) throw new Error('invalid document plan')
    this.isWaiting = true
    this.pub()
  }).bind(this)

  this.onOpenDocumentPlans = (function(){
    this.documentPlansOpen = true
    this.pub()
  }).bind(this)
  this.openDocPlansId = this.dis.reg('openDocumentPlans',this.onOpenDocumentPlans)

  this.isDocumentPlansOpen = function(){
    return this.documentPlansOpen
  }

  this.onCloseDocumentPlans = (function(){
    this.documentPlansOpen = false
    this.pub()
  }).bind(this)
  this.dis.reg('closeDocumentPlans',this.onCloseDocumentPlans)

  this.getClientSecret = function(){
    return this.clientSecret
  }

  this.onHoursSelected = (function(clientSecret){
    console.log(clientSecret)
    this.orderInfo = clientSecret.order_info
    this.clientSecret = clientSecret.client_secret
    this.isCreditCardInfoOpen = true
    this.isWaiting = false
    this.tutorPlansOpen = false
    this.pub()
  }).bind(this)
  this.hourseSelectedId = this.dis.reg('hoursSelected',this.onHoursSelected)


  this.getOrderInfo = function(){
    return this.orderInfo
  }


  this.onBuyHours = (function(hours){
    if(!hours) throw new Error('invalid hours')
    this.isWaiting = true
    this.pub()
  }).bind(this)
  this.dis.reg('buyHours', this.onBuyHours)

  this.getHoursToBuy = function(){
    return this.hoursToBuy
  }

  this.isWaitingForServer = function(){
    return this.isWaiting
  }


  this.getProductDescription = (function(){
    return this.productDescription
  }).bind(this)

  this.getSelectedTutorId = function(){
    if(this.selectedTutor){
      return this.selectedTutor.getId()
    } else{
      return null
    }

  }

  this.onOpenTutoringPlans = (function(tutor){
    if(this.tutoringPlans.length > 0){
      this.tutorPlansOpen = true
      this.selectedTutor = tutor
      this.pub()
    } else {
      window.alert('No tutoring service available at this time.')
    }
  }).bind(this)
  this.dis.reg('openTutoringPlans',this.onOpenTutoringPlans)

  this.isTutoringPlansOpen = function(){
    return this.tutorPlansOpen
  }

  this.onCloseTutorPlans = (function(){
    this.tutorPlansOpen = false
    this.pub()
  }).bind(this)
  this.dis.reg('closeTutoringPlans',this.onCloseTutorPlans)

  /**
     When a plan is selected the payment options
    should close and the credit card info
    should open.
  */
  this.onSelectTutoringPlan = (function(plan){
    if(!plan) throw new Error('invalid option')
    this.selectedPlan = plan
    this.isWaiting = true
    this.tutorPlansOpen = false
    this.pub()
  }).bind(this)
  this.dis.reg('selectTutoringPlan',this.onSelectTutoringPlan)

  this.onPlanSelected = (function(response){
    this.clientSecret = response.client_secret
    this.orderInfo = response.order_info
    this.isCreditCardInfoOpen = true
    this.isWaiting = false
    this.pub()
  }).bind(this)
  this.planSelectedId = this.dis.reg('planSelected',this.onPlanSelected)


  this.closeCreditCardInfo = (function(){
    this.isCreditCardInfoOpen = false
    this.showPaymentSuccess = false
    this.pub()
  }).bind(this)
  this.dis.reg('closeCreditCardInfo',this.closeCreditCardInfo)

  this.onConfirmingPayment = (function(){
    this.isProcessingPayment = true
    this.pub()
  }).bind(this)
  this.confirmingPaymentId = this.dis.reg('confirmingPayment',this.onConfirmingPayment)

  this.onPaymentProcessed = (function(success){
    this.isProcessingPayment = false
    this.showPaymentSuccess = success
    this.pub()
  }).bind(this)
  this.paymentProcessedId = this.dis.reg('paymentProcessed',this.onPaymentProcessed)



}

return {
  getInstance:function(){
    if(!instance){
      instance = new PaymentStore()
    }
    return instance;
  },
  getNew:function(){
    return new PaymentStore();
  }
};
})
