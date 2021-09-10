
define(['ActiveRemoteService',
        'format-converter',
        'dispatcher/Dispatcher',
        'york-forum/models/ForumPost',
        'york-forum/models/PostReply',
        'ko'],
function(ActiveRemoteService,
         FormatConverter,
         Dispatcher,
        ForumPost,
        PostReply,
        ko){

  var YorkForumRemoteService = function(){
      Object.setPrototypeOf(Object.getPrototypeOf(this),new ActiveRemoteService());
      this.setMicroServer("forum");
      this.dis = new Dispatcher();

      this.removeVote = (function(post){
        var url = this.getServerURL() + '/removeVote';
        var json = JSON.stringify(this.flatten(post))
        $.ajax({
          url:url,
          type:"DELETE",
          data:json,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          beforeSend:this.setAuthorizationHeader,
          success:this.onPostsChanged,
          error:this.onError
        })
      }).bind(this)
      this.dis.reg('removeVote',this.removeVote)


      this.upvotePost = (function(post){
        var url = this.getServerURL() + '/upvotePost';
        var json = JSON.stringify(this.flatten(post))
        $.ajax({
          url:url,
          type:"POST",
          data:json,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          beforeSend:this.setAuthorizationHeader,
          success:this.onPostsChanged,
          error:this.onError
        })
      }).bind(this)
      this.dis.reg('upvotePost',this.upvotePost)

      this.onPostsChanged = (function(post){
        try{
          var wrapped = new ForumPost(post)
          this.dis.dispatch('postUpdated',wrapped)
        } catch(err){
          alert(err.message)
          this.onError('Malformed post received from server.')
        }
      }).bind(this)


      this.onReplyToReply = (function(reply){
        var url = this.getServerURL() + '/replyToReply';
        var json = JSON.stringify(this.flatten(reply))
        $.ajax({
          url:url,
          type:"POST",
          data:json,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          beforeSend:this.setAuthorizationHeader,
          success:this.onCommentsChanged,
          error:this.onError
        })
      }).bind(this)
      this.dis.reg('replyToReply',this.onReplyToReply)



      this.onDeleteComment = (function(comment){
        var url = this.getServerURL() + '/comment';
        var json = JSON.stringify(this.flatten(comment))
        $.ajax({
          url:url,
          type:"DELETE",
          data:json,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          beforeSend:this.setAuthorizationHeader,
          success:this.onCommentsChanged,
          error:this.onError
        })
      }).bind(this)
      this.dis.reg('deleteComment', this.onDeleteComment)



      this.commentPost  = (function(post){
        var url = this.getServerURL() + '/commentForumPost';
        var json = JSON.stringify(this.flatten(post))
        $.ajax({
          url:url,
          type:"POST",
          data:json,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          beforeSend:this.setAuthorizationHeader,
          success:this.onCommentsChanged,
          error:this.onError
        })
      }).bind(this)
      this.dis.reg('commentPost',this.commentPost)


      this.onCommentsChanged = (function(rawPost){
        var post = new ForumPost(rawPost)
        this.getForumReplies(post)
      }).bind(this)


      this.getForumReplies = (function(post){
        var url = this.getServerURL() + '/postReplies?postId=' + post.getId();
        $.ajax({
          url:url,
          type:"GET",
          beforeSend:this.setAuthorizationHeader,
          success:this.onRepliesReceived,
          error:this.onError
        })
      }).bind(this)
      this.dis.reg('showPost', this.getForumReplies)


      // expected either an array or a raw post object.
      this.onRepliesReceived = (function(response){
        try{
          if(Array.isArray(response)){
            var replies = this.wrapReplies(response)
            this.dis.dispatch('postReplies',replies)
          } else {
            var post = new ForumPost(response)
            this.dis.dispatch('deleteAllPostReplies',post)
          }

        } catch(err){
          this.onError(err.message)
        }
      }).bind(this)


      this.wrapReplies = (function(raws){
        var replies = []
        var host = this.getServerURL()
        for(var k = 0; k < raws.length; k++){
          replies.push(new PostReply(raws[k], host))
        }
        return replies
      }).bind(this)

      this.onDeleteForumPost = (function(post){
        var url = this.getServerURL() + '/deleteForumPost';
        var json = JSON.stringify(this.flatten(post))
        $.ajax({
          url:url,
          type:"POST",
          data:json,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          beforeSend:this.setAuthorizationHeader,
          success:this.onPostDeleted,
          error:this.onError
        })
      }).bind(this)
      this.dis.reg('deleteForumPost', this.onDeleteForumPost)


      this.onPostDeleted = (function(postId){
        this.dis.dispatch('forumPostDeleted',postId)
      }).bind(this)


      this.onPostForumMessage = (function(post){
        var url = this.getServerURL() + '/postYorkForum';
        var json = JSON.stringify(this.flatten(post))
        $.ajax({
          url:url,
          type:"POST",
          data:json,
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          beforeSend:this.setAuthorizationHeader,
          success:this.onPostSuccess,
          error:this.onError
        })
      }).bind(this)
      this.dis.reg('postForumMessage',this.onPostForumMessage)


      this.onPostSuccess = (function(rawPost){
        try{
          var wrapped = new ForumPost(rawPost)
          this.dis.dispatch('postSuccess',wrapped)
        }catch(err){
          this.onError(err.message)
        }
      }).bind(this)


      this.onError = (function(err){
        if(err.responseText){
          err = err.responseText
        }
        this.dis.dispatch('postError',err)
      }).bind(this)


      this.onAuth = (function(update){
        if(update.state == 'authenticated'){
          this.getYorkForumPosts()
        }
      }).bind(this)
      this.dis.reg('authState',this.onAuth)


      this.getYorkForumPosts = (function(){
        $.ajax({
          url:this.getServerURL() + '/posts',
          type:"GET",
          beforeSend:this.setAuthorizationHeader,
          success:this.onYorkForumPosts,
          error:this.onError
        })
      }).bind(this)


      this.onYorkForumPosts = (function(data){
        try {
          var forumMemberCount = data.count
          var wrapped = []
          var self = this
          data.posts.forEach(function(post){
            var post = new ForumPost(post)
            wrapped.push(post)
          })
          this.dis.dispatch('forumMemberCount', forumMemberCount)
          this.dis.dispatch('forumPosts',wrapped)
        } catch(err){
          console.log(err)
          this.onError('There was a problem loading the news. Please try again later.')
        }
      }).bind(this)


      this.getFakeRepliesComplex = function(){
        return [{
          reply_id:1,
          parent_id:null,
          user_id:1,
          post_id:52,
          body:'body',
          first:'root',
          last:'1',
          timestamp:'1 min ago'
        },
        {
          reply_id:2,
          parent_id:1,
          post_id:52,
          user_id:4,
          body:'I am a child',
          first:'root 1',
          last:'child 1',
          timestamp:'1 min ago'
        },
        {
          reply_id:3,
          parent_id:1,
          post_id:52,
          user_id:8,
          body:'I am a child',
          first:'root 1 -',
          last:'child 2',
          timestamp:'1 min ago',
        },
        {
          reply_id:4,
          parent_id:3,
          post_id:52,
          user_id:8,
          body:'I am a child of root 1 - child 2',
          first:'child 2 -',
          last:'child 3',
          timestamp:'1 min ago'
        }
      ]
    } // end

      this.getSimpleRawReply = function(){

              return [{
                reply_id:1,
                parent_id:null,
                post_id:52,
                user_id:1,
                body:'body',
                first:'root',
                last:'1',
                timestamp:'1 min ago'
              }]
      }

      this.getMedRawReply = function(){

              return [{
                reply_id:1,
                parent_id:null,
                user_id:1,
                body:'body',
                first:'root',
                last:'1',
                timestamp:'1 min ago'
              },{
                reply_id:2,
                parent_id:1,
                user_id:1,
                body:'body',
                first:'child',
                last:'1',
                timestamp:'1 min ago'
              }]
      }



//       {
//         reply_id:1,
//         author:'Cindy',
//         message:`I believe classes are capped due to the amount and difficulty of work that has to be marked, not the physical number of seats required to accommodate all students. I can't imagine the TA for the current 4101 section having to mark 50+ versions of each assignment when the solutions and proofs can be so convoluted.`,
//         replies:ko.observableArray([
//           {
//             reply_id:4,
//               author:'Rayhelm',
//             message:`You only need one prof for a class, not 6+ like York has. That one can hire an army of T.A.s as they are cheap and plentiful.
//
// Except if York did that they would probably keep the crappiest Prof of the bunch.`,
//             replies:ko.observableArray([])
//           }
//         ])
//       },
//       {
//         reply_id:3,
//         author:'Cindy',
//         message:'So fools and liberals',
//         replies:ko.observableArray([
//           {
//             reply_id:4,
//               author:'Linda',
//             message:'Fuck',
//             replies:ko.observableArray([])
//           },
//           {
//             reply_id:4,
//               author:'Linda',
//             message:'Fuck',
//             replies:ko.observableArray([    {
//                   reply_id:4,
//                     author:'Linda',
//                   message:'In the future try asking some upper year people to enroll in your courses when there enrollment window opens and when your enrollment window opens ask them to drop those courses so you will be able to take that spot.',
//                   replies:ko.observableArray([])
//                 }])
//           }
//
//         ])
//       }
//     ]


  }
  return YorkForumRemoteService;
})
