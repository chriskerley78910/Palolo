
define(['ad-views/AdStore', 'ad-specs/ad-spec'],
function(AdStore, AdSpec){

    describe("ad-store Tests", function(){

      let sut = null;
      let rs = null;
      beforeEach(() => {
        sut = AdStore;
        rs = sut.getRemoteService();
      })

      it('init() => registerOnAdReceived(fn) called', ()=>{
        spyOn(rs,'registerOnAdReceived');
        sut.init();
        expect(rs.registerOnAdReceived).toHaveBeenCalled();
      })


      it('isAdvisible() == true by default', ()=>{
        expect(sut.isAdVisible()).toBeTruthy();
      })

      it('onOpenGroupView => isAdVisible() == true', done =>{
        sut.onPub(()=>{
            expect(sut.isAdVisible()).toBeTruthy();
            done();
        })
        sut.onOpenGroupView();
      })

      it('onGiveClassmateFocus() => isAdVisible() == false', done => {
        sut.setAdVisible();
        sut.onPub(()=>{
          expect(sut.isAdVisible()).toBeFalsy();
          done();
        })
        sut.onGiveClassmateFocus();
      })

      it('onOpenLead() => isLeadOpen == true ^ rs.recordLeadClick(ad)',()=>{
          spyOn(rs,'recordLeadClick');
          sut.onOpenLead();
          expect(rs.recordLeadClick).toHaveBeenCalledWith(sut.getCurrentAd());
          expect(sut.isLeadOpen()).toBeTruthy();
      })

      it('onCloseLead() => isLeadOpen == false', ()=>{
        sut.onOpenLead();
        sut.onCloseLead();
        expect(sut.isLeadOpen()).toBeFalsy();
      })


      it('onCourseInfo() asks the remoteService for the ad', ()=>{
        spyOn(rs,'getAdFromServer');
        sut.onCourseInfo();
        expect(rs.getAdFromServer).toHaveBeenCalled();
      })

      it('onAdReceived(ad) => set the ad and publish that change.', ()=>{
        let fake = AdSpec.getRaw();
        spyOn(sut,'publish');
        sut.onAdReceived(fake);
        expect(sut.getCurrentAd().ad_id).toBe(fake.ad_id);
        expect(sut.publish).toHaveBeenCalled();
        expect(sut.getCurrentAd().getImgURL()).toBe('http://ads.localhost/something.jpg');
      })

      it('publish() calls all subscribed functions.', (done) => {

        sut.onPub(()=>{
          expect(true).toBeTruthy();
          done();
        })
        sut.publish();
      })

      it('onMessage() => remoteService.sendMessage(obj)', (done)=>{
        let message = 'hello';
        let rss = sut.getRemoteService();
        spyOn(rss,'sendMessage');
        sut.onPub(()=>{
          expect(sut.isWaiting()).toBeTruthy();
          done();
        })
        sut.onMessage(message);
      })

      it('onMessageSent() => _isWaiting == false ^ publish', (done)=>{
          sut.onMessage('message');
          sut.onPub(()=>{
            expect(sut.isWaiting()).toBeFalsy();
            done();
          })
          sut.onMessageSent();
      })



    }); // end describe
}); // end define.
