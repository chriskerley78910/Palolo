/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */

define([
'jquery',
'ko',
'text!file-dropper/template.html',
'file-dropper/FileSharerRemoteService',
'dispatcher/Dispatcher',
'people-store/PeopleStore',
'people-models/NullPerson'],
function($,
  ko,
  template,
  FileSharerRemoteService,
  Dispatcher,
  Store,
  NullPerson){

  function SharedFilesViewModel(params,componentInfo){


    this._remoteService = new FileSharerRemoteService();
    this.dis = new Dispatcher();
    this.store = Store.getInstance();
    this.files = ko.observableArray([]);
    this.isVisible = ko.observable(false);
    this.uploadInProgress = ko.observable(false);
    this.percentageComplete = ko.observable("0");
    this.selectedClassmateId = -1;
    this._fileToBeUploaded = null;
    this.FILE_SIZE_LIMIT = 25000000; // about 25 megabytes.

    /**
     * Formats the url so that it has the server URL prefixed to it.
     * @param  {[type]} response
     */
    this.formatURL = function(response){
      response.url = this._remoteService.getServerURL() + "/" + response.url;
      if(response.senderId == this.selectedClassmateId){
        this.onSuccessfulUpload(response);
      }
      // console.log("response.url == " + response.url);
    }
    this.formatURL = this.formatURL.bind(this);


    /**
     *
     * @param  {[type]} deleteMsg [description]
     * @return {[type]}           [description]
     */
    this.friendDeleteFile = function(deleteMsg){
      if(deleteMsg.senderId == this.selectedClassmateId){
        this.removeFileFromView(deleteMsg.name);
      }
    }
    this.friendDeleteFile = this.friendDeleteFile.bind(this);


    /**
     * Shows the view when the user state becomes authenticated and
     * Initializes the socket using the users token,
     * @param  {string} state
     */
    this.onAuth = function(update){
       if(update.state == 'authenticated'){
          this._remoteService.initSocket();
          this._remoteService.registerFileUploadCallback(this.formatURL);
          this._remoteService.registerFileDeleteCallback(this.friendDeleteFile);
          this._remoteService.registerUploadProgressCallback(this.uploadProgressCallback);
       }
       else{
         this.isVisible(false);
       }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState',this.onAuth);





    this.onFilesDownloaded = function(files){
        this.files([]);
        for(var i = 0; i < files.length; i++){
            files[i].user_opened = ko.observable(files[i].user_opened);
            this.files.push(files[i]);
        }
    }
    this.onFilesDownloaded = this.onFilesDownloaded.bind(this);


    /**
     *  Changes the state 'opened' to true for the
     *  file with the given fileName.
     */
    this.showFileAsSeen = function(fileName){
      var self = this;

      return function(){
        for(var i = 0; i < self.files().length; i++){
          if(self.files()[i].name == fileName){
            self.files()[i].user_opened(true);
            break;
          }
        }
      }
    }
    this.showFileAsSeen = this.showFileAsSeen.bind(this);



    /**
     * @pre: expects the accessToken to be
             stored in localStorage and the selectedFriend
             observable to be the currently selected
             friendId.

     * @post: Query's the remote service for the list
     *        of all files shared between this user
     *        and the currently selected friend.
     */
    this.onStoreChange = function(){
      var p = this.store.getFocusedPerson();
      if(p.getConstructorName() == 'NullPerson'){
        this.isVisible(false);
      }
      else{
        this.selectedClassmateId = p.getId();
        this._remoteService.loadFiles(this.selectedClassmateId, this.onFilesDownloaded);
        this.isVisible(true);
      }
    }
    this.onStoreChange = this.onStoreChange.bind(this);
    this.store.sub(this.onStoreChange);

    /**
     * downloads the file from the remote service
     * and displays it too the user. If
     * the file has not been opened before then
     * it sends a message to the remote service
     * that the file has now been opened.
     */
    this.downloadFile = function(data, event ,testMode){
      if(testMode != 'test'){
        window.open(data.url,'_blank');
      }

      if(!data.user_opened()){
        var self = this;
        var fileName = data.name;
        this._remoteService
            .setFileAsOpened(
              data.name,
              this.selectedClassmateId,
              this.showFileAsSeen(fileName));
      }
    }
    this.downloadFile = this.downloadFile.bind(this);

    /**
     * Uploads the file to the server.
     * @param  data is the file that was clicked.
     */
    this.uploadFile = function(data, input, testMode){

      if(!this.uploadInProgress()){
        if(testMode){
          testMode.callback();
        }
        if(input.target.files && input.target.files[0]){
          var reader = new FileReader();
          this._fileToBeUploaded = input.target.files[0];
          if(this._fileToBeUploaded.size > this.FILE_SIZE_LIMIT){
            alert('Files greater than 10mb cant be uploaded at the moment.');
            return;
          }
          var self = this;
          reader.onload = function(event){
            self.clearFileChooserInput(input.target);
            self.onFileLoadedInBrowser(event);
            $('#file-dropper-upload-btn').val('');
          }
          reader.readAsDataURL(this._fileToBeUploaded);
        }
      }
      else{
        alert('Only one file can be uploaded at a time.');
        $('#file-dropper-upload-btn').val('');
      }
    }
    this.uploadFile = this.uploadFile.bind(this);

    this.clearFileChooserInput = function(inputElement){
      var $el = $(inputElement);
      $el.wrap('<form>').closest('form').get(0).reset();
      $el.unwrap();
    }
    this.clearFileChooserInput = this.clearFileChooserInput.bind(this);


    this.uploadProgressCallback = function(event){
     this.uploadInProgress(true);
     var percent = (event.loaded / event.total) * 100;
     var progress = Math.round(percent);
     var strPercent = progress + "%";
     this.percentageComplete(strPercent);
     $('#file-upload-progress-bar').css('width',strPercent);
   }
   this.uploadProgressCallback = this.uploadProgressCallback.bind(this);



    /**
     * @param  {Event} event the fileReader has completed reading
     *  the file as a URL.
     */
    this.onFileLoadedInBrowser = function(event){

      for(var i = 0; i < this.files().length; i++){
        if(this.files()[i].name == this._fileToBeUploaded.name){
          alert("A file already exists with that name, please choose another name.");
          return;
        }
      }
      this._remoteService
          .uploadFile(
            event.target.result,
            this._fileToBeUploaded.name,
            this.selectedClassmateId,
            this.onSuccessfulUpload,
            this.onFailedUpload);
    }
    this.onFileLoadedInBrowser = this.onFileLoadedInBrowser.bind(this);



    this.onFailedUpload = function(httpResponseText){
      this.uploadInProgress(false);
      alert(httpResponseText);
    }
    this.onFailedUpload = this.onFailedUpload.bind(this);


    /**
     * Puts the uploaded file name at the top of the
     * list given the fileResponse from the server.
     */
    this.onSuccessfulUpload = function(fileResponse){
      if(!fileResponse.name || typeof fileResponse.user_opened == 'undefined' || !fileResponse.url)
      {
        throw new Error('invalid file response! Are you sure you did JSON.parse?');
      }

      fileResponse.user_opened = ko.observable(fileResponse.user_opened);
      this.files.unshift(fileResponse);
      this.uploadInProgress(false);
    }
    this.onSuccessfulUpload = this.onSuccessfulUpload.bind(this);


    /**
     *  Asks the remote service to delete the given file.
     * @param  {[type]} data  must have
     * @param  {[type]} event
     */
    this.deleteFile = function(data, event){

        if(event){
          event.stopPropagation();
        }
        var self = this;
        this._remoteService.deleteFile(
          data.name,
          this.selectedClassmateId,
          function(){
              self.removeFileFromView(data.name);
          });
    }
    this.deleteFile = this.deleteFile.bind(this);


    /**
     * Removes the file from files which have
     * the same name as fileName.
     * @param  {[type]} fileName [description]
     */
    this.removeFileFromView = function(fileName){

      for(var i = 0; i < this.files().length; i++){
        if(this.files()[i].name == fileName){
          this.files.splice(i,1);
          break;
        }
      }
    }
    this.removeFileFromView = this.removeFileFromView.bind(this);



}; // end view model.

  return {
    viewModel: SharedFilesViewModel,
    template: template
  }
});
