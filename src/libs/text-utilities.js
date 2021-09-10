define([], function(){
  var ENTER_KEY = 13;
  var TAB_KEY = 9;

  var TextUtilities = function(){}

  TextUtilities.onKeyPress = function(e){
    var code = e.keyCode;
    if(code == TAB_KEY){
      e.preventDefault();
      this.insertTab(e.target);
      return false;
    }
    else if(e.shiftKey && code == ENTER_KEY){
      return true; // go to new line.
    }
    else if(code == ENTER_KEY){
      if(!e.send || typeof e.send != 'function'){
        throw new Error('send function must be attached to event.');
      }
      e.send();
    }
    else{
      return true;
    }
  }

  TextUtilities.insertTab = function(target){
      var start = target.selectionStart;
      var end = target.selectionEnd;
      var cursorPrefix = target.value.substring(0, start);
      var tab = "\t";
      var cursorPostfix = target.value.substring(end);
      target.selectionStart = target.selectionEnd = start + 1;
      target.value = cursorPrefix + tab + cursorPostfix;
    }


    TextUtilities.formatToHTML = function(text){
      text = TextUtilities.escapeHTML(text);
      text = TextUtilities.insertLineBreaks(text);
      return TextUtilities.insertHTMLTabs(text);
    }

    TextUtilities.escapeHTML = function(str){
      var after = str.replace(/[&<>"]/g, function (tag) {
        var chars_to_replace = {
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&apos;'
          };
          return chars_to_replace[tag] || tag;
      });
      return after;
    }
    
  TextUtilities.insertLineBreaks = function(text){
      var lines = text.split(/\n/gm);
      var messageWithBreaks = '';
      for(var i = 0; i < lines.length; i++){
        if(i < lines.length - 1){
            messageWithBreaks += lines[i] + '<br>';
        }
        else{
            messageWithBreaks += lines[i];
        }
      }
      return messageWithBreaks;
    }


  TextUtilities.insertHTMLTabs = function(text){
      var lines = text.split(/\t/gm);
      var withTabs = '';
      for(var i = 0; i < lines.length; i++){
        if(i == lines.length - 1 && lines[i] == ''){
          break;
        }
        withTabs += lines[i] + '\u00A0\u00A0\u00A0\u00A0';
      }
      return withTabs;
    }


  TextUtilities.wrapLinks = function(text, styleClass){
      if(/iframe/.test(text) == true){
        return text;
      }
      let regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
      if(regex.test(text)){
          var match = (text.match(regex))[0];
          var replacement = '<a target="_blank" ' +
                               'class="' + styleClass + '" ' +
                               'href="'  + match + '">' +
                                match
                          + '</a>';
          text = text.replace(match, replacement);
      }
      return text;
    }


return TextUtilities;
});
