/**
 * the only part that knows all the auth states.
 *
 * So this is really the state transitioner.
 *
 */
define(['auth/states/SignupState',
        'auth/states/LoginState',
        'auth/states/SentResetEmailState',
        'auth/states/ActivationEmailSentState',
        'auth/states/PasswordResetState'],

function(SignupState,
         LoginState,
         SentResetEmailState,
         ActivationEmailSentState,
         PasswordResetState){

 var StateBuilder = function(remoteService, viewModel){


   if(!remoteService || !viewModel){

     throw new Error('Both remoteService and viewModel must be injected.');
   }

    this._context = viewModel;



    this.states = [];


    this.getContext = function(){

      return this._context;
    }



    this.getState = function(name){

      for(var i = 0; i < this.states.length; i++){

        if(this.states[i].constructor.name == name){

          return this.states[i];
        }
      }

      return null;


    }


    this.buildInitialState = function(context){

      return this.buildLoginState(context);
    }





    this.build = function(state, context){

      var cachedState = this.getState(state);
      if(cachedState){
        return cachedState;
      }

      switch(state){

        case "LoginState":
          var state = this.buildLoginState(context);
          this.states.push(state);
          return state;
        break;


        case "SignupState":
          var state = new SignupState(context,remoteService);
          this.states.push(state);
          return state;
        break;

        case "ActivationEmailSentState":
          var state = new ActivationEmailSentState(context,remoteService);
          this.states.push(state);
          return state;
        break;

        case "PasswordResetState":
          var state = new PasswordResetState(context,remoteService);
          this.states.push(state);
          return state;
        break;


        case "SentResetEmailState":
          var state = new SentResetEmailState(context,remoteService);
          this.states.push(state);
          return state;
        break;


        default:
          return this.buildLoginState(context);
        break;
      }

    }


    this.buildLoginState = function(context){

      var state = new LoginState(context,remoteService);

      this.states.push(state);

      return state;
    }


    /**
     *
     * precondition: The state already exists in the array of states.
     *
     * Switches to the next state for the given state.
     */
    this.setNextStateOf = function(state, nextState){

      state.setNextState(nextState);

    }



    /**
     *   Foces the context to switch to the
     *   next state from the current state.
     *
     * e.g: if the current state is the login state
     * then it transitions to the signup state.
     */
    this.goToNextState = function(){

        //
        // var currentState = this._context.state();
        //
        // this._context.state(currentState.getNextState());
    }



};

  return StateBuilder;

}); // end define.
