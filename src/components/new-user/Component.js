
define(['ko',
        'text!new-user/template.html',
        'dispatcher/Dispatcher',
        'new-user/NewUserStore'],

function(ko,
         template,
         Dispatcher,
         Store){

  function ViewModel(){

    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.majors = ko.observableArray([{name:'Math'},{name:'Computer Science'}])
    this.isVisible = ko.observable(false)
    this.isFirstStep = ko.observable(true)
    this.isSecondStep = ko.observable(false)

    this.onStore = (function(){

    }).bind(this)
    this.store.sub(this.onStore)




    this.chooseYork = (function(){

    }).bind(this)

    this.chooseNonYork = (function(){

    }).bind(this)


    this.selectMajor = (function(){

    }).bind(this)

  }

  return {
    viewModel: ViewModel,
    template : template
  }


});
