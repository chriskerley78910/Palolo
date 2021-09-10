
define(['york-forum/models/ForumPost', 'york-forum/models/PostReply'],
function(ForumPost, PostReply){

    describe("forum-post test", function(){

      beforeEach(()=>{
        sut = ForumPost.getFake()
        sut.deleteReplies()
        sut.resetReplyCount()
      })

      it('hasAnchorTag(<a) == true', ()=>{
        expect(sut.hasAnchorTag('<a class=fdf> </a>')).toBeTruthy()
      })

      it('changeTarget(<a>) == <a target=_blank', ()=>{
        const result = sut.changeTarget('<a> </a>')
        expect(result).toBe(`<a target="_blank" rel="noopener noreferrer"> </a>`)
      })

      it('getRep() returns the reputation of the poster', ()=>{
        expect(sut.getRep()).toBe('Reputation: 5')
      })

      it('setRep(null) just return', ()=>{
        sut.setRep(null)
          expect(sut.getRep()).toBe('Reputation: 5')
      })


      it('setAlreadyVoted(1179) sets it to be true', ()=>{
        sut.setAlreadyVoted(1179)
        expect(sut.isAlreadyVoted()).toBeTruthy()
      })

      it('setAlreadyVoted(nul) sets it to be false', ()=>{
        sut.setAlreadyVoted(null)
        expect(sut.isAlreadyVoted()).toBeFalsy()
      })

      it('setVoteCount(null) sets the count to zero',()=>{
        sut.setVoteCount(null)
        expect(sut.getVoteCount()).toBe(0)
      })


      it('setVoteCount(-1) throws',()=>{
        try{
          sut.setVoteCount(-1)
        } catch(err){
          expect(err.message).toBe('id malformed')
        }
      })

      it('setVoteCount(4) works',()=>{
        sut.setVoteCount(4)
        expect(sut.getVoteCount()).toBe(4)
      })


      it('onCommentDeleted => updated the replyTree for that post. (simple case)', () =>{

        const reply = PostReply.getFake()
        const replyId = 54
        reply.setId(replyId)
        reply.setPostId(sut.getId())
        reply.setParentId(null)

        sut.setReplies([reply])

        expect(sut.replies().length).toBe(1)
        sut.deleteReply(reply.getId())
        expect(sut.replies().length).toBe(0)
      })

      it('onCommentDeleted => updated the replyTree for that post. (complex case)', () =>{


        const r1 = PostReply.getFake()
        const r1Id = 54
        r1.setId(r1Id)
        r1.setPostId(sut.getId())
        r1.setParentId(null)

        const r2 = PostReply.getFake()
        const r2Id = 55
        r2.setId(r2Id)
        r2.setPostId(sut.getId())
        r2.setParentId(r1.getId())

        sut.setReplies([r1, r2])
        expect(sut.replies()[0].getReplies().length).toBe(1)
        sut.deleteReply(r2Id)
       expect(sut.replies()[0].getReplies().length).toBe(0)
      })


      it('getCommentHTML keeps the line breaks.', ()=>{
        sut.setComment('hello\n world')
        expect(sut.getCommentHTML()).toBe('hello<br /> world')
      })

      it('setReplyCount(null) sets it too zero', ()=>{
        sut.setReplyCount(null)
        expect(sut.getReplyCount()).toBe(0)
      })

      it('setReplyCount(-1) throws', ()=>{
        try{
          sut.setReplyCount(-1)
          expect(false).toBe(true)
        }catch(err){
          expect(err.message).toBe('id malformed')
        }
      })

      it('setReplyCount(0) works', ()=>{
        sut.setReplyCount(0)
        expect(sut.getReplyCount()).toBe(0)
      })

      it('comment() is empty at first', ()=>{
        expect(sut.comment()).toBe('')
      })

      it('setComment throw if its empty',()=>{
        try{
        sut.setComment('')
        }catch(err){
          expect(err.message).toBe('comment cannot be set to empty')
        }
      })


      it('setReplies() increments the reply count', ()=>{
        const r1 = PostReply.getFake()
        r1.setParentId(null)
        expect(sut.getReplyCount()).toBe(0)
        sut.setReplies([r1])
        expect(sut.getReplyCount()).toBe(1)
      })


      it('setReplies(array of replies) 1-level case does that', ()=>{
        const r1 = PostReply.getFake()
        r1.setParentId(null)
        const r2 = PostReply.getFake()
        r2.setParentId(null)
        const replies = [r1, r2]
        sut.setReplyCount(2)
        sut.setReplies(replies)
        expect(sut.getReplyCount()).toBe(2)
      })

      it('setReplies(replies) 2 level case', ()=>{

        const root = PostReply.getFake()
        root.setAuthor('Root Reply')
        root.setParentId(null)

        const firstChild = PostReply.getFake()
        firstChild.setId(50)
        firstChild.setParentId(root.getId())
        firstChild.setAuthor('Child Reply')

        const replies = [root,firstChild]
        sut.setReplies(replies)
        console.log(sut.replies())
        expect(sut.replies().length).toBe(1)
        expect(sut.getReplyCount()).toBe(2)
        expect(sut.replies()[0].getChildAt(0).getAuthor()).toBe('Child Reply')

      })

      it('setReplies(replies) complex case', ()=>{

        const root = PostReply.getFake()
        root.setParentId(null)
        root.setAuthor('Root 1')

        const firstChild = PostReply.getFake()
        firstChild.setId(firstChild.getId() + 1)
        firstChild.setParentId(root.getId())
        firstChild.setAuthor('Root 1 - Child 1')

        const secondChild = PostReply.getFake()
        secondChild.setId(secondChild.getId() + 2)
        secondChild.setParentId(root.getId())
        secondChild.setAuthor('Root 1 - Child 2')


        const root2 = PostReply.getFake()
        root2.setParentId(null)
        root2.setAuthor('Root 2')
        root2.setId(secondChild.getId() + 1)

        const firstChild2 = PostReply.getFake()
        firstChild2.setId(secondChild.getId() + 2)
        firstChild2.setParentId(root2.getId())
        firstChild2.setAuthor('Root 2 - Child 1')

        const replies = [root, firstChild, secondChild, root2, firstChild2]
        sut.setReplies(replies)

        expect(sut.replies().length).toBe(2)
        expect(sut.replies()[0].getAuthor()).toBe('Root 1')

        var r1Children = sut.replies()[0].replies()
        expect(r1Children.length).toBe(2)
        expect(r1Children[0].getAuthor()).toBe('Root 1 - Child 1')
        expect(r1Children[1].getAuthor()).toBe('Root 1 - Child 2')

        expect(sut.replies()[1].getAuthor()).toBe('Root 2')
        var r2Children = sut.replies()[1].replies()
        expect(r2Children.length).toBe(1)
        expect(r2Children[0].getAuthor()).toBe('Root 2 - Child 1')

      })




      it('setReplies throws if any of the replies are not a PostReply', ()=>{
        try{
          const replies = [PostReply.getFake(), {}]
          sut.setReplies(replies)
          expect(false).toBeTruthy()
        } catch(err) {
          expect(err.message).toBe('must be a reply')
        }
      })

      it('is a ValidObject ',()=>{
        const p = ForumPost.getFake()
        expect(typeof p.validateStr).toBe('function')
      })

      it('setExpanded(true) => isExpanded()',()=>{
        const p = ForumPost.getFake()
        expect(p.isExpanded()).toBeFalsy()
        p.setExpanded(true)
        expect(p.isExpanded()).toBeTruthy()
        p.setExpanded(false)
        expect(p.isExpanded()).toBeFalsy()
      })


      it('buildOutgoing => sets userId and postId to -1', ()=>{
          const o = ForumPost.buildOutgoing({
            title:'title',
            body:'body'
          })
          expect(o.getId()).toBe(1)
          expect(o.getUserId()).toBe(2)
      })

      it('sets all attr', () => {

        const post = ForumPost.getFake()
        expect(post.getId()).toBe(1)
        expect(post.getUserId()).toBe(2)
        expect(post.getTitle()).toBe('title')
        expect(post.getBody()).toBe('text')
        expect(post.getAuthor()).toBe('Chris Kerley')
        expect(post.isPoster()).toBeTruthy()
        expect(post.getReplyCount()).toBe(2)
        expect(post.getVoteCount()).toBe(3)
        expect(post.isAlreadyVoted()).toBeTruthy()

      })



    });

});
