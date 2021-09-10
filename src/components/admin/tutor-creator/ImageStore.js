define(['RemoteService','jquery'],
function(RemoteService, $){

 var ImageStore = function(){

   Object.setPrototypeOf(this,new RemoteService());

   this.constructor = ImageStore;
   this.constructor.name = "ImageStore";
   this.fileReader =  new FileReader();
   this.imageData = null;

   this.registerImageTag = function(){
      $('#headshot-file').change(this.onImageUpload);
   }
   this.registerImageTag = this.registerImageTag.bind(this);

   var self = this;
   this.onImageUpload = function(){
     self.readUpload(this);
   }


   this.readUpload = function(upload){
      if(upload.files && upload.files[0]){
        this.fileReader.onload = this.onFileLoaded;
        this.fileReader.readAsDataURL(upload.files[0]);
      }
   }
  this.readUpload = this.readUpload.bind(this);


  this.onFileLoaded = function(fileLoadedEvent){
    var data = fileLoadedEvent.target.result;
    this.imageSourceSetter(data); // for file preview.
    this.imageData = data;
  }
  this.onFileLoaded = this.onFileLoaded.bind(this);


  this.hasStoredImage = function(){
    return this.imageData != null;
  }

  this.clearStoredImage = function(){
    this.imageData = null;
  }

  this.getImageData = function(){
    return this.imageData;
  }


  this.registerImageSourceSetter = function(callback){
    this.imageSourceSetter = callback;
  }
 }

 return ImageStore;
})
