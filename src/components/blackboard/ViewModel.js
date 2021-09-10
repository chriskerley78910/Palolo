this.selectedClassmateId
define([
  'ko',
  'dispatcher/Dispatcher',
  'text!blackboard/template.html',
  'blackboard/BlackboardRemoteService',
  'blackboard/canvas/Canvas',
  'blackboard/boards/BlackBoard',
  'blackboard/boards/BlackboardCollection',
  'blackboard/models/Line',
  'blackboard/models/Erase',
  'blackboard/models/RemoteErase',
  'blackboard/BlackboardStore',
],
function(ko,
         Dispatcher,
         template,
         RemoteService,
         Canvas,
         Blackboard,
         BlackboardCollection,
         Line,
         Erase,
         RemoteErase,
         BlackboardStore){

  function BlackboardViewModel(params,componentInfo){


    this.dis = new Dispatcher();
    this.store = BlackboardStore.getInstance()
    this.selectedClassmateId = -1;
    this.isToggleVisible = ko.observable(false);
    this.spinnerVisible = ko.observable(false);
    this.prevArrowVisible = ko.observable(false);
    this.blackboardOpen = ko.observable(false);
    this.isTrashedMessageVisible = ko.observable(false);
    this.recentlyTrashedBoards = ko.observableArray([]);
    this.isWaitingForEmail = ko.observable(false)
    this.showEmailCheckmark = ko.observable(false)
    this.isEmailOptionsOpen = ko.observable(false)


    this.remoteService = new RemoteService();
    this.SAVING_DELAY = 5000; // * 60;
    this.ERASER_RADIUS = 0.02;

    this.boards = new BlackboardCollection();


    this.white = '#ffffff'
    this.blue = '#00c4ff'
    this.green = '#00FF2D'
    this.yellow = '#ffd800'
    this.pink = '#FF00DC'

    // tool stuff.
    this._myCurrentTool = 'cursor'
    this.myToolsColor =  this.white
    this._friendsCurrentTool = 'cursor'


    this.setPencilTool = (function(){
     this._myCurrentTool = 'pencil';
     this.canvas.setMyToolToPencil();
   }).bind(this)

    this.setEraserTool = function(){
      this._myCurrentTool = 'eraser';
      this.canvas.setMyToolToEraser();
    }



    this.selectBlue = function(){
      this.myToolsColor = this.blue
      this.setPencilTool()
    }

    this.selectPink = function(){
      this.myToolsColor = this.pink
      this.setPencilTool()
    }

    this.selectYellow = function(){
      this.myToolsColor = this.yellow
      this.setPencilTool()
    }

    this.selectGreen = function(){
      this.myToolsColor = this.green
      this.setPencilTool()
    }

    this.getMyCurrentTool = (function(){
      return this._myCurrentTool;
    }).bind(this)


    this.setBoardCollection = function(boards){
      this.boards = boards
    }


    this.emailBoard = (function(){
      var png = this.canvas.getPNG()
      var friendId = this.selectedClassmateId
      var p = {friendId:friendId, img:png}
      this.remoteService.emailBlackboard(p, this.onBlackboardEmailed)
      this.isWaitingForEmail(true)
    }).bind(this)


    this.emailBoardTitle = ko.observable('')
    this.titleValid = ko.observable(false)
    this.onEmailBoardTitle = (function(title){
      if(title.length < 2) {
        this.titleError('needs to be longer.')
        this.titleValid(false)
      }
      else this.titleValid(true)
    }).bind(this)
    this.emailBoardTitle.subscribe(this.onEmailBoardTitle)


    this.emailBoardMessage = ko.observable('')
    this.messageValid = ko.observable(false)
    this.onEmailBoardMessage = (function(message){
      if(message.length < 2){
        this.messageError('message must be longer')
        this.messageValid(false)
      } else{
        this.messageValid(true)
      }
    }).bind(this)

    this.onStore = (function(){
      this.isEmailOptionsOpen(this.store.isBlackboardSharerOpen())
    }).bind(this)
    this.store.sub(this.onStore)


    this.openEmailWindow = (function(){
      this.dis.dispatch('openBlackboardSharer')
    }).bind(this)

    this.closeEmailWindow = (function(){
      this.dis.dispatch('closeBlackboardSharer')
    }).bind(this)


    this.onBlackboardEmailed = (function(){
      this.isWaitingForEmail(false)
      var self = this
      this.showEmailCheckmark(true)
      setTimeout(function(){
        self.showEmailCheckmark(false)
      },1250)
    }).bind(this)


    /**
     * "slides" the blackboard up or down.
     * @return {[type]} [description]
     */
    this.toggleVisibility = (function(){
      if(!this.blackboardOpen()){
        this.blackboardOpen(true);
        this.canvas.resizeBlackboard();
        var self = this;
        setTimeout(function(){
          self.canvas.resizeBlackboard();
        },50);
      }
      else{
          this.blackboardOpen(false);
      }
    }).bind(this)




    this.hideBlackboard = (function(){
      this.blackboardOpen(false);
      this.isToggleVisible(false);
    }).bind(this)
    this.openGroupId = this.dis.reg('showGroupView', this.hideBlackboard);
    this.groupInfoId  = this.dis.reg('groupInfo', this.hideBlackboard);
    this.dis.reg('openNews',this.hideBlackboard)




    this.handleFriendChange = (function(classmate){
      if(classmate){
        this.selectedClassmateId = classmate.getId();
        var id = this.selectedClassmateId;
        this.possiblySaveState();
        if(this.canvas.clear){
          this.canvas.clear();
        }
        this.spinnerVisible(true);
        this.remoteService.getSharedBoards(id);
        this.remoteService.joinFriend(id, this._myCurrentTool);
        this.recentlyTrashedBoards([]);
        this.isToggleVisible(true);
      }
      else{
        this.blackboardOpen(false);
      }
    }).bind(this)
    this.classmateCallbackId = this.dis.reg('focusPerson', this.handleFriendChange);




    /**
     * Asks the remote service to send out the current position of this
     * user on the black board so that the friend can see where the current
     * user is on the board.
     * @param  {object} position
     */
    this.setMyCursorPosition = (function(position){
      if(this.boards.isEmpty() == false){
        var update = {
          position:position,
          boardId:this.getCurrentBoardId(),
          friendId:this.selectedClassmateId
        }
        var self = this;
        this.remoteService.emitMyCursorPosition(update,function(){
          // on success.
        });
      }
    }).bind(this)
    this.canvas = new Canvas(this);


    /**
     * Cavvas is only updated if the friend is the currently
     * selected friend and the current board id matches
     * the board id in the update.
     * @param  {[type]} update [description]
     */
    this.onFriendsCursorPositionReceived = (function(update){
      if(this.selectedClassmateId == update.friendId && update.boardId == this.getCurrentBoardId()){
          this.canvas.drawFriendsCursor(update);
      }
      else if(this.selectedClassmateId == update.friendId){
        this.drawFriendPositionHintMarker(update);
      }
    }).bind(this)


    /**
     * Gives a hint to the current user about which
     * way they should move through the boards to
     * see what their friend is doing.
     * @param  {[type]} update [description]
     */
    this.drawFriendPositionHintMarker = (function(position){
      if(position.boardId < this.getCurrentBoardId()){
        this.canvas.drawFriendLeftMarker(position.y0);
      }
      else if(position.boardId > this.getCurrentBoardId()){
        this.canvas.drawFriendRightMarker(position.y0);
      }
    }).bind(this)



    this.setMyPencilPosition = (function(position){
      if(this.boards.isEmpty() == false){
        var update = {
          x0:position.x,
          y0:position.y,
          boardId:this.getCurrentBoardId(),
          friendId:this.selectedClassmateId
        }
        this.remoteService.emitMyPencilPosition(update);
      }
    }).bind(this)


    /**
     * Attemps to ask the canvas to draw the friends pencil
     * However if the friends pencil is on another board
     * it will no be drawn.
     * @param  {object} update
     */
    this.onFriendPencilPositionReceived =  (function(update){
        if(update.friendId == this.selectedClassmateId && this.boards.isEmpty() == false){
          if(update.boardId == this.getCurrentBoardId()){
              this.canvas.drawFriendsPencil(update);
          }
          else{
            this.drawFriendPositionHintMarker(update);
          }
        }
    }).bind(this)

    this.setMyPencilLine = function(line){
      line.setFriendId(this.selectedClassmateId)
      line.setBoardId(this.getCurrentBoardId())
      line.setColor(this.myToolsColor)
      var self = this;
      var serial = line.serialize()
      this.remoteService.emitMyPencilLine(serial, function(){
        self.onPencilLineSent(line);
        self.startSaveCountDown();
      });
    }

    /**
     * An acknowledgment function which gets
     * exectuted when a line has been successfully
     * sent out to all subscribers of the current board.
     */
    this.onPencilLineSent = (function(line){
      this.boards.appendLineToCurrentBoard(line);
      this.canvas.drawMyPencilLine(line);
    }).bind(this)


    /**
     *
     * @param  {object} position of the form {x:Number,y:Number}
     */
    this.setMyEraserPosition = (function(position){
      position.boardId = this.getCurrentBoardId();
      position.friendId = this.selectedClassmateId;
      this.remoteService.emitMyEraserPosition(position);
    }).bind(this)


    /**
     * Updates the board with the friends eraser position.
     * @param  {[type]} update [description]
     */
    this.onFriendsEraserPositionReceived = (function(update){
      if(update.friendId == this.selectedClassmateId){
        if(update.boardId == this.getCurrentBoardId()){
          this.canvas.drawFriendsEraser(update.position);
        }
        else{
          this.drawFriendPositionHintMarker(update);
        }
      }
    }).bind(this)


    this.setMyEraserDown = (function(point){
      var erase = RemoteErase.create(point.x, point.y, this.ERASER_RADIUS)
      erase.setFriendId(this.selectedClassmateId)
      erase.setBoardId(this.getCurrentBoardId())
      var s = erase.serialize()
      var self = this
      this.remoteService.emitMyEraserDown(s,function(){
        self.onEraseSent(erase)
      });
    }).bind(this)


    this.onEraseSent = (function(erase){
      this.boards.pushEraserCallOntoState(erase);
      this.canvas.eraseArea(erase);
      this.startSaveCountDown();
    }).bind(this)


    this.onFriendsEraserDown = (function(command){
      console.log('here')
      var erase = new RemoteErase(command)
      var friendId = this.selectedClassmateId
      var boardId = this.getCurrentBoardId()
      console.log('erase:')
      console.log(erase)
      console.log('friendId:' + friendId)
      console.log('boardId:' + boardId)

      if(erase.isForCurrentBoard(friendId, boardId)){
        this.boards.pushEraserCallOntoState(erase);
        this.canvas.friendEraseArea(erase);
      }
    }).bind(this)





    /**
     * Draws the friends line to the canvas if the
     * current board id is the same as the arguments
     * boardId.   also updates the current board state by
     * appending the line to it.
     *
     * friendId:Number
     * boardId:Number
     * line: {p0:{x,y},p1:{x,y}}
     */
    this.onFriendPencilLineReceived = (function(rawLine){
      var line = new Line(rawLine)
      var friendId = this.selectedClassmateId
      var boardId = this.getCurrentBoardId()

      if(line.isFrom(friendId)){
        if(line.isOnBoard(boardId)){
          this.boards.appendLineToCurrentBoard(line);
          this.canvas.drawFriendsPencilLine(line);
        }
        else{
          this.boards.appandCommandToAnotherBoard(line)
          var p = line.getEndPoint()
          this.drawFriendPositionHintMarker(p);
        }
      }
    }).bind(this)


    /**
     * Handles what happens when the board data
     * is loaded from the remote service.
     * @param  {object} board has a id and lines property.
     */
    this.onSharedBoardsReceived = (function(json){
      var boards = JSON.parse(json)
      this.boards.setBoards(boards);
      if(this.boards.getCurrentBoardIndex() > 0){
        this.prevArrowVisible(true);
      }
      else{
        this.prevArrowVisible(false);
      }
      var currentBoardId = this.getCurrentBoardId();
      this.remoteService.getBoardData(currentBoardId, this.onBoardDataReceived);
    }).bind(this)




    this.timeoutReferences = [];
    this.testMode = false;
    this.startSlowServerResponseTimer = (function(testString){
      var self = this;
        var timerReferece = setTimeout(function(){
                if(!self.testMode)
                  alert("Problem loading chalkboards, try refreshing the screen.");
          },5000);
        this.timeoutReferences.push(timerReferece);
    }).bind(this)

    this.getCurrentBoardId = function(){
      return this.boards.getCurrentBoardId()
    }


    this.processIncomingBoardData = (function(json){
      var raw = JSON.parse(json)
      var board_id = raw.board_id
      var commands = []
      if(board_id == this.getCurrentBoardId()){
        raw.commands.forEach(function(c){
          if(c.kind == 'line')
            commands.push(new Line(c))
          else
            commands.push(new Erase(c))
        })
      }
        this.spinnerVisible(false);
        return commands;
    }).bind(this)


    this.onBoardDataReceived = (function(json){
        var commands = this.processIncomingBoardData(json)
        this.canvas.drawEntireBoard(commands);
        this.boards.setCurrentBoardCommands(commands);
    }).bind(this)


    this.onAdditionalBoardData = (function(json){
        var commands = this.processIncomingBoardData(json)
        this.canvas.drawOntoBoard(commands);
        this.boards.appendCommandsToCurrentBoard(commands);
    }).bind(this)

    /**
     * Saves the changes to the server when the user
     * stops doing their work for more than a few seconds.
     * or they switch to a new board.
     */
    this.saveTimers = [];
    this.startSaveCountDown = (function(callback){
      this.clearExistingTimers();
      this.createNewSaveTimer();
    }).bind(this)


    this.clearExistingTimers = (function(){
      if(this.saveTimers.length > 0){
        for(var i = 0; i < this.saveTimers.length; i++){
          clearTimeout(this.saveTimers[i]);
        }
        this.saveTimers = [];
      }
    }).bind(this)

    /**
     * Schedules a new save event to occur after SAVING_DELAY time.
     * @param  {Function} callback  for testing purposes.
     */
    this.createNewSaveTimer = (function(callback){
      var self = this;
      var saveTimerHandle = setTimeout(function(){
        self.possiblySaveState();
        if(callback && typeof callback == 'function'){
              callback(true);
        }
      },self.SAVING_DELAY);
      this.saveTimers.push(saveTimerHandle);
    }).bind(this)




    /**
        Trashes the current board.
    **/
    this.trashCurrentBoard = (function(){
      try{
        this.spinnerVisible(true);
        var currentBoardId = this.getCurrentBoardId();
        var friendId = this.selectedClassmateId;
        this.possiblySaveState();
        this.remoteService.trashBoard(currentBoardId, friendId);
      } catch(err) {
        console.log(err.message);
      }
    }).bind(this)


    this.onBoardTrashed = (function(jsonBoard){
      var trashedBoard = JSON.parse(jsonBoard);
      var trashedBoardId = trashedBoard.boardId;
      var friendId = this.selectedClassmateId;
      this.remoteService.getSharedBoards(friendId);
      this.recentlyTrashedBoards.push(trashedBoardId);
    }).bind(this)


    this.undoTrashBoard = function(){
      if(this.recentlyTrashedBoards().length <= 0){
        throw new Error('Cannot undo because there is no recently trashed boards.');
      }
      this.possiblySaveState()
      var lastBoardTrashed = this.recentlyTrashedBoards.pop(); // oldest of the recently trashed.
      var friendId = this.selectedClassmateId;
      this.remoteService.undoTrashBoard(lastBoardTrashed, friendId);
    }

    this.onTrashBoardUndone = (function(){
      var friendId = this.selectedClassmateId;
      this.remoteService.getSharedBoards(friendId);
    }).bind(this)

    this.onFriendRestoredBoard = (function(info){
      this.validateBoardUpdateInfo(info);
      var friendId = info.friendId;
      let selectedClassmateId = this.selectedClassmateId;
      if(friendId == selectedClassmateId){
        this.remoteService.getSharedBoards(friendId);
      }
    }).bind(this)


    this.onFriendTrashedBoard = (function(json){
      var info = JSON.parse(json)
      this.validateBoardUpdateInfo(info);
      var currentFriendId = this.selectedClassmateId;
      var currentBoardId = this.getCurrentBoardId();
      if(info.friendId == currentFriendId && currentBoardId == info.boardId){
        this.remoteService.getSharedBoards(currentFriendId);
        this.isTrashedMessageVisible(true);
        var self = this;
        setTimeout(function(){
          self.isTrashedMessageVisible(false);
        },3000);
      }
    }).bind(this)


    this.validateBoardUpdateInfo = function(info){
      if(!info || typeof info != 'object' || isNaN(info.friendId) || info.friendId < 1){
        throw new Error("Invalid trash board command,  friendId is required.");
      }
      if(!info.boardId || isNaN(info.boardId) || info.boardId < 1){
        throw new Error('boardId must be a positive integer.');
      }
    }


    /**
     * [description]
     * @param  {object} data has friendId and currentTool
     */
    this.onFriendToolUpdated = (function(data){
      if(data.friendId == this.selectedClassmateId){
        this._friendsCurrentTool = data.currentTool;
      }
    }).bind(this)


    this.onAuth = function(update){
      if(update.state == 'authenticated'){
        this.remoteService.initialize();
        this.canvas.initialize();

        this.remoteService.registerGetSharedBoardsCallback(this.onSharedBoardsReceived);
        this.remoteService.registerOnNextBoardRecievedCallback(this.onNextBoardRecieved);
        this.remoteService.registerOnPreviousBoardRecievedCallback(this.onPreviousBoardRecieved);
        this.remoteService.registerOnSaveCallback(this.onCurrentBoardSaved);
        this.remoteService.registerOnBoardTrashedCallback(this.onBoardTrashed);
        this.remoteService.registerOnFriendTrashedBoard(this.onFriendTrashedBoard);
        this.remoteService.registerOnTrashBoardUndone(this.onTrashBoardUndone);
        this.remoteService.registerOnFriendRestoredBoard(this.onFriendRestoredBoard);

        this.remoteService.attachFriendJoinedBlackboardHandler(this.onFriendToolUpdated);
        this.remoteService.attachOnFriendCursorPositionReceivedHandler(this.onFriendsCursorPositionReceived);
        this.remoteService.attachOnFriendPencilPositionCallback(this.onFriendPencilPositionReceived);
        this.remoteService.attachFriendsPencilLineUpdateHandler(this.onFriendPencilLineReceived);
        this.remoteService.attachOnFriendsEraserPositionUpdateCallback(this.onFriendsEraserPositionReceived);
        this.remoteService.attachFriendsEraserDownCallback(this.onFriendsEraserDown);
        this.setPencilTool() // so the user can draw right away.
      }
    }
    this.onAuth = this.onAuth.bind(this);
    this.dis.reg('authState',this.onAuth);




    this.onCurrentBoardSaved = function(){
      console.log('Current board saved.');
    }
    this.onCurrentBoardSaved = this.onCurrentBoardSaved.bind(this);


    this.prevArrowClicked = function(){
      this.possiblySaveState();
      this.spinnerVisible(true);
      var boardId = this.getCurrentBoardId();
      var friendId = this.selectedClassmateId;
      this.remoteService.getPreviousBoard(boardId,friendId);
    }


    this.nextArrowClicked = (function(){
      this.possiblySaveState();
      this.spinnerVisible(true);
      var currentBoardId = this.getCurrentBoardId();
      var currentFriendId = this.selectedClassmateId;
      this.remoteService.getNextBoard(currentBoardId, currentFriendId);
    }).bind(this)


    this.possiblySaveState = (function(){
      if(this.boards.isNotEmpty() && this.boards.isCurrentBoardDirty()){
        var s = this.boards.getSerializedCurrentBoard();
        this.remoteService.saveCurrentBoard(s);
      }
    }).bind(this)


    this.onFriendAddedNewBoard = (function(board){
      if(!this.boards.contains(board)){
        this.boards.appendBoard(board);
      }
    }).bind(this)
    this.dis.reg('friendAddedNewBoard',this.onFriendAddedNewBoard)

    /**
     * @param  {object} jsonBoard
     *  appends a new board to the collection if it is not there already.
     *  loads the most recent version of the board.  (compares the persisted one to the local one.)
     */
    this.onNextBoardRecieved = (function(jsonBoard){
      var board = JSON.parse(jsonBoard);
      if(!this.boards.contains(board)){
        this.boards.appendBoard(board);
        this.boards.setIndexToLastBoard()
      } else
        this.boards.setCurrentBoardById(board.board_id)

      var currentBoard = this.boards.getCurrentBoardDeepCopy()
      var cacheLastUpdated = currentBoard.getLastModifiedMillis()
      var serverLastUpdated = (new Date(board.last_loaded).getTime())
      if(cacheLastUpdated > serverLastUpdated){
        var cachedCommands = currentBoard.getCommands()
        this.canvas.drawEntireBoard(cachedCommands);
        var ack = this.onAdditionalBoardData
        var boardId = currentBoard.getId()
        this.remoteService.getAdditionalBoardData(boardId, ack)
      } else {
        this.remoteService.getBoardData(currentBoard.getId(), this.onBoardDataReceived);
      }
      this.prevArrowVisible(true);
    }).bind(this)



    /**
     * Takes an json array of two boards, where is 2nd is
     * the board that is being switched too and the 1st is
     * the one that comes before it.  IF the 1st one has
     * board_id == -1 then that signifies that there is no
     * previous board and that the left arrow button should
     * be hidden to contrain the user from attempting to
     * go to a left board when one does not exist.
     * @param  {json} boards is a json array of boards.
     */
    this.onPreviousBoardRecieved = (function(jsonBoards){
      var boards = JSON.parse(jsonBoards);
      if(boards.length != 2 || isNaN(boards[1].board_id)){
        throw new Error('onPreviousBoardRecieved() expects JSON array of length 2 as input.');
      }
      if(this.boards.isEmpty()){
        throw new Error("Can't set previous board without its reference existing somewhere in the board set.");
      }
      if(boards[0].board_id == -1 && boards[1].board_id != -1){ // there is no board before this one.
        this.prevArrowVisible(false);
      }
      this.boards.setCurrentBoardById(boards[1].board_id);
      var currentBoardId = this.getCurrentBoardId();
      this.remoteService.getBoardData(currentBoardId, this.onBoardDataReceived);
    }).bind(this)



}; // end view model.

  return {
    viewModel: BlackboardViewModel,
    template: template
  }

});
