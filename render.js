window.$= window.jQuery=require('jquery')

const serialport=require('serialport')
const fs=require('fs')
const xml2js=require('xml2js')
const ipc=require('electron').ipcRenderer
let port=null

/*检查更新*/
function CheckUpdate(){
	ipc.send('check-for-update')
}
/*获取串口列表*/
serialport.list((err,ports)=>{
    for (let item of ports) {
        $('#COM').append(`<option value="${item.comName}">${item.comName}</option>`)
    }
})

/*获取串口数据*/
function GetSerialPortData(ws){
	let COM=$("#COM").val()
	let sendConfigParams={}
	let receive='',receiveArr=[]
	
	$(".form-group").each(function(){
		var key=$(this).find(".form-control").attr("id")
		var value=$(this).find(".form-control").val()
		if(Number(value))
			sendConfigParams[key]=Number(value)
		else
			sendConfigParams[key]=value
	})
	if(!port){

		try{
			port=new serialport(COM,sendConfigParams)
			$(".status").fadeOut()
		}catch(ex){
			$(".status").fadeIn()
			$(".status").text(err)
		}
	}
	port.on('error',err=>{
		$(".showResult").hide()	
	})
	port.on('data',data=>{
		$(".showResult").fadeIn()
		receive+=data.toString()
		/*以回车结尾的电子秤,取样数据大于20组*/
		receiveArr=receive.replace(/(^\s*)|(\s*$)/g, "").split('\n')
		if(receiveArr.length>20){
			let result=receiveArr[receiveArr.length-2].toString().replace(/(^\s*)|(\s*$)/g, "")
			if(result.indexOf("ST")>=0 && result.length>=16){ //以ST开头的电子秤数据解析
				$('.result').text(result.substring(6,result.length))
				try{
					if(ws.readyState==ws.OPEN)
						ws.send(JSON.stringify({"data":result.substring(6,result.length).replace(/(^\s*)|(\s*$)/g, "")}))					
				}catch(exception){
					
				}

			}			
		}

	})
}

let xmlParser=new xml2js.Parser({
	explicitArray:false,
	ignoreAttrs:true
})	
let jsonBuilder=new xml2js.Builder()

/*从配置文件里读取数据*/
function GetConfig(){
	fs.readFile('./Config.xml','utf-8',(err,data)=>{
		if(err){
			throw err
		}
		xmlParser.parseString(data,function(err,result){
			let obj=JSON.parse(JSON.stringify(result)).root
			$(".form-control").each(function(){
				let key=$(this).attr("id")
				$(this).find("option").each(function(){
					if($(this).val()===obj[key])
						$(this).attr("selected",true)
					else
						$(this).attr("selected",false)
				})
			})
		})
	})
}
function SaveConfig(){
	let xml='<configuration>Weigher Configuration</configuration>'
	let obj={}
	$(".form-control").each(function(){
		var key=$(this).attr("id")
		if(key){
			obj[key]=$(this).val()
		}
	})
	let builder=new xml2js.Builder()
	let jsonxml=builder.buildObject(obj)
	return jsonxml
}
/*打开app,获取默认配置*/
GetConfig()
/*尝试获取更新*/
CheckUpdate()
/*使用websocket服务器端*/
let webSocketServer=require('ws').Server
let websocket=new webSocketServer({port:1314})

/*监听websocket连接事件*/
websocket.on("connection",function(ws){
	ws.on("message",function(msg){
		if(msg==="weighting"){
			GetSerialPortData(ws)
		}
	})

	ws.on("close",function(msg){
		$(".status").text("connection has been closed...")
	})

})

/*尝试创建保存配置的文件config.xml*/
$("#connect").on("click",function(){
	let xml=SaveConfig()
	fs.writeFile('./Config.xml',xml,function(err){
		if(err)
			throw err
	})
	GetSerialPortData()
})