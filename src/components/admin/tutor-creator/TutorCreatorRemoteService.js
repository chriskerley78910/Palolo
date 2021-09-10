define(['RemoteService','jquery'],
function(RemoteService, $){

 var TutorCreatorRemoteService = function(){

   Object.setPrototypeOf(this,new RemoteService());

   this.constructor = TutorCreatorRemoteService;
   this.constructor.name = "TutorCreatorRemoteService";
   this.getConstructorName = function(){
     return "TutorCreatorRemoteService";
   }

   this.setDevPort('');
   this.setDevHost("admin.");
   this.setDevDomain("localhost");

   this.setLiveHost('www.admin.');
   this.setLivePort('');



   this.addTutor = function(fields, imageData){

     var data = imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
     var blob = this.base64ToBlob(data,'image/png');
     var formData = new FormData();
     formData.append('photo', blob);
     formData.append('firstName',fields.first);
     formData.append('lastName',fields.last);
     formData.append('email',fields.email);
     formData.append('password', fields.password);

     var url = this.getServerURL() + "/createTutor";
     $.ajax({
       url:url,
       type:"POST",
       cache:false,
       contentType:false,
       processData:false,
       data:formData,
       beforeSend:this.setAuthorizationHeader,
       success:this.onTutorAdded,
       error:this.onAddTutorError
     });
   }

   /**
    * Converts base64 data into a Blob.
    * @param  {[type]} base64 [description]
    * @param  {[type]} mime   [description]
    * @return {Blob}        [description]
    */
   this.base64ToBlob = function(base64, mime){

       mime = mime || '';
       var sliceSize = 1024;
       var byteChars = window.atob(base64);
       var byteArrays = [];

       for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize) {
           var slice = byteChars.slice(offset, offset + sliceSize);

           var byteNumbers = new Array(slice.length);
           for (var i = 0; i < slice.length; i++) {
               byteNumbers[i] = slice.charCodeAt(i);
           }

           var byteArray = new Uint8Array(byteNumbers);
           byteArrays.push(byteArray);
       }

       return new Blob(byteArrays, {type: mime});
   }


   this.registerOnTutorAdded = function(callback){
     this.onTutorAdded = callback;
   }

   this.registerOnAddTutorError = function(callback){
     this.onAddTutorError= callback;
   }

 }

 return TutorCreatorRemoteService;
})
