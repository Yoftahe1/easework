import { useState, useEffect } from "react";
import "./App.css";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function App() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [minMinutes, setMinMinutes] = useState(1);
  const [maxMinutes, setMaxMinutes] = useState(5);
  const [currentIntervalMinutes, setCurrentIntervalMinutes] = useState(1);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [proposal, setProposal] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Retrieve subscription status, start time, intervals, and notifications preference from local storage
    chrome.storage.local.get(
      ["isSubscribed", "startTime", "minMinutes", "maxMinutes", "currentIntervalMinutes", "notificationsEnabled", "proposal"],
      function (result) {
        if (result.isSubscribed) {
          setIsSubscribed(true);
        }
        if (result.startTime) {
          setStartTime(result.startTime);
        }
        if (result.minMinutes) {
          setMinMinutes(result.minMinutes);
        }
        if (result.maxMinutes) {
          setMaxMinutes(result.maxMinutes);
        }
        if (result.currentIntervalMinutes) {
          setCurrentIntervalMinutes(result.currentIntervalMinutes);
          if (!result.isSubscribed) {
            setRemainingSeconds(result.currentIntervalMinutes * 60);
          }
        } else if (result.minMinutes) {
          if (!result.isSubscribed) {
            setRemainingSeconds(result.minMinutes * 60);
          }
        }
        if (result.notificationsEnabled !== undefined) {
          setNotificationsEnabled(result.notificationsEnabled);
        }
        if (result.proposal !== undefined) {
          setProposal(result.proposal);
        }
      }
    );

    // Listen to changes in chrome local storage
    const handleStorageChange = (changes, areaName) => {
      if (areaName === "local") {
        if (changes.isSubscribed !== undefined) {
          setIsSubscribed(changes.isSubscribed.newValue);
        }
        if (changes.startTime !== undefined) {
          setStartTime(changes.startTime.newValue);
        }
        if (changes.minMinutes !== undefined) {
          setMinMinutes(changes.minMinutes.newValue);
        }
        if (changes.maxMinutes !== undefined) {
          setMaxMinutes(changes.maxMinutes.newValue);
        }
        if (changes.currentIntervalMinutes !== undefined) {
          setCurrentIntervalMinutes(changes.currentIntervalMinutes.newValue);
        }
        if (changes.notificationsEnabled !== undefined) {
          setNotificationsEnabled(changes.notificationsEnabled.newValue);
        }
        if (changes.proposal !== undefined) {
          setProposal(changes.proposal.newValue);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    // Update progress and remaining seconds based on time passed since startTime
    if (startTime && isSubscribed) {
      const totalSeconds = currentIntervalMinutes * 60;
      const totalMs = totalSeconds * 1000;

      const updateProgress = () => {
        const elapsedTime = Date.now() - startTime;
        const progressValue = Math.min(100, Math.max(0, (elapsedTime / totalMs) * 100));
        setProgress(progressValue);

        const remaining = Math.max(0, Math.ceil((totalMs - elapsedTime) / 1000));
        setRemainingSeconds(remaining);
      };

      updateProgress();
      const intervalId = setInterval(updateProgress, 1000);

      return () => clearInterval(intervalId);
    }
  }, [startTime, currentIntervalMinutes, isSubscribed]);

  function handleSubscribe() {
    chrome.runtime.sendMessage({ 
      action: "start", 
      minMinutes: minMinutes, 
      maxMinutes: maxMinutes 
    });
    setIsSubscribed(true);
    setProgress(0);
    setRemainingSeconds(minMinutes * 60);
  }

  function handleToggleNotifications() {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    chrome.storage.local.set({ notificationsEnabled: newValue });
  }

  function handleUnsubscribe() {
    chrome.runtime.sendMessage({ action: "stop" });
    chrome.storage.local.remove(["isSubscribed", "startTime", "currentIntervalMinutes"]);
    setIsSubscribed(false);
    setProgress(0);
    setRemainingSeconds(minMinutes * 60);
  }

  function handleProposalChange(e) {
    const val = e.target.value;
    setProposal(val);
    chrome.storage.local.set({ proposal: val });
  }

  function handleCopy() {
    if (!proposal) return;
    navigator.clipboard.writeText(proposal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }


  const formatTime = (secs) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="app-container">
      <div className="header-group">
        <h1 className="app-title">Ease-Work</h1>
        <div className="app-subtitle">Upwork Job Monitor</div>
      </div>

      {!isSubscribed && (
        <div className="input-row">
          <div className="form-group">
            <label className="input-label">Min (min)</label>
            <input
              type="number"
              min="1"
              value={minMinutes}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                setMinMinutes(val);
                chrome.storage.local.set({ minMinutes: val });
                if (!isSubscribed) {
                  setRemainingSeconds(val * 60);
                }
                if (val > maxMinutes) {
                  setMaxMinutes(val);
                  chrome.storage.local.set({ maxMinutes: val });
                }
              }}
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label className="input-label">Max (min)</label>
            <input
              type="number"
              min="1"
              value={maxMinutes}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1);
                setMaxMinutes(val);
                chrome.storage.local.set({ maxMinutes: val });
                if (val < minMinutes) {
                  setMinMinutes(val);
                  chrome.storage.local.set({ minMinutes: val });
                  if (!isSubscribed) {
                    setRemainingSeconds(val * 60);
                  }
                }
              }}
              className="input-field"
            />
          </div>
        </div>
      )}

      {isSubscribed && (
        <div className="progress-wrapper">
          <div className="progress-pulse"></div>
          <CircularProgressbar
            value={progress}
            text={formatTime(remainingSeconds)}
            styles={buildStyles({
              pathColor: `#10b981`,
              textColor: '#10b981',
              trailColor: 'rgba(255, 255, 255, 0.05)',
              textSize: '16px'
            })}
          />
        </div>
      )}

      <div className="toggle-row" onClick={handleToggleNotifications}>
        <div className="toggle-text-container">
          <div className="toggle-title">Desktop Alerts</div>
          <div className="toggle-desc">{notificationsEnabled ? "Alert on new jobs" : "Muted"}</div>
        </div>
        <div className={`switch-track ${notificationsEnabled ? 'active' : ''}`}>
          <div className="switch-thumb" />
        </div>
      </div>

      <div className="proposal-section">
        <div className="proposal-header">
          <label className="input-label">Proposal Template</label>
          <button 
            className={`btn-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            disabled={!proposal}
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <textarea
          className="proposal-textarea"
          value={proposal}
          onChange={handleProposalChange}
          placeholder="Type your proposal template here..."
        />
      </div>

      {isSubscribed ? (
        <button className="btn-action btn-danger" onClick={handleUnsubscribe}>
          Stop Monitor
        </button>
      ) : (
        <button className="btn-action btn-primary" onClick={handleSubscribe}>
          Start Monitor
        </button>
      )}

      <p className="app-footer">@ ALL-RIGHTS RESERVED TO EASE-WORK</p>
    </div>
  );
}

export default App;
