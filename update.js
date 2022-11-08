//db操作
importClass(android.database.sqlite.SQLiteDatabase);
importClass(android.net.ConnectivityManager);

let latestAppVer = 11005;
let latestDbVer = 221105;

var csvFileName = "db.csv";
var confi = files.read("./config.txt");
var conf = confi.split(" ");

var updateServer = conf[2];//远程更新服务器选择

/**
 * 主函数:利用脚本引擎运行指定的代码
 */
function downloadRemoteDB(url) {
    try {
        //console.show()    //打开控制台
        //获取网页状态运行代码
        //var url = "https://cdn.jsdelivr.net/gh/shockeyzhang/HikCultureHelper/auth.js"//远程地址
        var cm = context.getSystemService(context.CONNECTIVITY_SERVICE);
        var net = cm.getActiveNetworkInfo();

        //toast(net);

        if (net == null || !net.isAvailable()) {
            toastLog("网络连接不可用!");
            return false;
        } 
        else {
            //toast("正在下载脚本");
            var rmt_conn = http.get(url, {
                headers: {
                    'Accept-Language': 'en-us,en;q=0.5',
                    'User-Agent': 'Mozilla/5.0(Macintosh;IntelMacOSX10_7_0)AppleWebKit/535.11(KHTML,likeGecko)Chrome/17.0.963.56Safari/535.11'
                }
            });

            if (rmt_conn.statusCode == 200) {
                //toastLog("脚本下载成功");
                var rmtCsv = rmt_conn.body.string();
                files.write(csvFileName, rmtCsv);
                return true;
            } else {
                toastLog("Error:" + rmt_conn.statusMessage);
                return false;
            }
        }
    } catch (err) {
        console.error(err)  //抛出异常
        //exit()  //退出
        return false;
    }
}


var sdPath = files.getSdcardPath() + "/shockey/com.shockey.cetc/files/";//注意直接用sd卡目录，解决手机不能创建目录成功问题，缺点是删除软件后会残留此处文件

//数据文件名
var dbName = "tiku_hik.db";
var dbPath = files.path(sdPath + dbName);
var tikuVerInfo = "题库信息";
/**
 * @description: 判断题库是否存在，不存在就创建
 * @param: null
 * @return: null
 */
function isDatabasExist() {
    
    if (!files.exists(dbPath)) {
        files.createWithDirs(dbPath);
        console.error("未找到题库！重新创建题库！");

        var db = SQLiteDatabase.openOrCreateDatabase(dbPath, null);
        var createTable = "\
        CREATE TABLE IF NOT EXISTS tiku(\
        question CHAR(256) UNIQUE ON CONFLICT Ignore,\
        answer CHAR(256),\
        options CHAR(256),\
        type CHAR(16)\
        );";
        db.execSQL(createTable);

        return false;
    }
    
    return true;
}

function searchDb(keyw, _tableName, queryStr) {
    var tableName = _tableName;
    
    //确保文件存在
    if (!isDatabasExist()) {
        console.error("未找到数据库，创建默认数据库");
    }
    //创建或打开数据库
    var db = SQLiteDatabase.openOrCreateDatabase(dbPath, null);
    var query = "";
    if (queryStr == "") {
        query = "SELECT question,answer,options,type FROM " + tableName + " WHERE question LIKE '" + keyw + "%'";//前缀匹配
    } else {
        query = queryStr;
    }

    var cursor = db.rawQuery(query, null);
    cursor.moveToFirst();
    var ansTiku = [];
    if (cursor.getCount() > 0) {
        do {
            //按照question,answer,options,type插入，所有查询语句必须包含这四个字段，否则这里就会报错
            var timuObj={"question" : cursor.getString(0),"answer":cursor.getString(1),"options":cursor.getString(2),"type":cursor.getString(3)};
            ansTiku.push(timuObj);
        } while (cursor.moveToNext());
    } 
    cursor.close();
    return ansTiku;

}

