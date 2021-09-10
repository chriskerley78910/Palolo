
define(['file-dropper/Component',
        'people-models/NullPerson',
        'people-models/Person'],
function(Component,
        NullPerson,
        Person){

    describe("file-dropper Tests", function(){

      let vm = null;

      beforeEach(() => {
        vm = new Component.viewModel();
        vm._remoteService.setFakeToken();
      })


      let getPerson = (id)=>{
        return Person.getFake()
      }


      it(`userState == authenticated
        ^ isVisible() == true`, () =>{

        spyOn(vm._remoteService,'initSocket');
        spyOn(vm._remoteService,'registerFileUploadCallback');
        spyOn(vm._remoteService,'registerFileDeleteCallback');
        vm.onAuth('anonymous');
        expect(vm.isVisible()).toBeFalsy();
        vm.onAuth({state:'authenticated', id:'2'});
        vm.onAuth('anonymous');
        expect(vm.isVisible()).toBeFalsy();
      })

      it('userState == authenticated => init and connect() socket', ()=>{
        expect(vm._remoteService.sock).toBeNull();
        spyOn(vm._remoteService,'registerUploadProgressCallback');
        vm.onAuth({state:'authenticated', id:'2'});
        expect(vm._remoteService.sock).not.toBeNull();
        expect(vm._remoteService.registerUploadProgressCallback).toHaveBeenCalled();
      })


      it(`onFileLoadedInBrowser() ^ valid file => _remoteService.uploadFile()`, ()=>{

          vm._fileToBeUploaded = "dummyData";
          spyOn(vm._remoteService,'uploadFile');
          vm.onFileLoadedInBrowser({target:{files:[new Blob(['sdfdfsdfwefwef'], { type: 'text/csv;charset=utf-8;' })]}});
          expect(vm._remoteService.uploadFile).toHaveBeenCalled();
      })

      it(`onFileLoadedInBrowser() ^ fileName already in files array => alertError()`,()=>{
        vm._fileToBeUploaded = {
          name:'some_name.pdf'
        }
        vm.files([{
          name:'some_name.pdf'
        }])
        spyOn(window,'alert');
        spyOn(vm._remoteService,'uploadFile');
        vm.onFileLoadedInBrowser({target:{files:[new Blob(['sdfdfsdfwefwef'], { type: 'text/csv;charset=utf-8;' })]}})
        expect(window.alert).toHaveBeenCalled();
        expect(vm._remoteService.uploadFile).not.toHaveBeenCalled();
      })

      it('uploadFile() ^ uploadInProgress() == true => alert(only one file at a time)',()=>{

        vm.uploadInProgress(true);
        let spy = jasmine.createSpy();
        spy.msg = 'test';
        spyOn(window,'alert');
        vm.uploadFile(null,null, spy);
        expect(window.alert).toHaveBeenCalledWith('Only one file can be uploaded at a time.');
      })

      it('onSuccessfulUpload(fileResponse) => fileadded to files', ()=>{

        let originalLength = vm.files().length;
        vm.uploadInProgress(true);
        vm.onSuccessfulUpload({name:'chris',user_opened:'false',url:'dummyURL'});
        let files = vm.files();
        expect(files.length).toBe(originalLength + 1);
        let file = files[files.length-1];
        expect(file.name).toBe('chris');
        expect(file.user_opened()).toBe('false');
        expect(file.url).toBe('dummyURL');
        expect(vm.uploadInProgress()).toBeFalsy();
      })


      it('deleteFile() calls deletefile on RemoteService', ()=>{
          spyOn(vm._remoteService,'deleteFile');
          vm.deleteFile({name:'fakename'});
          expect(vm._remoteService.deleteFile).toHaveBeenCalledWith(
            jasmine.any(String),
            vm.selectedClassmateId,
            jasmine.any(Function)
          );
      })


      it('removeFileFromView(name) ^ filename is files <=> removes that file.',()=>{

          vm.files.push({name:'fakename'});
          vm.removeFileFromView('fakename');
          expect(vm.files().length).toBe(0);
          vm.files.push({name:'fakename2'});
          vm.removeFileFromView('othername');
          expect(vm.files().length).toBe(1);
      })


      it('onStoreChange() calls loadFiles on RemoteService', ()=>{
          spyOn(vm._remoteService,'loadFiles');
          let id = 55;
          const p = getPerson(id);
          vm.isVisible(false);
          vm.store.getFocusedPerson = () => p;
          vm.onStoreChange();
          expect(vm.isVisible()).toBeTruthy();
          expect(vm._remoteService.loadFiles).toHaveBeenCalledWith(p.getId(), jasmine.any(Function));
          expect(vm.selectedClassmateId).toBe(p.getId());
      })

      it('loadFiles(null) => isVisible() == false', ()=>{
        vm.isVisible(true);
        let person = getPerson(-1);
        vm.store.getFocusedPerson = ()=>{return new NullPerson()};
        vm.onStoreChange();
        expect(vm.isVisible()).toBeFalsy();
      })

      it('onFilesDownloaded() empties the current file list before adding the new ones.',()=>{
        vm.files.push('fakedata');
        vm.onFilesDownloaded([]);
        expect(vm.files().length).toBe(0);
      })

      it('removeFileFromView(fileName) does just that.', ()=>{
        vm.files([{name:'fakeName'}]);
        vm.removeFileFromView('fakeName');
        expect(vm.files().length).toBe(0);
      })





      let makeFakeFile = (opened) =>{
        return {
          name:'fakename',
          user_opened:(change)=>{
            return opened;
          }
        }
      }

      it('showFileAsSeen(name) => user_opened == true', ()=>{
          var file = makeFakeFile(false);
          file.user_opened = jasmine.createSpy('spy');
          vm.files([file]);
          vm.showFileAsSeen('fakename')();
          expect(vm.files()[0].user_opened).toHaveBeenCalledWith(true);
      })


      it('formatURL() only does so if the senderid matches the selecteClassmateId', ()=>{
        spyOn(vm,'onSuccessfulUpload');
        let id = 12;
        let response = {
          url:'www.hello',
          senderId:id
        }
        vm.selectedClassmateId = id;
        vm.formatURL(response);
        expect(vm.onSuccessfulUpload).toHaveBeenCalled();
      })

      it('friendDeleteFile does do only if their id matches.',()=>{
        spyOn(vm,'removeFileFromView');
        let id = 12;
        let msg = {
          name:'name',
          senderId:id
        }
        vm.selectedClassmateId = id;
        vm.friendDeleteFile(msg);
        expect(vm.removeFileFromView).toHaveBeenCalledWith(msg.name);
      })


      it('downloadFile(a,b,c) => calls RemoteService.setFileAsOpened',()=>{
        spyOn(vm._remoteService,'setFileAsOpened');
        vm.downloadFile(makeFakeFile(false),'fake','test');
        expect(vm._remoteService.setFileAsOpened).toHaveBeenCalled();
      })

      it('downloadFile(a,b,c) ^ file already opened => setFileAsOpened not called.',()=>{
        spyOn(vm._remoteService,'setFileAsOpened');
        vm.downloadFile(makeFakeFile(true),'g','test');
        expect(vm._remoteService.setFileAsOpened).not.toHaveBeenCalled();
      })



      it('uploadProgressCallback() => uploadInProgress() == true ',()=>{
        expect(vm.uploadInProgress()).toBeFalsy();
        vm.uploadProgressCallback({loaded:50,total:100});
        expect(vm.uploadInProgress()).toBeTruthy();
      })

    }); // end describe

}); // end define.
