
define(['course/models/ForumMessage'],
function(ForumMessage){

    let rawMessage = {
      group_id:1,
      text:'text',
      timestamp:"2 min ago.",
      first:'chris',
      last:'kerley',
      isSelf:true,
      sender_img_url:'123.jpeg'
    }
    let server = 'http://forum.localhost';


    let getFake = ()=>{
      return new ForumMessage(rawMessage, server);
    }

    let getRaw = ()=>{
      return rawMessage;
    }



    describe("Test ForumMessage", function(){

      let sut = null;


      beforeEach(() => {
        sut = getFake();
      })

      it('hasImage() == true', ()=>{
        expect(sut.hasImage()).toBeTruthy();
      })


      it('throws if the sender_img_url is missing.', ()=>{

        try{
         new ForumMessage({
              text:'text',
              timestamp:"2 min ago.",
              first:'chris',
              last:'kerley',
              isSelf:true,
              sender_img_url:null,
              group_id:1
            }, 'http');
            expect(false).toBeTruthy();
        }
        catch(err){
          expect(err.message).toBe('sender_img_url is malformed.');
        }
      })

    it('throws if the group_id is missing.', ()=>{
          try{
           new ForumMessage({
                text:'text',
                timestamp:"2 min ago.",
                first:'chris',
                last:'kerley',
                isSelf:true,
                sender_img_url:'123.jpeg'
              }, 'http');
              expect(false).toBeTruthy();
          }
          catch(err){
            expect(err.message).toBe('group_id is missing or malformed.');
          }
    })

    it('setImgUrlPrefix() does just that.', ()=>{
      sut.setImgUrlPrefix('http://host');
      expect(sut.getImgUrl()).toBe('http://host/123.jpeg');
    })

    it('getGroupId() returns the group that the message is associated with.', ()=>{
      expect(sut.getGroupId()).toBe(rawMessage.group_id);
    })




      it('creatSelfMessage() does just that.',()=>{
        let server = 'localhost';
        let msg = ForumMessage.createSelfMessage('text',getRaw().group_id);
        expect(msg.getText()).toBe('text');
      })

      it('getHTML() wraps links in anchor html', ()=>{
        let text = 'some text https://hello.com';
        let server = 'localhost';
        let msg = ForumMessage.createSelfMessage(text,getRaw().group_id);
        let expectedHTML = 'some text <a target="_blank" class="forum-self-msg-link" href="https://hello.com">https://hello.com</a>';
        expect(msg.getHTML()).toBe(expectedHTML);
      })

      it('getHTML() ^ not self => wraps links in anchor html and styles it as friend.', ()=>{

        let text = 'some text https://hello.com';
        let server = 'localhost';
        let msg = ForumMessage.createSelfMessage(text,getRaw().group_id);
        msg.setAsFriend();
        let expectedHTML = 'some text <a target="_blank" class="forum-friend-msg-link" href="https://hello.com">https://hello.com</a>';
        expect(msg.getHTML()).toBe(expectedHTML);
      })



      it('getHTML() does not replace links in iframes.', ()=>{
        let text = 'Here is it <iframe width="560" height="315" src="https://www.youtube.com/embed/et0csuZryhs" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        let server = 'localhost';
        let msg = ForumMessage.createSelfMessage(text,getRaw().group_id);
        let result = msg.getHTML(text);
        expect(text).toBe(result);
      })

      it('getHTML() adds youtube embed  class when an iframe is in it..', ()=>{
        let text = 'Here is it <iframe width="560" height="315" src="https://www.youtube.com/embed/et0csuZryhs" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        let server = 'localhost';
        let msg = ForumMessage.createSelfMessage(text,getRaw().group_id);
        let result = /youtube\.com\/embed/.test(msg.getHTML(text));
        expect(result).toBeTruthy();
      })


    }); // end describe

    return {
      getFake:getFake,
      getRaw:getRaw
    }

}); // end define.
