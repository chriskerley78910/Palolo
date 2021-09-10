define(['ActiveRemoteService',
        'format-converter',
        'dispatcher/Dispatcher',
        'course-docs/models/SavedDoc',
        'course-docs/models/DocumentCollection',
        'course/models/CourseGroup',
        'people-models/Prof'],
function(ActiveRemoteService,
        FormatConverter,
        Dispatcher,
        SavedDoc,
        DocCollection,
        CourseGroup,
        Prof){


var CourseRemote = function(){

    this.constructor = CourseRemote;
    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("tests");
    this.dis = new Dispatcher()


    this.getDocs = (function(grp){
      this.isAdmin()
      if(!grp.isGroup || !grp.isGroup()){
        throw new Error('Can only get docs for a group.')
      }
      var url = this.getServerURL() + '/grp/' + grp.getId() + '/course-docs';
      $.ajax({
        url:url,
        type:'get',
        beforeSend:this.setAuthorizationHeader,
        success:this.onDocs,
        error:this.onError
      });
    }).bind(this)
    this.onGrpId = this.dis.reg('groupInfo',this.getDocs)
    this.onGetDocs = this.dis.reg('getDocs',this.getDocs)

    this.isAdmin = (function(){
      var url = this.getServerURL() + '/course-docs/uploader'
      var self = this
      $.ajax({
        url:url,
        type:'get',
        beforeSend:this.setAuthorizationHeader,
        success:function(response){
          var allowed = false
          if(response == 'true')
            allowed = true
          self.dis.dispatch('uploadingAllowed',allowed)
        },
        error:this.onError
      });
    }).bind(this)


    this.onDocs = function(json){
      try{
        var rawDocs = JSON.parse(json)
        var host = this.getServerURL()
        var docs = new DocCollection(rawDocs, host)
        this.dis.dispatch('courseDocs',docs)
      }
      catch(err){
        console.log(err)
        if(/in JSON at position/.test(err.message)){
          throw Error('malformed json string')
        }
      }
    }
    this.onDocs = this.onDocs.bind(this)

    this.addCourseAndUpload = (function(doc){
      var url = this.getServerURL() + '/course-docs/addCourseAndUpload'
      var self = this
      $.ajax({
        url:url,
        type:'post',
        data:{json:JSON.stringify(doc.serialize())},
        beforeSend:self.setAuthorizationHeader,
        success:self.onDocSubmitted,
        error:self.onError
      });
    }).bind(this)

    this.onSubmitDoc = (function(unsavedDoc){
      var url = this.getServerURL() + '/course-docs/upload'
      var self = this
      unsavedDoc.encodeFile(function(){
        $.ajax({
          url:url,
          type:'post',
          data:{json:JSON.stringify(unsavedDoc.serialize())},
          beforeSend:self.setAuthorizationHeader,
          success:self.onDocSubmitted,
          error:self.onError
        });
      })
    }).bind(this)
    this.submitDocId = this.dis.reg('submitDoc',this.onSubmitDoc)




    this.onDocSubmitted = (function(res){
      if(/no record/.test(res))
        this.dis.dispatch('openAddCourse')
      else
         this.dis.dispatch('docSubmitted',res)
    }).bind(this)


    this.onError = (function(err){
      console.log(err)
      alert(err.responseText)
    }).bind(this)

    this.recordDocDownload = (function(doc){
      var url = this.getServerURL() + '/course-docs/docDownloaded';
      $.ajax({
        url:url,
        type:'post',
        data:{docId:doc.getId()},
        beforeSend:this.setAuthorizationHeader,
        success:function(){},
        error:this.onError
      });
    }).bind(this)
    this.recordDownloadId = this.dis.reg('openDoc',this.recordDocDownload)

    this.getMatchingProfs = (function(name){
      var url = this.getServerURL() + '/course-docs/profs?name=' + name
      $.ajax({
        url:url,
        type:'get',
        beforeSend:this.setAuthorizationHeader,
        success:this.onMatchingProfs,
        error:this.onError
      });
    }).bind(this)
    this.getMatchingProfsId = this.dis.reg('getMatchingProfs',this.getMatchingProfs)


    this.onMatchingProfs = (function(matches){
      var profs = []
      var host = this.getServerURL()
      for(var i = 0; i < matches.length; i++){
        var data = matches[i]
        var prof = new Prof(data,host,SavedDoc)
        profs.push(prof)
      }
      this.dis.dispatch('matchingProfs',profs)
    }).bind(this)

    //
    //
    // this.registerOnRole = function(callback){
    //   this._checkType(callback);
    //   this.onRoleReceived = callback;
    // }
    //
    //
    // this.getRole = function(){
    //   var url = this.getServerURL() + '/getRole';
    //   $.ajax({
    //     url:url,
    //     type:'GET',
    //     beforeSend:this.setAuthorizationHeader,
    //     success:this.onRoleReceived,
    //     error:function(a,b,err){
    //       console.log(err);
    //     }
    //   });
    // }
    //
    // this.registerOnPractiseTestsRecieved = function(callback){
    //   this._checkType(callback);
    //   this.onPractiseTestsRecieved = callback;
    // }
    //
    // this.registerOnPractiseRetrievalError = function(callback){
    //   this._checkType(callback);
    //   this.onTestRetrievalError = callback;
    // }
    //
    // this.getPractiseTests = function(groupId){
    //
    //   var url = this.getServerURL() + '/' + groupId + '/practice_tests';
    //   $.ajax({
    //     url:url,
    //     type:'get',
    //     beforeSend:this.setAuthorizationHeader,
    //     success:this.onPractiseTestsRecieved,
    //     error:this.onTestRetrievalError
    //   });
    // }
    //
    // this.registerOnTestCollectionChanged = function(callback){
    //   this._checkType(callback);
    //   this.onTestCollectionChanged = callback;
    // }
    //
    // this.registerOnTestUploadError = function(callback){
    //   this._checkType(callback);
    //   this.onTestUploadError = callback;
    // }
    //
    // this.saveFile = function(base64, courseId, testName, year){
    //   if(!courseId || isNaN(courseId)){
    //     throw new Error('courseId must be a parameter to save a Test File.');
    //   }
    //   if(!testName || typeof testName != 'string' || testName.length < 1){
    //     throw new Error('testName must be a string and included as a parameter.');
    //   }
    //   if(!year || typeof year != 'number' || year < 1900){
    //     throw new Error('year must be a number and included as a parameter.');
    //   }
    //   var url = this.getServerURL() + '/test_upload/' + courseId + '/' + year;
    //   var formData = new FormData();
    //   var blob = FormatConverter.base64ToBlob(base64);
    //   formData.append(testName, blob);
    //   $.ajax({
    //     url:url,
    //     type:'POST',
    //     data:formData,
    //     contentType:false,
    //     processData:false,
    //     beforeSend:this.setAuthorizationHeader,
    //     success:this.onTestCollectionChanged,
    //     error:this.onTestUploadError
    //   });
    // }
    //
    //
    // this.onCoursePhotoUploaded = function(result){
    //   console.log(result)
    // }
    //
    //
    // this.recordTestDownload = function(testId){
    //
    //   var url = this.getServerURL() + '/practice_tests/' + testId + "/recordDownload";
    //   $.ajax({
    //     url:url,
    //     type:'POST',
    //     beforeSend:this.setAuthorizationHeader,
    //     success:function(){
    //
    //     },
    //     error:function(a,b,err){
    //       console.log(err);
    //     }
    //   })
    // }
    //
    //
    // this.deleteTest = function(testId){
    //   var url = this.getServerURL() + '/practice_tests/' + testId;
    //   $.ajax({
    //     url:url,
    //     type:'DELETE',
    //     beforeSend:this.setAuthorizationHeader,
    //     success:this.onTestCollectionChanged,
    //     error:function(a,b,err){
    //       console.log(err);
    //     }
    //   })
    // }
    //
    // this._checkType = function(callback){
    //   if(typeof callback != 'function'){
    //     throw new Error('callback must be a function.');
    //   }
    // }
}

return CourseRemote;
})
