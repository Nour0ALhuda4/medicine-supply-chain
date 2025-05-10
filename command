nodemon server/app.js 
nodemon server/arduino-reader.js
-------------------------------------------------

--To check if port 3000 is in use, and see which process (PID) is using it.
    netstat -ano | findstr :3000 

--To  stop a process running on a specific PID
taskkill -F -PID {port to process is on}
