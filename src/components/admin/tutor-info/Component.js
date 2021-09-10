
define(['ko',
        'postbox',
        'text!admin/tutor-info/template.html',
        'admin/tutor-info/TutorInfoRemoteService'],

function(ko,
         postbox,
         template,
         RemoteService){

  function ViewModel(params, componentInfo){

    this.isVisible = ko.observable(false);
    this.noPhotoURL = './assets/no-photo.jpg';
    this.photoURL = ko.observable(this.noPhotoURL);
    this.firstName = ko.observable('');
    this.lastName = ko.observable('');
    this.email = ko.observable('');
    this._remoteService = new RemoteService();
    this.componentParams = params;


    this.injectRemoteService =  function(service){
      this._remoteService = service;
    }


    this.componentParams.visiblePanel.subscribe(function(panelName){
      if(panelName == 'tutor-info'){
        this.isVisible(true);
      }else{
        this.isVisible(false);
      }
    },this);


    this.getCurrentTutorId = function(){
      return this.componentParams.currentTutorId();
    }

    this.componentParams.currentTutorId.subscribe(function(tutorId){
      if(tutorId > 0){
          this._remoteService.getTutorInfo(tutorId);
      }
    },this);

    this.onTutorInfoReceived = function(info){
      var parsedInfo = JSON.parse(info);
      var image = parsedInfo.large_photo_url;
      if(image == null){
        this.photoURL(this.noPhotoURL);
      }
      else{
        this.photoURL(parsedInfo.large_photo_url);
      }
      this.firstName(parsedInfo.first);
      this.lastName(parsedInfo.last);
      this.email(parsedInfo.email);
    }
    this.onTutorInfoReceived = this.onTutorInfoReceived.bind(this);



    this.deleteTutor = function(){
      this._remoteService.deleteTutor(this.getCurrentTutorId());
    }

    this.onTutorDeleted = function(deletedTutorId){
      this.selectAnotherTutor(deletedTutorId);
    }
    this.onTutorDeleted = this.onTutorDeleted.bind(this);

    this.onDeleteTutorError = function(deletedTutorId){
    }

    this.selectAnotherTutor = function(currentTutorId){
      var currentTutorId = JSON.parse(currentTutorId);
      var tutors = this.componentParams.currentTutors();
      for(var i = 0; i < tutors.length; i++){
        if(tutors[i].id == currentTutorId){

          if(i < tutors.length - 1){ // not the last element.
            this.componentParams.currentTutorId(tutors[i + 1].id);
            tutors.splice(i, 1);
            this.componentParams.currentTutors(tutors);
            break;
          }
          else if(i - 1 >= 0){ // is the last element, but not the first.
            this.componentParams.currentTutorId(tutors[i - 1].id);
            tutors.splice(i, 1);
            this.componentParams.currentTutors(tutors);
            break;
          }
          else if(i == 0){ // is the last and the first.
            tutors.splice(i, 1);
            this.componentParams.currentTutorId(-1);
            this.componentParams.currentTutors(tutors);
            console.log('No more tutors!');
          }
        }
      }
    }

    this._remoteService.registerOnTutorInfo(this.onTutorInfoReceived);
    this._remoteService.registerOnTutorDeleted(this.onTutorDeleted);
    this._remoteService.registerOnDeleteTutorError(this.onDeleteTutorError);

  };

  return {
    viewModel: ViewModel,
    template: template
  }

});
