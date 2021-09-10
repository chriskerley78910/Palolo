define(['payment/PaymentRemoteService', 'payment/models/TutoringPlan'],
(Service, TutoringPlan) => {
    describe("payment-remote-service", ()=>{

      let sut
      beforeEach(()=>{
        sut = new Service()
      })

      it('getTutoringPlans => ajax request. ', ()=>{
        spyOn($,'ajax')
        sut.getTutoringPlans()
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          success:sut.onTutoringPlans
        }))
      })

      it('onTutoringPlans => dispatch wrapped plans.',()=>{
        const r = TutoringPlan.getRaw()
        spyOn(sut.dis, 'dispatch')
        sut.onTutoringPlans([
          r,r
        ])
        expect(sut.dis.dispatch).toHaveBeenCalledWith('tutoringPlans', jasmine.any(Array))
      })

      it('onSelectDocumentPlan is reg on dis',()=>{
        const cb = sut.dis.getCallbackById(sut.selDocPlanId)
        expect(cb).toBe(sut.onSelectDocumentPlan)
      })

      it('onDocumentPlanSelected => dispatch documentPlanSelected',()=>{
        spyOn(sut.dis,'dispatch')
        sut.onDocumentPlanSelected()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('documentPlanSelected')
      })

      it('onSelectDocumentPlan => ajax the plan',()=>{
        spyOn($,'ajax')
        const plan = 1
        sut.onSelectDocumentPlan({plan:plan})
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          url:sut.getServerURL() + '/selectDocumentPlan',
          data:{plan:plan}
        }))
      })

      it('onAuth, authenticated => dispatch false if dev mode',()=>{
        spyOn(sut.dis,'dispatch')
        spyOn(sut,'getTutoringPlans')
        sut.onAuth({state:'authenticated'})
        expect(sut.dis.dispatch).toHaveBeenCalledWith('paymentEnvironment',false)
      })

      it('onBuyHours => ajax it',()=>{
        spyOn($,'ajax')
        const hours = 2
        sut.onBuyHours(hours)
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          url:sut.getServerURL() + '/buyHours'
        }))
      })

      it('onHoursSelected => dispatch hoursSelected, secret',()=>{
        const secret = {}
        spyOn(sut.dis,'dispatch')
        sut.onHoursSelected(secret)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('hoursSelected',secret)
      })

      it('onSelectTutoringPlan => ajax request',()=>{
        spyOn($,'ajax')
        const planNum = 1
        sut.onSelectTutoringPlan(planNum)
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          type:'post',
          url:sut.getServerURL() + '/selectTutoringPlan'
        }))
      })

      it(`onPlanSelected => dispatch the client secret`, ()=>{
        const clientSecret = 1;
        spyOn(sut.dis,'dispatch')
        sut.onPlanSelected(clientSecret)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('planSelected',clientSecret)
      })

    })
})
