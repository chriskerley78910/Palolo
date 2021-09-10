define(['blackboard/boards/BlackBoard',
        'blackboard/models/Erase'],
function(BlackBoard, Erase){

    var BlackboardCollection = function(){

      this.boards = [];
      this.index = -1;

      this.contains = function(board){
        return this.getBoardById(board.board_id) != null
      }

      this.getLastBoard = function(){
        if(this.boards.length == 0)
          throw new Error('Cannot get a last board because no boards exist yet.')
        return this.boards[this.boards.length - 1]
      }

      this.getBoards = function(){
        return this.boards.slice(0);
      }


      this.getBoardById = function(id){
        var board = null
        this.boards.forEach(function(b){
          if(b.getId() == id){
            board = b
            return
          }
        })
        return board
      }

      this.setBoards = (function(boards){
        if(!Array.isArray(boards)){
          throw new Error("Needs to be an array.");
        }
        else if(boards.length < 1){
          throw new Error("Needs to have at least one element.");
        }
        this.boards = [];
        for(var i = 0; i < boards.length; i++){
          var rawData = boards[i];
          var blackboard = new BlackBoard(rawData);
          this.boards.push(blackboard);
        }
        var index = this.getLastViewedBoardIndex();
        this.index = index;
      }).bind(this)


      this.getLastViewedBoardIndex = function(){
        var candidateCurrentBoard = null;
        var latestSoFar = 0;
        var index = 0;
        for(var i = 0; i < this.boards.length; i++){
          var loadTime = this.boards[i].getLastTimeLoadedMillis()
          if(loadTime > latestSoFar){
            index = i;
            latestSoFar = loadTime;
          }
        }
        return index;
      }


      this.appendBoard = function(rawBoard){
        var blackBoard = new BlackBoard(rawBoard);
        this.boards.push(blackBoard);
        if(this.getCount() == 1) this.index = 0
      }

      this.setIndexToLastBoard = function(){
        this.index = this.boards.length - 1;
      }

      this.setCurrentBoardById = function(boardId){
        for(var i = 0; i < this.getCount(); i++){
          var candidateId = this.boards[i].getId();
          if(boardId == candidateId){
            this.index = i;
            return;
          }
        }
        throw new Error("That boardId does not exist in the board set.");
      }


      this.setCurrentBoardIndex = function(index){
        if(isNaN(index) || index < 0 || index >= this.getCount()){
          throw new Error("Invalid index.");
        }
        this.index = index;
      }


      this.deleteAll = function(){
        this.index = null;
        this.boards = [];
      }

      this.appendCommandsToCurrentBoard = function(commands){
        var self = this
        commands.forEach(function(c){
          self.boards[self.index].append(c)
        })
      }

      this.getCurrentBoardDeepCopy = function(){
        return this.boards[this.index].deepCopy();
      }

      this.getSerializedCurrentBoard = function(){
        return this.getCurrentBoardDeepCopy().serialize()
      }

      // private.
      this._getCurrentBoard = function(){
        var board = this.boards[this.index];
        if(!board){
          throw new Error("Current board has not been initialized.");
        }
        else{
          return board;
        }
      }

      this.pushEraserCallOntoState = function(command){
        if(this.isEmpty()){
          throw new Error("Can't store erase call because current board does not exist yet.");
        } else if(!command.isBoardable || !command.isBoardable()){
          throw new Error('Can only add Boardable objects to a Blackboards state.')
        }
        var b = this._getCurrentBoard();
        b.setDirty();
        b.append(command);
      }

      this.appendLineToCurrentBoard = function(line){
        var b = this._getCurrentBoard();
        b.append(line);
        b.setDirty();
      }

      this.appandCommandToAnotherBoard = function(line){
        this.boards.forEach(function(b){
          if(b.getId() == line.getBoardId()){
            b.append(line)
            b.updateLastModified()
            return;
          }
        })
      }


      this.getCurrentBoardCommandCount = function(){
        return this._getCurrentBoard().getCommands().length;
      }

      this.isEmpty = function(){
        return this.boards.length == 0;
      }

      this.isNotEmpty = function(){
        return this.boards.length > 0
      }

      this.getCount = function(){
        return this.boards.length;
      }

      this.getCurrentBoardIndex = function(){
        return this.index;
      }

      this.getCurrentBoardCommands = function(){
        return this._getCurrentBoard().getCommands();
      }

      this.getCurrentBoardId = function(){
        return this._getCurrentBoard().getId();
      }

      this.isCurrentBoardDirty = function(){
        var board = this._getCurrentBoard();
        if(board){
          return board.isDirty();
        }
        else{
          return false;
        }
      }
      this.isCurrentBoardDirty = this.isCurrentBoardDirty.bind(this);

      this.getCurrentBoardURL = function(){
        return this._getCurrentBoard().getURL();
      }

      this.setCurrentBoardCommands = function(state){
        this._getCurrentBoard().setCommands(state);
      }
    }

    BlackboardCollection.getFake = function(){
      var b1 = BlackBoard.getRaw()
      var b2 = BlackBoard.getRaw()
      b2.board_id = b1.board_id + 1
      var boards = [b1,b2]
      var c = new BlackboardCollection()
      c.setBoards(boards)
      return c
    }


    return BlackboardCollection;
});
