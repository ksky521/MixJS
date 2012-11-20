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
define('ROOT', dirname(__FILE__).'/test/');//此处是为了测试用的，如果是根目录可以去掉test/

// $MATCHED = array();

$IMPORTED = array();//保证唯一性

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

$topFileType = $type;//顶级文件类型~

header('cache-control: must-revalidate');
$offset = 60 * 60 * 24;//过期时间
$expire = 'expires: ' . gmdate ('D, d M Y H:i:s', time() + $offset) . ' GMT';
header ($expire);

/**************************合并输出文件********************/

$content = importFile(explode(',', $_GET['f']), $type);
echo implode(";\n", $content);


function importFile($files, $fileType = '.js'){
    global $DEBUG, $IMPORTED, $topFileType;
    $output = array();
    

    if(is_string($files)){
        $files = array($files);
    }else if(!is_array($files)){
        return $output;
    }

    foreach($files as $file){
        $file = str_replace('.', '/', $file) . $fileType;

        if(!in_array($file, $IMPORTED)){
            $IMPORTED[] = $file;

            $content = getFileContents($file);
            if(empty($content)){
                $content = 'alert("'.$file.'：内容为空或者没有找到文件")';
            }
            if($fileType == '.js'){
                //如果是js文件
                preg_match_all("/\.define\s*\([\"\']([^\"\']+)[\"\']\s*,\s*[\[](.+?)[\]]\s*,\s*function/es", $content, $matches);

                // var_dump($matches);
                if(isset($matches[2])){
                    foreach($matches[2] as $val){
                        // var_dump($val);
                        $val = explode(',', $val);

                        // $back = array();
                        // $output = '';
                        foreach($val as $v){
                            $v = trim($v);
                            $v = preg_replace('/[\"\']/s', '', $v);
                            $type = substr($v, -4);
                            if($type=='.css'){
                                $v = substr($v, 0, -4);
                            }else{
                                $type = substr($v, -3);
                                if($type=='.js'){
                                    $v = substr($v, 0, -4);
                                }else{
                                    $type = '.js';
                                }
                            }
                            // var_dump($v);
                            // var_dump(importFile($v, $type));
                            $output = array_merge($output, importFile($v, $type)) ;
                        }                        
                    }
                }
            }elseif($fileType == '.css' && $topFileType == '.js'){
                // $content = 'document.write("<style>'.$content.'</style>")';
                // var_dump($content);
                $content = 'alert("'.$file.':是css文件")';
            }
            
            echo "/**********************\n";
            echo '* 加载文件--->'.$file."\n";
            echo "**********************/\n\n";
            $output[] = $content;
        }
    }
    return $output;
}
/**
 * 获取文件内容
 * @param  [type] $filename [description]
 * @return [type]           [description]
 */
function getFileContents($filename){
    global $PATH;

    $path = $PATH;
    array_unshift($path, './');

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
/**
 * 检查BOM头
 * @param  [type] $filename [description]
 * @return [type]           [description]
 */
function checkBOM ($filename) { 
    $file = @fopen($filename, "r"); 
    $bom = fread($file, 3); 
    if ($bom != "\xEF\xBB\xBF"){ 
        return false; 
    } else { 
        return true; 
    }
}
function getPackage($packagePath){
    $files = array();
    if ($handle = opendir($packagePath)) {
        while ($file = readdir($handle)) { 
            if(strrpos($file, '.js')  && substr($file,0,1) != '.')
                $files[] = substr($packagePath . $file, 0, -3); //把最后的.js去掉
        } 
        closedir($handle); 
    }
    return $files;
}
