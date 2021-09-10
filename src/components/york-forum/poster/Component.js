/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2020-07-14
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'text!york-forum/poster/template.html',
        'dispatcher/Dispatcher',
        'york-forum/YorkForumStore',
        'cleditor',
        'york-forum/models/ForumPost'],

function(ko, template, Dis,  Store, cleditor, ForumPost){

  function ViewModel(params,componentInfo){
    this.dis = new Dis()
    this.isVisible = ko.observable(false)
    this.isSpinnerOn = ko.observable(false)
    this.isPostSuccessful = ko.observable(false)
    this.store = Store.getInstance()
    this.title = ko.observable('')
    this.titleHasFocus = ko.observable(false)
    this.isPostable = ko.observable(false)
    this.isValidBodyLength = ko.observable(false)
    this.bodyErrorMessage = ko.observable('')
    var MAX_POST_LENGTH = 10096 // encoding is like twice as long.
    var MIN_POST_LENGTH = 3


    this.onStore = (function(){
      var err = this.store.getPostError()
      if(err.length > 0){
        alert(err)
        this.dis.dispatch('clearPosterError')
        return
      }
      this.isVisible(this.store.isForumPosterVisible())
      if(this.isVisible() && !this.store.isSpinnerOn()){
        this.refreshPoster()
        this.titleHasFocus(true)

      }
      this.isSpinnerOn(this.store.isSpinnerOn())
      this.isPostSuccessful(this.store.isPostSuccessful())
    }).bind(this)
    this.store.sub(this.onStore)





    this.onTitle = (function(text){
      if(text.length < 3)
          this.isPostable(false)
      else
          this.isPostable(true)
    }).bind(this)
    this.title.subscribe(this.onTitle)




    this.hide = (function(){
      this.dis.dispatch('hideYorkForumPoster')
    }).bind(this)


    this.options = {
            width: 500, // width not including margins, borders or padding
            height: 250, // height not including margins, borders or padding
            controls: // controls to add to the toolbar
                "bold italic underline strikethrough subscript superscript | font size " +
                "style | color highlight removeformat | bullets numbering | outdent " +
                "indent | alignleft center alignright justify | undo redo | " +
                "rule image link unlink | cut copy paste pastetext | print source",
            colors: // colors in the color popup
                "FFF FCC FC9 FF9 FFC 9F9 9FF CFF CCF FCF ",
            sizes: // sizes in the font size popup
                "1,2,3,4,5,6,7",
            styles: // styles in the style popup
                [["Paragraph", "<p>"]],
            useCSS: true, // use CSS to style HTML when possible (not supported in ie)
            docType: // Document type contained within the editor
                '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
            docCSSFile: // CSS file used to style the document contained within the editor
                "",
            bodyStyle: // style to assign to document body contained within the editor
                "margin:4px; font:32pt Arial,Verdana; cursor:text"
        }
        this.getMaxLength = function(){
          return MAX_POST_LENGTH
        }

      this.onBodyChange = (function(){
        var text = this.getEditorText()
        if(text.length < MIN_POST_LENGTH){
          this.isValidBodyLength(false)
          this.bodyErrorMessage('Your message is too short.')
        } else if(text.length > this.getMaxLength()) {
            this.isValidBodyLength(false)
            this.bodyErrorMessage('Your message is too long.')
        } else{
          this.isValidBodyLength(true)
          this.bodyErrorMessage('')
        }
      }).bind(this)

        var self = this
        this.initEditor = function() {
          try{
            self.editor = $("#forum-input").cleditor(this.options)
            self.editor[0].change(self.onBodyChange)
          } catch(err){
            console.log(err.message)
          }
        }
       $(document).ready(this.initEditor);

     this.refreshPoster = function(){
       this.editor[0].refresh()
     }

      this.getEditorText = function(){
        return this.editor[0].$area.val()
      }

      this.getTitle = function(){
        return this.title()
      }

      this.clear = function(){
        this.title('')
        this.editor[0].clear()
      }


      this.post = (function(){
        try{

          var post = ForumPost.buildOutgoing({
            title:this.getTitle(),
            body:this.getEditorText()
          })

          this.dis.dispatch('postForumMessage',post)
          this.clear()
        }catch(err){
          console.log(err)
        }
      }).bind(this)


  };

  return {
    viewModel: ViewModel,
    template : template
  }

});
