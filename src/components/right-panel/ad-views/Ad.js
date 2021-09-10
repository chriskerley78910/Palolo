
define(['ko'],
function(ko){

  var Ad = function(data){


    this.getConstructorName = function(){
      return "Ad";
    }

    this.checkString = function(str, errMsg){
      if(!str || typeof str != 'string' || str.length < 1){
        throw new Error(errMsg);
      }
    }

    this.checkNum = function(num, errMsg){
      if(!num || Number.isInteger(num) == false || num < 1){
        throw new Error(errMsg);
      }
    }


    this.setId = function(id){
      this.checkNum(id, 'ad_id required');
      this.ad_id = id;
    }
    this.setId(data.ad_id);

    this.getId = function(){
      return this.ad_id;
    }


    this.setHeadline = function(headline){
      this.checkString(headline,'headline is required.');
      this.headline = headline;
    }
    this.setHeadline(data.headline);

    this.getHeadline = function(){
      return this.headline;
    }

    this.setDegree = function(degree){
      this.checkString(degree, 'degree is required.');
      this.degree = degree;
    }
    this.setDegree(data.degree);


    this.getDegree = function(){
      return this.degree;
    }

    this.setSchool = function(school){
      this.checkString(school, 'school is required.');
      this.school = school;
    }
    this.setSchool(data.school);


    this.getSchool = function(){
      return this.school;
    }

    this.setMajor = function(major){
      this.checkString(major, 'major is required.');
      this.major = major;
    }
    this.setMajor(data.major);


    this.getMajor = function(){
      return this.major;
    }

    this.setExperience = function(exp){
      this.checkNum(exp, 'experience is required.');
      this.experience = exp;
    }
    this.setExperience(data.experience);


    this.getExperience = function(){
      return this.experience + " years";
    }


    this.setFirstName = function(name){
      this.checkString(name, 'first_name is is required.');
      this.firstName = name;
    }
    this.setFirstName(data.first_name);


    this.getFirstName = function(){
      return this.firstName;
    }


    this.setLastName = function(name){
      this.checkString(name, 'last_name is is required.');
      this.lastName = name;
    }
    this.setLastName(data.last_name);


    this.getLastName = function(){
      return this.lastName;
    }

    this.setImgURL = function(url){
      this.checkString(url, 'img_url is is required.');
      this.imgURL = url;
    }
    this.setImgURL(data.img_url);

    this.getImgURL = function(){
      return this.serverPrefix + '/' + this.imgURL;
    }

    this.setServerPrefix = function(host){
      this.checkString(host);
      this.serverPrefix = host;
    }

    this.setHourlyRate = function(rate){
      this.checkNum(rate, 'hourly_rate is required.');
      this.hourlyRate = rate;
    }
    this.setHourlyRate(data.hourly_rate);

    this.getHourlyRate = function(){
      return this.hourlyRate;
    }

    this.setDegreeVerification = function(isVerified){
      if(isVerified != 0 && isVerified != 1){
        throw new Error('is_degree_verified is required.');
      }
      this.isDegreeVerified = isVerified;
    }
    this.setDegreeVerification(data.is_degree_verified);


    this.isDegreeVerified = function(){
      return this.isDegreeVerified;
    }

    this.setText = function(text){
      if(!text || typeof text != 'string' || text.length < 1){
        throw new Error('Ads must have non-empty text.');
      }
      this.text = text;
    }
    this.setText(data.text);


    this.getText = function(){
      return this.text;
    }

  } // end constructor.

  return Ad;

})
