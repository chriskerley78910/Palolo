define(['jquery',
        'ActiveRemoteService'],
function($,
         ActiveRemoteService){

    var BlackboardRemoteService = function(){

      Object.setPrototypeOf(this, new ActiveRemoteService());
      this._callbacks = {};
      this.lastBoardDataRequest = null;
      this.setMicroServer("blackboard");


      this.initialize = (function(){
        this.setSock()
        this.sock.on('io_error', this.onError)
        this.sock.on('friendAddedNewBoard',this.onFriendAddedNewBoard)
      }).bind(this)

      this.onFriendAddedNewBoard = (function(board){
         this.dis.dispatch('friendAddedNewBoard',JSON.parse(board))
      }).bind(this)


      this.onError = (function(message){
        alert(message)
      }).bind(this)

      this.attachFriendJoinedBlackboardHandler = (function(callback){
        this.sock.on('friendJoinedBlackboard',callback);
      }).bind(this)


      this.emailBlackboard = (function(args, ack){
        this.sock.emit('emailBlackboard',args, ack)
      }).bind(this)

      this.getBoardData = (function(boardId, ack){
          this.sock.emit('getBoard',boardId, ack)
      }).bind(this)


      this.saveCurrentBoard = (function(currentBoard){
        var ack =  this._callbacks['onSaveCallback'];
        if(typeof ack != 'function') throw new Error('saveCurrentBoard callback missing.');
        var json = JSON.stringify(currentBoard);
        this.sock.emit('saveBoardState', {json:json}, ack);
      }).bind(this)


      this.registerOnSaveCallback = (function(callback){
        if(typeof callback != 'function'){
          throw new Error("Save board callback needs to be a function.");
        }
        this._callbacks['onSaveCallback'] = callback;
      }).bind(this)



      /**
       * Requests the last board the current user viewed from the set of
       * boards that are shared with friendId.
       * @param  {Number} friendId The id number of the currently selected friend.
       */
      this.getSharedBoards = (function(friendId){
        if(isNaN(friendId) || friendId < 1){
          throw new Error('friendId must be a positive integer.');
        }
        var onSuccess = this._callbacks['onSharedBoardsReceived'];
        if(typeof onSuccess != 'function'){
          throw new Error('onSharedBoardsReceived callback has not been registered.');
        }
        if(!this.sock._callbacks['$sharedBoards']){
          this.sock.on('sharedBoards',this._callbacks['onSharedBoardsReceived'])
        }
        this.sock.emit('getSharedBoards',{friendId:friendId})
      }).bind(this)


      this.getNextBoard = (function(boardId,friendId){
        this.sock.emit('nextBoard', {boardId:boardId, friendId:friendId})
      }).bind(this)


      this.registerOnNextBoardRecievedCallback = (function(callback){
          this.sock.on('nextBoardReceived',callback)
      }).bind(this)




      this.joinFriend = function(friendId, currentTool){
        if(this.sock){
          var data = {
                      friendId:friendId,
                      currentTool:currentTool
                     };
          this.sock.emit('joinRoom',data,function(result){
            if(result == 'success'){
              // console.log('Blackboard:Connected to friend:' + friendId);
            }
          });
        }
      }

      this.getPreviousBoard = (function(boardId,friendId){
        this.sock.emit('previousBoard',{boardId:boardId, friendId:friendId})
      }).bind(this)


      this.registerOnPreviousBoardRecievedCallback = (function(cb){
        this.sock.on('previousBoardReceived', cb)
      }).bind(this)




      /**
      * @param  {Function} callback The function to be executed on successful retrieval
      *                             of the board. It is passed the board data.
      */
      this.registerGetSharedBoardsCallback = function(callback){
        this._callbacks['onSharedBoardsReceived'] = callback;
      }

      this.getAdditionalBoardData = (function(boardId, ack){
        this.sock.emit('getAdditionalBoardData',boardId, ack)
      }).bind(this)

      this.emitMyCursorPosition = function(update,onSuccess){
        this.sock.emit('myCursorPosition',update,function(result){
          if(result == 'success'){
            onSuccess();
          }
        });
      }

      this.attachOnFriendCursorPositionReceivedHandler = (function(callback){
        this.sock.on('friendsCursorPosition',callback);
      }).bind(this)

      this.emitMyPencilPosition = (function(update){
        this.sock.emit('myPencilPosition',update);
      }).bind(this)

      this.attachOnFriendPencilPositionCallback = (function(callback){
        this.sock.on('friendPencilPositionUpdate',callback);
      }).bind(this)

      this.emitMyPencilLine = (function(pencilLine,onSuccess){
        this.sock.emit('myPencilLine',pencilLine,onSuccess);
      }).bind(this)

      this.attachFriendsPencilLineUpdateHandler = (function(callback){
        this.sock.on('friendsPencilLineUpdate',callback);
      }).bind(this)

      this.emitMyEraserPosition = (function(update){
        this.sock.emit('myEraserPosition', update);
      })

      this.attachOnFriendsEraserPositionUpdateCallback = (function(cb){
        this.sock.on('onFriendsEraserPositionUpdate',cb);
      }).bind(this)

      this.emitMyEraserDown = (function(erase, ack){
        this.sock.emit('myEraserDown',erase, ack);
      }).bind(this)

      this.attachFriendsEraserDownCallback = (function(callback){
        this.sock.on('friendsEraserDownUpdate',callback);
      }).bind(this)

      this.registerOnBoardTrashedCallback = (function(callback){
        this.checkType(callback);
        this.sock.on('boardTrashed', callback)
      }).bind(this)

      this.registerOnFriendTrashedBoard = function(callback){
        this.checkType(callback);
        this.sock.on('boardTrashed',callback);
      }

      this.trashBoard = (function(boardId, friendId){
        var o = {friendId:friendId, boardId:boardId}
        this.sock.emit('trashBoard',o)
        this.sock.emit('relayTrashBoard',o);
      }).bind(this)

      this.registerOnTrashBoardUndone = (function(callback){
        this.checkType(callback);
        this.sock.on('boardRestored', callback)
      }).bind(this)

      this.undoTrashBoard = (function(boardId, friendId){
         var o = {friendId:friendId, boardId:boardId}
         this.sock.emit('restoreBoard',o)
         this.sock.emit('relayRestoreBoard',o);
      }).bind(this)

      this.registerOnFriendRestoredBoard = (function(callback){
        this.sock.on('friendsBoardRestored',callback);
      }).bind(this)

      this.checkType = function(fn){
        if(typeof fn != 'function'){
          throw new Error("Callback must be a function");
        }
      }

    }

    return BlackboardRemoteService;
});
