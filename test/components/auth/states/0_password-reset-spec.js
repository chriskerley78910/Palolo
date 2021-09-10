
define([
  'auth/states/PasswordResetState',
  'auth/AuthRemoteService',
  'mocks/mock-data',
  'auth/AuthViewModel'], function(
    PasswordResetState,
    AuthRemoteService,
    MockData,
    AuthViewModel){

    describe("Test PasswordResetState", function(){


      let state = null;
      let vm = null;
      beforeEach(() => {
        vm = new AuthViewModel.viewModel();
        state = new PasswordResetState(vm,new AuthRemoteService());
      })

      it('is a prototype of AuthStat', () =>{
        expect(Object.getPrototypeOf(state).constructor.name).toBe('AuthState');
      })


      it('submitResetEmail() is overriden.', ()=>{
        expect(()=>{state.submitResetEmail()}).not.toThrow();
      })

      it('submitResetEmail => spinner is visible', ()=>{
        spyOn(state.context,'triggerUpdate');
        expect(state.spinner).toBeFalsy();
        state.submitResetEmail();
        expect(state.spinner).toBeTruthy();
        expect(state.context.triggerUpdate).toHaveBeenCalled();
      })

      it(`onResetPasswordError()
        ^ responseText == Malformed email
        => show error message`, ()=>{

          spyOn(state.context,'triggerUpdate');
          state.onResetPasswordError({responseText:'Malformed Email'},null,null,true);
          expect(state.localErrorMessage.wrongEmail).toBe("Malformed Email");
          expect(state.context.triggerUpdate).toHaveBeenCalled();
      })

      it('onResetPasswordCallback(success) => context.gotoSentResetEmailState()', ()=>{

          state.spinner = true;
          spyOn(state.context,'gotoSentResetEmailState');
          state.onResetPasswordCallback(JSON.stringify('success'));
          expect(state.context.gotoSentResetEmailState).toHaveBeenCalled();
          expect(state.spinner).toBeFalsy();
      })

      it('onResetPasswordCallback(~success) => ~context.gotoSentResetEmailState()', ()=>{
          spyOn(state.context,'gotoSentResetEmailState');
          state.onResetPasswordCallback(JSON.stringify('failure'));
          expect(state.context.gotoSentResetEmailState).not.toHaveBeenCalled();
      })

    }); // end describe

}); // end define.
