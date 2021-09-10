
define(['course/models/ForumMessageCollection',
        'course/models/ForumMessage'],
function(ForumMessageCollection,
         ForumMessage){


      describe("Test ForumMessageCollection", function(){

        let col = null;

        beforeEach(()=>{
           col = new ForumMessageCollection();
        })

        it('empty upon init', ()=>{

          expect(col.getSize()).toBe(0);
        })

        it('add("text") throws', ()=>{
          try{

            col.add("text");
          }
          catch(err){
            expect(err.message).toBe("can only add ForumMessages.");
          }
        })

        it('add(ForumMessage) adds the messages', ()=>{

          col.add(ForumMessage.getFake());
          expect(col.getSize()).toBe(1);
        })


        it('toArray() does just that.', ()=>{

          col.add(ForumMessage.getFake());
          let arr = col.toArray();
          expect(arr.length).toBe(1);
          expect(Array.isArray(arr)).toBeTruthy();
        })


        it('get(index) returns the ForumMessage at those position.',()=>{
          let msg = ForumMessage.getFake();
          col.add(msg);
          expect(col.get(0)).toBe(msg);
        })

        it('clear() erases all the messages in the collection.', ()=>{
          col.add(ForumMessage.getFake());
          col.clear();
          expect(col.getSize()).toBe(0);
        })


    }); // end describe



}); // end define.
