
define(['socketio',
        'ActiveRemoteService',
        'dispatcher/Dispatcher',
        'people-models/Person',
        'people-models/Pal',
        'people-models/Classmate',
        'people-models/PersonCollection'],
function(io,
         ActiveRemoteService,
         Dispatcher,
         Person,
         Pal,
         Classmate,
         PersonCollection){

  var instance = null;

  var PeopleRemoteService = function(){

    Object.setPrototypeOf(this,new ActiveRemoteService());
    this.setMicroServer("friends");
    this.constructor = PeopleRemoteService;
    this.dis = new Dispatcher();
    this.REFRESH_RATE = 5000;

    this.getConstructorName = function(){
      return 'PeopleRemoteService';
    }

    this.init = (function(){
      this.setSock(this.onSock);
    }).bind(this)


    this.onSock = (function(){
      this.sock.on('connect',this.getPalList);
      this.sock.on('connect',this.getPalRequestList);
      this.sock.on('palList', this.onPalList);
      this.sock.on('palRequestSent',this.onPalRequestSent);
      this.sock.on('palRequestReceived',this.onPalRequestRecieved);
      this.sock.on('palRequestList',this.onPalRequestList);
      this.sock.on('palRequestAccepted', this.onPalRequestAccepted);
      this.sock.on('classList', this.onClassList);
      this.sock.on('io_error',this.onError);
    }).bind(this)


    this.onAuth = function(auth){
      if(auth && auth.state == 'authenticated'){
        this.init();
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState', this.onAuth);


    this.onError = function(err){
      console.log('Something went wrong on the relationship server.');
      alert(err);
    }
    this.onError = this.onError.bind(this);




    this.getPalList = function(){
      this.sock.emit('getPalList');
      var self = this;
      self.timerId = setTimeout(function(){
        self.getPalList();
      },self.REFRESH_RATE);
    }
    this.getPalList = this.getPalList.bind(this);



    this.onPalList = (function(pals){
      var url = this.getServerURL();
      var collection = new PersonCollection()
      pals.forEach(function(pal){
        collection.add(new Pal(pal, url))
      })
      this.dis.dispatch('palList',collection)
    }).bind(this)



    this.onGroupInfo = function(g){
      this.init();
      this.sock.emit('getClassList',g.getId());
      var self = this;
      if(typeof this.getClassTimerId == 'number'){
        clearTimeout(this.getClassTimerId);
      }
      this.getClassTimerId = setTimeout(function(){
        self.onGroupInfo(g);
      },self.REFRESH_RATE);
    }
    this.onGroupInfo = this.onGroupInfo.bind(this);
    this.onGroupInfoId = this.dis.reg('groupInfo', this.onGroupInfo);


    this.onClassList = (function(classmates){
      var collection = new PersonCollection();
      var url = this.getServerURL();
      classmates.forEach(function(classmate){
        collection.add(new Classmate(classmate, url))
      })
      this.dis.dispatch('classList',collection)
    }).bind(this);




    this.recordFriendClick = (function(p){
      this.sock.emit('recordFriendClick',this.flatten(p));
    }).bind(this)
    this.focusPersonId = this.dis.reg('focusPerson',this.recordFriendClick);


    /**
      p is an instance of Person (not a subclass)
    */
    this.onAddPal = (function(p){
      this.sock.emit('addPal', this.flatten(p));
    }).bind(this)
    this.addPalId = this.dis.reg('addPal',this.onAddPal);


    this.onPalRequestSent = function(p){
      var p = Classmate.getCopy(p)
      this.dis.dispatch('palRequestSent',p);
    }
    this.onPalRequestSent = this.onPalRequestSent.bind(this);

    this.onPalRequestRecieved = function(p){
      var pal = new Classmate(p,this.getServerURL());
      this.dis.dispatch('palRequestReceived', pal);
    }
    this.onPalRequestRecieved = this.onPalRequestRecieved.bind(this);


    this.acceptRequest = function(p){
      this.sock.emit('acceptPalRequest',p);
    }
    this.acceptRequest = this.acceptRequest.bind(this);
    this.acceptRequestId = this.dis.reg('acceptRequest',this.acceptRequest);


    this.onPalRequestAccepted = function(p){
      var host = this.getServerURL();
      var pal = new Pal(p, host);
      pal.setAsNew();
      this.dis.dispatch('palRequestAccepted',pal);
    }
    this.onPalRequestAccepted = this.onPalRequestAccepted.bind(this);



    this.getPalRequestList = function(){
      this.sock.emit('getPalRequestList');
      var self = this;
      self.palRequestTimerId = setTimeout(function(){
        self.getPalRequestList();
      }, self.REFRESH_RATE);
    }
    this.getPalRequestList = this.getPalRequestList.bind(this);


    this.onPalRequestList = function(requests){
      var people = [];
      var url = this.getServerURL();
      requests.forEach(function(person){
        var p = new Person(person,url);
        people.push(p);
      })
      this.dis.dispatch('palRequestList',people);
    }
    this.onPalRequestList = this.onPalRequestList.bind(this);

    this.onDenyRequest = function(p){
      this.sock.emit('denyRequest',p);
    }
    this.onDenyRequest = this.onDenyRequest.bind(this);
    this.denyRequestId = this.dis.reg('denyRequest',this.onDenyRequest)

  }
  return {
    getInstance:function(){
      if(!instance){
        instance = new PeopleRemoteService();
      }
      return instance;
    },
    getNew:function(){
      return new PeopleRemoteService();
    }
  };
})
