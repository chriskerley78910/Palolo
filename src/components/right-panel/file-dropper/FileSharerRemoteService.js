

define(['ActiveRemoteService',
        'format-converter'],
function(ActiveRemoteService,
         FormatConverter){

  var FileSharerRemoteService = function(){

      Object.setPrototypeOf(this,new ActiveRemoteService());
      this.sock = null;
      this._callbacks = {};
      this.setMicroServer("files");

      /**
       * Initializes the socket instance.
       */
      this.initSocket = function(){
        this.setSock();
      }

      this.registerFileUploadCallback = function(callback){
        this.sock.on('fileUpload',callback);
      }

      this.registerFileDeleteCallback = function(callback){
        this.sock.on('fileDelete',callback);
      }

       this.registerUploadProgressCallback = function(cb){
         this._callbacks['uploadProgressCallback'] = cb;
       }


      /**
       * Returns the first fileUpload callback for the socket.
       * There should be only one fileupload callback,  all others
       * are ignored.
       * @return {Function}
       */
      this.getFileUploadCallback = function(){
        let callbacks = this.sock._callbacks.$fileUpload;
        if(!callbacks){
          throw new Exception("no callback for that event is registered.");
        }
        else{
          return callbacks[0];
        }
      }
      /**
       * Sets the file  with the given name as opened, by the current user.
       */
      this.setFileAsOpened = function(fileName, friendId, onSuccess){
        // http://files.localhost/57/seen/Untitled%201.docx
        var url = this.getServerURL() + "/" + friendId + "/seen/" + fileName;
        // console.log(url);
          $.ajax({
            url:url,
            type:"POST",
            beforeSend:this.setAuthorizationHeader,
            success:onSuccess,
            error:function(a,b,err){
              console.log(err);
            }
          })
      }



      /**
       * Loads all the files shared between the current user
       * and the given friend.
       * @param  {Number} friendId  The userId of the currently selected friend.
       * @param  {Function} onSuccess callback function that
       * is executed with the list of files that are shared
       * between the two users.
       */
      this.loadFiles = function(friendId, onSuccess){
        var self = this;

        $.ajax({
          url:this.getServerURL() + "/" + friendId + "/files",
          type:"GET",
          cache:true,
          beforeSend:this.setAuthorizationHeader,
          success:function(response){
            var files = JSON.parse(response);
            for(var i = 0; i < files.length; i++){
              files[i].url = self.getServerURL() + "/" + files[i].url;
            }
            onSuccess(files);
          },
          error:function(jq,status,err){
            console.log(err);
          }
        })
      }


      /**
       * requests that the server delete the given file.
       * @param  {string} fileName
       * @param  {Number} friendId  int
       * @param  {Function} onSuccess callback.
       */
      this.deleteFile = function(fileName,friendId, onSuccess){

        var self = this;
        var url = this.getServerURL() + '/' + friendId + "/" + fileName;
        $.ajax({
            url:url,
            type: 'DELETE',
            beforeSend:this.setAuthorizationHeader,
            success: function(result) {
              onSuccess();
            },
            error:function(a,b,c){
              console.log(a.responseText);
              console.log(c);
            }
        });
      }




      /**
       * @param  {[type]} fileData is the image in base64 format.
       * @param {Function} callback is called on successful upload of the fileData.
       */
      this.uploadFile = function(fileData, fileName, friendId, onSuccess, onFailure){

        var data = fileData.replace(/^data:(.*);base64,/, "");
        var blob = FormatConverter.base64ToBlob(data);
        var formData = new FormData();
        formData.append('fileName', fileName);
        formData.append('friendId',friendId);
        formData.append('file', blob);
        var self = this;
        $.ajax({
          url:this.getServerURL() + '/uploadFile',
          type:"POST",
          contentType:false,
          processData:false,
          data:formData,
          beforeSend:this.setAuthorizationHeader,
          xhr:function(){
            var xhr = new window.XMLHttpRequest();
                xhr.upload
                   .addEventListener("progress",
                                      self._callbacks.uploadProgressCallback,
                                      false
                                    );
            return xhr;
          },
          success:function(fileResponse){
            var response = JSON.parse(fileResponse);
            response.url = self.getServerURL() + "/" + response.url;
            onSuccess(response);
          },
          error:function(jq,status,err){
            onFailure(jq.responseText);
          }
        })
      }
      this.uploadFile = this.uploadFile.bind(this);
  }


  return FileSharerRemoteService;

})
