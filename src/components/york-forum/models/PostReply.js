
define(['abstract-interfaces/ValidObject',
        'ko'],
function(ValidObject, ko){

  var PostReply = function(raw, host){

    Object.setPrototypeOf(this, new ValidObject())
    this.author = ''
    this.userPhotoURL = ko.observable('./assets/no-photo.jpg')
    this.owner = null
    this.postId = null
    this.message = ''
    this.replies = ko.observableArray([])
    this.commentBoxOpen = ko.observable(false)


    // used for passing along the component tree.
    this.getSelf = (function(){
      return this
    }).bind(this)

    this.openCommentBox = function(){
      // this.commentBoxOpen(true)
    }

    this.isCommentBoxOpen = function(){
      return this.commentBoxOpen()
    }


    this.equals = function(reply){
      return reply.isReply() && this.getId() == reply.getId()
    }

    this.getReplies = function(){
      return this.replies()
    }

    this.isOwner = function(){
      return this.owner
    }

    this.setOwner = function(i){
      this.validateBool(i)
      this.owner = i
    }
    this.setOwner(raw.is_owner)

    this.setHost = function(host){
      this.validateStr(host)
      this.host = host
    }
    this.setHost(host)

    this.getHost = function(){
      return this.host
    }

    this.setUserPhotoURL = function(url){
      if(url != null){
        this.validateStr(url)
        this.userPhotoURL(host + '/' + url)
      }
    }
    this.setUserPhotoURL(raw.small_photo_url)

    this.getUserPhotoURL = function(){
      return this.userPhotoURL()
    }

    this.getKOUserPhotoURL = function(){
      return this.userPhotoURL
    }

    this.setId = (function(id){
      this.validateId(id)
      this.replyId = id
    }).bind(this)
    this.setId(raw.reply_id)

    this.getId = function(){
      return this.replyId
    }

    this.setPostId = function(id){
      this.validateId(id)
      this.postId = id
    }
    this.setPostId(raw.post_id)

    this.getPostId = function(){
      return this.postId
    }


    this.addChild = function(reply){
      if(!this.isDuplicate(reply)){
        this.replies().push(reply)
        this.replies.valueHasMutated()
      }
    }

    this.getChildAt = function(index){
      return this.replies()[index]
    }

    this.getChildCount = function(){
      return this.replies().length
    }

    this.isDuplicate = function(reply){
      for(var i = 0; i < this.replies().length; i++){
        if(this.replies()[i].getId() == reply.getId()){
          return true
        }
      }
      return false
    }



    this.setParentId = function(id){
      if(id == null){
        this.parentId = null
      } else {
        this.validateId(id)
        this.parentId = id
      }
    }
    this.setParentId(raw.parent_id)


    this.getParentId = function(){
      return this.parentId
    }

    this.isReply = function(){
      return true
    }

    this.getAuthor = function(){
      return this.author
    }

    this.setAuthor = function(author){
      this.validateStr(author)
      this.author = author
    }
    this.setAuthor(raw.first + ' ' + raw.last)


    this.getUserId = function(){
      return this.userId
    }

    this.setUserId = function(id){
      this.validateId(id)
      this.userId = id
    }
    this.setUserId(raw.user_id)

    this.setTimestamp = function(time){
      this.validateStr(time)
      this.timestamp = time
    }
    this.setTimestamp(raw.timestamp)

    this.getTimestamp = function(){
      return this.timestamp
    }



    this.setBody = function(body){
      this.validateStr(body)
      this.message = body
    }
    this.setBody(raw.body)


    this.getBody = function(){
      return this.message
    }


  }

  PostReply.buildOutgoing = function(obj){
    var r = PostReply.getFake()
    r.setBody(obj.body)
    r.setParentId(obj.parentId)
    return r
  }

  PostReply.getRaw = function(){
    return {
      reply_id:1,
      post_id:5,
      parent_id:2,
      user_id:3,
      body:'body',
      first:'Chris',
      last:'Kerley',
      small_photo_url:'fakephotourl',
      timestamp:'1 min',
      is_owner:1
    }
  }

  PostReply.getFake = function(){
    var fakeHost = 'fakehost'
    return new PostReply(PostReply.getRaw(),fakeHost)
  }


  return PostReply;
})
