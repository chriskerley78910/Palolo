define(['ActiveRemoteService',
        'socketio',
        'dispatcher/Dispatcher',
        'jquery'],
function(ActiveRemoteService,
         io,
         Dispatcher,
         $){


  var AdRemoteService = function(data){
    this._io = io;
    this.dis = new Dispatcher();
    this.constructor = AdRemoteService;
    Object.setPrototypeOf(this, new ActiveRemoteService());
    this.setMicroServer("ads");


    this.registerOnAdReceived = function(fn){
      this.checkFunction(fn);
      this.onAdReceived = fn;
    }

    this.getAdFromServer = function(){
      var url = this.getServerURL() + '/ad';
      var self = this;
      $.ajax({
        url:url,
        type:'GET',
        beforeSend:this.setAuthorizationHeader,
        success:function(json){
          self.onAdReceived(JSON.parse(json));
        },
        error:function(a,b,err){
          console.log(err);
        }
      });
    }


    this.registerOnMessageSent = function(fn){
      this.checkFunction(fn);
      this.onMessageSent = fn;
    }



    this.onAdHovered = function(ad){
      var url = this.getServerURL() + '/adHovered';
      $.ajax({
        url:url,
        type:'POST',
        data:{adId:ad.getId()},
        beforeSend:this.setAuthorizationHeader,
        error:function(a,b,err){
          console.log(err);
        }
      });
    }
    this.onAdHovered = this.onAdHovered.bind(this);
    this.adHoveredId = this.dis.reg('adHovered', this.onAdHovered);



    this.recordLeadClick = function(ad){
      var url = this.getServerURL() + '/adClicked';
      $.ajax({
        url:url,
        type:'POST',
        data:{adId:ad.getId()},
        beforeSend:this.setAuthorizationHeader,
        error:function(a,b,err){
          console.log(err);
        }
      });
    }


    this.sendMessage = function(adMsgPair){
      var url = this.getServerURL() + '/message';
      var ad = adMsgPair.ad;
      var msg = adMsgPair.message;
      $.ajax({
        url:url,
        type:'POST',
        data:{
          adId:ad.getId(),
          message:msg,
          headline:ad.getHeadline()
        },
        beforeSend:this.setAuthorizationHeader,
        success:this.onMessageSent,
        error:function(a,b,err){
          console.log(err);
        }
      });
    }


    this.checkFunction = function(fn){
      if(typeof fn != 'function'){
        throw new Error('fn must be a function');
      }
    }

  } // end constructor.

  return AdRemoteService;

})
