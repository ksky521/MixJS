//删除文件BOM头
var fs = require('fs');
//删除UTF-8 BOM 头
module.exports.removeBOMChar = function(str) {
	return str.replace(/^\xef\xbb\xbf/,'');
};
//删除文件UTF-8 BOM 头
module.exports.removeFileBOMChar = function(filePath){
	return this.removeBOMChar(fs.readFileSync(filePath));
};
