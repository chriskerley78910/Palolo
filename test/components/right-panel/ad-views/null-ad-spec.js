
define(['right-panel/ad-views/NullAd'],
function(NullAd){

  let Mock = {
    getFake:()=>{
      return new NullAd();
    }
  }

    describe("NullAd Tests", function(){



      it('sets all the attributes of the ad.',()=>{
        let ad = Mock.getFake();
        expect(ad.getId()).toBe(1);
        expect(ad.getHeadline()).toBe('MATH TUTOR');
        expect(ad.getDegree()).toBe('B.A');
        expect(ad.getSchool()).toBe("York University");
        expect(ad.getMajor()).toBe('Computer Science');
        expect(ad.getExperience()).toBe(4);
        expect(ad.getFirstName()).toBe('Chris');
        expect(ad.getLastName()).toBe('Kerley');
        expect(ad.getImgURL()).toBe('http://something.jpeg');
        expect(ad.getHourlyRate()).toBe(45);
        expect(ad.isDegreeVerified()).toBeTruthy();
      })

    }); // end describe

    return Mock;
}); // end define.
