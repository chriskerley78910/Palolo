
define(['ko',
        'ad-views/lead-view/Component',
        'ad-specs/ad-spec'],
function(ko,
         Component,
         AdSpec){

    describe("lead-views Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      it('isVisible() == false by default', ()=>{
        expect(sut.isVisible()).toBeFalsy();
      })


      it('hasNullAd as currentAd by default.', ()=>{
        expect(sut.currentAd().getConstructorName() == 'NullAd').toBeTruthy();
      })

      it('closeAd() => isVisible() == false', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.closeLead();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('closeLead');
      })

      it('onStoreChanged() => sets the ad stored in the store.', ()=>{
        let ad = AdSpec.getFake();
        sut.store.setCurrentAd(ad);
        expect(sut.isVisible()).toBeFalsy();
        spyOn(sut.store,'isLeadOpen').and.returnValue(true);
        sut.onStoreChanged();
        expect(sut.currentAd().getConstructorName()).toBe('Ad');
        expect(sut.isVisible()).toBeTruthy();
      })

      it('sendMessage() dispatches the current lead message on the leadMessage channnel.', ()=>{
        let msg = 'Current lead message';
        sut.leadMessage(msg);
        spyOn(sut.dis, 'dispatch');
        sut.sendMessage();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('leadMessage', msg);
        expect(sut.leadMessage().length).toBe(0);
      })

      it('sendMessage() shows an error if the message is empty.', ()=>{
        let msg = '             ';
        sut.leadMessage(msg);
        spyOn(sut.dis, 'dispatch');
        spyOn(window,'alert');
        sut.sendMessage();
        expect(window.alert).toHaveBeenCalled();
        expect(sut.dis.dispatch).not.toHaveBeenCalled();
      })


    }); // end describe
}); // end define.
