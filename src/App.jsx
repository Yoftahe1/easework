import { useState, useEffect } from "react";
import bell from "./assets/bell.mp3";
import "./App.css";

function App() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["isSubscribed"], function (result) {
      if (result.isSubscribed != undefined) {
        setIsSubscribed(true);
      }
    });
  }, []);

  useEffect(() => {
    const messageListener = (message) => {
      if (message.action === "playSound") {
        const audio = new Audio(chrome.runtime.getURL(bell));
        audio.play();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  function handleSubscribe() {
    chrome.runtime.sendMessage({ action: "start" });
    chrome.storage.local.set({ isSubscribed: true });
    setIsSubscribed(true);
  }

  function handleUnsubscribe() {
    chrome.runtime.sendMessage({ action: "stop" });
    chrome.storage.local.remove("isSubscribed");
    setIsSubscribed(false);
  }

  return (
    <>
      <div>
        <h1>Ease-Work</h1>
        {isSubscribed ? (
          <button className="warn" onClick={handleUnsubscribe}>
            Unsubscribe
          </button>
        ) : (
          <button onClick={handleSubscribe}>Subscribe</button>
        )}
      </div>
      <p>@ ALL-RIGHTS RESERVED TO EASE-WORK</p>
    </>
  );
}

export default App;
