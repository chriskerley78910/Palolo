define(['payment/credit-card-info/Component'],
(Component) => {
    describe("credit-card-info", ()=>{

      let sut
      beforeEach(()=>{
        sut = new Component.viewModel()
      })

      it('onCardholderName() sets isNameValid',()=>{

        sut.onCardholderName('Chris')
        expect(sut.isNameValid()).toBeFalsy();

        sut.onCardholderName('Chris Kerley')
        expect(sut.isNameValid()).toBeTruthy();

        sut.onCardholderName('Chris Kerley 23432')
        expect(sut.isNameValid()).toBeFalsy();
      })

      it('setOrderInfo() does nothing if order is null', ()=>{

        spyOn(sut.store,'getOrderInfo').and.returnValue(null)
        spyOn(sut,'productPrice')
        sut.setOrderInfo()
        expect(sut.productPrice).not.toHaveBeenCalled()
      })

      it('setOrderInfo() does that', ()=>{
        const order = {
          product_qty:2,
          product_price:1.1,
          product_description:'Live Tutoring',
          sales_tax_rate:0.13
        }
        spyOn(sut.store,'getOrderInfo').and.returnValue(order)
        sut.setOrderInfo()
        expect(sut.productPrice()).toBe('$1.10')
        expect(sut.productDescription()).toBe('Live Tutoring')
        expect(sut.productQuantity()).toBe(2)
        expect(sut.salesTax()).toBe("$0.29")
        expect(sut.orderTotal()).toBe('$2.49')

      })


      it('setupCard(true) sets up stripe with the live key',()=>{
        sut.setupCard(true)
        expect(sut.stripe._apiKey).toBe(sut.livePublicKey)
      })

      it('setupCard(false) sets up stripe with the test key',()=>{
        sut.setupCard(false)
        expect(sut.stripe._apiKey).toBe(sut.testPublicKey)
      })

      it('onStore, showPaymentSuccess => clears the card',()=>{
        spyOn(sut.store,'isCreditCardInfoOpen').and.returnValue(true)
        spyOn(sut.store,'showPaymentSuccess').and.returnValue(true)
        spyOn(sut,'cardholderName')
        sut.stripe = {}
        sut.card = {
          clear:jasmine.createSpy()
        }
        sut.onStore()

        expect(sut.isVisible()).toBeTruthy()
        expect(sut.card.clear).toHaveBeenCalled()
        expect(sut.cardholderName).toHaveBeenCalledWith('')
      })

      it('onStore, !isCreditCardInfoOpen => clears the card',()=>{
        spyOn(sut.store,'isCreditCardInfoOpen').and.returnValue(false)
        spyOn(sut.store,'showPaymentSuccess').and.returnValue(false)
        sut.stripe = {}
        sut.card = {
          clear:jasmine.createSpy()
        }
        sut.onStore()

        expect(sut.isVisible()).toBeTruthy()
        expect(sut.card.clear).toHaveBeenCalled()
      })

      it('onStore, store.isWaiting <==> isSpinnerVisible()',()=>{
        sut.isSpinnerVisible(false)
        sut.store.isWaiting = true
        sut.onStore()
        expect(sut.isSpinnerVisible()).toBeTruthy()

        sut.store.isWaiting = false
        sut.onStore()
        expect(sut.isSpinnerVisible()).toBeFalsy()
      })

      it('onStore, showPaymentSuccess <=> showPaymentSuccess',()=>{
        sut.isPaymentComplete(false)
        sut.store.showPaymentSuccess = true
        sut.onStore()
        expect(sut.isPaymentComplete()).toBeTruthy()
        sut.store.showPaymentSuccess = false
        sut.onStore()
        expect(sut.isPaymentComplete()).toBeFalsy()
      })



      it('close => dis that',()=>{
        spyOn(sut.dis,'dispatch')
        sut.close()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('closeCreditCardInfo')
      })

      it('confirmPayment => isProcessingPayment() == true',()=>{
        const event = {
          preventDefault:jasmine.createSpy()
        }
        sut.stripe = {
          confirmCardPayment : ()=>{
            return Promise.resolve({
              paymentIntent:{
                status:'succeeded'
              }
            })
          }
        }
        sut.store.clientSecret = {}
        spyOn(sut.dis,'dispatch')
        spyOn(sut,'onConfirmPaymentComplete')

        sut.confirmPayment(event)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('confirmingPayment')

      })

      it('onConfirmPaymentComplete => dispatch(paymentProcessed)',()=>{
        spyOn(sut.dis,'dispatch')
        const result = {
          paymentIntent:{
            status:'succeeded'
          }
        }
        sut.onConfirmPaymentComplete(result)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('paymentProcessed', true)
      })

    })
})
