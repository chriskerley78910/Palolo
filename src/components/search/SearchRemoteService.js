define(['ActiveRemoteService',
        'dispatcher/Dispatcher',
        'people-models/PersonCollection',
        'people-models/Person',
        'people-models/Stranger'],
function(ActiveRemoteService,
        Dispatcher,
        PersonCollection,
        Person,
        Stranger){


var SearchRemoteService = function(){

    this.constructor = SearchRemoteService;
    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("search");
    this.dis = new Dispatcher()

    this.onSelectedGroupId = (function(grpId){
      var url = this.getServerURL() + '/selectedCourse'
      $.ajax({
        url:url,
        type:'post',
        data:{
          courseId:grpId
        },
        beforeSend:this.setAuthorizationHeader,
        success:function(){
          console.log('updated course.')
        },
        error:this.onError
      })
    }).bind(this)
    this.dis.reg('selectedGroupId', this.onSelectedGroupId)

    this.onQueryCourse = (function(queryObj){
      var course = queryObj.query
      var grpId = queryObj.grpId
      var url = this.getServerURL() + '/queryCourse?query=' + course + '&grpId=' + grpId
      $.ajax({
        url:url,
        type:'get',
        beforeSend:this.setAuthorizationHeader,
        success:this.onCoursesFound,
        error:this.onError
      })
    }).bind(this)
    this.queryCourseId = this.dis.reg('queryCourse',this.onQueryCourse)


    this.onCoursesFound = (function(courses){
      this.dis.dispatch('coursesFound', courses)
    }).bind(this)

    this.onQueryName = (function(name){
      var url = this.getServerURL() + '/queryName?query=' + name
      $.ajax({
        url:url,
        type:'get',
        beforeSend:this.setAuthorizationHeader,
        success:this.onPeopleFound,
        error:this.onError
      })
    }).bind(this)
    this.queryNameId = this.dis.reg('queryName',this.onQueryName)


    /**
      pre: None of the people are already pals.
    */
    this.onPeopleFound = (function(people){
      var c = new PersonCollection()
      var host = this.getServerURL()
      for(var i = 0; i < people.length; i++){
        var p = new Stranger(people[i],host)
        c.add(p)
      }
      this.dis.dispatch('peopleFound',c)
    }).bind(this)



    this.onError = (function(err){
      console.log(err)
      alert('Sorry this feature is not working at the moment.')
    }).bind(this)

}

return SearchRemoteService;
})
