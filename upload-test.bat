@echo off
setlocal enabledelayedexpansion
set FILE_PATH=D:\KTPM-architecture-solution-main\CS2\sample-image\msedge_MgkLtHaimR.png
set OUTPUT_CSV=D:\KTPM-architecture-solution-main\CS2\upload-test-result.csv

echo Starting cURL Load Test...

:: Tạo file CSV với header
echo Timestamp,Response Time (s) > "D:\KTPM-architecture-solution-main\CS2\upload-test-result.csv"

:: Chạy trong 30 giây
for /L %%s in (1,1,30) do (
    echo .
    echo Running time %%s.
    for /L %%i in (1,1,5) do (
        echo ...
        echo Sending request %%i in time %%s...
        curl -s -X POST -F "image=@D:\KTPM-architecture-solution-main\CS2\sample-image\msedge_MgkLtHaimR.png" http://localhost:5000/upload -w "%%{time_total}" -o nul > temp.txt
        set /p RESPONSE_TIME=<temp.txt
        echo !time!,!RESPONSE_TIME! >> "D:\KTPM-architecture-solution-main\CS2\upload-test-result.csv"
    )
)

echo Load Test Complete. Results saved to D:\KTPM-architecture-solution-main\CS2\upload-test-result.csv
del temp.txt
pause