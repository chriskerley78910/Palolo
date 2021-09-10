/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2020-07-14
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'text!york-forum/reply/template.html',
        'dispatcher/Dispatcher',
        'york-forum/YorkForumStore'],

function(ko, template, Dis,  Store){

    function ReplyComponent(params) {

      this.dis = new Dis()
      this.isRoot = ko.observable(params.replies.isRoot)
      this.replies = params.replies.replies   // so sub-replies can be drawn.

      if(params.replies.self){
        this.reply = params.replies.self()
        this.replyId = this.reply.getId()
        this.message = this.reply.getBody()
        this.author = this.reply.getAuthor()
        this.timestamp = this.reply.getTimestamp()
        this.userPhotoURL = this.reply.getKOUserPhotoURL()
        this.isOwner = this.reply.isOwner()
        this.replyToReplyMessage = ko.observable('')
        this.isCommentBoxOpen = this.reply.commentBoxOpen
        this.commentCommentHasFocus = ko.observable(false)


        this.deleteComment = (function(){
          if(confirm('Are you sure you want to delete this?')){
              this.dis.dispatch('deleteComment',this.reply)
          }
        }).bind(this)

        this.openCommentBox = (function(){
          this.isCommentBoxOpen(true)
          this.commentCommentHasFocus(true)
        }).bind(this)

        this.replyToReply = (function(){
          var o = {
            parentReply:this.reply,
            message:this.replyToReplyMessage().replace(/\n/gi,'<br />')
          }
          this.replyToReplyMessage('')
          this.dis.dispatch('replyToReply',o)
        }).bind(this)

      }



      var child
      if(this.replies.length > 0){
        params.replies.shift()
        child = new ReplyComponent(params);
      }
      return child
}


  return {
    template: template,
    viewModel: {
        createViewModel: function(params, componentInfo) {
            return new ReplyComponent(params);
        }
    }
  }

});
