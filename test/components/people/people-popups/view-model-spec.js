define(['people-popups/Component'],
function(Component){

    describe("people-popups", function(){

      var sut = null;

      beforeEach(()=>{
        sut = new Component.viewModel()
      })

      it('isPalRequestSentVisible() == false by default',()=>{
        expect(sut.isPalRequestSentVisible()).toBeFalsy()
      })

      it('isPalRequestSentVisible() <=> store.isPalRequestSent()',()=>{
        sut.store.isPalRequestSent = ()=> true;
        sut.onStoreUpdated();
        expect(sut.isPalRequestSentVisible()).toBeTruthy();
        sut.store.isPalRequestSent = ()=>false
        sut.onStoreUpdated();
        expect(sut.isPalRequestSentVisible()).toBeFalsy();
      })

    }); // end describe

}); // end define.
