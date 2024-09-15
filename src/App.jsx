import { useState, useEffect } from "react";
import bell from "./assets/bell.mp3";
import "./App.css";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function App() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(60); // To store the remaining seconds

  useEffect(() => {
    // Retrieve subscription status and start time from local storage
    chrome.storage.local.get(["isSubscribed", "startTime"], function (result) {
      if (result.isSubscribed) {
        setIsSubscribed(true);
        if (result.startTime) {
          setStartTime(result.startTime);
        }
      }
    });
  }, []);

  useEffect(() => {
    // Update progress and remaining seconds based on time passed since startTime
    if (startTime) {
      const intervalId = setInterval(() => {
        const elapsedTime = Date.now() - startTime; // Calculate elapsed time
        const progressValue = (elapsedTime % 60000) / 600; // Progress for 1 minute
        setProgress(progressValue);

        // Calculate remaining seconds
        const remaining = 60 - Math.floor((elapsedTime % 60000) / 1000);
        setRemainingSeconds(remaining);

        // When a minute is completed, play sound
        if (remaining === 0) {
          const audio = new Audio(chrome.runtime.getURL(bell));
          audio.play();
        }
      }, 1000); // Update every second

      return () => clearInterval(intervalId); // Clear the interval on unmount
    }
  }, [startTime]);

  function handleSubscribe() {
    const now = Date.now();
    chrome.runtime.sendMessage({ action: "start" });
    chrome.storage.local.set({ isSubscribed: true, startTime: now });
    setIsSubscribed(true);
    setStartTime(now);
    setProgress(0);
    setRemainingSeconds(60);
  }

  function handleUnsubscribe() {
    chrome.runtime.sendMessage({ action: "stop" });
    chrome.storage.local.remove(["isSubscribed", "startTime"]);
    setIsSubscribed(false);
    setProgress(0);
    setRemainingSeconds(60); // Reset remaining seconds
  }

  return (
    <>
      <div>
        <h1>Ease-Work</h1>

        {isSubscribed && (
          <div style={{ width: 150, height: 150 }}>
            <CircularProgressbar
              value={progress}
              text={`${remainingSeconds}s`} // Display remaining seconds in the text
              styles={buildStyles({
                pathColor: `#14a800`,
                textColor: '#14a800', // Color for the remaining seconds text
              })}
            />
          </div>
        )}
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
