
define(['ko',
        'text!section-selector/template.html',
        'dispatcher/Dispatcher'],

function(ko,
         template,
         Dispatcher){

  function ViewModel(params, componentInfo){

    this.dis = new Dispatcher();
    this.isSelected = ko.observable(false);
    this.courseGroup = ko.observable(null);

    this.selectCourseView = function(){
      this.dis.dispatch('showGroupView');
    }

    this.onCourseViewSelected = (function(isSelected){
      this.isSelected(isSelected);
    }).bind(this)
    this.openGroupViewId = this.dis.reg('showGroupView', this.onCourseViewSelected);

    this.prevSection = function(){
      var sections = this.sections();
      this.currentSectionIndex--;
      if(this.currentSectionIndex < 0){
        this.currentSectionIndex = sections.length - 1;
        var section = sections[this.currentSectionIndex];
        newSectionId = section.getId();
        this.selectedSection(section);
      }
      else{
        var section = sections[this.currentSectionIndex];
        newSectionId = section.getId();
        this.selectedSection(section);
      }
      this.dis.dispatch('getCourseGroupBySection',newSectionId);
    }

    this.prevSection = function(){
      var sections = this.sections();
      this.currentSectionIndex--;
      if(this.currentSectionIndex < 0){
        this.currentSectionIndex = sections.length - 1;
        var section = sections[this.currentSectionIndex];
        newSectionId = section.getId();
        this.selectedSection(section);
      }
      else{
        var section = sections[this.currentSectionIndex];
        newSectionId = section.getId();
        this.selectedSection(section);
      }
      this.dis.dispatch('getCourseGroupBySection',newSectionId);
    }

    this.nextSection = function(){

      var sections = this.sections();
      if(sections.length < 1){
        throw new Error('Cant get next section if section list is empty.');
      }
      this.currentSectionIndex++;
      if(this.currentSectionIndex >= sections.length){
        this.currentSectionIndex = 0;
        var section = sections[this.currentSectionIndex];
        newSectionId = section.getId();
        this.selectedSection(section);
      }
      else{
        var section = sections[this.currentSectionIndex];
        newSectionId = section.getId();
        this.selectedSection(section);
      }
      this.dis.dispatch('getCourseGroupBySection',newSectionId);
    }



  } // end view model.

  return {
    viewModel: ViewModel,
    template : template
  }


});
