
import React, { useContext, useState, useEffect, useRef } from 'react'
import "./App.css";
import logo from "./logo.svg";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import NoMatch from "./pages/noMatch";
import Reactflow from "./pages/reactflow"
import { io } from "socket.io-client"


function App() {


  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [notificationServerDown, setNotificationServerDown] = useState(false)
  const URL_PATH_NOTIFICATION_SERVER = 'http://localhost:3006'  // WE HAVE TO REPLACE BEFORE GOING GIVE 

  const KitchenName = 'dummy123'

  // Need fixing its not connecting to notification server after hosting
  useEffect(() => {


    const socket = io(URL_PATH_NOTIFICATION_SERVER, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      forceNew: true,
      reconnectionDelay: 1000,         // 🔁 Retry after 1s
      reconnectionDelayMax: 2000,      // 🔁 Max wait of 2s between attempts
      timeout: 5000,                   // 🔥 Fail fast if no response in 5s
      query: {
        type: 'kitchen_frontend_app',
        KitchenName: KitchenName

      },
      transports: ['websocket'],
      auth: {
        serverOffset: 0
      }
    });


    socketRef.current = socket;

    socket.on("connect", () => {
      reconnectAttemptsRef.current = 0;
      setConnectionStatus("Connected");
      setNotificationServerDown(false)
      console.log("Connected to Notification server", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setConnectionStatus("Disconnected: " + reason);
      console.log("Disconnected Notification server:", reason);

      if (reason === "transport close" || reason === "ping timeout") {
        // Attempt reconnection
        socket.connect()
      }
    });


    socket.on("reconnect_attempt", (attemptNumber) => {
      reconnectAttemptsRef.current = attemptNumber;
      setConnectionStatus(`Reconnecting... Attempt ${attemptNumber}`);
      console.log(`Reconnection attempt #${attemptNumber}`);
    });

    socket.on("reconnect_failed", () => {
      setConnectionStatus("Reconnection failed after 5 attempts");
      setNotificationServerDown(true)
      console.error("Notification server Failed to reconnect after several attempts");
    });

    socket.on("reconnect", () => {
      setNotificationServerDown(false)
      setConnectionStatus("Reconnected successfully");
      console.log("Notification server Reconnected successfully");
    });



    socket.on('connect_error', (e) => {
      console.log(e.message, 'socket server is down');

      // we get this error when down
      setNotificationServerDown(true)
    })


    // Custom ping/pong
    let pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping");
        console.log("📡 Sent ping");
      }
    }, 30000); // every 30 seconds

    socket.on(`pong`, (msg) => {
      console.log("📶 Pong received",);
    });



    socket.on(KitchenName, (arg, serverOffset) => {
      socket.auth.serverOffset = serverOffset;

      console.log('--Data coming from Notification server', arg)


    })





    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };

  }, [KitchenName])







  return (
    <div className="App">
      <Routes>

        <Route path='*' element={<NoMatch />}></Route>
        <Route path='/reactflow' element={<Reactflow />}></Route>
        <Route>
          <Route path='/home' element={<Home />}>
            <Route path='about' element={<About />}></Route>
          </Route>



        </Route>
      </Routes>
    </div>
  );
}

export default App;
