
define(['ad-views/Ad'],
function(Ad){

  let getRaw = ()=>{
    return {
      ad_id:1,
      headline:"MATH TUTOR",
      degree:'B.A',
      school:'York University',
      major:'Computer Science',
      experience:4,
      first_name:'Chris',
      last_name:'Kerley',
      img_url:'something.jpg',
      hourly_rate:45,
      is_degree_verified:true,
      text:'This is the ad text.'
    }
  }

  let Mock = {
    getRaw:getRaw
    ,
    getFake:()=>{
      let data = getRaw();
      return new Ad(data);
    }
  }

    describe("Ad Tests", function(){

      it('requires an id number.', ()=>{
        let data = {}
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('ad_id required');
        }
      })

      it('requires a headline', ()=>{
        let data = {
          ad_id:1
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('headline is required.');
        }
      })

      it('requires degree acronymn', ()=>{
          let data ={
            ad_id:1,
            headline:"MATH TUTOR"
          }
          try{
            new Ad(data);
            expect(false).toBeTruthy();
          }
          catch(err){
            expect(err.message).toBe('degree is required.');
          }
      })

      it('requires school of degree.', ()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.Sc'
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('school is required.');
        }
      })

      it('requires degree major', ()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.A',
          school:'York University'
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('major is required.');
        }
      })

      it('requires years of professional teaching experience.',()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.A',
          school:'York University',
          major:'Computer Science'
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('experience is required.');
        }
      })

      it('requires first_name.', ()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.A',
          school:'York University',
          major:'Computer Science',
          experience:4
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('first_name is is required.');
        }
      })

      it('requires last name.', ()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.A',
          school:'York University',
          major:'Computer Science',
          experience:4,
          first_name:'Chris'
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('last_name is is required.');
        }
      })

      it('requires advertisers image url.', ()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.A',
          school:'York University',
          major:'Computer Science',
          experience:4,
          first_name:'Chris',
          last_name:'Kerley'
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('img_url is is required.');
        }
      })

      it('requires hourly rate.', ()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.A',
          school:'York University',
          major:'Computer Science',
          experience:4,
          first_name:'Chris',
          last_name:'Kerley',
          img_url:'http://something.jpeg'
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('hourly_rate is required.');
        }
      })


      it('requires if their degree is verified', ()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.A',
          school:'York University',
          major:'Computer Science',
          experience:4,
          first_name:'Chris',
          last_name:'Kerley',
          img_url:'http://something.jpeg',
          hourly_rate:45
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('is_degree_verified is required.');
        }
      })

      it('requires text', ()=>{
        let data ={
          ad_id:1,
          headline:"MATH TUTOR",
          degree:'B.A',
          school:'York University',
          major:'Computer Science',
          experience:4,
          first_name:'Chris',
          last_name:'Kerley',
          img_url:'http://something.jpeg',
          hourly_rate:45,
          is_degree_verified:1
        }
        try{
          new Ad(data);
          expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('Ads must have non-empty text.');
        }
      })

      it('sets all the attributes of the ad.',()=>{
        let ad = Mock.getFake();
        ad.setServerPrefix('ads.localhost');
        expect(ad.getId()).toBe(1);
        expect(ad.getHeadline()).toBe('MATH TUTOR');
        expect(ad.getDegree()).toBe('B.A');
        expect(ad.getSchool()).toBe("York University");
        expect(ad.getMajor()).toBe('Computer Science');
        expect(ad.getExperience()).toBe('4 years');
        expect(ad.getFirstName()).toBe('Chris');
        expect(ad.getLastName()).toBe('Kerley');
        expect(ad.getImgURL()).toBe('ads.localhost/something.jpg');
        expect(ad.getHourlyRate()).toBe(45);
        expect(ad.isDegreeVerified()).toBeTruthy();
        expect(ad.getText()).toBe('This is the ad text.');
      })

    }); // end describe

    return Mock;
}); // end define.
