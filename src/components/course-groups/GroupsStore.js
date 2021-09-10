define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store',
        'course/models/CourseGroup'],
function(Dispatcher,
         Store,
         CourseGroup){


   var instance = null;
   var GroupStore  = function(){

     Object.setPrototypeOf(this, new Store())
     this.dis = new Dispatcher()
     this.groupViewVisible = false
     this.courseGroups = []
     this.selectedGroup = null
     this.newsSelected = true

     this.isNewsViewVisible = function(){
       return this.newsSelected
     }


     // pre: selectedGroup is not already in the courseGroups list.
     this.onGroupJoined = (function(groupId){
       if(this.selectedGroup && this.selectedGroup.getId() == groupId){
         this.courseGroups.push(this.selectedGroup)
         this.pub()
       }
     }).bind(this)
     this.dis.reg('groupJoined',this.onGroupJoined)


     this.getSelectedGroup = function(){
       return this.selectedGroup
     }

     this.onGroupLeft = (function(groupId){
       var index = -1
       for(var i = 0; i < this.courseGroups.length; i++){
         var g = this.courseGroups[i]
         if(g.getId() == groupId){
           index = i
           break
         }
       }
       if(index >= 0) {
         this.courseGroups.splice(index, 1)
         this.pub()
       }
     }).bind(this)
     this.dis.reg('courseLeft', this.onGroupLeft)


     this.onOpenNews = (function(){
       this.groupViewVisible = false
       this.newsSelected = true
       this.pub()
     }).bind(this)
     this.dis.reg('openNews',this.onOpenNews)

     this.isGroupViewVisible = function(){
       return this.groupViewVisible
     }

     this.onGroupInfo = (function(group){
       this.selectedGroup = group
       this.groupViewVisible = true
       this.newsSelected = false
       this.pub()
     }).bind(this)
     this.dis.reg('groupInfo',this.onGroupInfo)


     this.onFocusPerson = (function(){
       this.groupViewVisible = false
       this.pub()
     }).bind(this)
     this.dis.reg('focusPerson',this.onFocusPerson)

     this.getMyCourseGroups = function(){
       return this.courseGroups
     }

     this.onMyCourseGroups = (function(groups){
       this.courseGroups = groups
       this.pub()
     }).bind(this)
     this.dis.reg('myCourseGroups',this.onMyCourseGroups)


  } // end

    return {
      getInstance:function(){
        if(!instance){
          instance = new GroupStore();
        }
        return instance;
      },
      getNew:function(){
        return new GroupStore();
      }
    }
  })
