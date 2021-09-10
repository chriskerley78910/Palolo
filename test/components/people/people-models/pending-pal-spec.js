define(['people-models/PendingPal',
        'people-models/Classmate'],
function(PendingPal,
         Classmate){
    describe("PendingPal Tests", function(){

      let sut = null;
      beforeEach(()=>{
        sut = new PendingPal( Classmate.getFake());
      })

      it('build creates a PendingPal from an existing person',()=>{
        const p = PendingPal.build(Classmate.getFake())
        expect(p.isAddable()).toBeFalsy()
      })

      it('instanceof PendingPal', ()=>{
        expect(sut.constructor).toBe(PendingPal);
      })

      it('isAddable() == true',()=>{
        expect(sut.isAddable()).toBeFalsy();
      })

      it('getLargePhotoURL() == whatever',()=>{
        expect(sut.getLargePhotoURL()).toBe('https://www.profile.palolo.ca//profile_images/485l.jpg')
      })

    }); // end describe

}); // end define.
