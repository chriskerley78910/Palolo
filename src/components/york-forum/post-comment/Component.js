/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2020-07-14
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'text!york-forum/post-comment/template.html',
        'dispatcher/Dispatcher',
        'york-forum/YorkForumStore'],

function(ko, template, Dis,  Store){

    function View(params) {

      this.dis = new Dis()
      this.comment = ko.observable('')
      this.submitComment = (function(component){
        // this.dis.dispatch('submitComment',this.replyId)
      }).bind(this)


}


  return {
    template: template,
    viewModel:View
  }

});
