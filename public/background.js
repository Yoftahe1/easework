let intervalId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start" && !intervalId) {
    intervalId = setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.startsWith("https://www.upwork.com/nx/search/jobs")) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    }, 60000);
  } else if (message.action === "stop" && intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});
