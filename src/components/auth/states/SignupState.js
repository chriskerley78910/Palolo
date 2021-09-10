/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */


define(['auth/states/AuthState'],

function(AuthState){

  function SignupState(context, remoteService){


    Object.setPrototypeOf(this,new AuthState(context));

    this.validateRemoteService(remoteService);
    this.isVisible = true;
    this.endowSignupForm = true;
    this.remoteService = remoteService;
    this.constructor = SignupState;

    this.getConstructorName = function(){
      return "SignupState";
    }



    // unique too this state.
    this.EXPECTED_SIGNUP_RESPONSE = 'Activation email sent.';

    this.nameRegex = /^[a-zA-Z]{2,}$/

    this.activationEmailSent = false;
    this.firstName = "";
    this.isFirstNameValid = false;
    this.lastName = "";





    this.validateFirstName = function(name){

        var isValid = this.nameRegex.test(name);
        if(!isValid){
          this.isFirstNameValid = false;
        }
        else{
          this.isFirstNameValid = true;
        }
    }
    this.validateFirstName = this.validateFirstName.bind(this);

    this.setFirstName = function(name){
      this.validateFirstName(name);
    }



    this.validateLastName = function(name){
      var isValid = this.nameRegex.test(name);
      if(!isValid){
        this.isLastNameValid = false;
      }
      else{
        this.isLastNameValid = true;
      }
    }
    this.validateLastName = this.validateLastName.bind(this);

    this.setLastName = function(name){
      this.validateLastName(name);
      this.lastName = name;
    }








    this.signUp = function(){

      this.spinner = true;

      var creds =   {

            action:'createNewUser',
            first:this.firstName,
            last:this.lastName,
            email:this.email,
            password:this.password
        }



        $.ajax({
              type:'POST',
              url:this.remoteService.getServerURL(),
              crossDomain: true,
              data:creds,
              success:this.onSignupCallback
            })
        this.context.triggerUpdate();
    }

    this.signUp = this.signUp.bind(this);

    // this.signUpObject =




    this.onSignupCallback = function(response){

      this.spinner = false;

      var decoded = JSON.parse(response);

      if(decoded === this.EXPECTED_SIGNUP_RESPONSE){

        this.activationEmailSent = true;

      }
      else{

        this.activationEmailSent = false;
        this.errorMessage = decoded;
      }

      this.context.triggerUpdate();
    }
    this.onSignupCallback = this.onSignupCallback.bind(this);






}; // end SignupState constructor.


  return SignupState;


}); // end define.
