define(['ko'],function(ko){

  var Note = function(){
    this.isOpen = ko.observable(false);
    this.text = ko.observable('');
    this.title = ko.observable('Loop Invariants.');
    this.hasFocus = ko.observable(false);

    this.dateCreated = function(){
      return "Mar 12th"
    }

    this.close = function(){
      this.isOpen(false);
    }

    this.open = function(){
      this.isOpen(true);
    }
  }

  return Note;

})
