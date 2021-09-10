/**
 *  Used for closing a widget when the user clicks somewhere else on the document.
 *
 *  element should be an ancester of all elements in the widget
 *
 * valueAccessor must be a function that executes the closing of the widget
 * (this closing function should be defined in the view model.)
 *
 */
define(['ko','jquery'],function(ko,$){

  ko.bindingHandlers.complementClick = {


    init :  function(element,valueAccessor,allBindings,viewModel){

        var $e = $(element);

        $(document).mouseup(function(event){
          var $target = $(event.target);
          var matchCount = $target.closest($e).length;
          if(matchCount > 0){
            return true;
          }
          else {
            // no child of the menu was clicked (nor the menu its self.).
            var callback = valueAccessor(); // returns the argument that was passed to the binding.
            callback();
          }
        });
    },

    update: function(element,valueAccessor,allBindings,viewModel){


    }
  };
});
