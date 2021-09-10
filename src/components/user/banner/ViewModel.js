/**
 * @license Proprietary - Please do not steal our hard work.
 * @Author: Christopher H. Kerley
 * @Last modified time: 2019-08-24
 * @Copyright: Palolo Education Inc. 2020
 */

define(['ko',
        'text!banner/template.html',
        'jquery',
        'dispatcher/Dispatcher',
        'user/profile-setter/ProfileStore'],
function(ko,
         template,
         $,
         Dispatcher,
         ProfileStore){

  function BannerViewModel(params, componentInfo){

    this.store = ProfileStore.getInstance();

    this.dis = new Dispatcher();
    this.isBannerVisible = ko.observable(false);
    this.usersName = ko.observable('');
    this.smallPhotoUrl = ko.observable('');



    // menu stuff.
    this.isMenuVisible = ko.observable(false);
    this.isAdminButtonVisible = ko.observable(false);
    this.isAdminVisible = ko.observable(false);
    this.mobileMenuVisible = ko.observable(false)
    this.isSearchVisible = ko.observable(false)

    this.openSearch = (function(){
      this.isSearchVisible(true)
    }).bind(this)

    this.closeSearch = (function(c, e){
      this.isSearchVisible(false)
      if(e) e.stopPropagation();
      return false;
    }).bind(this)

    this.openHambergerMenu = (function(){
      this.mobileMenuVisible(true)
    }).bind(this)

    this.closeHambergerMenu = (function(){
      this.mobileMenuVisible(false)
    }).bind(this)


    this.openAdminPanel = function(){
      this.isAdminVisible(true);
      this.isMenuVisible(false);
    }


    this.openCourseAdder = function(){
      this.dis.dispatch('openCourseAdder');
    }



    /**
     * Triggers a broadcast to all subscribers of isImageUploaderVisible.
     */
    this.openProfileSetter = function(c, event){
      this.dis.dispatch('showProfileSetter');
      this.isMenuVisible(false);
      return false;
    }


    this.onAuth = (function(update){
      if(update.state == 'authenticated'){
        this._isAuthenticated = true;
        this.isBannerVisible(true);
      }
      else{
        this._isAuthenticated = false;
        this.isBannerVisible(false);
      }
    }).bind(this)
    this.dis.reg('authState', this.onAuth);


    this.onStore = (function(){
      var info = this.store.getUserInfo();
      if(info){
        this.isAdminButtonVisible(info.role == 'admin');
        this.usersName(info.first + ' ' + info.last + ', rep: ' + info.rep);
        var smallPhotoUrl = info.small_photo_url;
        if(!smallPhotoUrl){
          this.smallPhotoUrl('./assets/no-photo.jpg');
        }
        else{
          this.smallPhotoUrl(smallPhotoUrl + "?" + new Date().getTime()); // cache bust.
        }
      }
    }).bind(this)
    this.store.sub(this.onStore);




    this.onUserInfoError = function(err){
      console.log(err);
      // Not admin.
    }
    this.onUserInfoError = this.onUserInfoError.bind(this);



    this.closeMenu = function(){
      this.isMenuVisible(false);
    }
    this.closeMenu = this.closeMenu.bind(this);


    this.toggleDropDown = function(){
      if(this.isMenuVisible() === true){
        this.isMenuVisible(false);
      }
      else{
      }
      this.isMenuVisible(true);
    }
    this.toggleDropDown = this.toggleDropDown.bind(this);

    this.logOut = function(){
      this.dis.dispatch('logout');
    }





}; // end BannerViewModel constructor.


return {
    viewModel: BannerViewModel,
    template :template
};


}); // end define.
