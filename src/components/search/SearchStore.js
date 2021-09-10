define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store',
        'search/SearchRemoteService',
        'people-models/PersonCollection'],
function(Dispatcher,
         Store,
         SearchRemoteService,
         PersonCollection){

   var instance = null;
   var SearchStore  = function(){

     new SearchRemoteService()

     Object.setPrototypeOf(this, new Store());
     this.dis = new Dispatcher();
     this.visible = false
     this.peopleFound = new PersonCollection()
     this.currentGroup = null
     this.coursesFound = []

     this.onClearResults = (function(){
       this.coursesFound = []
       this.peopleFound = new PersonCollection()
       this.pub()
     }).bind(this)
     this.dis.reg('clearResults',this.onClearResults)

     this.getCoursesFound = function(){
       return this.coursesFound
     }

     this.onCoursesFound = (function(courses){
       this.coursesFound = courses
       this.pub()
     }).bind(this)
     this.dis.reg('coursesFound',this.onCoursesFound)


     this.getCurrentGroupId = function(){
       if(this.currentGroup)
          return this.currentGroup.getId()
        else
          return null
     }

     this.onCourseGroup = (function(g){
       if(g && g.isGroup && g.isGroup())
          this.currentGroup = g
     }).bind(this)
     this.dis.reg('groupInfo',this.onCourseGroup)

     this.onFocusPerson = (function(){
       this.currentGroup = null
       this.pub()
     }).bind(this)
     this.dis.reg('focusPerson',this.onFocusPerson)

     this.onClearPeopleFound = (function(){
       this.peopleFound = null
       this.pub()
     }).bind(this)
     this.clearPeopleId = this.dis.reg('clearPeopleFound',this.onClearPeopleFound)

     this.onPeopleFound = (function(people){
       this.peopleFound = people
       this.pub()
     }).bind(this)
     this.peopleFoundId = this.dis.reg('peopleFound',this.onPeopleFound)

     this.getPeopleFound = function(){
       if(this.peopleFound){
         return this.peopleFound.toArray()
       }
       else
          return []
     }


     this.isVisible = function(){
       return this.visible
     }

     this.setVisible = function(){
       this.visible = true
     }

     this.onAuth = (function(u){
      u.state == 'authenticated' ? this.visible = true : this.visible = false
      this.pub()
    }).bind(this)
     this.dis.reg('authState', this.onAuth);

  } // end

    return {
      getInstance:function(){
        if(!instance){
          instance = new SearchStore();
        }
        return instance;
      },
      getNew:function(){
        return new SearchStore();
      }
    }
  })
