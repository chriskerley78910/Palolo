define(['ko','jquery'],function(ko,$){


  ko.bindingHandlers.sliderValue = {
    // Init, runs on initialization
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext)  {
      if ( ko.isObservable(valueAccessor()) && (element instanceof HTMLInputElement) && (element.type === "range") )
      {
        // Add event listener to the slider, this will update the observable on input (just moving the slider),
        // Otherwise, you have to move the slider then release it for the value to change
        element.addEventListener('input', function(){
          // Update the observable
          if (ko.unwrap(valueAccessor()) != element.value)
          {
            valueAccessor()(element.value);

            // Trigger the change event, awesome fix that makes
            // changing a dropdown and a range slider function the same way
            element.dispatchEvent(new Event('change'));
          }
        }); // End event listener
      }

    }, // End init

    // Update, runs whenever observables for this binding change(and on initialization)
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
      // Make sure the parameter passed is an observable
      if ( ko.isObservable(valueAccessor()) && (element instanceof HTMLInputElement) && (element.type === "range") )
      {
        // Update the slider value (so if the value changes programatically, the slider will update)
        if (element.value != ko.unwrap(valueAccessor()))
        {
          element.value = ko.unwrap(valueAccessor());
          element.dispatchEvent(new Event('input'));
        }
      }
    } // End update

  }; // End sliderValue

});
