
define(['abstract-interfaces/ValidObject',
        'ko'],
function(ValidObject, ko){

  var ForumPost = function(raw){

    Object.setPrototypeOf(this, new ValidObject())
    this.expanded = ko.observable(false)
    this.comment = ko.observable('')
    this.replies = ko.observableArray([])
    this.replyCount = ko.observable(0)
    this.voteCount = ko.observable(0)
    this.alreadyVoted = ko.observable(false)
    this.rep = 0

    this.setAlreadyVoted = function(already){
      if(already == null){
        this.alreadyVoted(false)
      } else {
        this.validateId(already)
        this.alreadyVoted(true)
      }
    }
    this.setAlreadyVoted(raw.already_voted)

    this.isAlreadyVoted = function(){
      return this.alreadyVoted()
    }

    this.getRootReplyCount = function(){
      return this.replies().length
    }


    this.setVoteCount = function(votes){
      if(votes == null){
        this.voteCount(0)
      } else{
        this.validateId(votes + 1)
        this.voteCount(votes)
      }
    }
    this.setVoteCount(raw.votes)


    this.getVoteCount = function(){
      return this.voteCount()
    }


    this.setReplyCount = function(count){
      if(count == null) this.replyCount(0)
      else {
        this.validateId(count)
        this.replyCount(count)
      }
    }
    this.setReplyCount(raw.reply_count)

    this.incrementReplyCount = function(){
      this.replyCount(this.replyCount() + 1)
    }


    this.deleteReplies = function(){
      this.replies([])
    }

    this.resetReplyCount = function(){
      this.replyCount(0)
    }


    this.deleteReply = function(replyId){
      var replies = this.replies()
      this.recursiveDelete(replyId, replies)
    }

    this.recursiveDelete = function(replyId, replies){
      if(replies.length < 1){
        return
      }

      for(var i = 0; i < replies.length; i++){
        var r = replies[i]
        if(r.getId() == replyId){
          replies.splice(i, 1)
          return true
        } else {
          var subReplies = r.getReplies()
          this.recursiveDelete(replyId, subReplies)
        }
      }
    }

    // pre1: You can assume that the index of a child is always
    //       greater than the parent.
    //
    // pre2: All root replies have null as their parentId
    // post1: behvaiour is undefined if the parentId or root replies is not null.
    this.setReplies = function(replies){
      this.deleteReplies()
      this.resetReplyCount()
      for(var r = 0; r < replies.length; r++){
        var root = replies[r]
        if(!root.isReply) throw new Error('must be a reply.')
        this.recurse(root, replies, r + 1)
        if(root.getParentId() == null){
            this.replies().push(root)
            this.incrementReplyCount()
        }
      }
    }


    this.recurse = function(parent, replies, index){
      for(var i = index; i < replies.length; i++){
        var next = replies[i]
        if(!next.isReply) throw new Error('must be a reply')
        if(next.getParentId() == parent.getId()){
          parent.addChild(next)
          this.incrementReplyCount()
          this.recurse(next, replies, i + 1)
        }
      }
    }

    this.isDuplicate = function(replyId){
      var found = false
      this.replies().forEach(function(r){
        if(r.getId() == replyId){
          found = true
          return
        }
      })
      return found
    }

    this.clearComment = function(){
      this.comment('')
    }

    this.getComment = function(){
      return this.comment()
    }

    this.getCommentHTML = function(){
        return this.getComment().replace(/\n/gi,'<br />');
    }


    this.setComment = function(text){
      if(typeof text != 'string' || text.length < 1)
        throw new Error('comment cannot be set to empty')
      this.comment(text)
    }

    this.getReplyCount = function(){
      return this.replyCount()
    }




    this.setExpanded = function(bool){
      this.expanded(bool)
    }

    this.isExpanded = function(){
      return this.expanded()
    }

    this.setId = (function(id){
      this.validateId(id)
      this.id = id
    }).bind(this)
    this.setId(raw.post_id)

    this.getId = function(){
      return this.id
    }

    this.getAuthor = function(){
      return this.author
    }

    this.setAuthor = function(author){
      this.validateStr(author)
      this.author = author
    }
    this.setAuthor(raw.first + ' ' + raw.last)

    this.setRep = function(rep){
      if(typeof rep != 'number' || rep < 0) return
      this.rep = 'Reputation: ' + rep
    }
    this.setRep(raw.author_rep)

    this.getRep = function(){
      return this.rep
    }

    this.isPoster = function(){
      return this.poster
    }

    this.setPoster = function(poster){
      if(poster == 1) this.poster = true
      else this.poster = false
    }
    this.setPoster(raw.is_owner)


    this.getUserId = function(){
      return this.userId
    }

    this.setUserId = function(id){
      this.validateId(id)
      this.userId = id
    }
    this.setUserId(raw.user_id)

    this.setTimestamp = function(time){
      try{
        this.validateStr(time)
        this.timestamp = time
      }catch(err){
        this.timestamp = '';
      }
    }
    this.setTimestamp(raw.timestamp)

    this.getTimestamp = function(){
      return this.timestamp
    }

    this.getTitle = function(){
      return this.title
    }

    this.setTitle = function(title){
      this.title = title
    }
    this.setTitle(raw.title)

    this.hasAnchorTag = function(body){
      return /<a/.test(body)
    }

    this.changeTarget = function(body){
      return body.replace('<a','<a target="_blank" rel="noopener noreferrer"')
    }


    this.setBody = function(body){
      this.validateStr(body)
      if(this.hasAnchorTag(body)){
        body = this.changeTarget(body)
      }
      this.body = body
    }
    this.setBody(raw.body)



    this.getBody = function(){
      return this.body
    }




  }

  ForumPost.buildOutgoing = function(obj){
    var o = ForumPost.getFake()
    o.setTitle(obj.title)
    o.setBody(obj.body)
    return o
  }

  ForumPost.getRaw = function(){
    return {
      post_id:1,
      user_id:2,
      title:'title',
      body:'text',
      first:'Chris',
      last:'Kerley',
      author_rep:5,
      timestamp:'nulltime',
      is_owner:1,
      reply_count:2,
      votes:3,
      already_voted:1
    }
  }

  ForumPost.getFake = function(){
    return new ForumPost(ForumPost.getRaw())
  }


  return ForumPost;
})
