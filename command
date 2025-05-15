nodemon server/app.js 
nodemon server/arduino-reader.js
-------------------------------------------------

--To check if port 3000 is in use, and see which process (PID) is using it.
    netstat -ano | findstr :3000 

--To  stop a process running on a specific PID
taskkill -F -PID {port to process is on}

--To open pm2
pm2 start server/app.js --name medicine-supply-chain

--To stop pm2
pm2 stop 0

--ip 
198.199.84.32