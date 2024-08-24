chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "start") {
    chrome.alarms.create('autoRefresh', { periodInMinutes: 1 });
  } else if (message.action === "stop") {
    chrome.alarms.clear('autoRefresh');
  }
});


chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoRefresh') {
    chrome.tabs.query({}, (tabs) => {

      tabs.map(tab => {
        if (tab.url.startsWith("https://www.upwork.com/nx/search/jobs")) {
          chrome.tabs.reload(tab.id);
        }
      })

    });
  }
});