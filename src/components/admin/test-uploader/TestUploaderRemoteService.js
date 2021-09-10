define(['RemoteService','jquery'],
function(RemoteService, $){

 var TestUploaderRemoteService = function(){

   Object.setPrototypeOf(this,new RemoteService());

   this.constructor = TestUploaderRemoteService;
   this.constructor.name = "TestUploaderRemoteService";
   this.getConstructorName = function(){
     return "TestUploaderRemoteService";
   }

   this.setDevPort('');
   this.setDevHost("tests.");
   this.setDevDomain("localhost");

   this.setLiveHost('www.tests.');
   this.setLivePort('');

 }

 return TestUploaderRemoteService;
})
