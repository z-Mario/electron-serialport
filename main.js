const electron=require('electron')
const app=electron.app
const BrowserWindow=electron.BrowserWindow
const path=require('path')
const url=require('url')
const autoUpdater=electron.autoUpdater
const {dialog} =require('electron')
const ipc=require('electron').ipcMain
const feedUrl='http://172.16.5.63/update'
let mainWindow
if(require('electron-squirrel-startup')) return;
autoUpdater.setFeedURL(feedUrl);
function createWindow(){
	mainWindow=new BrowserWindow({width:400,height:300,icon:'./gyc_icon.ico'})
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname,'index.html'),
		protocol:'file',
		slashes:true
	}))

	mainWindow.on('closed',function(){
		mainWindow=null
	})
  if (process.argv[1] == '--squirrel-firstrun') {
      return;
  }  
}
app.on('ready',createWindow)

app.on('window-all-closed',function(){
	if(process.platform!== 'darwin'){
		app.quit()
	}
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
  var handleStartupEvent = function () {
    if (process.platform !== 'win32') {
      return false;
    }
    var squirrelCommand = process.argv[1];
    switch (squirrelCommand) {
      case '--squirrel-install':
      case '--squirrel-updated':
        install();
        return true;
      case '--squirrel-uninstall':
        uninstall();
        app.quit();
        return true;
      case '--squirrel-obsolete':
        app.quit();
        return true;
    }
      // 安装
    function install() {
      var cp = require('child_process');    
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--createShortcut", target], { detached: true });
      child.on('close', function(code) {
          app.quit();
      });
    }
    // 卸载
    function uninstall() {
      var cp = require('child_process');    
      var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
      var target = path.basename(process.execPath);
      var child = cp.spawn(updateDotExe, ["--removeShortcut", target], { detached: true });
      child.on('close', function(code) {
          app.quit();
      });
    }
  };
  if (handleStartupEvent()) {
    return ;
  }

ipc.on("check-for-update",function(event){
  if (process.argv[1] == '--squirrel-firstrun') {
      return;
  }  
   let appName="观云长称重组件V1.0.0"
   let appIcon=__dirname+'/gyc.ico'
   let message={
      error:'检查更新出错',
      updateAva:'有版本更新，请升级',
      updateNotAva:'现在使用的就是最新版本,不用更新',
      downloaded:'最新版本已下载'
   }
   
   autoUpdater.on('error',function(err){
    return dialog.showMessageBox(mainWindow,{
      type:'info',
      icon:appIcon,
      title:appName,
      message:message.error,
      detail: '\r'+err
    })
   })
    .on('update-available', function(e) {
        var downloadConfirmation = dialog.showMessageBox(mainWindow, {
            type: 'info',
            icon: appIcon,
            buttons: ['确定'],
            title: appName,
            message: message.updateAva
        });
        if (downloadConfirmation === 0) {
            return;
        }
    })
    .on('update-downloaded',  function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        var index = dialog.showMessageBox(mainWindow, {
            type: 'info',
            icon: appIcon,
            buttons: ['现在重启','稍后重启'],
            title: appName,
            message: message.downloaded,
            detail: releaseName + "\n\n" + releaseNotes
        });
        if (index === 1) return;
        autoUpdater.quitAndInstall();
    });
     autoUpdater.checkForUpdates();       
})