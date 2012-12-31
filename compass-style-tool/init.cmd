@echo off
color 03
REM =====================================
REM    初始化切图页面 0.1 Alpha by Theowang
REM
REM =====================================
SETLOCAL ENABLEEXTENSIONS
 
echo.
echo 初始化切图页面 0.1 Alpha by Theowang

:copyFile
echo.
echo 拷贝数据。。。
echo.
xcopy /e "%~dp0\\initPSD" "%~dpf1"
goto getInNewFolder 

:getInNewFolder
echo.
echo 拷贝数据成功！
echo.
cd "%~dpf1"
goto createCompass 

:createCompass
compass init
echo.
echo **** ~O(∩_∩)O~ 初始化成功 ****
echo.
goto End 

:End
ENDLOCAL
pause