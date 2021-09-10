define(['course/models/Location',
        'people-models/Prof',
        'abstract-interfaces/ValidObject'],
function(Location, Prof, ValidObject){

  function CourseGroup(data, host){

    Object.setPrototypeOf(this, new ValidObject())



    if(!data || typeof data != 'object'){
      throw new Error('CourseSection constructor expects an object as an argument.');
    }

    try{
      this.validateStr(host)
    }catch(err){
      throw new Error('host is required')
    }

    this.isGroup = function(){
      return true
    }

    this.getHost = function(){
      return this.host
    }

    this.setHost = function(host){
      this.validateStr(host)
      this.host = host
    }
    this.setHost(host)


    this._validateId = function(id, errorMessage){
      if(!id || isNaN(id) || id < 1){
        throw new Error(errorMessage);
      }
    }

    this._validateNonEmptyString = function(s, errorMessage){
      if(!errorMessage){
        throw new Error('_validateNonEmptyString must be supplied with a errorMessage');
      }
      if(!s|| typeof s != 'string' || s.length < 1){
        throw new Error(errorMessage);
      }
    }


    this.setId = function(grpId){
        this._validateId(grpId, 'groupId must be a postive integer.');
        this.groupId = grpId;
    }
    this.setId(data.group_id);



    this.getId = function(){
      return this.groupId;
    }



    this._validateNonEmptyString(data.section_letter, 'section_letter must a non-empty string.');
    this._sectionLetter = data.section_letter;
    this.getSectionLetter = function(){
      return this._sectionLetter;
    }


    this.setBuilding = function(building){
      if(!building || typeof building != 'string'){
        throw new Error('building cant be empty');
      }
      this.building = building;
    }
    this.setBuilding(data.building_name);


    this.getBuilding = function(){
      return this.building;
    }

    this.inAnotherSection = function(){
      return this.isInAnotherSection;
    }

    this.setInAnotherSection = function(bool){
      if(typeof bool != 'boolean'){
        throw new Error('bool must be a boolean.');
      }
      this.isInAnotherSection = bool;
    }
    this.setInAnotherSection(data.in_another_section);


    this.setImgUrl = function(imgUrl){
      this.imgUrl = imgUrl;
    }
    this.setImgUrl(data.img_url);


    this.getImgUrl = function(){
      return this.getHost() + '/' + this.imgUrl;
    }

    this.setDept = function(dept){
      this._validateNonEmptyString(dept, 'dept must be non-empty.');
      this.dept = dept;
    }
    this.setDept(data.dept);


    this.getDept = function(){
      return this.dept;
    }

    this.getCourseCode = function(){
      return this._courseCode;
    }

    this.setCourseCode = function(code){
      this._validateNonEmptyString(code, 'course_code must be a non-empty string.');
      this._courseCode = code;
    }
    this.setCourseCode(data.course_code);



    this.getCourseDescription = function(){
      return this.description;
    }

    this.setCourseDescription = function(description){
      this._validateNonEmptyString(description, "description must be a non-empty string.");
      this.description = description;
    }
    this.setCourseDescription(data.description);


    this.setMembershipStatus = function(status){
      if(typeof status !== 'boolean'){
        throw new Error('membership status must be a boolean');
      }
      this.isMemberStatus = status;
    }
    this.setMembershipStatus(data.is_member);



    this.isMember  = function(){
      return this.isMemberStatus;
    }

    this.setProf = function(data){
      this.prof = new Prof(data, host)
    }
    this.setProf(data)

    this.getProf = function(){
      return this.prof
    }

    this.getProfsName = function(){
      return  this.prof.getFirst() + ' ' + this.prof.getLast()
    }

    this.getProfsPhoto = function(){
      return this.prof.getSmallPhotoURL()
    }


  } // end class.

  CourseGroup.getRaw = function(){
    return {
      group_id:1,
      dept:'EECS',
      course_code:"FAKE101",
      description:'Fake Course',
      section_letter:'A',
      is_member:true,
      in_another_section: false,
      building_name:'Accolade East',
      room_name:'001',
      id:2,
      first:'Nick',
      last:'Weber',
      small_photo_url:'small',
      large_photo_url:'large',
      role:'prof'
    }
  }

  CourseGroup.getFake = function(){
    var host = 'http://host'
    return new CourseGroup(CourseGroup.getRaw(), host);
  }




  return CourseGroup;
});
