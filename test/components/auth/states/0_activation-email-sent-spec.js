
define(['auth/states/ActivationEmailSentState',
        'auth/AuthRemoteService',
        'mocks/mock-data'],

function(ActivationEmailSentState,
         AuthRemoteService,
         MockData){

    describe("Test Signup", function(){


      let state = null;

      beforeEach(() => {
        state = new ActivationEmailSentState(MockData.getMockVM(),new AuthRemoteService());
      })


      it('is a prototype of AuthStat', () => {

        expect(Object.getPrototypeOf(state).constructor.name).toBe('AuthState');
      })



      it('',()=>{

      })

    }); // end describe

}); // end define.
