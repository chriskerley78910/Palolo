/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define(['jquery',
        'ko',
        'dispatcher/Dispatcher',
        'text!auth/template.html',
        'auth/AuthRemoteService',
        'auth/StateBuilder'],
function($,
         ko,
         Dispatcher,
         template,
         AuthRemoteService,
         StateBuilder){

  function AuthViewModel(params, componentInfo){


    this.isVisible = ko.observable(false).extend({notify:'always'});
    this.authState = ko.observable('anonymous');
    this.dis = new Dispatcher();
    this._remoteService = new AuthRemoteService();
    this.stateBuilder = new StateBuilder(this._remoteService, this);
    this.errorTimeout = 8000;
    this._userId = -1;



    this.setUserId = (function(id){
      if(!id || isNaN(id) || id < 1){
        throw new Error('id must be a postive integer.');
      }
      this._userId = id;
    }).bind(this)

    this.dispatchAuth = (function(state){
      if(state === 'authenticated'){
          this.dis.dispatch('authState', {
            id:this._userId,
            state:state
          });
      }
    }).bind(this)
    this.authStateSubscription = this.authState.subscribe(this.dispatchAuth);


    this.onLogout = (function(testMode){
      this._remoteService.deleteToken();
      // this._remoteService.checkIfCurrentTokenIsValid();
      if(!testMode){
        location.reload();
      }
    }).bind(this)
    this.dis.reg('logout',this.onLogout);


    /**
     * Whenever an attribute of a state changes that
     * is not an observable, this must be called.
     */
    this.triggerUpdate = function()  {
      this.state.valueHasMutated();
    }
    this.triggerUpdate = this.triggerUpdate.bind(this);

    var initialState = this.stateBuilder.buildInitialState(this);
    this.state = ko.observable(initialState);


    this.activationEmailSent = ko.computed(function(){
      var isSent = this.state().activationEmailSent;
      if(isSent){
        this.goToActivationEmailSentPage();
      }
      return isSent;
    },this).extend({notify:'always'});


    this.onTokenAnalyzed = function(json){
      try{
        var idTokenPair = JSON.parse(json);
        if(!idTokenPair || Array.isArray(idTokenPair) === false){
          this.isVisible(true);
          this._remoteService.deleteToken();
          this.authState('anonymous');
        }
        else{  // token is valid.

          var userId = idTokenPair[0];
          this.setUserId(userId);

          var token = idTokenPair[1];
          this._remoteService.setAccessToken(token);

          this.authState('authenticated');
          this.isVisible(false);
        }
      }
      catch(err){
        console.log(err);
      }
    }
    this.onTokenAnalyzed = this.onTokenAnalyzed.bind(this);



    this.email = ko.computed({
      read:function(){
          return this.state().email;
      },
      write:function(newEmail){
          this.state().setEmail(newEmail);
          // have to force the update because
          // on the State instance, email is
          // not an observable.
          this.state.valueHasMutated();
      },
      owner:this
    }).extend({ notify: 'always' });





    this.errorMessage = ko.computed({
      read:function(){
        return this.state().errorMessage;
      },
      write:function(value){
        this.state().errorMessage = value;
      },
      owner:this
    }).extend({notify:'always'});





    this.timerDone = true;

    this.clearErrorCallback = function(){
      this.errorMessage('');
      this.triggerUpdate();
      this.timerDone = true;
    }
    this.clearErrorCallback = this.clearErrorCallback.bind(this);


    this.errorSubscribeCallback = function() {

      if(this.timerDone){
        this.timerDone = false;
        setTimeout(this.clearErrorCallback,this.errorTimeout);
      }
    }

    this.errorSubscribeCallback = this.errorSubscribeCallback.bind(this);
    this.errorMessage.subscribe(this.errorSubscribeCallback);





    this.firstName = ko.computed({
      read:function(){
        return this.state().firstName;
      },
      write:function(value){
        this.state().firstName = value;
      },

      owner: this
    }).extend({notify:'always'});




    this.isEmailValid = ko.computed({
      read:function(){
        return this.state().isEmailValid;
      },
      write:function(value){
        this.state().isEmailValid = value;
      },
      owner:this
    });

    this.isFirstNameValid = ko.computed(function() {
      return this.state().isFirstNameValid;
    },this).extend({notify:'always'});


    this.isLastNameValid = ko.computed(function() {
      return this.state().isLastNameValid;
    },this);



    this.lastName = ko.computed({
      read:function(){
          return this.state().lastName;
      },
      write: function(value){
        this.state().lastName = value;
      }
    },this).extend({notify:'always'});


    this.login = function() {
      this.state().login();
    }



    this.loginPageVisible = ko.computed({
      read:function(){
          return this.state().getConstructorName() == "LoginState" && false == this.activationEmailSent();
      },
      write: function(value){

      },
      owner:this

    }).extend({notify:'always'});


    this.resetPasswordVisible = ko.computed({

      read:function(){

        return this.state().constructor.name == "PasswordResetState";
      },
      write: function(value){

      },
      owner:this
    }).extend({notify:'always'});




    this.resetPasswordEmailSentPageVisible = ko.computed({

      read:function(){
        return this.state().constructor.name == "SentResetEmailState";
      },
      write: function(value){

      },
      owner:this
    }).extend({notify:'always'});




    this.password = ko.computed({
        read:function(){
          return this.state().password;
        },
        write:  function(password){
          this.state().setPassword(password);
          this.state.valueHasMutated();
        },
        owner:this
    })




    this.signUp = function() {
      this.state().signUp();
    }


    this.signupPageVisible =  ko.computed(function() {

      return this.state().constructor.name == "SignupState";
    },this);


    this.injectSignupPageCallback = function(callback){

      this.signupPageVisible.subscribe(callback);
    }




    this.submitResetEmail =  function(){
      this.state().submitResetEmail();
    }


    this.spinner = ko.computed(function() {
      return this.state().spinner;
    },this);



    this.activationEmailSentPageVisible = ko.computed(function(){
      return this.state().constructor.name == "ActivationEmailSentState";
    },this);




    this.isPasswordValid = ko.computed(function() {
        return this.state().isPasswordValid;
    },this).extend({notify:'always'});



    this.invalidPasswordMessage = ko.computed(function(){
      return this.state().localErrorMessage.passwordError;
    },this).extend({notify:'always'});


    this.malformedEmailError = ko.computed(function(){
      return this.state().localErrorMessage.wrongEmail;

    },this).extend({notify:'always'});

    this.invokeSignupFormEndowment = ko.computed(function(){
      return this.state().endowSignupForm;
    },this);


 // make a whole other object whose responsibility is transitions.
// just get it working then refactor the design!

    this.goToSignupPage = function() {
      this.state(this.stateBuilder.build("SignupState",this));
    }

    this.goToActivationEmailSentPage = function(){
      this.state(this.stateBuilder.build("ActivationEmailSentState", this));
    }

    this.goToLoginPage = function() {
      this.state(this.stateBuilder.build("LoginState",this));
      // this.signupPageVisible(false);
    }


    this.goToPasswordResetState = function(){
      this.state(this.stateBuilder.build("PasswordResetState",this));
    }


    this.gotoSentResetEmailState = function(){
      this.state(this.stateBuilder.build("SentResetEmailState",this));
    }
    this._remoteService.registerOnTokenVerified(this.onTokenAnalyzed);
    this._remoteService.checkIfCurrentTokenIsValid();
}; // end AuthViewModel constructor.


return {
    viewModel: AuthViewModel,
    template :template
};


}); // end define.
