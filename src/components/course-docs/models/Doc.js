define(['abstract-interfaces/ValidObject',
        'people-models/Prof'],
function(ValidObject, Prof){
  var Doc = function(file){

    Object.setPrototypeOf(this, new ValidObject())


    this.setShallowProf = function(prof){
      this.prof = prof;
    }

    this.getProf = function(){
      return this.prof
    }

    this.setTitle = function(title){
      this.validateStr(title)
      this.title = title
    }

    this.getTitle = function(){
      return this.title
    }



    this.setYear = function(year){
      this.validateId(year)
      this.year = year;
    }

    this.getYear = function(){
      return this.year;
    }

    this.setTopics = function(topics){
      this.topics = topics;
    }

    this.getTopics = function(){
      return this.topics
    }
  }

return Doc;
})
