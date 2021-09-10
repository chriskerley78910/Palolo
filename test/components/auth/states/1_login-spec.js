
define(['auth/states/LoginState','mocks/mock-data'], function(LoginState,MockData){

    describe("Test Login", function(){


      let state = null;

      beforeEach(() => {
        state = new LoginState(MockData.getMockVM());
      })


      var mockJWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE1NDcwMjc2MjAsImp0aSI6Ik91b3NFTEtrckxZNkRTZEc2YzFsMFE9PSIsImlzcyI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MVwvQXV0aC5waHAiLCJuYmYiOjE1NDcwMjc2MjAsImV4cCI6MTU0NzAyNzY4MCwiZGF0YSI6eyJ1c2VySWQiOjI1LCJ1c2VyRmlyc3ROYW1lIjoiQ2hyaXNrIiwidXNlckxhc3ROYW1lIjoiS2VybGV5In19.B-1pOm5hDDxw0S8SPEGIjAdg4hurxxWcvVrisbhTfuBlSV-oMQJ_rlLiJoY2DEe6GOvlW6tDN6KwB3kbPn9Tkg';

      // it('does an alert if the jwt in localStorage is faulty', () =>{
      //
      //   expect(window.localStorage.getItem('accessToken')).not.toBeDefined();
      //   state.onLoginCallback(JSON.stringify(mockJWT));
      //   expect(window.localStorage.getItem('accessToken')).toBeDefined();
      // })




    }); // end describe

}); // end define.
