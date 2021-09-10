define(['ko',
         'ad-views/AdRemoteService',
         'dispatcher/Dispatcher',
         'ad-views/NullAd',
         'ad-views/Ad'],
function(
  ko,
  RemoteService,
  Dispatcher,
  NullAd,
  Ad
){


  var Store = {};
  var _currentAd = new NullAd();
  var _subscribers = [];

  var _remoteService = new RemoteService();
  var _isWaiting = false;
  var _dis = new Dispatcher();
  var _isAdVisible = true;
  var _isLeadOpen = false;
  var _leadMessage = 'Hi, I’m interested. Please contact me.';
  var _onPub = null;


  var _publish = function(){
    _subscribers.forEach(function(e){
      e();
    })
    if(typeof _onPub == 'function'){
      _onPub();
    }
  }

  Store.onPub = function(fn){
    _onPub = fn;
  }

  Store.getCurrentAd = function(){
    return _currentAd;
  }

  Store.setCurrentAd = function(ad){
    if(ad.getConstructorName() != 'Ad'){
      throw new Error('error');
    }
    _currentAd = ad;
  }


  Store.isAdVisible = function(){
    return _isAdVisible;
  }

  Store.setAdVisible = function(){
    _isAdVisible = true;
  }

  Store.setAdNotVisible = function(){
    _isAdVisible = false;
  }

  Store.onOpenGroupView = function(){
     Store.setAdVisible();
    _publish();
  }
  _dis.reg('showGroupView',Store.onOpenGroupView);



  Store.onGiveClassmateFocus = function(){
    Store.setAdNotVisible();
    _publish();
  }
  Store.classmateId = _dis.reg('focusPerson', Store.onGiveClassmateFocus);


  Store.init = function(){
    _remoteService.registerOnAdReceived(Store.onAdReceived);
    _remoteService.registerOnMessageSent(Store.onMessageSent);
  }

  Store.onAdReceived = function(rawAd){
    _currentAd = new Ad(rawAd);
    _currentAd.setServerPrefix(_remoteService.getServerURL());
    Store.publish();
  }

  Store.onMessageSent = function(){
    _isWaiting = false;
    Store.publish();
  }

  Store.getLeadMessage = function(){
    return _leadMessage;
  }

  Store.onCourseInfo = function(groupInfo){
    _remoteService.getAdFromServer();
  }
  _dis.reg('groupInfo', Store.onCourseInfo);

  Store.isWaiting = function(){
    return _isWaiting;
  }

  Store.isLeadOpen = function(){
    return _isLeadOpen;
  }

  Store.onOpenLead = function(){
    _isLeadOpen = true;
    Store.publish();
    _remoteService.recordLeadClick(_currentAd);
  }
  _dis.reg('openLead', Store.onOpenLead);


  Store.onCloseLead = function(){
    _isLeadOpen = false;
    Store.publish();
  }
  _dis.reg('closeLead', Store.onCloseLead);

  Store.onMessage = function(msg){
    _remoteService.sendMessage({
      ad:_currentAd,
      message:msg
    });
    _isWaiting = true;
    Store.publish();
  }
  _dis.reg('leadMessage', Store.onMessage);

  Store.subscribe = function(fn){
    _subscribers.push(fn);
  }

  Store.publish = function(){
    _subscribers.forEach(function(fn){
      fn();
    })
    if(typeof _onPub == 'function'){
      _onPub();
    }
  }

  Store.getRemoteService = function(){
    return _remoteService;
  }

  Store.init();
  return Store;
});