function insertOrUpdate(sql) {
    if (!isDatabasExist()) {
        console.error("未找到数据库，创建默认数据库");
    }
    
    var db = SQLiteDatabase.openOrCreateDatabase(dbPath, null);
    db.execSQL(sql);
    db.close();
    return true;
}

var updateDialog = null;

function updateTikuVer()
{
    var date = new Date();
    var y = date.getFullYear();
    var m = date.getMonth()+1;
    var d = date.getDate();
    var h = date.getHours();
    var min = date.getMinutes();
    var s = date.getSeconds();
    
    var datetimeStr = y + "-" +m+"-"+d+"_"+h+":"+min+":"+s;
    //toastLog(datetimeStr);
    var sql = "INSERT INTO tiku (question, answer, type) VALUES ('"+tikuVerInfo+"', '"+datetimeStr+"','"+ latestDbVer +"') " +
    "ON CONFLICT(question) DO UPDATE SET answer = '" + datetimeStr + "', type = '"+latestDbVer+"'";
    //log("sql=%s", sql);
    insertOrUpdate(sql);
}

function updateApp()
{
    alert("功能开发中……");
}

function updateDb()
{
    //下载远程题库
    //var url = "https://cdn.jsdelivr.net/gh/shockeyzhang/HikCultureHelper/tiku.csv";//远程地址1
    var url = "https://cdn.staticaly.com/gh/shockeyzhang/HikCultureHelper/main/tiku.csv";//远程地址2
    //var url = "https://rawcdn.githack.com/shockeyzhang/HikCultureHelper/main/tiku.csv";//远程地址3 无法访问
    if(updateServer == "1")
    {
        url = "https://cdn.jsdelivr.net/gh/shockeyzhang/HikCultureHelper/tiku.csv";//远程地址1
    }
    else if(updateServer == "2")
    {
        url = "https://cdn.staticaly.com/gh/shockeyzhang/HikCultureHelper/main/tiku.csv";//远程地址2
    }
    else
    {
        url = "http://ftp6287982.host104.abeiyun.cn/data/files/tiku.csv";//远程地址3 ,阿贝云服务器
    }
    
    var updateDialog = dialogs.build({
        title: "正在更新...",
        progress: {
            max: 100,
            showMinMax: true
        },
        autoDismiss: false,
        //cancelable: false //不允许取消
    }).show();

    try {
        //执行下载更新
        var dl = downloadRemoteDB(url);

        if (!dl){ //下载失败
            updateDialog.dismiss();
            updateDialog = null;
            sleep(100);

            alert("下载题库失败，请稍候再试！");
            return false;
        }

        //开始更新
        var path = files.path(csvFileName);
        //确保文件存在
        if (!files.exists(path)) {
            alert("获取题库数据出错，请稍候再试");
            updateDialog.dismiss();
            updateDialog = null;
            return false;
        }
        
        var file = open(csvFileName, "r");
        var allLine = file.readlines();
        //log("all=%d", allLine.length);

        var content;
        var lineIdx = 0;
        var p = ((lineIdx / allLine.length) * 100);

        for each(line in allLine)
        {
            //console.log(line);
            let lineTmp = line.replace(/\\,/g, "，");//英文逗号换成中文版的
            lineTmp = lineTmp.replace(/\'/g, "");//删除单引号
            content = lineTmp.split(",");
            //console.log("Q:%s, A:%s\n", content[0], content[1]);
            //log("len=%d",content.length);

            //计算进度条位置
            p = ((lineIdx / allLine.length) * 100);

            if(content.length == 4)
            {
                var ins = "INSERT INTO tiku (";
                var val = ") VALUES (";

                if(content[0].length)
                {
                    ins += "question";
                    val += "'" + content[0] + "'";
                }

                if (content[1].length) {
                    ins += ",answer";
                    val += ",'" + content[1] + "'";
                }

                if (content[2].length) {
                    ins += ",options";
                    val += ",'" + content[2] + "'";
                }

                if (content[3].length) {
                    ins += ",type";
                    val += ",'" + content[3] + "'";
                }

                //ins += ")";
                val += ")";

                var sql = ins + val;
                if (content[1].length) { //如果是答案存在，则更新
                    sql += " ON CONFLICT(question) DO UPDATE SET answer = '" + content[1] + "'";//发现冲突，更新答案
                }
                //console.log(sql);
                var ret = insertOrUpdate(sql);//更新题库答案，更新1条记录

                if (ret) {
                    //log("题库更新成功！-%d", lineIdx);
                }
                else {
                    console.error("更新题库失败，跳过！-%d", lineIdx)
                }
            }
            else
            {
                console.log("Q:%s, A:%s, O:%s, T:%s\n", content[0], content[1], content[2], content[3]);
            }

            // 更新进度条
            updateDialog.setProgress(p);

            lineIdx++;
        }
    
        toastLog("题库更新完成");

        updateDialog.setProgress(100);
        //更新题库版本信息
        updateTikuVer();
    }
    catch (e) {
        log(e);
    }

    updateDialog.dismiss();
    updateDialog = null;
}

function checkUpdate()
{
    var appVer = app.versionCode;//软件版本
    var dbVer = 0;
    
    var sqlStr = "SELECT question,answer,options,type FROM tiku WHERE question LIKE '%%"+tikuVerInfo+"%'";
    
    var qaArray = searchDb("", "tiku", sqlStr);
    var qCount = qaArray.length;

    
    if (qCount > 0) {
        console.log("结果：%d/%d", 1, qCount);
        console.log(qaArray[0].question+":"+qaArray[0].answer);
        console.info("题库版本：", qaArray[0].type);
        dbVer = parseInt(qaArray[0].type);
    } 
    // else {
    //     console.error("未找到");
    // }
    
    //清空数组
    qaArray.splice(0,qaArray.length);
    
    if((appVer < latestAppVer)&&(dbVer < latestDbVer))
    {
        //软件和题库都可更新
        dialogs.build({
        //对话框标题
        title: "检测到更新",
        //对话框内容
        content: "软件和题库都可更新，请选择操作:\n" +
        "(题库更新期间，请勿答题！ )" ,
        //cancelable:false,//这两行代码设置不允许点击对话框外部进行取消
        //canceledOnTouchOutside:false,
        positive: "取消",
        negative: "更新题库",
        neutral: "更新软件",
        
        }).on("positive", ()=>{
        //取消，啥也不做
        }).on("negative", ()=>{
            //更新题库
            threads.start(function(){
                updateDb();
            });
            
        }).on("neutral", ()=>{
            //更新软件
            threads.start(function(){
                updateApp();
            });
            
        }).show();
    }
    else if(appVer < latestAppVer)
    {
        //APP更新
        dialogs.build({
        //对话框标题
        title: "检测到更新",
        //对话框内容
        content: "发现新版本软件，是否更新？\n" ,
        //cancelable:false,//这两行代码设置不允许点击对话框外部进行取消
        //canceledOnTouchOutside:false,
        positive: "取消",
        negative: "更新",
        //neutral: "更新软件",
        
        }).on("positive", ()=>{
        //取消，啥也不做
        }).on("negative", ()=>{
            //更新
            threads.start(function(){
                updateApp();
            });
            

        }).show();
    }
    else if(dbVer < latestDbVer)
    {
        //数据库更新
        dialogs.build({
        //对话框标题
        title: "检测到更新",
        //对话框内容
        content: "发现新题库，是否更新？\n" ,
        //cancelable:false,//这两行代码设置不允许点击对话框外部进行取消
        //canceledOnTouchOutside:false,
        positive: "取消",
        negative: "更新",
        //neutral: "更新软件",
        
        }).on("positive", ()=>{
        //取消，啥也不做
        }).on("negative", ()=>{
            //更新
            threads.start(function(){
                updateDb();
            });

        }).show();
    }
    else
    {
        //已经是最新
        alert("题库和软件都已经是最新版！");
    }
}


checkUpdate();
