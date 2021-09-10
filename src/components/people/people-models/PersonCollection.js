define(['people-models/Classmate'],
function(Classmate){
  var PersonCollection = function(data, host){

    this.getConstructorName = function(){
      return 'PersonCollection'
    }

    this.col = []

    this.isCollection = function(){
      return true
    }

    this.clear = function(){
      this.col = []
    }

    this.getOldPals = function(){
      var col = new PersonCollection()
      this.col.forEach(function(p){
        if(!p.isNew || p.isNew() == false){
          col.add(p)
        }
      })
      return col
    }

    this.getNewPals = function(){
      var col = new PersonCollection()
      this.col.forEach(function(p){
        if(p.isNew && p.isNew() == true){
          col.add(p)
        }
      })
      return col
    }

    this.getPersonById = (function(id){
      var match = null
      this.col.forEach(function(p){
        if(p.getId() == id){
          match = p
          return
        }
      })
      return match
    }).bind(this)

    this.add = (function(p){
      if(typeof p !== 'object'){
        throw new Error('Can only add objects to Person collection')
      }
      else if(this.contains(p)){
        throw new Error('Duplicate entry')
      } else {
        this.col.push(p)
        this.sortByPresence()

      }
    }).bind(this)


    this.sortByPresence = function(){
      this.col.sort(function(p1,p2){
         if(p1.isPresent() && !p2.isPresent()){
           return -1
         } else if(!p1.isPresent() && p2.isPresent()){
           return 1
         } else {
           return 0
         }
      })
    }


    this.contains = (function(p){
      for(var i = 0; i < this.col.length; i++){
        if(this.col[i].equals(p)){
          return true
        }
      }
      return false
    }).bind(this)


    this.remove = (function(person){
      var index = -1;
      for(var i = 0; i < this.col.length; i++){
        if(person.id == this.col[i].getId()){
          index = i
          break
        }
      }
      if(index >= 0)
        this.col.splice(i,1);
    }).bind(this)


    this.applyToMatch = function(p, fun){
      if(typeof p != 'object' || !p.getId)
        throw new Error('missing person arg.')
      if(typeof fun != 'function')
        throw new Error('missing function arg.')
      this.col.forEach(function(o){
        if(o.getId() == p.getId()) fun(o)
      })
    }


    this.duplicate = (function(other){
      if(typeof other !== 'object' || !other.getConstructorName || other.getConstructorName() !== 'PersonCollection'){
        throw new Error('Expected a PersonCollection')
      }
      this.col = []
      var arr = other.toArray()
      var self = this
      arr.forEach(function(classmate){
        self.add(classmate)
      })
    }).bind(this)

    this.toArray = function(){
      return this.col
    }

    this.compare = (function(a,b){
        var score = this.byScore(a,b);
        var presence = this.byPresence(a,b);
        return presence == 0 ? score : presence
    }).bind(this)

    this.byScore = (function(a, b){
      if(a.getScore() > b.getScore()){
        return -1;
      } else if(a.getScore() < b.getScore()){
        return 1;
      }else if(a.getId() < b.getId()){
        return -1
      }
      else{
        return 1
      }
    }).bind(this)

    this.byPresence = (function(a,b){
      if(a.isPresent() && !b.isPresent()){
        return -1
      }
      else if(!a.isPresent() && b.isPresent()){
        return 1;
      }
      else{
        return 0;
      }
    }).bind(this)

    this.getSize = function(){
      return this.col.length
    }


    this.get = function(index){
      return this.col[index]
    }

    /**
      returns true iff this collection
      has the same elements in the same order.
    */
    this.equals = function(other){

      if(!other || !other.getConstructorName)
        return false
      else if(this.getSize() !== other.getSize())
        return false

      for(var i = 0; i < this.getSize(); i++){
        if(this.col[i].equals(other.get(i)) == false){
          return false
        }
      }
      return true;
    }

  } // end constructor

  PersonCollection.getFake = function(){
    var c1 = Classmate.getFake()
    var c2 = Classmate.getFake()
    c2.setId(c2.getId() + 1)
    var c = new PersonCollection()
    c.add(c1)
    c.add(c2)
    return c
  }

  return PersonCollection;
});
