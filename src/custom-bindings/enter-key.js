
define(['ko'],function(ko){
  ko.bindingHandlers.enterKey = {
    init :  function(element,valueAccessor,allBindings,viewModel){
      var callBack = valueAccessor();
     // alert(callBack);
     // alert(element);
  //adsdfadsdf does not work.
      $(element).keypress(function(event){

        var keyCode = (event.which ? event.which : event.keyCode);

        if(keyCode === 13){
          //console.log(keyCode);
          //console.log($(element).text());
          callBack.call(viewModel);

          return false;
        }
        return true;
      });
    }
  };
});
