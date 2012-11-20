(function(exports) {
	var fs = require('fs');
	//删除UTF-8 BOM 头
	exports.removeBOMChar = function(str) {
		return str.replace(/^\xef\xbb\xbf/,'');
	};
	//删除文件UTF-8 BOM 头
	exports.removeFileBOMChar = function(filePath){
		return this.removeBOMChar(fs.readFileSync(filePath));
	};
})(exports);