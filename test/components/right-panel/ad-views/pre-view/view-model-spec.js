
define(['ad-views/pre-view/Component',
        'ad-specs/ad-spec'],
function(Component, AdSpec){

    describe("pre-view Tests", function(){

      let sut = null;
      beforeEach(() => {
        sut = new Component.viewModel();
      })

      it('isVisible() == false by default', ()=>{
        expect(sut.isVisible()).toBeFalsy();
      })



      it('onStoreChanged() => sets the currentAd stored in the store.', ()=>{
        expect(sut.currentAd().getConstructorName()).toBe('NullAd');
        let ad = AdSpec.getFake();
        spyOn(sut.store,'getCurrentAd').and.returnValue(ad);
        spyOn(sut.store,'isAdVisible').and.returnValue(true);
        sut.onStoreChange();
        expect(sut.currentAd()).toBe(ad);
        expect(sut.isVisible()).toBeTruthy();
      })

      it('openLead() => dispatch(openLead)', ()=>{
        spyOn(sut.dis,'dispatch');
        sut.openLead();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('openLead');
      })


      it('onHover() => dispatch(adHovered, Ad)',()=>{
        spyOn(sut.dis,'dispatch');
        let ad = AdSpec.getFake();
        sut.currentAd(ad);
        sut.onHover();
        expect(sut.dis.dispatch).toHaveBeenCalledWith('adHovered', sut.currentAd());
      })

    }); // end describe
}); // end define.
