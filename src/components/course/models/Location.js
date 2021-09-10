define([],
function(
){

  function Location(data){

    if(!data || typeof data != 'object'){
      throw new Error('Location constructor expects an object as an argument.');
    }

    this.getConstructorName = function(){
      return 'Location';
    }

    this._validateNonEmptyString = function(s, errorMessage){
      if(!errorMessage){
        throw new Error('_validateNonEmptyString must be supplied with a errorMessage');
      }
      if(!s|| typeof s != 'string' || s.length < 1){
        throw new Error(errorMessage);
      }
    }


    this.setId = function(id){
      if(!id || isNaN(id) || id < 1){
        throw new Error('id must be a postive integer.');
      }
      this._locationId = id;
    }
    this.setId(data.location_id);

    this.getId = function(){
      return this._locationId;
    }


    this.setLocationName = function(name){
      this._validateNonEmptyString(name, 'location name must be a non-empty string.');
      this._locationName = name;
    }
    this.setLocationName(data.location_name);


    this.getLocationName = function(){
      return this._locationName;
    }




    this.setServerURLPrefix = function(prefix){
      this._validateNonEmptyString(prefix, 'prefix must be a non-empty string.');
      this._serverURLPrefix = prefix;
    }

    this.getServerURLPrefix = function(){
      return this._serverURLPrefix;
    }

    this.setLocationImageURL = function(url){
      this._validateNonEmptyString(url, 'url must be a non-empty string.');
      this._imgURL = url;
    }
    this.setLocationImageURL(data.img_url);


    this.getLocationImageURL = function(){
      var prefix = this.getServerURLPrefix();
      return prefix + '/' + this._imgURL + '?' + (new Date()).getTime();
    }


  } // end class.

  return Location;
});
