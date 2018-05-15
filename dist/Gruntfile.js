var grunt = require("grunt");  
grunt.config.init({  
    pkg: grunt.file.readJSON('package.json'),  
    'create-windows-installer': {  
        x64: {  
        	version:'1.0.0',
            appDirectory: './观云长称重组件-win32-x64',  
            authors: '乐麦信息技术(杭州)有限公司',  
            exe: '观云长称重组件.exe',
            setupIcon:'./gyc.ico',
            title:'观云长称重客户端',
            iconUrl:'http://172.16.5.63/icon/gyc_icon.ico',
            noMsi:true
        }         
    }  
})  
grunt.file.defaultEncoding = 'GBK';
grunt.loadNpmTasks('grunt-electron-installer');  
grunt.registerTask('default', ['create-windows-installer']); 