
define(['auth/AuthViewModel'], function(AuthViewModel){

    describe("Test AuthViewModel", function(){


      let sut = null;

      beforeEach(() => {
        localStorage.clear();
        sut = new AuthViewModel.viewModel();
      })

      afterAll(() =>{
        localStorage.clear();
      })


      var  setToken = function(){
        window.localStorage.setItem('accessToken',"sometoken");
      }



      it('setUserId(A) throws',()=>{

        let f = ()=>{
          sut.setUserId('A');
        }
        expect(f).toThrow(jasmine.any(Error));
      })


      it('dispatchAuth() => dispatches on authState line.', ()=>{

        spyOn(sut.dis,'dispatch');
        sut.dispatchAuth('authenticated');
        let userId = 45;
        sut.setUserId(userId);
        sut.dispatchAuth('authenticated');
        expect(sut.dis.dispatch).toHaveBeenCalledWith('authState', {
          id:userId,
          state:'authenticated'
        })
      })


      it('accessToken does not exist => isVisible(true)', () =>{
        sut.isVisible(false);
        window.localStorage.clear();
        sut.onTokenAnalyzed(false);
        expect(sut.isVisible()).toBeTruthy();
      })

      it('sut.isEmailValid() == true => state.isEmailValid() == true ', () =>{
        sut.goToLoginPage();
        expect(sut.state().isEmailValid).toBeFalsy();
        sut.isEmailValid(true);
        expect(sut.state().isEmailValid).toBeTruthy();
      })

      it('sut.password(value) => state.password(value)', ()=>{
        sut.goToLoginPage();
        expect(sut.state().password).toBe('');
        sut.password('valid32234');
        expect(sut.state().password).toBe('valid32234');
      })

      it('state.isPasswordValid() == true => sut.isPasswordValid() == true', () =>{
        sut.goToLoginPage();
        expect(sut.isPasswordValid()).toBeFalsy();
        sut.state().isPasswordValid = true;
        sut.triggerUpdate();
        expect(sut.isPasswordValid()).toBeTruthy();
      })

      it('sut.firstName(name) => state().firstName', () =>{
        sut.goToSignupPage();
        expect(sut.state().firstName).toBe('');
        sut.firstName('validname');
        expect(sut.state().firstName).toBe('validname');
      })

      it('switches to the login state when there IS NOT an access token.', () =>{
        expect(window.localStorage.getItem('accessToken')).toBeNull();
        expect(sut.state().constructor.name).toBe('LoginState');
      })

      it('signUp() throws an exception if not inSignupState',() =>{
        sut.onTokenAnalyzed(false);
        expect(sut.state().constructor.name).toBe('LoginState');
        expect(()=>{sut.signUp()}).toThrow(new Error("cant signup when your not on the signup screen"));
      })

      it(`signup state
        ^ state.email('validemail)
        => email is set`, ()=>{

        sut.goToSignupPage();
        sut.state().email = 'valid@valid.com';
        sut.triggerUpdate();
        expect(sut.email()).toBe('valid@valid.com');
      })

      it('sut.email(newEmail) => state.email(newEmail)', () =>{
        sut.goToLoginPage();
        expect(sut.email()).toBe('');
        sut.email('valid email');
        expect(sut.state().email).toBe('valid email');
      })

      it("sut.lastName(name) => state().lastName(name)", () =>{
        sut.goToLoginPage();
        expect(sut.state().lastName).toBe('');
        sut.lastName('validname');
        expect(sut.state().lastName).toBe('validname');
      })

      it(`loginPage
        ^ sut.password(valid)
        => state.password(valid)`, () =>{

          sut.goToLoginPage();
          expect(sut.state().password).toBe('');
          sut.password('validpass888');
          expect(sut.state().password).toBe('validpass888');
      })


      it(`loginPage
        ^ state.password(valid)
        => sut.password(valid)`, () =>{

          sut.goToLoginPage();
          expect(sut.password()).toBe('');
          sut.state().password = 'validpass8';
          sut.triggerUpdate();
          expect(sut.password()).toBe('validpass8');
        })


      it('switches to the SignupState when goToSignupPage is exececuted', () =>{

        sut.onTokenAnalyzed(); // goes to login state.
        expect(sut.invokeSignupFormEndowment()).toBeFalsy();
        sut.goToSignupPage();
        expect(sut.state().constructor.name).toBe("SignupState");
        expect(sut.invokeSignupFormEndowment()).toBeTruthy();
        sut.goToLoginPage();
        expect(sut.invokeSignupFormEndowment()).toBeFalsy();
      })


      var goToSignupPage = function(){
        sut.onTokenAnalyzed();
        sut.goToSignupPage();
      }

      it("loginPageVisible is true if thats the state", () =>{

        sut.goToLoginPage();
        expect(sut.loginPageVisible()).toBeTruthy();
      })

      it('loginPageVisible is false when activationEmailSent is true', ()=>{

        sut.goToLoginPage();
        sut.state().activationEmailSent = false;
        sut.triggerUpdate();
        expect(sut.loginPageVisible()).toBeTruthy();
        sut.state().activationEmailSent = true;
        sut.triggerUpdate();
        expect(sut.loginPageVisible()).toBeFalsy();
      })


      it('signup state => loginPage NOT visible', ()=>{
        sut.goToLoginPage();
        expect(sut.loginPageVisible()).toBeTruthy();
        sut.goToSignupPage();
        expect(sut.loginPageVisible()).toBeFalsy();
      })

      it('SignupPageVisible is true if the current state is SignupState', () =>{

          goToSignupPage();
          expect(sut.signupPageVisible()).toBeTruthy();
      })



      it('signupPageVisible is false if the current state is not SignupState', () =>{
          sut.goToLoginPage();
          expect(sut.signupPageVisible()).toBeFalsy();
      })





      it('isFirstNameValid defaults to false', () =>{

        expect(sut.isFirstNameValid()).toBeFalsy();
      })

      it('onTokenAnalyzed(NOT ARRAY) => _remoteService.deleteToken()',()=>{
        spyOn(sut._remoteService,'deleteToken');
        sut.onTokenAnalyzed(null);
        expect(sut._remoteService.deleteToken).toHaveBeenCalled();
      })


      it(`   name is valid
          ^  state == SignupState
          => isFirstNameValid === true`, () =>{

          sut.onTokenAnalyzed();
          sut.goToSignupPage();
          expect(sut.state().isFirstNameValid).toBe(false);
          sut.state().setFirstName('validname');
          sut.triggerUpdate();
          expect(sut.isFirstNameValid()).toBe(true);
          sut.goToLoginPage();
          expect(sut.isFirstNameValid()).toBeFalsy();
      })


      it(`state == signUp
        ^ firstName is valid
        => firstName is set`, () => {

          sut.goToSignupPage();
          sut.state().firstName = "valid";
          sut.triggerUpdate();
          expect(sut.firstName()).toBe("valid");
        })


      it(`state == signup
        ^ lastname is valid
        => isLastNameValid == true`, ()=>{

         goToSignupPage();
         expect(sut.isLastNameValid()).toBeFalsy();
         sut.state().setLastName('validname');
         sut.triggerUpdate();
         expect(sut.isLastNameValid()).toBe(true);
      })



      it(` lastname is valid
        => lastname is updated`, (done)=>{

        goToSignupPage();
        sut.state().setLastName("chris");
        sut.triggerUpdate();
        expect(sut.lastName()).toBe("chris");
        done();

      })


      it('switches to the LoginState when goToLoginPage is executed', () =>{
          goToSignupPage();
          sut.goToLoginPage();
          expect(sut.state().constructor.name).toBe("LoginState");
      })


      it('has an errorMessage observable', () =>{
        expect(sut.errorMessage()).toBe("");
      })



      it('DOES set errorMessage when an error happens during signup', () =>{

        expect(sut.errorMessage()).toBe('');
        sut.state().errorMessage = "Password is wrong";
        sut.triggerUpdate();
        expect(sut.errorMessage()).toBe("Password is wrong");
      })

      it('errorMessage disappears after the timeout is done', (done) =>{


        sut.errorTimeout = 50;
        sut.timerDone = true;
        sut.state().errorMessage = "wrong";
        sut.triggerUpdate();

        setTimeout(function(){
          expect(sut.errorMessage()).toBe('');
          done();
        },100);

      })

      it('sets timerDone back to true after the callback is done', ()=>{
        sut.timerDone = false;
        sut.clearErrorCallback();
        expect(sut.timerDone).toBeTruthy();
      })


      it('does NOT set errorMessage if triggerUpdate isnt called', () =>{
        expect(sut.errorMessage()).toBe('');
        sut.state().errorMessage = "Password is wrong";
        expect(sut.errorMessage()).toBe("");
      })

      it('activationEmailSent observable', () =>{
        expect(sut.activationEmailSent()).toBeFalsy();
      })

      it(`  signupState
         ^  expectedSignupResponse
         => state == ActivationEmailSentState
         ^  activationEmailSent == true`,()=>{

          sut.goToSignupPage();
          sut.state().onSignupCallback(JSON.stringify(sut.state().EXPECTED_SIGNUP_RESPONSE));
          sut.triggerUpdate();
          expect(sut.activationEmailSent()).toBeTruthy();
          expect(sut.errorMessage()).toBe('');
      })


      it('has the spinner observable', () =>{
        expect(sut.spinner()).toBeFalsy();
      })


      it('makes spinner() true when a states spinner is true', () =>{

        sut.goToSignupPage();
        sut.state().spinner = true;
        sut.triggerUpdate();
        expect(sut.spinner()).toBeTruthy();
      })


      it('has the login function defined', ()=>{
        expect(sut.login).toBeDefined();
      })


      it('login state ^ login() => state.login()', () =>{

        var spy = spyOn(sut.state(),'login');
        sut.goToLoginPage();
        sut.login();
        expect(spy).toHaveBeenCalled();

      })


    it('userState get set to authenticated when checkToken hides the auth widget', () =>{

      let idTokenPair = JSON.stringify(['1','faketoken']);
      spyOn(sut,'authState')
      sut.onTokenAnalyzed(idTokenPair)
      expect(sut.authState).toHaveBeenCalledWith('authenticated')
    })

    it('userState is set to anonymous when checkToken returns false', () => {
        expect(sut.authState()).toBe('anonymous');
        spyOn(sut,'authState')
        sut.onTokenAnalyzed(false);
        expect(sut.authState).toHaveBeenCalledWith('anonymous')
    })

    it('calloutMessage == password not long enough', ()=>{
      sut.password("short");
      expect(sut.state().localErrorMessage.passwordError).toBe("Password is too short.");
    })

    it('onLogout() => tokenChecker.deleteToken() and authState() == anonymous', () =>{
      spyOn(sut._remoteService,'deleteToken');
      let isTest = true;  // to avoid loading the page again.
      sut.onLogout(isTest);
      expect(sut._remoteService.deleteToken).toHaveBeenCalled();
    })


    it('gotoActivationEmailSentPage() switches the viewmodels state to that state', () =>{
      expect(sut.goToActivationEmailSentPage());
      expect(sut.state().constructor.name).toBe("ActivationEmailSentState");
    })

    it('going from SignUpState to ActivationEmailSentState hides the signup state view.' ,() =>{
      sut.goToSignupPage();
      expect(sut.activationEmailSentPageVisible()).toBeFalsy();
      expect(sut.signupPageVisible()).toBeTruthy();
      sut.goToActivationEmailSentPage();
      expect(sut.signupPageVisible()).toBeFalsy();
      expect(sut.activationEmailSentPageVisible()).toBeTruthy();
    })


    it('activationEmailSent(true) => sut.activationEmailSentPageVisible == true', ()=>{

        sut.state(sut.stateBuilder.build("ActivationEmailSentState",sut));
        expect(sut.activationEmailSentPageVisible()).toBeTruthy();
    })

    it('goToPasswordResetState() does just that.', ()=>{
        sut.goToPasswordResetState();
        expect(sut.state().constructor.name).toBe('PasswordResetState');
    })


    it('submitResetEmail() does that on the current state()',()=>{
      spyOn(sut.state(),'submitResetEmail');
      sut.submitResetEmail();
      expect(sut.state().submitResetEmail).toHaveBeenCalled();
    })

    }); // end describe

}); // end define.
