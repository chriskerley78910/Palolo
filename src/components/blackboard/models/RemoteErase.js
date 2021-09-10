define(['blackboard/models/Erase'],
function(Erase){

  var RemoteErase = function(data){
    Object.setPrototypeOf(this,new Erase(data))


    this.setX = function(x){
      if(x > 1 || x < 0)
        throw new Error('x must be between 0 and 1')
      this.x = x
    }
    this.setX(data.x)

    this.setY = function(y){
      if(y > 1 || y < 0)
        throw new Error('y must be between 0 and 1')
      this.y = y
    }
    this.setY(data.y)


    this.setFriendId = function(id){
      this.friendId = id
    }
    this.setFriendId(data.friend_id)

    this.getFriendId = function(){
      return this.friendId
    }

    this.setBoardId = function(id){
      this.boardId = id
    }
    this.setBoardId(data.board_id)

    this.getBoardId = function(){
      return this.boardId
    }

    this.isForCurrentBoard = function(friendId, boardId){
      var sameFriend = friendId == this.friendId
      var sameBoard = this.boardId == boardId
      return  sameFriend && sameBoard
    }

    this.serialize = function(){
      return {
        x:this.x,
        y:this.y,
        r:this.rad,
        board_id:this.getBoardId(),
        friend_id:this.getFriendId()
      }
    }
  }

  RemoteErase.getRaw = function(){
    var r = Erase.getRaw()
    r.board_id = 2
    r.friend_id = 3
    return r
  }


  RemoteErase.getFake = function(){
    var r = RemoteErase.getRaw()
    return new RemoteErase(r)
  }

  RemoteErase.create = function(x,y,r){
    return new RemoteErase({x:x, y:y, r:r})
  }

  return RemoteErase;

});
