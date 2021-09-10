
define(['york-forum/YorkForumStore',
        'york-forum/models/ForumPost',
        'york-forum/models/PostReply'],
function(Store,
         ForumPost,
         PostReply){

    describe("york-forum-store test", function(){

      let sut = null;

      beforeEach(() => {
        sut = Store.getNew();
      })

      it('onForumMemberCount => updates count and pub()',done =>{
        const count = 1
        expect(sut.getMemberCount()).toBe(0)
        sut.onPub(()=>{
          expect(sut.getMemberCount()).toBe(count)
          done()
        })
        sut.onForumMemberCount(count)
      })

      it('updatePost post not there =>  do nothing', () => {
        const p = ForumPost.getFake()
        spyOn(sut,'pub')
        spyOn(sut,'getPost').and.returnValue(null)
        sut.updatePost(p)
        expect(sut.pub).not.toHaveBeenCalled()
      })

      it('updatePost => update corresponding post', done => {
        const p = ForumPost.getFake()
        expect(p.isAlreadyVoted()).toBeTruthy()
        sut.posts.push(p)
        const p2 = ForumPost.getFake()
        p2.setAlreadyVoted(null)

        sut.onPub(()=>{
          expect(p.isAlreadyVoted()).toBeFalsy()
          done()
        })
        sut.updatePost(p2)
      })

      it('updatePost => update corresponding post', done => {
        const p = ForumPost.getFake()
        p.setAlreadyVoted(null)
        sut.posts.push(p)
        const p2 = ForumPost.getFake()
        p2.setAlreadyVoted(1)

        sut.onPub(()=>{
          expect(p.isAlreadyVoted()).toBeTruthy()
          done()
        })
        sut.updatePost(p2)
      })







      it('onClearPosterError => clear and pub()', done =>{

        sut.postError = 'hello'
        sut.spinnerOn = true
        sut.onPub(()=>{
          expect(sut.getPostError()).toBe('')
          expect(sut.isSpinnerOn()).toBeFalsy()
          done()
        })
        sut.onClearPosterError()

      })



      it('onCommentPost => spinnerOn', done =>{
        expect(sut.isSpinnerOn()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isSpinnerOn()).toBeTruthy()
          done()
        })
        sut.onCommentPost()
      })

      it('onDeleteAllPostReplies => does that', ()=>{
        const stored = ForumPost.getFake()
        const reply = PostReply.getFake()
        reply.setParentId(null)
        reply.setPostId(stored.getId())
        stored.setReplies([reply])
        sut.posts = [stored]

        expect(stored.getRootReplyCount()).toBe(1)
        const post = ForumPost.getFake()
        sut.onDeleteAllPostReplies(post)
        expect(stored.getRootReplyCount()).toBe(0)
      })

      it('onPostReplies([]) does nothing', ()=>{
        spyOn(sut,'pub')
        sut.onPostReplies([])
        expect(sut.pub).not.toHaveBeenCalled()
      })

      it('onPostReplies => finds post and sets replies, pub()', done =>{
        const p = ForumPost.getFake()
        const r = PostReply.getFake()
        r.setParentId(null)
        r.setPostId(p.getId())

        sut.posts = [p]
        const replies = [r]
        expect(sut.posts[0].replies().length).toBe(0)
        sut.onPub(()=>{
          console.log(sut.posts[0])
          expect(sut.posts[0].replies().length).toBe(1)
          done()
        })
        sut.onPostReplies(replies)

      })

      it('onShowPost => setExpanded(false) on all other posts.', done =>{
        const post1 = ForumPost.getFake()
        post1.setExpanded(true)
        sut.posts = [post1]

        const post2 = ForumPost.getFake()
        post2.setId(post1.getId() + 1)
        sut.onPub(()=>{
          expect(post1.isExpanded()).toBeFalsy()
          done()
        })
        sut.onShowPost(post2)
      })

      it('onShowPost => post.setExpanded(true), pub', done => {
        const post = ForumPost.getFake()
        expect(post.isExpanded()).toBeFalsy()
        sut.posts = [post]
        sut.onPub(()=>{
          expect(post.isExpanded()).toBeTruthy()
          done()
        })
        sut.onShowPost(post)
      })

      it('onForumPostDeleted(postId) => removes the post with that id.', done => {
        const p1 = ForumPost.getFake()
        const p2 = ForumPost.getFake()
        p2.setId(p1.getId() + 1)
        sut.posts = [p1, p2]
        sut.spinnerOn = true
        sut.onPub(()=>{
          expect(sut.getPosts().length).toBe(1)
          expect(sut.getPosts()[0].getId()).toBe(p1.getId())
          expect(sut.isSpinnerOn()).toBeFalsy()
          done()
        })
        sut.onForumPostDeleted(p2.getId())

      })

      it('onProfileInfo = > set photo url and pub', done => {
        const url = {}
        expect(sut.getUserPhoto()).toBeNull()
        expect(sut.getUserName()).toBeNull()
        sut.onPub(()=>{
          expect(sut.getUserPhoto()).toBe(url)
          expect(sut.getUserName()).toBe('Chris Kerley')
          done()
        })
        sut.onProfileInfo({small_photo_url:url, first:'Chris', last:'Kerley'})

      })

      it('onOpenNews => visible == true, pub',done => {
        sut.visible = false
        sut.onPub(()=>{
          expect(sut.isVisible()).toBeTruthy()
          done()
        })
        sut.onOpenNews()
      })

      it('hideNews => hide the forum', done => {
        sut.visible = true
        sut.onPub(()=>{
          expect(sut.isVisible()).toBeFalsy()
          done()
        })
        const person = {}
        sut.hideNews(person)
      })

      it('selGrpId', ()=>{
        const f = sut.dis.getCallbackById(sut.selGrpId)
        expect(f).toBe(sut.hideNews)
      })

      it('onForumPosts => updates posts and pub', done =>{
        const posts = [ForumPost.getFake(), ForumPost.getFake()]
        expect(sut.getPosts().length).toBe(0)
        sut.onPub(()=>{
          expect(sut.getPosts().length).toBe(2)
          done()
        })
        sut.onForumPosts(posts)
      })

      it('onPostError => set err and pub', done =>{
        const err = 'message'
        sut.forumPosterVisible = true
        sut.onPub(()=>{
          expect(sut.getPostError()).toBe(err)
          expect(sut.isForumPosterVisible()).toBeFalsy()
          done()
        })
        sut.onPostError(err)
      })

      it('onPostSuccess => prepend post to forum and close poster', done => {

        const post = ForumPost.getFake()
        const oldLength = sut.getPosts().length
        sut.forumPosterVisible = true
        spyOn(sut,'hideSuccess')
        sut.onPub(()=>{
          expect(sut.isForumPosterVisible()).toBeFalsy()
          expect(sut.getPosts().length).toBe(oldLength + 1)
          expect(sut.isForumPosterVisible()).toBeFalsy()
          done()
        })
        sut.onPostSuccess(post)
      })

      it('onOpenForumPoster => isForumPosterVisible()',done => {
        expect(sut.isForumPosterVisible()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isForumPosterVisible()).toBeTruthy()
          done()
        })
        sut.onOpenForumPoster()
      })

      it('onPost => turns on the spinner.',done => {
        expect(sut.isSpinnerOn()).toBeFalsy()
        sut.onPub(()=>{
          expect(sut.isSpinnerOn()).toBeTruthy()
          done()
        })
        sut.onServerCall()
      })

      it('onPostSuccess => postSuccessful, !spinnerOn',done => {
        sut.spinnerOn = true
        expect(sut.isPostSuccessful()).toBeFalsy()
        spyOn(sut,'hideSuccess')
        sut.onPub(()=>{
          expect(sut.isSpinnerOn()).toBeFalsy()
          expect(sut.isPostSuccessful()).toBeTruthy()
          done()
        })
        sut.onPostSuccess()
      })


    });

});
