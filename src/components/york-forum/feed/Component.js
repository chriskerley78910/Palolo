/**
 * @license Proprietary - Please do not steal our hard work. Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2020-07-14
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'text!forum-feed/template.html',
        'dispatcher/Dispatcher',
        'york-forum/YorkForumStore'],

function(ko, template, Dis,  Store){

  function View(){
    this.dis = new Dis()
    this.isVisible = ko.observable(false)
    this.store = Store.getInstance()
    this.posts = ko.observableArray([])
    this.userPhotoURL = ko.observable('')
    this.userFullName = ko.observable('')

    this.onStore = (function(){
      this.isVisible(this.store.isVisible())
      var p = this.store.getPosts()
      p.forEach(function(post){
        post.replies.valueHasMutated()
      })
      this.posts(p)
      this.userPhotoURL(this.store.getUserPhoto())
      this.userFullName(this.store.getUserName())
    }).bind(this)
    this.store.sub(this.onStore)


    this.gotoPerson = (function(vm, e){
      if(e){
        e.stopPropagation()
        return false
      }
    }).bind(this)

    this.openPoster = (function(){
      this.dis.dispatch('openForumPoster')
    }).bind(this)


    this.toggleVote = (function(post,e){
      if(post.isAlreadyVoted()){
        this.dis.dispatch('removeVote',post)
      } else {
        this.dis.dispatch('upvotePost',post)
      }
      e.stopPropagation()
      return false
    }).bind(this)


    this.deletePost = (function(post,e){
      if (confirm('Are you sure you want to delete?')) {
        this.dis.dispatch('deleteForumPost',post)
      }
      e.stopPropagation()
      return false
    }).bind(this)

    this.showPost = (function(post){
      if(!post.isExpanded()){
          this.dis.dispatch('showPost',post)
      } else {
        return false
      }
    }).bind(this)

    this.commentPost = (function(post){
      var postId = post.getId()
      var message = post.getCommentHTML()
      post.clearComment()
      this.dis.dispatch('commentPost',{postId:postId, message:message})
    }).bind(this)
  };

  return {
    viewModel: View,
    template : template
  }

});
