
define(['auth/states/AuthState',
         'auth/AuthViewModel',
         'auth/states/MockState'],
function(
           AuthState,
           VM,
           MockState){

    describe("Test AuthState", function(){


      let state = null;

      let vm = null;

      beforeEach(() => {
        vm = new VM.viewModel();
        state = new AuthState(vm);
      })


      it('is a prototype of AuthStat', () =>{
        expect(Object.getPrototypeOf(state).constructor.name).toBe('AuthState');
      })

      it('throws context missing exception if it is not injected', ()=>{

          expect(()=>{new AuthState()}).toThrow(new Error('context must be injected into authstate, but it is undefined'));
      })


      it('isLastNameValid defaults to false', () =>{


        expect(state.isFirstNameValid).toBeFalsy();
      })

      it('has email defined', () =>{
        expect(state.email).toBeDefined();
      })


      it('has password defined', ()=>{
        expect(state.password).toBeDefined();
      })


      it('validatePassword(e3) says password not long enough', () =>{
        let callback = (msg) => {
          expect(msg).toBe('Password is too short.');
        }
        state.validatePassword(callback)('a3');
      })


      it('validatePassword("qwerqwer") says password must have a number', () =>{

        let callback = (msg) => {
          expect(msg).toBe('Password must have at least one number.');
        }
        state.validatePassword(callback)('qwerqwer');
      })



      it('has errorMessage defined', () =>{
        expect(state.errorMessage).toBeDefined();
      })


      it('has localErrorMessageDefined', () =>{

          expect(state.localErrorMessage).toBeDefined();
      })


      it('sets the localErrorMessage.loginPasswordError when the password is too short', () =>{

          let callback = (msg) =>{
            expect('Password is too short.').toBe(msg);
          }

          state.validatePassword(callback)('qwerwer');
      })


      it('throws an exception if the default login function is called', () =>{
        expect(() =>{state.login()}).toThrow(new Error('cant execute abstract login function'));
      })

      it('the context has a triggerUpdate function', () =>{
        expect(typeof state.context.triggerUpdate).toBe("function");
      })


      it('throws if the context doesnot have triggerUpdate', () =>{
        expect(()=>{new AuthState({})}).toThrow(new Error('context needs triggerUpdate function'));
      })


      it('setNextState(state) throws if state is not a AuthState', () =>{


        expect(()=>{state.setNextState({})}).toThrow(new Error('State must be a decendant of AuthState'));
      })


      it('setNextState(state) sets the "nextState" attribute of the state if the state is valid.', () =>{

        state.setNextState(new MockState(vm));

        expect(state._nextState.constructor.name).toBe("MockState");
      })





    }); // end describe

}); // end define.
