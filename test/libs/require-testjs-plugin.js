

/**
 *
 *  Loads all the stuff that is common amoung all the
 *  components (for testing) so you dont have to duplicate this for each one.
 *
 *
 * Requires that requireJS be loaded beforehand.
 *  For example in your HTML file.
 *   <script
      type="text/Javascript"
      src="../../../libs/require.js"
      data-main="./moduleloader.js"></script>

      <script
         type="text/Javascript"
         src="../../../libs/require-testjs-plugin.js"></script>
 */
var RequireTestJS = function(requirejs){

  this.requirejs = requirejs;
  this.testPaths = [];
  this.configObject = {
    // to set the default folder
    baseUrl: '../../../../src/',
    // paths: maps ids with paths (no extension)

    waitSeconds: 1,
    paths: {
      'mapper'          : ['libs/knockout.mapping.latest'],
      'text'            : ['libs/text'],
      'socketio'        : ['libs/socket.io.slim'],
      'adapter'         : ['libs/adapter-latest'],
      'ko'              : ['libs/knockout-3.4.2'],
      'jquery'          : ['http://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min'],
      'stripe'          : ['https://js.stripe.com/v3?noext'],
      'twilio-video'    : ['https://media.twiliocdn.com/sdk/js/video/releases/2.4.0/twilio-video.min'],
      'DetectRTC'       : ['libs/DetectRTC.min'],
      'cleditor'        : ['libs/jquery.cleditor.min'],
      'enterKey'        : ['custom-bindings/enter-key'],
      'jasmine'         : ['../test/libs/jasmine-2.8.0/jasmine'],
      'jasmine-html'    : ['../test/libs/jasmine-2.8.0/jasmine-html'],
      'jasmine-boot'    : ['../test/libs/jasmine-2.8.0/boot'],
      'Dispatcher'      : ['components/dispatcher/Dispatcher'],
      'text-utilities'      : ['libs/text-utilities'],
      'RemoteService'   : ['components/remote-service/RemoteService'],
      'ActiveRemoteService'   : ['components/remote-service/DevelopmentRemoteService'],
      'RootViewModel'    : ['RootViewModel'],
      'format-converter' : ['libs/format-converter']

    },

    deps: ['ko','mapper','jasmine'],

    callback: function(ko,mapper){
      ko.mapping = mapper;
    },

    // shim: makes external libraries compatible with requirejs (AMD)
    shim: {
      'jasmine-html': {
        deps : ['jasmine']
      },
      'jasmine-boot': {
        deps : ['jasmine', 'jasmine-html']
      }
  // ensure ko loads before mapper.
    }
  };


  /**
   * Used to shorten the path to import a js file.
   * It is relative to the moduleloader.js path.
   *
   * @param  {[type]} name to represent the path.
   * @param  {[type]} path The path that will be represented by the name
   */
  this.addPathTag = function(name,path){
    this.configObject.paths[name] = path;
  }

  /**
   * @param  {string} path The path to the spec. It is
   *                       relative to the directory
   *                       where the test runner is.
   */
  this.load = function(path){
    this.testPaths.push(path);
  }

  this.getConfigObject = function(){
    return this.configObject;
  }



  /**
   * Changes the baseURL that is used
   * by relative paths in the paths
   * setting.
   */
  this.setSrcRootPath = function(url){
    this.configObject.baseUrl = url;
  }

  /**
    0 is the base url.
    1 is 1 level lower.
    2 is 2 levels lower
    etc.
  */
  this.setRelativeBaseURL = function(level){
    var base = '../../../../';
    if(level == 0){
      base  = base + 'src/';
    }
    else if(level == 1){
      base = base + '../src/';
    }
    this.setSrcRootPath(base);
  }



  this.startTests = function(){

    var self = this;

    this.requirejs.config(this.getConfigObject());
    // stuff the NEEDs to be loaded before all others.
    requirejs(['jasmine-boot','ko','enterKey','twilio-video'],
              function (boot,  ko,   enterKey) {

      // load the specs you want to test before loading jasmine.
      require(self.testPaths, function(){

        //trigger Jasmine
        window.onload(); // jasmine waits for this event to fire.
      });

    });
  }
  this.startTests = this.startTests.bind(this);
}
