
define(['york-forum/forum-stats/Component'],
function(Component){

    describe("forum-stats tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      it('isVisible() == false by default', ()=>{
        expect(sut.isVisible()).toBeFalsy();
      })

      it('memberCount() == 0',  ()=>{
        expect(sut.memberCount()).toBe(0)
      })

      it('onStore() => memberCount() == store.getMemberCount()',()=>{
        const count = 1
        spyOn(sut.store,'getMemberCount').and.returnValue(count)
        sut.onStore()
        expect(sut.memberCount()).toBe(count)
      })

      it('onStore(),!store.isVisible() => !isVisible()',()=>{
        sut.isVisible(true)
        spyOn(sut.store,'isVisible').and.returnValue(false)
        sut.onStore()
        expect(sut.isVisible()).toBeFalsy()
      })

    }); // end describe

}); // end define.
