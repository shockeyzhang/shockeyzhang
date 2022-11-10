var sdPath = files.getSdcardPath() + "/shockey/com.shockey.xxqghelper/files/";//注意直接用设备的包名，效果是直接升级对应的目录不会删除，如果卸载就会删除
var licenseName = ".cli";//授权文件名
var licensePath = files.path(sdPath + licenseName);

sleep(10000);//延时10s，等待拷贝激活码，避免出现闪退
let checkTime = 0;

//确保文件存在
while(1)
{
    if(checkTime > 1)//再次检测是否激活，如果未激活，则直接退出
    {
        threads.shutDownAll();
        engines.stopAll();
        exit();
    }
    
    if (files.exists(licensePath)) {
        var cfg = files.read(licensePath).toString();
        if(cfg.indexOf("=")<0){//如果是非法密钥，本地会进行检测
            sleep(30000);//延时30s，等待拷贝激活码，避免出现闪退
        }
        else //密钥格式正确，退出，细节校验交给本地
        {
            break;
        }
        
    }
    else{
        sleep(30000);//延时30s，等待拷贝激活码，避免出现闪退
    }
    
    checkTime++;
}

