
define(['course/../../libs/text-utilities'],
function(TextUtilities){

    describe("text-utilities", function(){

      let sut = null;
      beforeEach(()=>{
        sut = TextUtilities;
      })

      it('onKeyPress(TAB)', ()=>{
        let event = {
          keyCode:9,
          preventDefault:jasmine.createSpy(),
          target:{
          }
        }
        spyOn(sut,'insertTab');
        expect(sut.onKeyPress(event)).toBeFalsy();
        expect(sut.insertTab).toHaveBeenCalled();

      })

      it('onKeyPress(SHIFT ENTER) == true', ()=>{
        let event = {
          keyCode:13,
          shiftKey:true,
          preventDefault:jasmine.createSpy(),
          target:{
          }
        }
        spyOn(sut,'insertTab');
        expect(sut.onKeyPress(event)).toBeTruthy();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(sut.insertTab).not.toHaveBeenCalled();
      })

      it('onKeyPress(ENTER) => send()', ()=>{
        let event = {
          keyCode:13,
          shiftKey:false,
          send:jasmine.createSpy(),
          preventDefault:jasmine.createSpy(),
          target:{
          }
        }
        sut.onKeyPress(event);
        expect(event.send).toHaveBeenCalled();
      })


      it('checkKeyPressCombo no matches => DO_DEFAULT',()=>{
        let event = {
          keyCode:77,
          shiftKey:true
        };
        expect(sut.onKeyPress(event)).toBeTruthy();
      })



      it('insertLineBreaks(text)', ()=>{
        let text = `hello.`;
        let newText = sut.insertLineBreaks(text);
        expect(newText).toBe(`hello.`);
      })


      it('insertLineBreaks(text) qwe\nqwe\n', ()=>{
        let text = `qwe\nqwe`;
        let newText = sut.insertLineBreaks(text);
        expect(newText).toBe(`qwe<br>qwe`);
      })


      it('insertLineBreaks(text)', ()=>{
        let text = `hello. \n how are you?`;
        let newText = sut.insertLineBreaks(text);
        expect(newText).toBe(`hello. <br> how are you?`);
      })


      it('insertLineBreaks() does just that.', ()=>{
        let text = `hello \n how are you \n chris?`;
        let converted = sut.insertLineBreaks(text);
        expect(converted).toBe('hello <br> how are you <br> chris?');
      })




      it('insertTab does just that.', ()=>{
        let e = document.createElement('textarea');
        e.selectionStart = 0;
        e.selectionEnd = 0;
        e.value = 'hello';
        sut.insertTab(e);
        expect(e.value.length).toBe(6);
        expect(e.value.substring(0)).toMatch(/\t/);
      })

      it('insertHTMLTabs(text) does just that.', ()=>{
        let text = `hello\thow\tare you?`;
        let withHTMLTabs = sut.insertHTMLTabs(text);
        expect(withHTMLTabs).toBe('hello\u00A0\u00A0\u00A0\u00A0how\u00A0\u00A0\u00A0\u00A0are you?\u00A0\u00A0\u00A0\u00A0');
      })


      it('escapeHTML(#include <stdio.h>) does just that.', ()=>{
        let text = '#include <stdio.h>';
        let escaped = sut.escapeHTML(text);
        expect(escaped).toBe('#include &lt;stdio.h&gt;');
      })

      it('htmlReplaces & by escaping them.', ()=>{
          let result = sut.escapeHTML("#include &");
          expect(result).toBe("#include &amp;");
      })






    }); // end describe
}); // end define.
