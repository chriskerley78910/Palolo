
define(['york-forum/YorkForumRemoteService',
        'york-forum/models/ForumPost',
        'york-forum/models/PostReply'],
function(RemoteService,
         ForumPost,
         PostReply){

    describe("york-forum-remote-service test", function(){

      let sut = null;

      beforeEach(() => {
        sut = new RemoteService()
      })

      it('removeVote => ajax', ()=>{
        const post = ForumPost.getFake()
        spyOn($,'ajax')
        sut.removeVote(post)
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          type:'DELETE',
          success:sut.onPostsChanged
        }))
      })

      it('onPostsChanged => dispatch postUpdated, post', ()=>{

        const raw = ForumPost.getRaw()
        spyOn(sut.dis,'dispatch')
        sut.onPostsChanged(raw)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('postUpdated',jasmine.any(Object))
      })


      it('upvotePost => ajax', ()=>{
        const post = ForumPost.getFake()
        spyOn($,'ajax')
        sut.upvotePost(post)
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          type:'POST',
          success:sut.onPostsChanged
        }))
      })


      it('onReplyToReply does ajax ', ()=>{
        spyOn($,'ajax')
        const parentReply = PostReply.getFake()
        const o = {
          parentReply:parentReply,
          message:'hello'
        }
        sut.onReplyToReply(o)
        const expected = {
          type:'POST',
          success:sut.onCommentsChanged
        }
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining(expected))
      })



      it('onDeleteComment => ajax call', ()=>{
        spyOn($,'ajax')
        const d = {}
        sut.onDeleteComment(d)
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          type:'DELETE',
          data:JSON.stringify(d)
        }))
      })



      it('commentPost => ajax post', ()=>{
        spyOn($,'ajax')
        sut.commentPost({})
        expect($.ajax).toHaveBeenCalledWith(jasmine.objectContaining({
          success:sut.onCommentsChanged
        }))
      })

      it('onCommentsChanged(post) => getForumReplies(post)',()=>{
        spyOn(sut,'getForumReplies')
        const post = ForumPost.getRaw()

        sut.onCommentsChanged(post)
        expect(sut.getForumReplies).toHaveBeenCalledWith(jasmine.objectContaining({
          id:jasmine.any(Number)
        }))
      })

      it('onRepliesReceived => dispatch wrapReplies', () => {
        const raw = []
        const arr = []
        spyOn(sut.dis,'dispatch')
        spyOn(sut,'wrapReplies').and.returnValue(arr)
        sut.onRepliesReceived(raw)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('postReplies',arr)
      })

      it('onRepliesReceived(non array) => dispatch deleteAllPostReplies', () => {
        const raw = ForumPost.getRaw()
        spyOn(sut.dis,'dispatch')
        sut.onRepliesReceived(raw)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('deleteAllPostReplies',jasmine.any(Object))
      })

      it('wrappedReplies does just that.', ()=>{
        const r1 = PostReply.getRaw()
        const r2 = PostReply.getRaw()
        r2.reply_id = 2
        const rawReplies = [r1, r2]
        const wrapped = sut.wrapReplies(rawReplies)
        expect(wrapped.length).toBe(2)
        expect(wrapped[0].getId()).toBe(1)
        expect(wrapped[1].getId()).toBe(2)
      })

      it('wrapReplies does just that.', ()=>{
        const r1 = PostReply.getRaw()
        const r2 = PostReply.getRaw()
        const raws = [r1, r2]
        const wrapped = sut.wrapReplies(raws)
        expect(wrapped.length).toBe(2)
        expect(wrapped[0].getId()).toBe(r1.reply_id)
      })

      it('getForumReplies => ajax request', ()=>{
        spyOn($,'ajax')
        // console.log($)
        sut.getForumReplies(ForumPost.getFake())
        expect($.ajax).toHaveBeenCalled()
      })

      it('onDeleteForumPost => ajax', ()=>{
        spyOn($,'ajax')
        sut.onDeleteForumPost(ForumPost.getFake())
        expect($.ajax).toHaveBeenCalled()
      })

      it('onPostDeleted => dispatch forumPostDeleted', ()=>{
        const post = ForumPost.getFake()
        spyOn(sut.dis,'dispatch')
        sut.onPostDeleted(post.getId())
        expect(sut.dis.dispatch).toHaveBeenCalledWith('forumPostDeleted',post.getId())
      })

      it('onYorkForumPosts => dispatch posts', ()=>{
        spyOn(sut.dis,'dispatch')
        const posts = [
          ForumPost.getRaw(),
          ForumPost.getRaw()
        ]
        const count = 5
        sut.onYorkForumPosts({
          posts:posts,
          count:count
        })
        expect(sut.dis.dispatch).toHaveBeenCalledWith('forumPosts',jasmine.any(Array))
        expect(sut.dis.dispatch).toHaveBeenCalledWith('forumMemberCount',jasmine.any(Number))
      })

      it('onYorkForumPosts calls onError if an exception occurs.', ()=>{
        spyOn(sut,'onError')
        const posts = [{}]
        sut.onYorkForumPosts(posts)
        expect(sut.onError).toHaveBeenCalled()
      })

      it('onErr => dispatch postError ', ()=>{
        spyOn(sut.dis,'dispatch')
        const m = {responseText:'msg'}
        sut.onError(m)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('postError',m.responseText)
      })

      it('onError defaults to accepting just text except there is a responseText prop',()=>{
        spyOn(sut.dis,'dispatch')
        sut.onError('err')
        expect(sut.dis.dispatch).toHaveBeenCalledWith('postError','err')
        sut.onError({responseText:'err2'})
        expect(sut.dis.dispatch).toHaveBeenCalledWith('postError','err2')
      })

      it('onPostSuccess => dispatch ForumPost', ()=>{
        const raw = ForumPost.getRaw()
        spyOn(sut.dis,'dispatch')
        sut.onPostSuccess(raw)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('postSuccess',jasmine.any(Object))
      })

      it('onPostSuccess delegates to onError if an exception occurs', ()=>{
        spyOn(sut,'onError')
        spyOn(sut.dis,'dispatch').and.throwError("fake error");
        sut.onPostSuccess()
        expect(sut.onError).toHaveBeenCalled()
      })

      it('onPostForumMessage',() => {
        spyOn($,'ajax')
        const post = {
          title:'EECS2030',
          body:'What the fuck?'
        }
        sut.onPostForumMessage(post)
        expect($.ajax).toHaveBeenCalled()
      })

      it('onAuth => getYorkForumPosts()', ()=>{
        spyOn(sut,'getYorkForumPosts')
        sut.onAuth({state:'authenticated'})
        expect(sut.getYorkForumPosts).toHaveBeenCalled()
      })



    });

});
