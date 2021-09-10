define(['ko',
        'text!credit-card-info/template.html',
        'dispatcher/Dispatcher',
        'payment/PaymentStore',
        'stripe'], // ensure Stripe is available first.
function(ko, template, Dis, Store){
  function ViewModel(){


    this.dis = new Dis()
    this.store = Store.getInstance()
    this.isVisible = ko.observable(false)
    this.isSpinnerVisible = ko.observable(false)

    this.cardholderName = ko.observable('')
    this.isNameValid = ko.observable(false)
    this.orderTotal = ko.observable(0)
    this.productDescription = ko.observable('')
    this.productQuantity = ko.observable(0)
    this.productPrice = ko.observable('')
    this.salesTax = ko.observable('')

    this.isProcessingPayment = ko.observable(false)
    this.isPaymentComplete = ko.observable(false)


    this.onStore = (function(){
      var show = this.store.isCreditCardInfoOpen
      if((!show || this.store.showPaymentSuccess) && this.stripe){
        this.card.clear()
        this.cardholderName('')
      }
      this.isVisible(this.store.isCreditCardInfoOpen)
      this.isSpinnerVisible(this.store.isWaiting)
      this.isProcessingPayment(this.store.isProcessingPayment)
      this.isPaymentComplete(this.store.showPaymentSuccess)
      this.setOrderInfo()
    }).bind(this)
    this.store.sub(this.onStore)


    this.setOrderInfo = function(){
      var order = this.store.getOrderInfo()
      if(order){
        this.productDescription(order.product_description)
        this.productPrice('$' + Number(order.product_price).toFixed(2))
        this.productQuantity(order.product_qty)
        this.salesTax('$' + Number(order.product_qty * order.product_price * order.sales_tax_rate).toFixed(2))
        this.orderTotal('$' + Number(order.product_qty * order.product_price * (1 + order.sales_tax_rate)).toFixed(2))
      }
    }


    this.onCardholderName = (function(name){
      var displayError = document.getElementById('card-errors');
      if(/^[A-Za-z]{1,}\s+[A-Za-z]{1,}$/.test(name)){
        this.isNameValid(true)
          displayError.textContent = '';
      } else {
        this.isNameValid(false)
          displayError.textContent = 'Cardholder name invalid.';
      }
    }).bind(this)
    this.cardholderName.subscribe(this.onCardholderName)





    this.close = (function(){
      this.dis.dispatch('closeCreditCardInfo')
    }).bind(this)


    // Custom styling can be passed to options when creating an Element.
    // (Note that this demo uses a wider set of styles than the guide below.)
    var style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '18px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };

    this.livePublicKey = 'pk_live_fJ6an24u7T7ziXp4oD4tLGFM00N9TudeYY'
    this.testPublicKey = 'pk_test_AkTJD4FnhRQeB9G9wfCifOzH00PPHxrLAN'

    // from https://stripe.com/docs/stripe-js#html-js
    this.setupCard = (function(isLive){
        // Create a Stripe client.
        if(isLive){
          this.stripe = Stripe(this.livePublicKey);
          //console.log('stripe - live mode.')
        }
        else{
          this.stripe = Stripe(this.testPublicKey);
          //console.log('stripe - dev mode.')
        }
        // Create an instance of Elements.
        var elements = this.stripe.elements();
        // Create an instance of the card Element.
        this.card = elements.create('card', {style: style});
        // Add an instance of the card Element into the `card-element` <div>.
        this.card.mount('#card-element');
        this.card.addEventListener('change', function(event) {
          var displayError = document.getElementById('card-errors');
          if (event.error) {
            displayError.textContent = event.error.message;
          } else {
            displayError.textContent = '';
          }
        });
    }).bind(this)
    this.dis.reg('paymentEnvironment',this.setupCard)

    // Handle form submission.
    this.confirmPayment = (function(ev) {
        ev.preventDefault();
        if(!this.stripe) throw new Error('expected stripe to be initialized.')
        var clientSecret = this.store.clientSecret
        if(!clientSecret)
          throw new Error('clientSecret has not been set')
        var paymentMethod
        if(this.cardholderName().length > 0){
          paymentMethod = {
            payment_method: {
              card: this.card, // automatically includes postal code.
              billing_details: {
                name: this.cardholderName(),
              }
            }
          }
        } else {
          paymentMethod = {
            payment_method: {
              card: this.card, // automatically includes postal code.
            }
          }
        }
        this.stripe.confirmCardPayment(clientSecret, paymentMethod)
                  .then(this.onConfirmPaymentComplete);
        this.dis.dispatch('confirmingPayment')
      }).bind(this)

      var form = document.getElementById('payment-form');
      form.addEventListener('submit', this.confirmPayment);



      this.onConfirmPaymentComplete = (function(result) {
        if (result.error) {
          // Show error to your customer (e.g., insufficient funds)
          var errorElement = document.getElementById('card-errors');
          errorElement.textContent = result.error.message;
          console.log(result.error.message);
          this.dis.dispatch('paymentProcessed',false)
        } else {
          // The payment has been processed!
          if (result.paymentIntent.status === 'succeeded') {
            this.dis.dispatch('paymentProcessed',true)
            // Show a success message to your customer
            // There's a risk of the customer closing the window before callback
            // execution. Set up a webhook or plugin to listen for the
            // payment_intent.succeeded event that handles any business critical
            // post-payment actions.
          }
          else{
            console.log('failure')
            this.dis.dispatch('paymentProcessed',false)
          }
        }
      }).bind(this)


};

  return {
    viewModel: ViewModel,
    template: template
  }
});
