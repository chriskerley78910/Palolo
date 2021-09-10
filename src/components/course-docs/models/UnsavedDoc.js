define(['course-docs/models/Doc',
        'people-models/Prof',
         'course/models/CourseGroup'],
function(Doc,
         Prof,
         CourseGroup){
  var UnsavedDoc = function(file, grp){

    Object.setPrototypeOf(this, new Doc())
    this.MAX_FILE_SIZE = 10000000


    this.setTitle = function(title){
      if(typeof title != 'string')
        throw new Error('title must be a string')
      this.title = title
    }

    this.setFile = (function(file){
      if(file instanceof File == false){
        throw new Error('must be a file')
      }
      if(file.size > this.MAX_FILE_SIZE){
        throw new Error('That file is too large. (10mb max)')
      }
      this.file = file
      this.setTitle(this.file.name)
    }).bind(this)
    this.setFile(file)

    this.getFile = function(){
      return this.file
    }

    this.encodeFile = (function(done){
      var reader = new FileReader();
      var self = this;
      reader.onload = function(e){
        self.encodedFile = e.target.result;
        if(done && typeof done == 'function'){
          done()
        }
      }
      reader.readAsDataURL(this.file);
    }).bind(this)


    this.getEncodedFile = function(){
      return this.encodedFile
    }


    this.getFileName = function(){
      return this.file.name
    }

    this.setGrp = function(grp){
      if(!grp.isGroup()){
        throw new Error('Expected a CourseGroup instance')
      }
      this.grp = grp;
    }
    this.setGrp(grp)

    this.getGrp = function(){
      return this.grp;
    }

    this.getGrpId = function(){
      return this.grp.getId()
    }

    this.isSendable = function(){
      return  !this.file == false &&
              !this.title == false &&
              this.profId > 0;
    }

    this.setProfId = function(id){
      this.validateId(id)
      this.profId = id
    }



    this.serialize = (function(){

      if(!this.encodedFile) throw new Error('cannot serialize if the file has not been encoded yet')
      if(!this.year) throw new Error('to serialize, the year must be set')
      if(!this.profId)
        throw new Error('to serialize, the profId must be set')

      return {
        title:this.title,
        file:this.encodedFile,
        year:this.year,
        profId:this.profId,
        grpId:this.grp.getId()
      }
    }).bind(this)

  }

  UnsavedDoc.getFake = function(){
    var grp = CourseGroup.getFake()
    return new UnsavedDoc(new File([],'name'),grp)
  }

  UnsavedDoc.getFakeSerializable = function(){
    var grp = CourseGroup.getFake()
    var doc = new UnsavedDoc(new File([],'name'),grp)
    doc.encodedFile = 'string'
    doc.setYear(2000)
    doc.setProfId(1)
    doc.grp = CourseGroup.getFake()
    return doc
  }

return UnsavedDoc;
})
