
define(['york-forum/reply/Component',
        'ko',
        'york-forum/models/PostReply'],
  function(Component, ko, PostReply){

    describe("reply tests", function(){

      let sut = null;

      beforeEach(() => {
        var reply = PostReply.getFake()
        var params = {
          replies: {
            isRoot: false,
            self:reply.getSelf,
            replies: ko.observableArray([])
          }
        }
        sut = new Component.viewModel.createViewModel(params);
      })



      it('openReplyToReply => dispatch(replyToReply, replyId)', ()=>{
        sut.reply = PostReply.getFake()
        const replyId = 5
        sut.reply.setId(replyId)
        spyOn(sut.dis,'dispatch')
        sut.openCommentBox()
        expect(sut.isCommentBoxOpen()).toBeTruthy()
        expect(sut.commentCommentHasFocus()).toBeTruthy()
      })

      it('isRoot is false', () =>{
        expect(sut.isRoot()).toBe(false)
      })

      it('replyId is the reply of the ForumReply', () =>{
        expect(sut.replyId).toBe(1)
      })

      it('delete => dispatch(deleteComment)', ()=>{
        spyOn(sut.dis,'dispatch')
        const commentId = 45;
        sut.replyId = commentId
        spyOn(window,'confirm').and.returnValue(true)
        sut.deleteComment()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('deleteComment',jasmine.any(Object))
      })

      it('replyToReply => dispatches(replyToReply)', () => {
        spyOn(sut.dis,'dispatch')
        const reply = {};
        sut.reply = {}
        const message = 'the\nMessage'
        sut.replyToReplyMessage(message)
        sut.replyToReply()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('replyToReply',jasmine.objectContaining({
          parentReply:sut.reply,
          message:'the<br />Message'
        }))
        expect(sut.replyToReplyMessage()).toBe('')
      })


    }); // end describe

}); // end define.
