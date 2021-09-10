
define(['auth/states/SignupState',
        'auth/AuthRemoteService',
        'mocks/mock-data'],

function(SignupState,
         AuthRemoteService,
         MockData){

    describe("Test Signup", function(){

      let state = null;

      beforeEach(() => {
        state = new SignupState(MockData.getMockVM(),new AuthRemoteService());
      })


      it('is a prototype of AuthStat', () =>{
        expect(Object.getPrototypeOf(state).constructor.name).toBe('AuthState');
      })



      it('set isFirstNameValid to true if the name is', () =>{

        state.setFirstName('validname');
        expect(state.isFirstNameValid).toBeTruthy();
      })


      it('set isFirstNameValid to false if the name is not', () =>{

        state.setFirstName('s');
        expect(state.isFirstNameValid).toBeFalsy();
      })


      it('set isLastNameValid to true if it is', () =>{

        state.setLastName('validname')
        expect(state.isLastNameValid).toBeTruthy();
        expect(state.lastName).toBe('validname');
      })


      it('set isValidEmail to true if it is', () =>{

        state.setEmail('sdsds@fdf.com');
        expect(state.isEmailValid).toBeFalsy();
      })


      it('set isValidEmail false if it isnt', () =>{
        state.setEmail('blah!');
        expect(state.isEmailValid).toBeFalsy();
      })


      it('sets isValidPassword when it is', () =>{

        state.setPassword('qweqwe123');
        expect(state.isPasswordValid).toBeTruthy();
      })



      it('turns off the loader when a result is given', () =>{

        state.spinner = true;
        state.onSignupCallback(MockData.getMockJSON());
        expect(state.spinner).toBeFalsy();
      })

      it('populates errorMessage if there is an error signing up', () =>{

        state.onSignupCallback(MockData.getMockJSON());
        expect(state.errorMessage).toBe(MockData.getDecodedMockJSON());
      })



      it('makes activationEmailSent observer true', () => {

        expect(state.activationEmailSent).toBeFalsy();
        state.onSignupCallback(MockData.getSignupMockJSON());
        expect(state.activationEmailSent).toBeTruthy();
      })


      it('calls triggerUpdate() in the signup function', () =>{

        spyOn(state.context,'triggerUpdate');
        spyOn(state,'onSignupCallback');
        state.signUp();
        expect(state.context.triggerUpdate).toHaveBeenCalled();
      })


      it('calls triggerUpdate() in the signup callback', () =>{

        spyOn(state.context,'triggerUpdate');
        state.onSignupCallback(MockData.getMockJSON());
        expect(state.context.triggerUpdate).toHaveBeenCalled();
      })

      it('throws if remoteService is not of AuthRemoteService type', () =>{

        expect(()=>{new SignupState(state.context,null)})
        .toThrow(new Error("AuthRemoteService must be injected."));
      })


      it('has a remoteService attribute', () =>{

          expect(state.remoteService.constructor.name).toBe("AuthRemoteService");
      })


      it(` onSignupCallback(response)
        ^  response != EXPECTED_SIGNUP_RESPONSE
        => activationEmailSent == false`, ()=>{

            state.onSignupCallback(JSON.stringify('bogusResponse'));
            expect(state.activationEmailSent).toBeFalsy();
        })



        it(` onSignupCallback(response)
          ^  response == EXPECTED_SIGNUP_RESPONSE
          => activationEmailSent == true`, ()=>{

              state.onSignupCallback(JSON.stringify(state.EXPECTED_SIGNUP_RESPONSE));
              expect(state.activationEmailSent).toBeTruthy();
          })



    }); // end describe

}); // end define.
