
define(['ko',
        'postbox',
        'text!admin/tutor-list/template.html',
        'admin/tutor-list/TutorListRemoteService'],

function(ko,
         postbox,
         template,
         AdminRemoteService){


  function ViewModel(params, componentInfo){

    this.componentParams = params;
    this.tutors = ko.observableArray([]);
    this.currentTutorId = ko.observable(-1);
    this.currentChildComponent = ko.observable('course-delegator');
    this._remoteService = new AdminRemoteService();

    /**
      All the panel names that require the tutor list will
      make the tutor list visible.
    **/
    this.onVisiblePanelChange = function(isVisible){
        this._remoteService.registerOnTutorsReceived(this.onTutorsRecieved);
        this._remoteService.getTutors();
    }
    this.onVisiblePanelChange = this.onVisiblePanelChange.bind(this);
    this.componentParams.isVisible.subscribe(this.onVisiblePanelChange,this);

    this.openTutorInfo = function(){
      this.currentChildComponent('tutor-info');
    }

    this.openCourseDelegator = function(){
      this.currentChildComponent('course-delegator');
    }

    this.openTutorCreator = function(){
      this.currentChildComponent('tutor-creator');
    }

  

    this.selectTutor = function(data, event){
      this.currentTutorId(data.id);
    }
    this.selectTutor = this.selectTutor.bind(this);

    this.onTutorsRecieved = function(jsonTutors){
      var parsedTutors = JSON.parse(jsonTutors);
      this.tutors(parsedTutors);
      if(parsedTutors.length > 0){
          this.currentTutorId(parsedTutors[0].id); // select the first tutor by default.
          this.openTutorInfo();
      }
      else{
        console.log("No tutors loaded into the system.");
      }
    }
    this.onTutorsRecieved = this.onTutorsRecieved.bind(this);
  };

  return {
    viewModel: ViewModel,
    template: template
  }

});
