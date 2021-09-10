define(['people-models/Person','ko'],
function(Person, ko){

  var Prof = function(data, host, DocConstructor){

    Object.setPrototypeOf(this, new Person(data, host))
    this.years = ko.observableArray([])

    this.getConstructorName = function(){
      return 'Prof'
    }

    this.addDoc = function(rawDoc){
      if(!rawDoc) throw new Error('expected doc')
      var doc = new DocConstructor(rawDoc, host)
      var year = this.getYear(doc)
      if(!year){
        this.years.push({
          year:doc.year,
          docs:ko.observableArray([doc])
        })
      }
      else{
        year.docs.push(doc)
      }
    }

    /**
      returns the year associated with the doc.
      Otherwise returns null if no year matches the
      docs year.
    */
    this.getYear = function(doc){
      for(var i = 0; i < this.getYearCount(); i++){
        var t = this.years()[i]
        if(t.year == doc.year && t.year == doc.year){
            return t
        }
      }
      return null
    }

    this.getYearAt = function(index){
      return this.years()[index]
    }

    this.getYearCount = function(){
      return this.years().length
    }


    this.getYears = function(){
      return this.years
    }


  } // end constructor.


  Prof.getRaw = function(){
    return Person.getRaw();
  }

  Prof.getFake = function(Constructor){
    const raw = Person.getRaw()
    return new Prof(raw, 'host', Constructor)
  }
  return Prof;
});
