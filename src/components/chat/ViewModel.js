/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */

define(['ko',
        'socketio',
        'text-utilities',
        'text!chat/template.html',
        'chat/models/ChatMessage',
        'chat/models/OutboundChatMessage',
        'chat/ChatRemoteService',
        'dispatcher/Dispatcher'],

function(ko,
         io,
         TextUtilities,
         template,
         ChatMessage,
         OutboundChatMessage,
         ChatRemoteService,
         Dispatcher){


  function ViewModel(params,componentInfo){

    this.dis = new Dispatcher();
    this.selectedClassmateId = ko.observable(null);
    this.inputHasFocus = ko.observable(false).extend({notify: 'always'});
    this.placeholder = ko.observable('');
    this.messages = ko.observableArray([]);
    this.showSendMsgPrompt = ko.observable(false);
    this.newMessage = ko.observable('');
    this.isValidInput = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.friendTyping = ko.observable(false);
    this.remoteService = new ChatRemoteService();
    this._messageSentHideDelay = 5000;
    this.chatBoxHeight = ko.observable(1)


    this.onClassmateSelected = (function(classmate){
      if(!classmate || typeof classmate != 'object'){
        throw new Error('Classmate must be an object.');
      }
      this.selectedClassmateId(classmate.getId());
      this.refreshChat();
    }).bind(this)
    this.dis.reg('focusPerson',this.onClassmateSelected);

    this.isVisible = ko.computed(function(){
        return this.selectedClassmateId() > 0 && this.selectedClassmateId() != null;
    },this);

    this.possiblyScaleInputBox = (function(){
      var rows = this.newMessage().split(/\r\n|\r|\n/).length
      $('#chat-text-area').attr('rows',rows)
    }).bind(this)


    this.onKeyPress = (function(vm, event){
      event.send = this.send;
      this.possiblyScaleInputBox()
      return TextUtilities.onKeyPress(event);
    }).bind(this)

    this.validateTextInput = function(value){
      /[^\s]+/.test(value) ? this.isValidInput(true) : this.isValidInput(false);
    }
    this.validateTextInput = this.validateTextInput.bind(this);
    this.newMessage.subscribe(this.validateTextInput,this);

    this.recordPartialText = function(text){
      var classmateId = this.selectedClassmateId();
      if(isNaN(classmateId) || classmateId < 1){
        throw new Error('classmateId must be a postive integer.');
      }
      else if(typeof text == 'string' && text.length > 0){
        this.dis.dispatch('typing',{recipient_id: classmateId, text:text});
      }
    }
    this.recordPartialText = this.recordPartialText.bind(this);
    this.typingSub = this.newMessage.subscribe(this.recordPartialText,this);


    this.setNoPersonSelected = (function(){
      this.selectedClassmateId(null);
    }).bind(this)
    this.dis.reg('groupInfo',this.setNoPersonSelected);
    this.dis.reg('openNews', this.setNoPersonSelected)

    this.onMessageHistory = function(msgs){
      if(!Array.isArray(msgs)){
        throw new Error('msgs must be an array.');
      }
      this.isSpinnerVisible(false);
      if(msgs.length <= 0){
        this.attachSendMessagePrompt();
      }
      else{
        this.showSendMsgPrompt(false);
        for(var i = 0; i < msgs.length; i++){
          var classmateId = this.selectedClassmateId();
          var senderId = msgs[i].getSenderId();
          var owner = msgs[i].isOwner();
          if(classmateId == senderId || owner){
              this.messages.unshift(msgs[i]);
          }
        }
      }
    }
    this.onMessageHistory = this.onMessageHistory.bind(this);
    this.dis.reg('chatHistory', this.onMessageHistory);


    /**
     * Shows the "Send a message to X" prompt
     * because there currently is no chat
     * history for the given friend.
     */
    this.attachSendMessagePrompt = function(){
      this.showSendMsgPrompt(true);
    }
    this.attachSendMessagePrompt = this.attachSendMessagePrompt.bind(this);

    this.initialize = ko.computed(function(){
      var friendId = this.selectedClassmateId();
      return friendId;
    },this);

    this.clearChat = function(){
        this.messages([]);
        this.friendTyping(false);
    }

    this.updateTextInputPlaceHolder = function(classmate){
      this.placeholder("What would you like to say to " + classmate.getFirst() + "?");
    }
    this.updateTextInputPlaceHolder = this.updateTextInputPlaceHolder.bind(this);
    this.dis.reg('selectedClassmate', this.updateTextInputPlaceHolder);



    this.oldFriendId = null;

    this.refreshChat = function(){
        var friendId = this.selectedClassmateId();
        if(friendId < 1){
          return; // no friend selected.
        }
        if(this.oldFriendId){
          this.clearChat();
        }
        this.isSpinnerVisible(true);
        this.oldFriendId = friendId;
        this.newMessage('');
        this.dis.dispatch('getChatHistory',friendId)
    }
    this.refreshChat = this.refreshChat.bind(this);

    this.inputClicked = function(){
      this.inputHasFocus(true);
    }


    /**
     * adds the message to the display and sends it
        because there is a noticable lag before the
        server response. (sent!) gets shown when the serve responds.
     */
    this.send = function(){
      var r = this.selectedClassmateId();
      var text = TextUtilities.formatToHTML(this.newMessage());
      var host = this.remoteService.getServerURL()
      var obj = {
        text:text,
        small_photo_url:'img',
        recipient_id:r
      }
      var m = new OutboundChatMessage(obj,host);
      this.messages.unshift(m);
      m.text = Object.getPrototypeOf(m).text;
      this.dis.dispatch('sendMessage', m);
      this.newMessage('');
    }
    this.send = this.send.bind(this);



    /**
      Finds the matching message
      and set it to 'sent'.
    */
    this.onMessageSent = function(acknowledgement){
      var token = acknowledgement.token;
      this.messages().forEach(function(m){
        if(m.getConstructorName() == 'OutboundChatMessage' && token == m.getToken()){
            m.setSent(token);
            m.setId(acknowledgement.id);
        }
      })
      this.possiblyScaleInputBox()
    }
    this.onMessageSent = this.onMessageSent.bind(this);
    this.dis.reg('messageSent', this.onMessageSent);


    this.onMessagesSeen = function(messageIds){
      this.messages().forEach(function(m){
        if(m.getConstructorName() == 'OutboundChatMessage'){
          messageIds.forEach(function(id){
              m.setSeen(id);
          })
        }
      })
    }
    this.onMessagesSeen = this.onMessagesSeen.bind(this);
    this.seenId = this.dis.reg('seen', this.onMessagesSeen);


    this.onTyping = function(id){
      if(id == this.selectedClassmateId()){
        this.friendTyping(true);
        var self = this;
        if(self.onTypingId){
          clearTimeout(self.onTypingId);
        }
        self.onTypingId = setTimeout(function(){
          self.friendTyping(false);
        },3000);
      }
    }
    this.onTyping = this.onTyping.bind(this);
    this.dis.reg('friendTyping',this.onTyping);

    this.onMessage = function(message){
        var classmateId = this.selectedClassmateId();
        if(message.getSenderId() === classmateId){
          this.messages.unshift(message);
          this.showSendMsgPrompt(false);
          this.friendTyping(false);
          this.dis.dispatch('messageSeen', message);
        }
    }
    this.onMessage = this.onMessage.bind(this);
    this.disChatId = this.dis.reg('message', this.onMessage);

}; // end view model.

  return {
    viewModel: ViewModel,
    template: template
  }

});
