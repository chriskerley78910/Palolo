
define(['ko'],
function(ko){

  var NullAd = function(data){
    this.getConstructorName = function(){
      return "NullAd";
    }

    this.id = 0;
    this.headline = "Your Headline";
    this.degree = "B.A";
    this.school = "York University";
    this.major = "Computer Science";
    this.experience = 2;
    this.firstName = "First";
    this.lastName = "Last";
    this.imgURL = './assets/no-photo.jpg';
    this.hourlyRate = 25;
    this.isDegreeVerified = true;

    this.getId = function(){
      return this.id;
    }

    this.getHeadline = function(){
      return this.headline;
    }

    this.getDegree = function(){
      return this.degree;
    }


    this.getSchool = function(){
      return this.school;
    }


    this.getMajor = function(){
      return this.major;
    }

    this.getExperience = function(){
      return this.experience;
    }


    this.getFirstName = function(){
      return this.firstName;
    }

    this.getLastName = function(){
      return this.lastName;
    }

    this.getImgURL = function(){
      return this.imgURL;
    }


    this.getHourlyRate = function(){
      return this.hourlyRate;
    }


    this.isDegreeVerified = function(){
      return this.isDegreeVerified;
    }

    this.getText = function(){
      return '';
    }

  } // end constructor.

  return NullAd;

})
