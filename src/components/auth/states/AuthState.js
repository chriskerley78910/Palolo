
define([],
function(){

  function AuthState(context){

    if(!context){

      throw new Error('context must be injected into authstate, but it is undefined');
    }
    else if(!context.triggerUpdate){

      throw new Error('context needs triggerUpdate function');
    }

    // move this state data into its own class!
    this.activationEmailSent = false;
    this.authServer = null;
    this.context = context;
    this.email = "";
    this.errorMessage = "";
    this.localErrorMessage = {
      passwordError:"",
      wrongEmail:""
    }
    this.firstName = '';
    this.MIN_PASSWORD_LENGTH = 8;
    this.isVisible = true;
    this.isEmailValid = false;
    this.isPasswordValid = false;
    this.lastName = '';
    this.password = "";
    this.spinner = false;
    this.endowSignupForm = false;


    this.getConstructorName = function(){
      throw new Error("getConstructorName must be implemented in a subclass.");
    }


    this.validateRemoteService = function(remoteService){

      if(!remoteService || remoteService.getConstructorName() != "AuthRemoteService"){
        throw new Error("AuthRemoteService must be injected.");
      }
    }


    this.signUp = function(){
      throw new Error('cant signup when your not on the signup screen');
    }

    this.login = function(){
      throw new Error('cant execute abstract login function');
    }


    this.submitResetEmail = function(){
      throw new Error('cant execute abstract submitResetEmail function');
    }

    this.isFirstNameValid = false;



     this.validateEmail = function(email){
       var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+\s*$/;
       var isValidEmail = regex.test(email);
       var isAYorkUniversityEmail = /.*yorku\.ca/.test(email);
       if(isValidEmail == false || isAYorkUniversityEmail == false){
         this.isEmailValid = false;
       }
       else{
         this.isEmailValid = true;
       }
     }
     this.validateEmail = this.validateEmail.bind(this);

     this.setEmail = function(email){
       this.validateEmail(email);
       this.email = email;
     }

     this.validatePassword = function(callback){
       var self = this;
       return function(password){
         var numRegex = /\d/;
         var whiteSpaceRegex = /\s/;
         var alphaRegex = /[a-zA-Z]/;
        if(password.length < self.MIN_PASSWORD_LENGTH){
           callback('Password is too short.');
         }
         else if(!alphaRegex.test(password)){
           callback('Password must have at least 1 letter.');
         }
         else if(!numRegex.test(password)){
           callback('Password must have at least one number.');
         }
         else if(whiteSpaceRegex.test(password)){
           callback('Password can\'t have any spaces.');
         }
         else{
           callback('success');
         }
       }
     }
     this.validatePassword = this.validatePassword.bind(this);

     this.passwordValidateCallback = function(msg){
         if(msg == 'success'){
              this.isPasswordValid = true;
         }
         else{
            this.isPasswordValid = false;

            this.localErrorMessage.passwordError = msg;
         }
     }

     this.passwordValidateCallback = this.passwordValidateCallback.bind(this);

      this.setPassword = function(password){
        this.validatePassword(this.passwordValidateCallback)(password);
        this.password = password;
      }

      // sets the next state of this state.
      // i.e: when this state transitions to the next state,
      // this is the state that is transitioned too.
      this.setNextState = function(state){
          if(Object.getPrototypeOf(state).constructor.name !== 'AuthState'){
            throw new Error('State must be a decendant of AuthState');
          }
          this._nextState = state;
      }

      this.goToNextState = function(){
      }
};

  return AuthState;

}); // end define.
