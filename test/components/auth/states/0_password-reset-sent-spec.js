
define([
  'auth/states/SentResetEmailState',
  'auth/AuthRemoteService',
  'mocks/mock-data',
  'auth/AuthViewModel'], function(
    SentResetEmailState,
    AuthRemoteService,
    MockData,
    AuthViewModel){

    describe("Test SentResetEmailState", function(){


      let state = null;

      let vm = null;

      beforeEach(() => {

        vm = new AuthViewModel.viewModel();

        state = new SentResetEmailState(vm,new AuthRemoteService());
      })

      it('is a prototype of AuthStat', () =>{
        expect(Object.getPrototypeOf(state).constructor.name).toBe('AuthState');
      })

      it('spinner == false', ()=>{
        expect(state.spinner).toBeFalsy();
      })

      it('sendResetPageVisible() is true when state() is SentResetEmailState', ()=>{
        vm.gotoSentResetEmailState();
        expect(vm.state().constructor.name).toBe("SentResetEmailState");
      })


      it('submitResetEmail() is overriden.', ()=>{
        vm.goToPasswordResetState();
        expect(()=>{vm.state().submitResetEmail()}).not.toThrow();
      })


    }); // end describe

}); // end define.
