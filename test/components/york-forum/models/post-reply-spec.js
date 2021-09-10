
define(['york-forum/models/PostReply'],
function(PostReply){

    describe("post-reply test", function(){

      beforeEach(()=>{
        sut = PostReply.getFake()
      })

      it('setOwner throws if not 1 or 0', ()=>{
        try{
          sut.setOwner('hello')
        }catch(err){
          expect(err.message).toBe('must be 1 or 0')
        }

      })



      it('throws if the host is not an argument', ()=>{

        try{
          const raw = PostReply.getRaw()
          new PostReply(raw,'')
        }catch(err){
          expect(err.message).toBe('must be a non-empty string')
        }
      })

      it('setUserPhotoURL throws if not a valid string', ()=>{
        try{
          sut.setUserPhotoURL('')
          expect(false).toBe(true)
        } catch(err){
          expect(err.message).toBe('must be a non-empty string')
        }
      })

      it('is a ValidObject ',()=>{
        const p = PostReply.getFake()
        expect(typeof p.validateStr).toBe('function')
      })


      it('setParentId must be null or a number.',()=>{
        sut.setParentId(null)
        expect(sut.getParentId()).toBeNull()

        sut.setParentId(1)
        expect(sut.getParentId()).toBe(1)

        try{
          sut.setParentId('hello')
          expect(false).toBe(true)
        } catch(err){
          expect(err.message).toBe('id malformed')
        }
      })


      it('addChild adds a child reply', ()=>{
        const rp = PostReply.getFake()
        const rc = PostReply.getFake()
        rc.setParentId(rp.getId())
        rc.setId(rp.getId() + 1)
        expect(rp.getChildCount()).toBe(0)
        rp.addChild(rc)
        expect(rp.getChildCount()).toBe(1)
        rp.addChild(rc)
        expect(rp.getChildCount()).toBe(1)
      })


      it('buildOutgoing => sets userId and postId to -1', ()=>{
          const o = PostReply.buildOutgoing({
            body:'body',
            parentId:2
          })
          expect(o.getId()).toBe(1)
          expect(o.getParentId()).toBe(2)
          expect(o.getUserId()).toBe(3)
      })

      it('sets all attr', () => {

        const reply = PostReply.getFake()
        expect(reply.getId()).toBe(1)
        expect(reply.getParentId()).toBe(2)
        expect(reply.getUserId()).toBe(3)
        expect(reply.getBody()).toBe('body')
        expect(reply.getAuthor()).toBe('Chris Kerley')
        expect(reply.getPostId()).toBe(5)
        expect(reply.getUserPhotoURL()).toBe('fakehost/fakephotourl')
        expect(typeof reply.getKOUserPhotoURL()).toBe('function')
        expect(reply.isOwner()).toBeTruthy()
      })



    });

});
