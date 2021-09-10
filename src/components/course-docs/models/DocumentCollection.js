define(['abstract-interfaces/ValidObject',
        'people-models/Prof',
        'course-docs/models/SavedDoc',
        'ko'],
function(ValidObject, Prof, DocConstructor, ko){

  var DocCollection = function(rawDocs, host){

    Object.setPrototypeOf(this, new ValidObject())
    this.validateStr(host)
    this.profs = []

    this.insertDocs = (function(docs){
      if(!Array.isArray(docs))
        throw new Error('expected an array.')
      var self = this
      docs.forEach(function(d){
        self.insertDoc(d)
      })
    }).bind(this)


    /**
      onlyinsert the prof if they are not
      already in the profs array.
    */
    this.insertDoc = (function(doc){
      var prof = this.getProf(doc)
      if(!prof){
        var objProf = new Prof(doc, host, DocConstructor)
        objProf.addDoc(doc)
        var obvProf = ko.observable(objProf)
        this.profs.push(obvProf)
      }
      else{
        this.profs.forEach(function(p){
          if(p().getId() == doc.id){
            p().addDoc(doc)
          }
        })
      }
    }).bind(this)

    /**
      Attempts to get the prof associated
      with the given document.  Returns
      null if no prof exist for that doc.
    */
    this.getProf = function(rawDoc){
      var prof = null
      this.profs.forEach(function(obvProf){
        if(rawDoc.id == obvProf().id){
          prof = obvProf
        }
      })
      return prof
    }



    this.getProfs = function(){
      return this.profs
    }


    this.getSize = function(){
      return this.profs.length
    }


    this.insertDocs(rawDocs)
  } // end constructor

  DocCollection.getFake = function(){
    return new DocCollection([],'fakehost')
  }

return DocCollection;
})
