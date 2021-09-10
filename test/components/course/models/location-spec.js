
define(['course/models/Location'], function(Location){

    describe("Test Location", function(){

      let sut = null;

      beforeEach(()=>{
        let validData = {
          location_id:1,
          location_name:'CLH',
          img_url:'fake.jpg'
          }
          sut = new Location(validData);
      })

      it('setId() throws if the id is NaN', ()=>{
        let f = ()=>{
          new Location({});
        }
        expect(f).toThrow(new Error('id must be a postive integer.'))
      })

      it('setId(id) does just that.', ()=>{
        sut.setId(52);
        expect(sut.getId()).toBe(52);
      })

      it('setServerURLPrefix(prefix) does just that.', ()=>{
        let prefix = 'http://server';
        sut.setServerURLPrefix(prefix);
        sut.setLocationImageURL('img.jpg');
        expect(sut.getLocationImageURL()).toMatch(/http:\/\/server\/img\.jpg\?.*/);
      })

      it('setLocationName(name) does just that.', ()=>{
        expect(sut.getLocationName()).toBe('CLH');
        sut.setLocationName('fakename2');
        expect(sut.getLocationName()).toBe('fakename2');
      })

      it('setLocationImageURL() does just that.', ()=>{
        sut.setLocationImageURL('newimg.jpg');
        expect(sut.getLocationImageURL()).toMatch(/.*newimg.jpg.*/);
      })


    }); // end describe

}); // end define.
