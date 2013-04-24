MixJS packageTool
=====

MixJS打包工具，目前是windows版本。。。右键鼠标右键菜单。

# 使用方法

首先配置nodejs环境变量：NODE_PATH

> 右键 我的电脑 （计算机） → 高级系统设置 → 环境变量 → 用户变量 → 新建变量名：NODE_PATH ，变量值：nodejs安装路径

运行install.cmd，然后找到需要压缩的js右键，选择 `打包MixJS文件`

会弹出选择是否压缩，y：打包后压缩，n：只是打包

打包后生成xxx-pack.js

## 使用配置 config.js

`config.js` 是配置，可以配置打包js默认所在路径