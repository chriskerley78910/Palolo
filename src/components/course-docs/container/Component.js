define([
'dispatcher/Dispatcher',
'course-docs/DocStore',
'ko',
'text!course-docs/container/template.html',],
function(
  Dis,
  Store,
  ko,
  template){

  function View(params, componentInfo){
    this.dis = new Dis()
    this.store = Store.getInstance()
    this.isVisible = ko.observable(false)
    this.isEmpty = ko.observable(false)
    this.uploadingAllowed = ko.observable(false)
    this.isJoinPromptVisible = ko.observable(false)

    this.onStore = function(){
      this.isJoinPromptVisible(!this.store.isCourseDocsPermitted() && this.store.isCourseDocsVisible())
      this.uploadingAllowed(this.store.isUploadingAllowed)
      this.isVisible(this.store.isCourseDocsPermitted() && this.store.isCourseDocsVisible())
      this.isEmpty(this.store.docCount() < 1);
    }
    this.onStore = this.onStore.bind(this)
    this.store.sub(this.onStore)


    this.openUploader = function(){
      this.dis.dispatch('openDocUploader')
      $('#doc-uploader-input').trigger('click');
    }

    this.selectCurrentDocs = function(){

      this.dis.dispatch('selectCurrentDocs')
    }

    this.selectPreviousDocs = function(){
      this.dis.dispatch('selectPreviousDocs')
    }


}

  return {
    viewModel: View,
    template: template
  }
});
