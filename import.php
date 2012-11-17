<?php
/**
 * f为文件地址
 * path路径
 * type为css或者js，目前只用js
 * IE下，get请求不能超过2083字节，请注意。
 * @author theowang
 */
error_reporting(0);

$DEBUG = true;
//$DEBUG = false;
define('ROOT', dirname(__FILE__).'/');

$MATCHED = array();

//保证唯一性
$IMPORTED = array();

if(isset($_GET['path'])){
    $PATH = explode(',', $_GET['path']);
}else{
    $PATH = array();
}


if(in_array($_GET['type'], array('js','css'))){
	$type = '.'.$_GET['type'];
}else{
    $type = '.js';
}

/**************************添加头文件类型********************/

if($type ==='.css'){
    header('Content-type: text/css; charset: UTF-8;');
}elseif($type ==='.js'){
    header('Content-type: application/x-javascript; charset: UTF-8;');
}
header("cache-control: must-revalidate");
$offset = 60 * 60 * 24;
$expire = "expires: " . gmdate ("D, d M Y H:i:s", time() + $offset) . " GMT";
header ($expire);

/**************************合并输出文件********************/

echo importMixJS(explode(',', $_GET['f']), $type, false);


function checkBOM ($filename) { 
    $file = @fopen($filename, "r"); 
    $bom = fread($file, 3); 
    if ($bom != "\xEF\xBB\xBF"){ 
        return false; 
    } else { 
        return true; 
	}
}

function importMixJS($files, $fileType = '.js', $returnFile = true){
    global $MATCHED, $DEBUG, $IMPORTED;

    $output = "";

    if(is_string($files)){
        $files = array($files);
    }else if(!is_array($files)){
        return $output;
    }
    if($DEBUG){
    	echo "/**************************************\n";
    	var_dump($files);
		echo "**************************************/\n";
    }
        
    foreach($files as $file){
        if(strrpos($file, '*')){
            $output .= importMixJS(getPackage(str_replace(array(".", '*'), array('/', ''), $file)));
        }elseif(in_array($file, $IMPORTED)){
            continue;
        }else{
            $IMPORTED[] = $file;
            $file = str_replace(".", '/', $file) . $fileType;
            
			echo "//===================>引入文件: " . $file . "; 是否从js文件中引入？ ".($returnFile?'是':'否')."\n";
                
            if(!in_array($file, $MATCHED)){
                $content = getFileContents($file);
                if(!$content){
                    echo "alert('文件内容为空：$file');\n";
                    continue;
                }
                $MATCHED[] = $file;
                $matches = array();
                //去掉注释
                $content = trim(preg_replace("/\/\*(.*?)\*\//ies", "", $content));
                $output .= preg_replace("/\/\/\/?\s?MixJS.define\s+([\w\-\$]+(\.[\w\-\$]+)*);?/ies", "importMixJS('\\1')", $content);
            }
        }
    }
    return $output;
}

function getFileContents($filename){
    global $PATH;

    $path = $PATH;
    array_unshift($path, "./");

    foreach($path as $eachPath){
    	if(checkBOM($eachPath . $filename)){
    		echo "alert('{$eachPath}{$filename}存在BOM头');\n";
    	}
        if($content = @file_get_contents($eachPath . $filename)){
            return $content;
        }
    }
    if(checkBOM(ROOT.$filename)){
        echo "alert('{$filename}存在BOM头');\n";
    }
    return file_get_contents(ROOT.$filename);
}

function getPackage($packagePath){
    $files = array();
    if ($handle = opendir($packagePath)) {
        while ($file = readdir($handle)) { 
            if(strrpos($file, ".js")  && substr($file,0,1) != ".")
                $files[] = substr($packagePath . $file, 0, -3); //把最后的.js去掉
        } 
        closedir($handle); 
    }
    return $files;
}
