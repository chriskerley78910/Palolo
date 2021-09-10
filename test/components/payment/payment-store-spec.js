
define(['payment/PaymentStore',
        'people-models/Person',
        'payment/models/TutoringPlan'],
function(Store,
         Person,
         TutoringPlan
        ){

    describe("payment-store", function(){

      let sut;
      beforeEach(()=>{
        sut = Store.getNew()
      })

      it('getTutoringPlans => returns a normalPlan and packagedPlans', ()=>{
        const p1 = TutoringPlan.getFake()
        p1.setId(1)
        p1.setHours(1)

        const p2 = TutoringPlan.getFake()
        p2.setId(2)
        p2.setHours(2)

        const p3 = TutoringPlan.getFake()
        p3.setId(3)
        p3.setHours(3)

        sut.onTutoringPlans([p1,p2,p3])

        const r = sut.getTutoringPlans()
        expect(r.normalPlan.getId()).toBe(p1.getId())
        expect(r.packagedPlans[0]).toBe(p2)
        expect(r.packagedPlans[1]).toBe(p3)
      })


      it('getOrderInfo() == null by default', ()=>{
        expect(sut.getOrderInfo()).toBeNull()
      })

      it('selectDocumentPlan => isWaiting',done =>{
        expect(sut.isWaitingForServer()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isWaitingForServer()).toBeTruthy()
          done()
        })
        sut.onSelectDocumentPlan(6)
      })

      it('onCloseDocumentPlans => does that.',done =>{
        sut.documentPlansOpen = true
        sut.onPub(()=>{
          expect(sut.isDocumentPlansOpen()).toBeFalsy()
          done()
        })
        sut.onCloseDocumentPlans()
      })

      it('onOpenDocumentPlans does that', done =>{
        expect(sut.isDocumentPlansOpen()).toBeFalsy()
        sut.onPub(()=>{
            expect(sut.isDocumentPlansOpen()).toBeTruthy()
          done()
        })
        sut.onOpenDocumentPlans()
      })

      it('onOpenDocumentPlans is reg on dis',()=>{
        const cb = sut.dis.getCallbackById(sut.openDocPlansId)
        expect(cb).toBe(sut.onOpenDocumentPlans)
      })

      it('onHoursSelected => store secret, open credit card form, pub',done => {
        const secret = {}
        const orderInfo = {
          product_description:'tutoring',
          product_qty:1,
          product_price:50
        }
        const clientSecret = {
          order_info:orderInfo,
          client_secret:secret
        }
        sut.tutorPlansOpen = true
        sut.onPub(()=>{
          expect(sut.getOrderInfo()).toEqual(orderInfo)
          expect(sut.getClientSecret()).toBe(clientSecret.client_secret)
          expect(sut.isTutoringPlansOpen()).toBeFalsy()
          done()
        })
        sut.onHoursSelected(clientSecret)
      })

      it('onHoursSelected is reg on dispatcher',()=>{
        const cb = sut.dis.getCallbackById(sut.hourseSelectedId)
        expect(cb).toBe(sut.onHoursSelected)
      })

      it('onBuyHours => set  waiting and pub',done =>{

        const hours = 2
        sut.tutorPlansOpen = true
        expect(sut.isWaitingForServer()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isWaitingForServer()).toBeTruthy()
          done()
        })
        sut.onBuyHours(hours)

      })

      it('getProductDescription() == ""',()=>{
        expect(sut.getProductDescription()).toBe('')
      })

      it('onOpenTutoringPlans => isTutoringPlansOpen == true',done =>{
        sut.tutorPlansOpen = false
        sut.tutoringPlans = [1]
        const tutor = Person.getFake()
        expect(sut.getSelectedTutorId()).toBeNull()
        sut.onPub(()=>{
            expect(sut.isTutoringPlansOpen()).toBeTruthy()
            expect(sut.getSelectedTutorId()).toBe(tutor.getId())
            done()
        })
        sut.onOpenTutoringPlans(tutor)
      })

      it('onOpenDocumentPlans, tutoringPlans.length == 0 => alert no tutoring', ()=>{
        sut.tutoringPlans = []
        const p = Person.getFake()
        spyOn(window,'alert')
        sut.onOpenTutoringPlans(p)
        expect(window.alert).toHaveBeenCalled()
      })

      it('onCloseTutorPlans => isTutoringPlansOpen() == false',done =>{

        sut.tutorPlansOpen = false
        sut.onPub(()=>{
          expect(sut.isTutoringPlansOpen()).toBeFalsy()
          done()
        })
        sut.onCloseTutorPlans()
      })

      it('onSelectTutoringPlan switches to the credit card view',()=>{
        expect(sut.isCreditCardInfoOpen).toBeFalsy()
        sut.tutorPlansOpen = true
        expect(sut.selectedPlan).toBeNull()
        const selectedPlan = 1
        sut.isWaiting = false
        sut.onPub(()=>{
          expect(sut.isCreditCardInfoOpen).toBeFalsy()
          expect(sut.isTutoringPlansOpen()).toBeFalsy()
          expect(sut.isWaiting).toBeTruthy()
          expect(sut.selectedPlan).toBe(selectedPlan)
        })
        sut.onSelectTutoringPlan(selectedPlan)
      })


      it('onPlanSelected stores the client secret and opens the credit card form',done => {
        const secret = {}
        const desc = 'tutoring'
        const qty = 2
        const price = 29.95
        const response = {
          client_secret:secret,
          order_info:{
              product_description:desc,
              product_qty:qty,
              product_price:price}
        }
        sut.clientSecret = null
        sut.isWaiting = true
        sut.isCreditCardInfoOpen = false

        const expectedOrder = {
          product_description:desc,
          product_qty:qty,
          product_price:price
        }

        sut.onPub(()=>{
          expect(sut.isWaiting).toBeFalsy()
          expect(sut.clientSecret).toBe(secret)
          expect(sut.isTutoringPlansOpen()).toBeFalsy()
          expect(sut.isCreditCardInfoOpen).toBeTruthy()
          expect(sut.getOrderInfo()).toEqual(expectedOrder)
          done()
        })
        sut.onPlanSelected(response)
      })

      it('onPlanSelected is reg on planSelectedId',()=>{
        const cb = sut.dis.getCallbackById(sut.planSelectedId)
        expect(cb).toBe(sut.onPlanSelected)
      })

      it('onSelectTutoringPlan',()=>{
        try{
          sut.onSelectTutoringPlan(null)
        }
        catch(err){
          expect(err.message).toBe('invalid option')
        }
      })





      it('closeCreditCardInfo does that',done =>{
        sut.isCreditCardInfoOpen = true
        sut.onPub(()=>{
          expect(sut.isCreditCardInfoOpen).toBeFalsy()
          done()
        })
        sut.closeCreditCardInfo()
      })



      it('onConfirmingPayment => isProcessingPayment', done =>{
        sut.isProcessingPayment = false
        sut.onPub(()=>{
          expect(sut.isProcessingPayment).toBeTruthy();
          done()
        })
        sut.onConfirmingPayment()
      })

      it('onConfirmingPayment is reg on confirmingPaymentId',()=>{
        const cb = sut.dis.getCallbackById(sut.confirmingPaymentId)
        expect(cb).toBe(sut.onConfirmingPayment)
      })

      it('onPaymentProcessed => show success, !isWaiting',done =>{

        sut.isProcessingPayment = true
        sut.showPaymentSuccess = false
        sut.clientSecret = {}
        sut.onPub(()=>{
          expect(sut.isProcessingPayment).toBeFalsy()
          expect(sut.showPaymentSuccess).toBeTruthy()
          expect(sut.clientSecret).toEqual({})
          done()
        })
        sut.onPaymentProcessed(true)
      })

      it('onPaymentProcessed is reg on paymentProcessed',()=>{
        const cb = sut.dis.getCallbackById(sut.paymentProcessedId)
        expect(cb).toBe(sut.onPaymentProcessed)
      })





    }); // end describe

}); // end define.
