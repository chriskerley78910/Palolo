define([],
function(
){

  function CourseSection(data){

    if(!data || typeof data != 'object'){
      throw new Error('CourseSection constructor expects an object as an argument.');
    }

    this.getConstructorName = function(){
      return 'CourseSection';
    }

    this.setSectionId = function(sectionId){
      if(isNaN(sectionId) || sectionId < 1 || Number.isInteger(sectionId) == false){
        throw new Error('sectionId must be a postive integer.');
      }
      this.sectionId = sectionId;
    }
    this.setSectionId(data.section_id);

    this.getId = function(){
      return this.sectionId;
    }

    this.setSectionLetter = function(sectionLetter){
      if(typeof sectionLetter != 'string' || sectionLetter.length < 1){
        throw new Error('sectionLetter must be a non empty string.');
      }
      this.sectionLetter = sectionLetter;
    }
    this.setSectionLetter(data.section_letter);

    this.getLetter = function(){
      return this.sectionLetter;
    }

  } // end class.

  // factory for creating lists of sections.
  CourseSection.makeSectionsArray = function(sections){
        var arr = [];
        if(Array.isArray(sections) == false || sections.length < 1){
          throw new Error('sections must be a non-empty array.');
        }
        for(var i = 0; i < sections.length; i++){
          var section = new CourseSection(sections[i]);
          arr.push(section);
        }
        return arr;
  };


  return CourseSection;
});
