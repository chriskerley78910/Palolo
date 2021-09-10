/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */

define(['ko',
        'text!course-adder/template.html',
        'dispatcher/Dispatcher'
],
function(ko,
         template,
         Dispatcher){

  function CourseAdderViewModel(){
    this.dis = new Dispatcher();
    this.isVisible = ko.observable(false);
    this.courseCodeQueryValue = ko.observable('');
    this.courseCodeSearchResults = ko.observableArray([]);


    this.onOpenCourseAdder = function(){
      this.isVisible(true);
    }
    this.onOpenCourseAdder = this.onOpenCourseAdder.bind(this);
    this.onOpenId = this.dis.reg('openCourseAdder', this.onOpenCourseAdder);


    this.hide = function(){
      this.isVisible(false);
    }
    this.hide = this.hide.bind(this);


    this.queryMatchingCourses = function(value){
      console.log('Querying course code:' + value);
      this.dis.dispatch('getCoursesMatching', value);
    }
    this.queryMatchingCourses = this.queryMatchingCourses.bind(this);
    this.courseCodeQueryValue.subscribe(this.queryMatchingCourses, this);


    this.onCourseMatches = function(matches){
      this.courseCodeSearchResults(matches);
    }
    this.courseResultsId = this.dis.reg('courseAdderCourseResults',this.onCourseMatches);

}; // end CourseAdderViewModel constructor.


return {
    viewModel: CourseAdderViewModel,
    template :template
};


}); // end define.
