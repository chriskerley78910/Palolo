define([],
function(){

  var Line = function(data){

    this.boardId = null
    this.friendId = null




    this.setColor = function(color){
      this.color = color
    }
    this.setColor(data.color)

    this.getColor = function(){
      return this.color
    }

    this.isLine = function(){
      return true
    }

    this.isBoardable = function(){
      return true
    }

    this.getColor = function(){
      return this.color
    }

    this.getBoardId = function(){
      return this.boardId
    }

    this.setBoardId = function(id){
      this.boardId = id
    }
    this.setBoardId(data.board_id)

    this.isOnBoard = function(otherId){
      return this.boardId == otherId
    }

    this.getFriendId = function(){
      return this.friendId
    }

    this.setFriendId = function(id){
      this.friendId = id
    }
    this.setFriendId(data.friend_id)

    this.isFrom = function(id){
      return this.friendId == id
    }

    this.checkKind = function(kind){
      if(kind != 'line')
        throw new Error('kind was expected to be of type line.')
    }
    this.checkKind(data.kind)

    this.getEndPoint = function(){
      var self = this
      return {
        getX:function(){
          return self.getEndX()
        },
        getY:function(){
          return self.getEndY()
        }
      }
    }

    this.getStartX = function(){
      return this.x0
    }

    this.setStartX = function(x0){
      this.x0 = x0
    }
    this.setStartX(data.x0)


    this.getStartY = function(){
      return this.y0
    }

    this.setStartY = function(y0){
      this.y0 = y0
    }
    this.setStartY(data.y0)

    this.getEndX = function(){
      return this.x1
    }

    this.setEndX = function(x1){
      this.x1 = x1
    }
    this.setEndX(data.x1)


    this.getEndY = function(){
      return this.y1
    }

    this.setEndY = function(y1){
      this.y1 = y1
    }
    this.setEndY(data.y1)


    this.serialize = function(){
      return {
        color:this.color,
        x0:this.x0,
        y0:this.y0,
        x1:this.x1,
        y1:this.y1,
        kind:'line',
        board_id:this.getBoardId(),
        friend_id:this.getFriendId()
      }
    }
  } // end

  Line.WHITE = '#ffffff'

  Line.getDefaultColor = function(){
    return Line.WHITE
  }

  Line.getRaw = function(){
    return {color:'#ffffff',board_id:6, friend_id:7, x0:2, y0:3, x1:4, y1:5, kind:'line'}
  }

  Line.getFake = function(){
    var r = Line.getRaw()
    return new Line(r)
  }


  return Line;

});
