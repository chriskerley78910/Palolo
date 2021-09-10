define([],
function(){

    var BlackBoard = function(board){

      if(!board || typeof board != 'object'){
        throw new Error('Board data must be passed to constructor.');
      }

      this.getLastModifiedMillis = function(){
        return new Date(this.lastModified).getTime()
      }

      this.setLastModified = function(millis){
        this.lastModified = new Date(millis).toISOString();
      }

      this.lastModified = null;

      this.updateLastModified = (function(){
        this.lastModified = new Date(Date.now()).toISOString()
      }).bind(this)



      this.getCommandCount = function(){
        return this.commands.length
      }

      this.setBoardId = function(id){
        if(!id || isNaN(id))
          throw new Error("board_id missing or not a number.");
        this.boardId = id
      }
      this.setBoardId(board.board_id)



      this.setBoardURL = function(url){
        if(!url || typeof url != 'string'){
          throw new Error("board_url missing or not a string.");
        }
        this.boardURL = url
      }
      this.setBoardURL(board.board_url)

      this.dirty = false;

      this.getCommands = function(){
        return this.commands.slice(0);
      }

      this.setCommands = function(commands){
        if(Array.isArray(commands)){
          this.commands = commands;
        }
        else{
          this.commands = [];
        }
      }
      this.setCommands(board.commands)

      this.append = function(command){
        if(typeof command == 'object' && command.isBoardable && command.isBoardable()){
          this.commands.push(command);
          this.setDirty()
          this.updateLastModified()
        }
        else
          throw new Error('Expected a Boardable command.')
      }

      this.getId = function(){
        return this.boardId;
      }

      this.isDirty = function(){
        return this.dirty;
      }

      this.setDirty = function(){
        this.dirty = true;
      }

      this.getURL = function(){
        return this.boardURL;
      }

      this.getLastTimeLoadedMillis = function(){
        return new Date(this.lastLoaded).getTime()
      }

      this.getLastTimeLoadedISO = function(){
        return this.lastLoaded
      }


      this.setLastTimeLoaded = function(time){
        if(typeof time != 'string' || time.length < 1){
          throw new Error('last_loaded must be a iso date string.');
        }
        this.lastLoaded = time;
      }
      this.setLastTimeLoaded(board.last_loaded)


      this.deepCopy = function(){
        var d = {
          board_url:this.getURL(),
          last_loaded:this.getLastTimeLoadedISO(),
          is_dirty:this.isDirty(),
          board_id:this.getId(),
          commands:this.getCommands()
        }
        var b = new BlackBoard(d);
        b.setLastModified(this.getLastModifiedMillis())
        return b;
      }

      this.serialize = function(){
        var serialized = []
        this.getCommands().forEach(function(c){
          serialized.push(c.serialize())
        })
        return {
          board_url:this.getURL(),
          last_loaded:this.getLastTimeLoadedISO(),
          is_dirty:this.isDirty(),
          board_id:this.getId(),
          commands:serialized
        }
      }
    } // end

    BlackBoard.getRaw = function(){
      return {
        board_url:'url',
        last_loaded:(new Date(0).toISOString()),
        is_dirty:true,
        board_id:1,
        commands:[]
      }
    }

    BlackBoard.getFake = function(){
      var raw = BlackBoard.getRaw()
      return new BlackBoard(raw);
    }

    return BlackBoard;
});
