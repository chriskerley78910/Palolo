define(['dispatcher/Dispatcher',
        'abstract-interfaces/Store',
        'york-forum/YorkForumRemoteService',
        'people-models/Person'],
function(Dispatcher,
         Store,
         RemoteService,
         Person){

   new RemoteService()
   var instance = null;
   var YorkForumStore  = function(){

     Object.setPrototypeOf(this, new Store())
     this.dis = new Dispatcher()
     this.spinnerOn = false
     this.visible = true
     this.forumPosterVisible = false
     this.posts = []
     this.postError = ''
     this.postSuccessful = false
     this.userPhotoURL = null
     this.userName = null
     this.memberCount = 0

     this.getMemberCount = (function(){
       return this.memberCount
     }).bind(this)


     this.onForumMemberCount = (function(count){
       if(typeof count != 'number' || count < 0)
        throw new Error('member count  must be a non-negative integer.')
       this.memberCount = count
       this.pub()
     }).bind(this)
     this.dis.reg('forumMemberCount',this.onForumMemberCount)


     this.updatePost = (function(serverPost){
       var p = this.getPost(serverPost.getId())
       if(!p) return
       if(serverPost.isAlreadyVoted()) p.setAlreadyVoted(1)
       else p.setAlreadyVoted(null)
       p.setVoteCount(serverPost.getVoteCount())
       this.pub()
     }).bind(this)
     this.dis.reg('postUpdated',this.updatePost)

     this.getPost = (function(postId){
       var post = null
       this.posts.forEach(function(p){
         if(p.getId() == postId){
           post = p
         }
         return
       })
       return post
     }).bind(this)


     this.getUserName = function(){
       return this.userName
     }



     this.onCommentPost = (function(){
       this.spinnerOn = true
       this.pub()
     }).bind(this)

     this.onDeleteAllPostReplies = (function(post){
       var postId = post.getId()
       var post = this.getPost(postId)
       if(post){
         post.deleteReplies()
         post.resetReplyCount()
         this.pub()
       }
     }).bind(this)
     this.dis.reg('deleteAllPostReplies', this.onDeleteAllPostReplies)


     /**
      Assumes that
     */
     this.onPostReplies = (function(replies){
       if(replies.length > 0){
         var targetPostId = replies[0].getPostId()
         for(var i = 0; i < this.posts.length; i++){
           if(this.posts[i].getId() == targetPostId){
             this.posts[i].setReplies(replies)
             break
           }
         }
         this.pub()
       }
     }).bind(this)
     this.dis.reg('postReplies',this.onPostReplies)


     this.onShowPost = (function(post){
       for(var i = 0; i < this.posts.length; i++){
          var current = this.posts[i]
          if(current.getId() == post.getId()){
            current.setExpanded(true)
            current.clearComment()
          } else {
            current.setExpanded(false)
          }
        }
        this.pub()
     }).bind(this)
     this.dis.reg('showPost',this.onShowPost)

     this.getUserPhoto = function(){
       return this.userPhotoURL
     }

     this.onProfileInfo = (function(user){
       this.userPhotoURL = user.small_photo_url
       this.userName = user.first + ' ' + user.last
       this.pub()
     }).bind(this)
     this.dis.reg('profileUpdate',this.onProfileInfo)


     this.onForumPosts = (function(posts){
       this.posts = posts
       this.pub()
     }).bind(this)
     this.dis.reg('forumPosts', this.onForumPosts)


     this.onOpenForumPoster = (function(){
       this.forumPosterVisible = true
       this.pub()
     }).bind(this)
     this.dis.reg('openForumPoster', this.onOpenForumPoster)

     this.isVisible = (function(){
       return this.visible;
     }).bind(this)

     this.onOpenNews = (function(){
       this.visible = true
       this.pub()
     }).bind(this)
     this.dis.reg('openNews',this.onOpenNews)



     this.hideNews = (function(person){
       this.visible = false
       this.pub()
     }).bind(this)
     this.dis.reg('focusPerson', this.hideNews)
     this.selGrpId = this.dis.reg('selectedGroupId',this.hideNews)

     this.isForumPosterVisible = (function(){
       return this.forumPosterVisible
     }).bind(this)


     this.hide = (function(){
       this.forumPosterVisible = false
       this.pub()
     }).bind(this)
     this.dis.reg('hideYorkForumPoster',this.hide)

     this.onForumPostDeleted = (function(postId){
       for(var i = 0; i < this.posts.length; i++){
         if(this.posts[i].getId() == postId){
           this.posts.splice(i,1)
         }
       }
       this.spinnerOn = false
       this.pub()
     }).bind(this)
     this.dis.reg('forumPostDeleted',this.onForumPostDeleted)

     this.onServerCall = (function(){
       this.spinnerOn = true
       this.pub()
     }).bind(this)
     this.dis.reg('postForumMessage',this.onServerCall)
     this.dis.reg('deleteForumPost',this.onServerCall)


     this.isSpinnerOn = function(){
       return this.spinnerOn
     }

     this.isPostSuccessful = function(){
       return this.postSuccessful
     }

     this.getPosts = function(){
       return this.posts
     }

     this.getPostError = function(){
       return this.postError
     }

     this.onClearPosterError = (function(){
       this.spinnerOn = false
       this.postError = ''
       this.pub()
     }).bind(this)
     this.dis.reg('clearPosterError',this.onClearPosterError)

     this.onPostError = (function(err){
       this.postError = err
       this.forumPosterVisible = false
       this.pub()
     }).bind(this)
     this.dis.reg('postError',this.onPostError)

     this.onPostSuccess = (function(post){
       this.posts.unshift(post)
       this.postSuccessful = true
       this.spinnerOn = false
       this.forumPosterVisible = false
       this.pub()
       var self = this
       setTimeout(this.hideSuccess,1500)
     }).bind(this)
     this.dis.reg('postSuccess',this.onPostSuccess)

     this.hideSuccess = (function(){
       this.postSuccessful = false
       this.pub()
     }).bind(this)


  } // end


    return {
      getInstance:function(){
        if(!instance){
          instance = new YorkForumStore();
        }
        return instance;
      },
      getNew:function(){
        return new YorkForumStore();
      }
    }
  })
