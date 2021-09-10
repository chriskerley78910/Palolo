define([
'ko',
'text-utilities',
'text!forum/template.html',
'dispatcher/Dispatcher',
'course/models/ForumMessage',
'course/CourseStore'],
function(
  ko,
  TextUtilities,
  template,
  Dispatcher,
  ForumMessage,
  CourseStore){

  function ForumViewModel(){

    this.dis = new Dispatcher();
    this.store = CourseStore.getInstance();
    this.messages = ko.observableArray([]);
    this.newMessage = ko.observable('');
    this.isVisible = ko.observable(false);
    this.isSpinnerVisible = ko.observable(false);
    this.inputHasFocus = ko.observable(false);
    this.isNewFeatureVisible = ko.observable(false);
    this.isSendingMessageVisible = ko.observable(false);
    this.showSent = ko.observable(false);
    this.hasBeenInitialized = false;
    this.groupName = ko.observable('')


    this.onStoreChanged = (function(){
      var group = this.store.getGroupInfo();
      if(!group || !group.isGroup || !group.isGroup()){
        return;
      }
      this.groupName(group.getDept() + ' ' + group.getCourseCode() + ' Section ' + group.getSectionLetter())
      this.isVisible(this.store.getSelectedFeature() == 'courseForum');
      this.populateMessages();
      this.store.wasLastMessageFromSelf() ? this.onMessageSent() : "";
    }).bind(this)
    this.store.sub(this.onStoreChanged, this);

    this.resizeTextArea = (function(){
      var rows = this.newMessage().split(/\r\n|\r|\n/).length
      $('#forum-chat-textarea').attr('rows',rows)
    }).bind(this)


    this.onMessageSent = function(){
      this.isSendingMessageVisible(false);
      this.showSent(true);
      var self = this;
      if(self.sentId){
        clearTimeout(self.sentId);
      }
      self.sentId = setTimeout(function(){
        self.showSent(false);
      },2000);
          this.resizeTextArea()
    }
    this.onMessageSent = this.onMessageSent.bind(this);


    this.populateMessages = (function(){
      var messages = this.store.getForumMessages().toArray();
      this.messages([]);
      for(var i = 0; i < messages.length; i++){
        this.messages.unshift(messages[i]);
      }
      this.isSpinnerVisible(false);
    }).bind(this)

    this.newMessage.subscribe(function(text){
      if(/\S/.test(text)){
        this.isValidInput(true);
      }
      else{
        this.isValidInput(false)
      }
    },this);
    this.isValidInput = ko.observable(false);



    this.onKeyPress = (function(vm, event){
      this.resizeTextArea()
      event.send = this.sendForumMessage;
      return TextUtilities.onKeyPress(event);
    }).bind(this)


    this.sendForumMessage = (function(){
      var text = this.newMessage();
      text = TextUtilities.formatToHTML(text);
      var grpId = this.store.getCurrentGroup().getId();
      var msg = ForumMessage.createSelfMessage(text, grpId);
      this.messages.unshift(msg);
      this.dis.dispatch('sendForumMessage',msg);
      this.newMessage('');
      this.isSendingMessageVisible(true);
    }).bind(this)

    this.appendMessage = function(message){
      if(message instanceof ForumMessage == false){
        throw new Error('expected messaged to be a ForumMessage');
      }
      this.messages.unshift(message);
    }
    this.appendMessage = this.appendMessage.bind(this);



    this.inputClicked = function(){
      this.inputHasFocus(true);
    }
}; // end view model.

  return {
    viewModel: ForumViewModel,
    template: template
  }
});
