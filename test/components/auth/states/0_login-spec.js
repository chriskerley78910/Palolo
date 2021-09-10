
define([
  'auth/states/LoginState',
  'auth/AuthRemoteService',
  'mocks/mock-data',
  'auth/AuthViewModel'], function(
    LoginState,
    AuthRemoteService,
    MockData,
    AuthViewModel){

    describe("Test Login", function(){


      let sut = null;

      beforeEach(() => {

        let vm = new AuthViewModel.viewModel();
        sut = new LoginState(vm,new AuthRemoteService());
      })


      it('login() clears the current login password', ()=>{
        sut.email = 'someemail'
        sut.password = 'somepassword'
        spyOn(sut.context,'triggerUpdate')
        sut.login()
        expect(sut.password).toBe('')
        expect(sut.email).toBe('')
        expect(sut.context.triggerUpdate).toHaveBeenCalled()
      })

      it('is a prototype of AuthStat', () =>{
        expect(Object.getPrototypeOf(sut).constructor.name).toBe('AuthState');
      })


      it('has AuthRemoteService as an attribute', ()=>{
        expect(sut.remoteService.constructor.name).toBe("AuthRemoteService");
      })

      it('set isValidEmail to true if it is', () =>{
        sut.setEmail('sdsds@fdf.com');
        expect(sut.isEmailValid).toBeFalsy();
      })

      it('something@yorku.ca is a valid email.', ()=>{

        sut.setEmail('something@yorku.ca');
        expect(sut.isEmailValid).toBeTruthy();
      })


      it('set isValidEmail false if it isnt', () =>{
        sut.setEmail('blah!');
        expect(sut.isEmailValid).toBeFalsy();
      })


      it('sets isValidPassword when it is', () =>{
        sut.setPassword('qweqwe123');
        expect(sut.isPasswordValid).toBeTruthy();
      })



      it('turns off the loader when a result is given', () =>{
        sut.spinner = true;
        var json = JSON.stringify({error:'some issue'});
        sut.onLoginCallback(json);
        expect(sut.spinner).toBeFalsy();
      })


      it('onLoginError(respnseText:errorMessage) => populates errorMessage',()=>{
        sut.spinner = true;
        spyOn(sut.context,'triggerUpdate');
        let response = {
          responseText:'somefailure2'
        }
        sut.onLoginError(response);
        expect(sut.errorMessage).toBe("somefailure2");
        expect(sut.spinner).toBeFalsy();
        expect(sut.context.triggerUpdate).toHaveBeenCalled();
      })

      it('onLoginCallback() = > onTokenAnalyzed(response)', () =>{
        spyOn(sut.context,'onTokenAnalyzed');
        let idTokenPair = ["1","token"];
        let json = JSON.stringify(idTokenPair);
        sut.onLoginCallback(json);
        expect(sut.context.onTokenAnalyzed).toHaveBeenCalledWith(json);
      })


      it('sets the accessToken when the login credentials are correct', () =>{

          expect(window.localStorage.getItem('accessToken')).not.toBeDefined;
          var json = {
            token:"sometoken"
          };
          sut.onLoginCallback(JSON.stringify(json));
          expect(window.localStorage.getItem('accessToken')).toBeDefined();
      })


      it('throws if the remoteService is not injected', ()=>{
          let vm = new AuthViewModel.viewModel();
          expect(()=>{new LoginState(vm,null)}).toThrow(new Error('AuthRemoteService must be injected.'));
      })

    }); // end describe

}); // end define.
