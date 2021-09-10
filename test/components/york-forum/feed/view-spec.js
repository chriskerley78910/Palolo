
define(['york-forum/feed/Component',
        'york-forum/models/ForumPost'],
function(Component, ForumPost){

    describe("forum-feed tests", function(){

      let sut = null;

      beforeEach(() => {
        sut = new Component.viewModel();
      })



      it('gotoPerson => stopPropagation', ()=>{
        const e = {
          stopPropagation:jasmine.createSpy()
        }
        expect(sut.gotoPerson(null, e)).toBeFalsy()
        expect(e.stopPropagation).toHaveBeenCalled()
      })

      it('onStore => userFullName() is set', ()=>{
        const name = 'Chris Kerley'
        spyOn(sut.store,'getUserName').and.returnValue(name)
        sut.onStore()
        expect(sut.userFullName()).toBe(name)
      })

      it('toggleVote, !isAlreadyVoted() => dispatch upvotePost, post', ()=>{
        spyOn(sut.dis,'dispatch')
        const post = ForumPost.getFake()
        spyOn(post,'isAlreadyVoted').and.returnValue(false)
        const e = {stopPropagation:jasmine.createSpy()}
        sut.toggleVote(post,e)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('upvotePost',post)
        expect(e.stopPropagation).toHaveBeenCalled()
      })

      it('toggleVote, isAlreadyVoted() => dispatch removeVote, post', ()=>{
        spyOn(sut.dis,'dispatch')
        const post = ForumPost.getFake()
        spyOn(post,'isAlreadyVoted').and.returnValue(true)
        const e = {stopPropagation:jasmine.createSpy()}
        sut.toggleVote(post,e)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('removeVote',post)
        expect(e.stopPropagation).toHaveBeenCalled()
      })

      it('deletePost() == false', ()=>{
        const p = ForumPost.getFake()
        const e = {stopPropagation:jasmine.createSpy()}

        spyOn(window,'confirm').and.returnValue(true)
        spyOn(sut.dis,'dispatch')
        const result = sut.deletePost(p,e)

        expect(result).toBeFalsy()
        expect(window.confirm).toHaveBeenCalled()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('deleteForumPost',p)
        expect(e.stopPropagation).toHaveBeenCalled()
      })

      it('commentPost() => dispatch postId and message', ()=>{

        spyOn(sut.dis,'dispatch')
        const post = ForumPost.getFake()
        const comment = 'fake'
        post.setComment(comment)
        sut.commentPost(post)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('commentPost',jasmine.any(Object))
      })

      it('showPost => dispatch showPost(post)', ()=>{
        spyOn(sut.dis,'dispatch')
        const post = ForumPost.getFake()
        post.setExpanded(false)
        sut.showPost(post)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('showPost', post)
      })
      it('onStore => userPhotoURL is set', ()=>{
        const url = {}
        spyOn(sut.store,'getUserPhoto').and.returnValue(url)
        sut.onStore()
        expect(sut.userPhotoURL()).toBe(url)
      })

      it('isVisible() == false intially', ()=>{
        expect(sut.isVisible()).toBeFalsy()
      })

      it('onStore() => getPosts(), update them', ()=>{
        const posts = [
          ForumPost.getFake(),
          ForumPost.getFake()
        ]
        spyOn(sut.store,'getPosts').and.returnValue(posts)
        sut.onStore()
        expect(sut.posts().length).toBe(2)
      })

      it('onStore(), isVisible() => isVisible()', ()=>{
        spyOn(sut.store,'isVisible').and.returnValue(true)
        sut.onStore()
        expect(sut.isVisible()).toBeTruthy()
      })


      it('openPoster => dispatch openPoster',()=>{
        spyOn(sut.dis,'dispatch')
        sut.openPoster()
        expect(sut.dis.dispatch).toHaveBeenCalledWith('openForumPoster')
      })

      it('commentPost => dispatch commentPost, post', ()=>{
        spyOn(sut.dis,'dispatch')
        const post = ForumPost.getFake()
        post.setComment('hello world')
        sut.commentPost(post)
        expect(sut.dis.dispatch).toHaveBeenCalledWith('commentPost',jasmine.any(Object))
        expect(post.getComment()).toBe('')
      })


    });

});
