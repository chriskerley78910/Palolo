
define(['auth/StateBuilder',
        'auth/AuthRemoteService',
        'mocks/mock-data'],
function(
          StateBuilder,
          AuthRemoteService,
          MockData){

    describe("Test StateBuilder", function(){


      let builder = null;

      beforeEach(() => {

        builder = new StateBuilder(new AuthRemoteService(),MockData.getMockVM());
      })



      it('throws if either the remoteService or the viewModel are not passed into the constructor', ()=>{


            expect(()=>{new StateBuilder(new AuthRemoteService())})
            .toThrow(new Error('Both remoteService and viewModel must be injected.'));
      })




      it('holds a reference to the viewModel (aka the context)', ()=>{

          expect(builder.getContext().constructor.name).toBe('AuthViewModel');
      })




      it('makes the LoginState for buildInitialState', () =>{


          var state = builder.buildInitialState(MockData.getMockVM());
          expect(state.constructor.name).toBe("LoginState");
      })


      it('returns a SignupState when that is passedin', () =>{

        var state = builder.build("SignupState", MockData.getMockVM());
        expect(state.constructor.name).toBe('SignupState');
      })


      it('returns a LoginState when that is passedin', () =>{

        var state = builder.build("LoginState", MockData.getMockVM());
        expect(state.constructor.name).toBe('LoginState');
      })


      it('returns a SentResetEmailState when that is passed in.', () =>{

        var state = builder.build('SentResetEmailState', MockData.getMockVM());
        expect(state.constructor.name).toBe('SentResetEmailState');
      })


      it('enforces a singleton LoginState', () =>{

        var state1 = builder.build("LoginState", MockData.getMockVM());
        var state2 = builder.build("LoginState", MockData.getMockVM());
        expect(state1 == state2).toBeTruthy();
        expect(state2.constructor.name).toBe('LoginState');
      })


      it('builds ActivationEmailSentState when that name is passed into build', () =>{
          var state = builder.build('ActivationEmailSentState',MockData.getMockVM());
          expect(state.constructor.name).toBe("ActivationEmailSentState");
      })

      it('build(PasswordResetState) builds a PasswordResetState', ()=>{
        let state = builder.build('PasswordResetState', MockData.getMockVM());
        expect(state.constructor.name).toBe("PasswordResetState");
      })



    }); // end describe

}); // end define.
