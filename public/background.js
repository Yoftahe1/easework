chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "start") {
    chrome.alarms.create('autoRefresh', { periodInMinutes: 1 });
  } else if (message.action === "stop") {
    chrome.alarms.clear('autoRefresh');
  }
});


chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoRefresh') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url.startsWith("https://www.upwork.com/nx/search/jobs")) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  }
});