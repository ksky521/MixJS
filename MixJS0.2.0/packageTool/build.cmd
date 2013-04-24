@echo off
title MixJS Builder - 正在打包 ...

color 03
REM =====================================
REM    MixJS Builder beta版
REM
REM =====================================
SETLOCAL ENABLEEXTENSIONS
 
echo.
 
REM 过滤文件后缀，只combo js文件
if "%~x1" NEQ ".js" (
    echo.
    echo **** 请选择JS文件
    echo.
    goto End
)
 
REM 检查NODE_PATH
if "%NODE_PATH%" == "" goto NoNodePath
if not exist "%NODE_PATH%\node.exe" goto NoNodePath

 
set RESULT_FILE=%~n1-pack%~x1

:ZIP_CHOICE

echo 选择是否【压缩】打包后的js文件?
set input=
set /p input= -^> 请选择(y/n): 
if /i "%input%"=="n" goto UNZIP
if /i "%input%"=="y" goto ZIP

REM 调用MixJSBuild合并文件
:UNZIP
"%NODE_PATH%\node.exe" "%~dp0build.js" --unzip "%~n1%~x1" > "%RESULT_FILE%"
echo.
echo **** ~O(∩_∩)O~ 【打包】成功 ****
echo.
goto End


REM 调用build合并并且压缩文件
:ZIP
"%NODE_PATH%\node.exe" "%~dp0build.js" "%~n1%~x1" > "%RESULT_FILE%"
echo.
echo **** ~O(∩_∩)O~ 【打包并压缩】成功 ****
echo.
goto End
 
:NoNodePath
echo.
echo **** 请先安装NodeJS并设置NODE_PATH环境变量 ****
echo.
 
:End
ENDLOCAL
pause



