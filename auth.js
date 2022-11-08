var sdPath = files.getSdcardPath() + "/shockey/com.shockey.cetc/files/";//注意直接用设备的包名，效果是直接升级对应的目录不会删除，如果卸载就会删除
var licenseName = ".cli";//授权文件名
var licensePath = files.path(sdPath + licenseName);

if(app.versionCode < 11005)//以前版本路径在当前目录
{
    //确保文件存在
    if (files.exists(licenseName)) {
        var cfg = files.read(licenseName).toString();
        if(cfg.indexOf("=")<0){
            files.rename("./tiku_hik.db", ".fb");
            threads.shutDownAll();
            engines.stopAll();
            exit();
        }
    }
    else{
        if(app.versionCode < 11002) //这个版本以前的直接删库退出，不允许使用
        {
            files.remove("./tiku_hik.db");
        }
        threads.shutDownAll();
        engines.stopAll();
        exit();
    }
}
else
{
    //确保文件存在
    if (files.exists(licensePath)) {
        var cfg = files.read(licensePath).toString();
        if(cfg.indexOf("=")<0){
            files.rename("./tiku_hik.db", ".fb");
            threads.shutDownAll();
            engines.stopAll();
            exit();
        }
    }
    else{
    
        threads.shutDownAll();
        engines.stopAll();
        exit();
    }
}