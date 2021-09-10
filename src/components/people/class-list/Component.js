/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */
define(['ko',
        'dispatcher/Dispatcher',
        'text!class-list/template.html',
        'people-models/NullPerson',
        'people-store/PeopleStore'],

function(ko,
         Dispatcher,
         template,
         NullPerson,
         PeopleStore){

  function ViewModel(params,componentInfo){

    this.dis = new Dispatcher();
    this.store = PeopleStore.getInstance();
    this.isVisible = ko.observable(false);
    this.groupInfo = ko.observable({
      courseCode:'Coursecode'
    });
    this.yourAMember = false;
    this.isCourseJoinedMessageVisible = ko.observable(false);
    this.classmateList = ko.observableArray([]);
    this.classmateList.extend({notify:'always'});
    this.selectedClassmate = ko.observable(new NullPerson());



    this.onStoreUpdated = (function(){
      var visible = this.store.isClassListVisible();
      this.isVisible(visible);
      if(visible){
        var classmates = this.store.getClassList();
        this.classmateList(classmates.toArray());
      }
    }).bind(this)
    this.store.sub(this.onStoreUpdated);



    this.setStore = function(store){
      this.store = store;
    }

    this.getClassmateCount = function(){
      return this.classmateList().length;
    }

    this.classmateClicked  = function(classmate){
      var p = Object.getPrototypeOf(classmate);
      classmateid = p.id;
      this.dis.dispatch('focusPerson', classmate);
      this.selectedClassmate(classmate);
    }
    this.classmateClicked = this.classmateClicked.bind(this);

    this.onCourseViewSelected = function(){
      var nullPerson = new NullPerson();
      this.selectedClassmate(nullPerson);
    }
    this.onCourseViewSelected = this.onCourseViewSelected.bind(this);
    this.dis.reg('showGroupView', this.onCourseViewSelected);


    this.getSelectedFriendId = function(){
      return this.selectedClassmate().getId();
    }


    this.peopleSubscription = null;
    this.registerPeopleListChangeCallback = function(callback){
      this.peopleSubscription = this.people.subscribe(callback, this, "arrayChange");
    }

    this.unregisterPeopleListChangeCallbacks = function(){
      this.peopleSubscription.dispose();
    }


    this.updateView = function(){
      this.people.valueHasMutated();
    }
    this.updateView = this.updateView.bind(this);

    this.addPal = function(classmate, e){
      e.stopPropagation();
      this.dis.dispatch('addPal',classmate);
    }
    this.addPal = this.addPal.bind(this);

  }; // end viewModel.

  return {
    viewModel: ViewModel,
    template : template
  }

});
