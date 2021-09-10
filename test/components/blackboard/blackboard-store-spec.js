
define(['blackboard/BlackboardStore'],
function(BlackboardStore){


  describe('Test BlackboardStore',function(){

      let sut = null;
      beforeEach(()=>{
        sut = BlackboardStore.getNew()
      })

      it('openBlackboardSharer, does that and pubs', done => {
        expect(sut.isBlackboardSharerOpen()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isBlackboardSharerOpen()).toBeTruthy()
          done()
        })
        sut.openBlackboardSharer()
      })

      it('closeBlackboardSharer, does that and pubs', done => {
        sut.blackboardSharerOpen = true
        expect(sut.isBlackboardSharerOpen()).toBeTruthy()
        sut.onPub(()=>{
          expect(sut.isBlackboardSharerOpen()).toBeFalsy()
          done()
        })
        sut.closeBlackboardSharer()
      })

  }); // end describe.


});  // end define.
