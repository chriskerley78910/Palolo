define(['abstract-interfaces/Store',
        'dispatcher/Dispatcher',
        'course-docs/models/SavedDoc',
        'course-docs/models/UnsavedDoc',
        'course-docs/DocRemoteService',
        'course-docs/models/DocumentCollection'],
function(AbstractStore,
         Dispatcher,
         SavedDoc,
         UnsavedDoc,
         DocRemoteService,
         DocCollection){

  var instance = null;

var DocStore = function(){
    this.constructor = DocStore;
    new DocRemoteService()
    Object.setPrototypeOf(this,new AbstractStore());
    this.currentGrp = null;
    this.dis = new Dispatcher();
    this.isDocsVisible = false
    this.isUploaderOpen = false
    this.unsavedDoc = null
    this.waiting = false
    this.docChanged = false
    this.lastUnsavedDoc = null
    this.docs = new DocCollection([],'http://localhost/')
    this.matchingProfs = null
    this.isUploadingAllowed = false
    this.courseAdderOpen = false
    this.joinPromptVisible = false


    this.onAddCourseAndUpload = (function(){
      this.waiting = true
      this.pub()
    }).bind(this)
    this.dis.reg('addCourseAndUpload',this.onAddCourseAndUpload)


    this.onOpenCourseAdder = (function(){
      this.courseAdderOpen = true
      this.pub()
    }).bind(this)
    this.dis.reg('openAddCourse',this.onOpenCourseAdder)

    this.isCourseAdderVisible = function(){
      return this.courseAdderOpen
    }


    this.onUploadingAllowed = (function(response){
      this.isUploadingAllowed = true
    }).bind(this)
    this.dis.reg('uploadingAllowed', this.onUploadingAllowed)

    this.isWaiting = function(){
      return this.waiting
    }

    this.docCount = function(){
      return this.docs.getSize()
    }

    this.getUnsavedDoc = function(){
      return this.unsavedDoc
    }

    this.getUnsavedDocTitle = function(){
      if(this.unsavedDoc){
        return this.unsavedDoc.getTitle()
      }
      else{
        return ''
      }
    }

    this.getGroupCourseInfo = function(){
      if(this.currentGrp){
        var dept = this.currentGrp.getDept()
        var code = this.currentGrp.getCourseCode()
        var desc = this.currentGrp.getCourseDescription()
        return dept + code + ' ' + desc
      }
    }

    this.onGrp = (function(grp){
      this.currentGrp = grp;
    }).bind(this)
    this.onGrpId = this.dis.reg('groupInfo', this.onGrp)

    this.isJoinGroupPromptVisible = function(){
      return this.joinPromptVisible
    }

    this.isCourseDocsPermitted = function(){
      return this.courseDocsPermitted
    }

    this.onJoined = (function(){
      this.courseDocsPermitted = true
      this.pub()
    }).bind(this)
    this.dis.reg('groupJoined', this.onJoined)

    this.onGroupLeft = (function(){
      this.courseDocsPermitted = false
      this.pub()
    }).bind(this)
    this.dis.reg('courseLeft', this.onGroupLeft)


    this.onShowCourseDocs = (function(featureName){
      featureName == 'noteShare' ? this.isDocsVisible = true : this.isDocsVisible = false;
      if(this.currentGrp && this.currentGrp.isMember())
        this.courseDocsPermitted = true
      else
        this.courseDocsPermitted = false
      this.pub()
    }).bind(this)
    this.showDocsId = this.dis.reg('courseFeatureSelection',this.onShowCourseDocs)



    this.isCourseDocsVisible = (function(){
      return this.isDocsVisible
    }).bind(this)


    this.onCourseDocs = (function(docs){
      this.docs = docs
      this.pub()
    }).bind(this)
    this.onDocsId = this.dis.reg('courseDocs',this.onCourseDocs)


    this.onTestDocUpload = (function(){
      this.isWaitingToLoad = true
      this.pub()
    }).bind(this)


    this.onOpenDocUploader = (function(){
      this.isUploaderOpen = true
      this.pub()
    }).bind(this)
    this.openUploaderId = this.dis.reg('openDocUploader',this.onOpenDocUploader)


    this.onCloseDocUploader = (function(){
      this.isUploaderOpen = false
      this.unsavedDoc = null
      this.pub()
    }).bind(this)
    this.closeUploaderId = this.dis.reg('closeDocUploader',this.onCloseDocUploader)

    this.onInputReset = (function(){
      this.lastUnsavedDoc = this.unsavedDoc
    }).bind(this)
    this.dis.reg('uploaderHasBeenReset',this.onInputReset)

    /**
      Only stores a reference to the
      unsaved doc if a previous doc has
      already been uploaded.
    */
    this.onDocUpload = (function(file){
      try{
        var grp = this.currentGrp
        this.lastUnsavedDoc = this.unsavedDoc
        this.unsavedDoc = new UnsavedDoc(file, grp);
        if(!this.lastUnsavedDoc)
          this.lastUnsavedDoc = this.unsavedDoc
        this.pub()
      }
      catch(err){
        console.log(err)
        alert(err.message)
      }
    }).bind(this)
    this.docUploadId = this.dis.reg('docUpload',this.onDocUpload)



    this.inputsShouldBeReset = (function(){
      return this.unsavedDoc != this.lastUnsavedDoc
    }).bind(this)



    this.onSetDocTitle = (function(title){
      if(this.unsavedDoc && this.unsavedDoc.setTitle){
        this.unsavedDoc.setTitle(title)
      }
      this.pub()
    }).bind(this)
    this.setTitleId = this.dis.reg('setDocTitle',this.onSetDocTitle)


    this.onSetDocYear = (function(year){
      this.unsavedDoc.setYear(year)
      this.pub()
    }).bind(this)
    this.setYearId = this.dis.reg('setDocYear',this.onSetDocYear)

    this.isReadyToSubmit = function(){
      return this.unsavedDoc && this.unsavedDoc.isSendable()
    }

    this.onSubmitDoc = (function(doc){
      this.waiting = true
      this.pub()
    }).bind(this)
    this.submitDocId = this.dis.reg('submitDoc',this.onSubmitDoc)


    this.onDocSubmitted = (function(){
      this.unsavedDoc = null
      this.waiting = false
      this.showSuccess()
      this.dis.dispatch('getDocs',this.currentGrp)
      this.pub()
    }).bind(this)
    this.onSubmitedId = this.dis.reg('docSubmitted',this.onDocSubmitted)

    this.isSuccessPopupVisible = function(){
      return this.isSuccessVisible
    }

    this.showSuccess = (function(){
      var self = this
      setTimeout(function(){
        self.isSuccessVisible = false
        self.pub()
      },2000)
      this.isSuccessVisible = true
    }).bind(this)

    this.getCurrentDocs = function(){
      return this.docs
    }


    this.onOpenDoc = (function(doc){
      window.open(doc.getFileURL(), '_blank', 'location=yes');
    }).bind(this)
    this.dis.reg('openDoc',this.onOpenDoc)


    this.onMatchingProfs = (function(profs){
      this.matchingProfs = profs
      this.pub()
    }).bind(this)
    this.matchingProfsId = this.dis.reg('matchingProfs',this.onMatchingProfs)


    this.onSelectedProf = (function(p){
      this.unsavedDoc.setProfId(p.getId())
      this.matchingProfs = []
      this.pub()
    }).bind(this)
    this.selectedProfId = this.dis.reg('selectedProf',this.onSelectedProf)

}

return {
  getInstance:function(){
    if(!instance){
      instance = new DocStore()
    }
    return instance;
  },
  getNew:function(){
    return new DocStore();
  }
};
})
