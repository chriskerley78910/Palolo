define(['ActiveRemoteService',
        'dispatcher/Dispatcher',
        'payment/models/TutoringPlan'],
function(ActiveRemoteService,
        Dispatcher,
        TutoringPlan){


var PaymentRemote = function(){

    this.constructor = PaymentRemote;
    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("payments");
    this.dis = new Dispatcher()

    this.onSelectDocumentPlan = (function(data){
      var url = this.getServerURL() + '/selectDocumentPlan';

      $.ajax({
        url:url,
        type:'post',
        data:data,
        beforeSend:this.setAuthorizationHeader,
        success:this.onDocumentPlanSelected,
        error:this.onError
      })
    }).bind(this)
    this.selDocPlanId = this.dis.reg('selectDocumentPlan',this.onSelectDocumentPlan)


    this.onDocumentPlanSelected = (function(){
      this.dis.dispatch('documentPlanSelected')
    }).bind(this)


    this.onAuth = (function(auth){
      if(auth.state = 'authenticated'){
        this.getTutoringPlans()
        this.dis.dispatch('paymentEnvironment',this.isLive())
      }
    }).bind(this)
    this.dis.reg('authState',this.onAuth)


    this.getTutoringPlans = (function(){
        var url = this.getServerURL() + '/tutoringPlans'
        $.ajax({
          url:url,
          type:'get',
          beforeSend:this.setAuthorizationHeader,
          success:this.onTutoringPlans,
          error:this.onError
        })
    }).bind(this)

    this.onBuyHours = (function(data){
      var url = this.getServerURL() + '/buyHours';
      $.ajax({
        url:url,
        type:'post',
        data:data,
        beforeSend:this.setAuthorizationHeader,
        success:this.onHoursSelected,
        error:this.onError
      })
    }).bind(this)
    this.dis.reg('buyHours',this.onBuyHours)

    this.onHoursSelected = (function(clientSecret){
      this.dis.dispatch('hoursSelected',clientSecret)
    }).bind(this)

    this.onSelectTutoringPlan = (function(plan){
      var url = this.getServerURL() + '/selectTutoringPlan';

      $.ajax({
        url:url,
        type:'post',
        data:plan,
        beforeSend:this.setAuthorizationHeader,
        success:this.onPlanSelected,
        error:this.onError
      })
    }).bind(this)
    this.dis.reg('selectTutoringPlan',this.onSelectTutoringPlan)


    this.onTutoringPlans = (function(rawPlans){
      var wrapped = []
      rawPlans.forEach(function(p){
        wrapped.push(new TutoringPlan(p))
      })
      this.dis.dispatch('tutoringPlans', wrapped)
    }).bind(this)


    this.onPlanSelected = (function(clientSecret){
      this.dis.dispatch('planSelected',clientSecret)
    }).bind(this)


    this.onError = (function(res){
      console.log(res)
      var adminContact = '\n-- Contact Chris at 905-808-8791 for assistance. ---'
      if(res.responseJSON){
        var qbResponse = res.responseJSON.errors[0].moreInfo
        alert(qbResponse + adminContact)
      }else{
        var qbResponse = res.responseText
        alert(qbResponse + adminContact)
      }
    }).bind(this)


}

return PaymentRemote;
})
