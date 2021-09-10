define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store',
        'people-store/PeopleRemoteService',
        'people-models/Pal',
        'people-models/NullPerson',
        'people-models/PendingPal',
        'people-models/PersonCollection'],
function(Dispatcher,
        Store,
        PeopleRemoteService,
        Pal,
        NullPerson,
        PendingPal,
        PersonCollection){

   var instance = null;

   var PeopleStore  = function(){

     Object.setPrototypeOf(this, new Store());
     this.dis = new Dispatcher();
     this.remote = PeopleRemoteService.getInstance();
     this.newPalList = new PersonCollection()
     this.palList = new PersonCollection();
     this.palRequests = [];
     this.classList = new PersonCollection();
     this.classListVisible = false;
     this.focusedPerson = new NullPerson();
     this.isPalRequestSentVisible = false;
     this.lastPalRequested = null;
     this.spinnerOn = true




     this.onAddPal = (function(){
       this.focusedPerson = PendingPal.build(this.focusedPerson)
       this.showPalRequestSent()
       this.pub()
     }).bind(this)
     this.addPalId = this.dis.reg('addPal',this.onAddPal)


     this.getFocusedPerson = function(){
       return this.focusedPerson
     }

     this.getPalCount = function(){
       return this.palList.getSize()
     }

     this.getDis = function(){
       return this.dis;
     }

     this.getPalList = function(){
       return this.palList.getOldPals()
     }

     this.getClassList = function(){
       return this.classList;
     }

     this.getPalRequests = function(){
       return this.palRequests;
     }

     this.onPalList = (function(list){
       if(!list || !list.isCollection || !list.isCollection())
        throw new Error('Expected a collection instance.')
       this.palList = list
       this.updateFocusedPerson()
       this.spinnerOn = false
       this.pub();
     }).bind(this)
     this.onPalsId = this.dis.reg('palList',this.onPalList);


     this.isSpinnerVisible = function(){
       return this.spinnerOn
     }


     this.getNewPals = function(){
       return this.palList.getNewPals()
     }

     // if the state of the focused person has changed
     // then it is updated.
     this.updateFocusedPerson = (function(){
       var old = this.getFocusedPerson()
       var fresh = this.palList.getPersonById(old.getId())
       if(fresh && old.isPresent() != fresh.isPresent()){
            this.focusedPerson = fresh
            this.dis.dispatch('updateFocusPerson', this.focusedPerson)
       }
     }).bind(this)


     this.onClassList = (function(collection){
       this.palList.toArray().forEach(function(pal){
         collection.applyToMatch(pal,function(match){
           match.setAddable(false)  // already a friend.
         })
       })
       this.classList.duplicate(collection);
       this.pub();
     }).bind(this);
     this.onClassListId = this.dis.reg('classList', this.onClassList);

     this.isClassListVisible = (function(){
       return this.classListVisible;
     }).bind(this)

     this.setFocusedPerson = function(p){
       this.focusedPerson = p
     }

     this.onFocusPerson = (function(p){
       this.focusedPerson = p;
       this.onAcknowledgeNewPal(p);
       this.pub();
     }).bind(this)
     this.onFocusPersonId = this.dis.reg('focusPerson', this.onFocusPerson);



     this.onAcknowledgeNewPal = (function(p){
       if(p.constructor.name == 'Pal'){
         this.palList.applyToMatch(p, function(match){
           match.setAsOld();
         })
       }
     }).bind(this)


     this.getFocusedPerson = function(){
       return this.focusedPerson;
     }

     this.onShowClassList = (function(featureName){
       featureName == 'classList' ? this.classListVisible = true : this.classListVisible = false;
       this.pub();
     }).bind(this)
     this.showClassListId = this.dis.reg('courseFeatureSelection',this.onShowClassList);

     this.onHideClassList = (function(){
       this.classListVisible = false;
       this.pub();
     }).bind(this)
    this.hideClassListId = this.dis.reg('hideClassList',this.onHideClassList);


    this.onGrpInfo = (function(grp){
      if(grp.getId() != this.currentGrpId) this.setNoPerson()
    }).bind(this)
    this.onGrpInfoId = this.dis.reg('groupInfo',this.onGrpInfo);


    this.setNoPerson = (function(){
      this.focusedPerson = new NullPerson();
      this.pub();
    }).bind(this)
    this.dis.reg('openNews',this.setNoPerson)


    this.onShowGroupView = (function(){
      this.focusedPerson = new NullPerson();
      this.pub();
    }).bind(this)
    this.showGroupId = this.dis.reg('showGroupView', this.onShowGroupView);


    this.isPalRequestSent = (function(){
      return this.isPalRequestSentVisible;
    }).bind(this)


    this.lastPalRequestPal = (function(){
      return this.lastPalRequested;
    }).bind(this)

    /**

    */
    this.onPalRequestSent = (function(pal){
      this.lastPalRequested = pal;
      this.classList.remove(pal);
      if(this.focusedPerson.getId() == pal.getId())
        this.focusedPerson = PendingPal.build(this.focusedPerson)
      this.showPalRequestSent()
      this.pub();
    }).bind(this)
    this.palRequestSentId = this.dis.reg('palRequestSent',this.onPalRequestSent);

    this.showPalRequestSent = (function(){
      var self = this;
      this.isPalRequestSentVisible = true;
      this.timerId = setTimeout(function(){
        self.isPalRequestSentVisible = false;
        self.pub();
      },3000);
    }).bind(this)

    this.onPalRequestReceived = (function(p){
      this.palRequests.push(p);
      this.pub();
    }).bind(this)
    this.palRequestReceivedId = this.dis.reg('palRequestReceived', this.onPalRequestReceived);


    this.onPalRequestAccepted = (function(p){
      this.palList.add(p);
      this.pub();
    }).bind(this)
    this.onRequestAcceptedId = this.dis.reg('palRequestAccepted', this.onPalRequestAccepted);

    this.getPalRequestList = function(){
      return this.palRequests;
    }

    this.addPal = function(p){
      if(p instanceof Pal)
        this.palList.push(p);
    }
    this.addPal = this.addPal;

    this.onPalRequestList = function(palRequests){
      this.palRequests = palRequests;
      this.pub();
    }
    this.onPalRequestList = this.onPalRequestList.bind(this);
    this.dis.reg('palRequestList', this.onPalRequestList);

    this.onAcceptRequest = function(p){
      var index = this.findPalRequest(p);
      if(index >= 0){
        var removedPerson = this.palRequests.splice(index,1);
        this.palList.add(removedPerson);
        this.pub();
      }
    }
    this.onAcceptRequest = this.onAcceptRequest.bind(this);
    this.acceptRequestId = this.dis.reg('acceptRequest',this.onAcceptRequest);


    /**
      removes person p from the palRequests list
      (if they are in the list.)
    */
    this.onDenyRequest = function(p){
      var index = this.findPalRequest(p)
      if(index >= 0){
        this.palRequests.splice(index, 1)
        this.pub()
      }
    }
    this.onDenyRequest = this.onDenyRequest.bind(this);
    this.denyRequestId = this.dis.reg('denyRequest',this.onDenyRequest)


    this.findPalRequest = function(p){
      var r = this.palRequests
      var index = -1
      for(var i = 0; i < r.length; i++){
        if(r[i].getId() == p.getId()){
          index = i
          break
        }
      }
      return index;
    }
    this.findPalRequest = this.findPalRequest.bind(this);




  } // end





   // this.onCourseGroupInfoCallbackId = this.dis.reg('groupInfo', this.onCourseGroupInfo);



    return {
      getInstance:function(){
        if(!instance){
          instance = new PeopleStore();
        }
        return instance;
      },
      getNew:function(){
        return new PeopleStore();
      }
    }
  })
