
define(['ko','abstract-interfaces/ValidObject'],
function(ko, ValidObject){

  var Person = function(literal, host){
    if(Object.getPrototypeOf(literal) !== Object.prototype){
      throw new Error('Expected literal object!')
    }
    Object.setPrototypeOf(this, new ValidObject());
    this.constructor = Person
    this.addable = false

    this.getConstructorName = function(){
      return "Person";
    }

    this.defaultPhotoURL = "./assets/no-photo.jpg";
    this.smallPhotoURL = ko.observable(this.defaultPhotoURL);
    this.largePhotoURL = ko.observable(this.defaultPhotoURL);


    this.equals = function(other){
      return this.getId() === other.getId();
    }

    this.isPresent = function(){
      return false
    }


    this.setId = function(id){
      this.validateId(id)
      this.id = id;
    }
    this.setId(literal.id);

    this.getId = function(){
      return this.id;
    }

    this.setHost = (function(host){
        this.validateStr(host)
        this.host = host;
    }).bind(this)
    this.setHost(host);


    this.getHost = function(){
      return this.host;
    }


    this.setFirst = (function(first){
      this.validateStr(first);
      this.first = first;
    }).bind(this);
    this.setFirst(literal.first)


    this.setLast = (function(last){
      this.validateStr(last);
      this.last = last;
    }).bind(this);
    this.setLast(literal.last)

    this.setDefaultPhotoURL = function(){
      this.smallPhotoURL(this.defaultPhotoURL);
      this.largePhotoURL(this.defaultPhotoURL);
    }

    this.getDefaultPhotoURL = function(){
      return this.defaultPhotoURL;
    }

    this.getLargePhotoURL = function(){
      return this.largePhotoURL();
    }

    this.getRelativeLargePhotoURL = function(){
      return this.relativeLargePhotoURL
    }

    this.setLargePhotoURL = function(url){
      if(url && typeof url == 'string' && url.length > 0){
        this.largePhotoURL(this.host + '/' + url);
        this.relativeLargePhotoURL = url
      }
      else{
        this.largePhotoURL(this.defaultPhotoURL);
        this.relativeLargePhotoURL = this.defaultPhotoURL;
      }
    }
    this.setLargePhotoURL(literal.large_photo_url);


    this.setSmallPhotoURL = (function(url){
      if(typeof url != 'string' || url.length < 1){
        this.smallPhotoURL(this.defaultPhotoURL);
        this.relativeSmallPhotoURL = this.defaultPhotoURL
      }
      else{
        this.smallPhotoURL(this.host + '/' + url);
        this.relativeSmallPhotoURL = url
      }
    }).bind(this);
    this.setSmallPhotoURL(literal.small_photo_url);



    this.getSmallPhotoURL = function(){
      return this.smallPhotoURL();
    }

    this.getRelativeSmallPhotoURL = function(){
      return this.relativeSmallPhotoURL
    }

    this.getFirst = function(){
      return this.first;
    }

    this.getLast = function(){
      return this.last;
    }

    this.getRole = function(){
      return this.role;
    }

    this.setRole = (function(role){
      this.validateStr(role)
      this.role = role;
    }).bind(this)
    this.setRole(literal.role);


    this.isAddable = (function(){
      return this.addable;
    }).bind(this)

    this.setAddable = function(bool){
      this.addable = bool
    }

    this.isReal = function(){
      return true
    }


  }

  // factory method.


  Person.getRaw = function(){
    return {
        id:2,
        first:'First',
        last:'Last',
        small_photo_url:'profile_images/485s.jpg',
        large_photo_url:'profile_images/485l.jpg',
        role:'Student'
    }
  }

  Person.getDefaultPhotoURL = function(){
    return './assets/no-photo.jpg'
  }


  Person.getFake = function(){
    var raw = Person.getRaw();
    return new Person(raw,'https://www.profile.palolo.ca/');
  }

    Person.getCopy = function(p){
      return new Person({
        id:p.getId(),
        first:p.getFirst(),
        last:p.getLast(),
        role:p.getRole()
      }, p.getHost());
    }


  return Person;
})
