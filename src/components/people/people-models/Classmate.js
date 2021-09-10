define(['ko',
        'people-models/Person'],
function(ko,
         Person){

  var Classmate = function(data, host){
    Object.setPrototypeOf(this, new Person(data, host));
    this.constructor = Classmate;
    this.present = ko.observable(false);
    this.addable = true

    this.getConstructorName = function(){
      return 'Classmate'
    }

    this.setActive = function(active){
      this.active = active;
    }
    this.setActive(data.is_active)

    this.isActive = function(){
      return this.active;
    }

    this.getLastSeen = function(){
      return this.lastLogin;
    }

    this.setLastSeen = function(lastSeen){
      if(typeof lastSeen != 'string'){
        throw new Error('last_login must be a string.');
      }
      this.lastLogin = lastSeen;
    }
    this.setLastSeen(data.last_login);

    this.setAge = function(age){
      if(Number.isInteger(age) == false || age < 15){
        throw new Error('malformed age.')
      }
      this.age = age;
    }
    this.setAge(data.age)

    this.getAge = function(){
      return this.age;
    }

    this.setRes = function(res){
      if(typeof res != 'string' || res.length < 1){
        throw new Error('malformed residence.')
      }
      this.res = res
    }
    this.setRes(data.res)


    this.getRes = function(){
      return this.res;
    }

    this.getFavouriteMusic = function(){
      return this.music;
    }

    this.setFavouriteMusic = function(music){
      if(!music || typeof music != 'string' || music.length < 1){
        throw new Error('music attribute is missing!');
      }
      this.music = music
    }
    this.setFavouriteMusic(data.music);

    this.setScore = function(score){
      if(score < 0.0 || score > 1.0){
        throw new Error('score must be between 0 and 1')
      }
      this.score = score;
    }
    this.setScore(data.score)

    this.getScore = function(){
      return this.score
    }

    this.isAddable = function(){
      return this.addable;
    }


    this.setPresent = function(p){
      if(typeof p == 'boolean'){
        this.present(p)
      }else{
        this.present(true);
      }
    }
    this.setPresent(data.present);

    this.isPresent = function(){
      return this.present();
    }

    this.setAbsent = function(){
      this.present(false);
    }


    this.setSharedClassCount = function(count){
      if(count == null){
        this.sharedClasses = 0;
      }
      else if(!Number.isInteger(count) || count < 0){
        throw new Error('count must be 0 or more.');
      }
      else{
      this.sharedClasses = count;
      }
    }
    this.setSharedClassCount(data.shared_classes);


    this.getSharedClassCount = function(){
      return this.sharedClasses;
    }

    this.setMajor = function(major){
      if(!major){
        this.major = 'Student';
      }else{
        this.major = major;
      }
    }
    this.setMajor(data.major);

    this.getMajor = function(){
      return this.major
    }

    this.setYearOfStudy = function(year){
      if(!year){
        this.yearOfStudy = 1;
      }
      else{
        this.yearOfStudy = year;
      }
    }
    this.setYearOfStudy(data.year_of_study);


    this.formatSchoolYear = function(year){
      switch (year) {
        case 1:
          return '1st Year, ';

        case 2:
          return '2nd Year, ';

        case 3:
          return '3rd Year, ';

        case 4:
          return '4th Year, ';

        default:
        return '1st Year, ';
      }
    }

    this.getEducationLevel = function(){
      return this.formatSchoolYear(this.yearOfStudy) + this.major;
    }


    this.getYear = function(){
      return this.yearOfStudy
    }




  }

  /**
    Takes the properties of a
    classmate and builds a new classmate.
    (assumes no functions exist on the argument)
  */
  Classmate.getCopy = function(c){

    return new Classmate({
      id:c.id,
      first:c.first,
      last:c.last,
      role:c.role,
      age:c.age,
      res:c.res,
      music:c.music,
      present:c.present,
      small_photo_url:c.smallPhotoURL(),
      large_photo_url:c.largePhotoURL(),
      last_login:c.getLastSeen(),
      shared_classes:c.getSharedClassCount()
    },c.host);
  }

  Classmate.getRaw = function(){
    var raw = Person.getRaw();
    raw.score = 1.0;
    raw.music = "Nirvana";
    raw.present = true;
    raw.last_login = '1w';
    raw.age = 15;
    raw.res = "Vanier";
    raw.is_pending_acceptance = false;
    raw.role = 'Student';
    raw.shared_classes = 0;
    raw.is_active = 1;
    return raw
  }

  Classmate.getFake = function(){
    var raw = Classmate.getRaw();
    return new Classmate(raw, Person.getFake().getHost());
  }

  Classmate.getFake2 = function(){
    var raw = Classmate.getRaw();
    raw.id = raw.id + 1;
    return new Classmate(raw, Person.getFake().getHost());
  }

  return Classmate;

});
