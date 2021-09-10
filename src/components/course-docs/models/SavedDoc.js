define(['course-docs/models/Doc',
        'people-models/Person'],
function(Doc,
         Person){
  var SavedDoc = function(rawDoc, host){

    Object.setPrototypeOf(this, new Doc(rawDoc))

    this.setId = (function(id){
      this.validateId(id)
      this.docId = id
    }).bind(this)
    this.setId(rawDoc.doc_id)

    this.getId = function(){
      return this.docId
    }

    this.setProfId = function(id){
      this.validateId(id)
      this.id = id
    }
    this.setProfId(rawDoc.id)

    this.getProfId = function(){
      return this.id
    }

    this.getCourseId = function(){
      return this.courseId
    }

    this.setCourseId = function(id){
      this.validateId(id)
      this.courseId = id
    }
    this.setCourseId(rawDoc.course_id)

    this.isLocked = function(){
      return this.locked
    }

    this.setLocked = function(locked){
      this.validateBool(locked);
      this.locked = locked == 1 ? true : false;
    }
    this.setLocked(rawDoc.locked)



    this.getFileURL = function(){
      return this.host + '/' + this.fileURL
    }

    this.setFileURL = function(url){
      if(!this.isLocked()){
        this.validateStr(url)
        this.fileURL = url
      }
    }
    this.setFileURL(rawDoc.file_url)

    this.getHost = function(){
      return this.host
    }

    this.setHost = function(host){
      this.validateStr(host)
      this.host = host
    }
    this.setHost(host)

    this.getLastOpened = function(){
      if(this.lastOpened){
        var format = {month:'long', year:'numeric', day:'numeric'}
        return this.lastOpened.toLocaleString('en-us',format)
      }
      else{
        return 'never'
      }
    }

    this.setLastOpened = function(date){
      if(!date){
        this.lastOpened = null
      }
      else{
      this.lastOpened = new Date(date)
      }
    }
    this.setLastOpened(rawDoc.last_opened)

    this.setTitle(rawDoc.title)
    this.setTopics(rawDoc.topics)
    this.setYear(rawDoc.year)
  }

  SavedDoc.getRaw = function(){
    var o1 = {
      doc_id:1,
      title:'Midterm',
      year:2020,
      course_id:5,
      file_url:'s.pdf',
      last_opened:'2020-04-05T17:35:15.000Z',
      locked:0,
    }
    var o2 = Object.assign(o1, Person.getRaw())
    return o2;
  }

  SavedDoc.getFake = function(){
    var raw = SavedDoc.getRaw()
    return new SavedDoc(raw, 'fakehost')
  }

return SavedDoc;
})
