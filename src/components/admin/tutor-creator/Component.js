
define(['ko',
        'postbox',
        'text!tutor-creator/template.html',
        'admin/tutor-creator/TutorCreatorRemoteService',
        'admin/tutor-creator/ImageStore'],

function(ko,
         postbox,
         template,
         RemoteService,
         ImageStore){


  function ViewModel(params, componentInfo){

    this.componentParams = params;
    this.isVisible = ko.observable(false);
    this.isSuccessMessageVisible = ko.observable(false);
    this.isErrorMessageVisible = ko.observable(false);
    this.firstName = ko.observable('');
    this.lastName = ko.observable('');
    this.email = ko.observable('');
    this.password = ko.observable('');
    this._remoteService = new RemoteService();
    this._imageStore = new ImageStore();
    this.messageLingerTime = 1500;
    this.errorMessage = ko.observable('');

    this.noPhotoURL = './assets/no-photo.jpg';
    this.photoURL = ko.observable(this.noPhotoURL);



    this.componentParams.visiblePanel.subscribe(function(panelName){
      if(panelName == 'tutor-creator'){
        this.isVisible(true);
        this._remoteService.registerOnTutorAdded(this.onTutorAdded);
        this._remoteService.registerOnAddTutorError(this.onAddTutorError);
        this._imageStore.registerImageSourceSetter(this.setImageSource);
        this._imageStore.registerImageTag();
      }
      else{
        this.isVisible(false);
      }
    },this);


    this.setImageSource = function(url){
      this.photoURL(url);
    }
    this.setImageSource = this.setImageSource.bind(this);


    // this.uploadPhoto = function(){
    //     var file_data = this.getFileData();
    //     var form_data = new FormData();
    //     form_data.append('file', file_data);
    //     this._remoteService.uploadPhoto(form_data);
    // }
    // this.uploadPhoto = this.uploadPhoto.bind(this);


    //
    // this.getFileData = function(){
    //   return $('#headshot-file').prop('files')[0];
    // }


    this.saveTutor = function(){
      try{
        var post = {
          first:this.firstName(),
          last:this.lastName(),
          email:this.email(),
          password:this.password()
        }
        if(post.first.length < 1 || post.last.length < 1 || post.email.length < 1 || post.password.length < 1){
          throw new Error("All fields must be filled in.");
        }
        if(this._imageStore.hasStoredImage() == false){
          throw new Error("You must upload an image for the tutor.");
        }
        this._remoteService.addTutor(post, this._imageStore.getImageData());
      }
      catch(err){
        this.showErrorMessage(err.message);
      }
    }


    this.onTutorAdded = function(jsonTutor){
        var parsedTutor = JSON.parse(jsonTutor);
        this.componentParams.currentTutors.push(parsedTutor);
        this.firstName('');
        this.lastName('');
        this.email('');
        this.password('');
        this.showSuccessMessage();
        this.photoURL(this.noPhotoURL);
        this._imageStore.clearStoredImage();
    }
    this.onTutorAdded = this.onTutorAdded.bind(this);



    this.showSuccessMessage = function(callback){
      this.isSuccessMessageVisible(true);
      var self = this;
      setTimeout(function(){
        self.isSuccessMessageVisible(false);
        if(typeof callback == 'function'){
          callback();
        }
      },self.messageLingerTime);
    }


    this.onAddTutorError = function(xhr,b,err){
      this.showErrorMessage(xhr.responseText);
    }
    this.onAddTutorError = this.onAddTutorError.bind(this);


    this.showErrorMessage = function(message){
      this.isErrorMessageVisible(true);
      this.errorMessage(message);
      var self = this;
      setTimeout(function(){
        self.isErrorMessageVisible(false);
        self.errorMessage('');
      },self.messageLingerTime);
    }


  };

  return {
    viewModel: ViewModel,
    template: template
  }

});
