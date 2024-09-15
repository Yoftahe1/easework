let oldJobs = []
let newJobs = []

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "start") {
    chrome.tabs.query({}, (tabs) => {
      let tab = tabs.find(tab => tab.url.startsWith("https://www.upwork.com/nx/search/jobs"))
      if (tab) {
        executeScript(tab.id, false)
      }
    });

    chrome.alarms.create('autoRefresh', { periodInMinutes: 1 });
  } else if (message.action === "stop") {
    chrome.alarms.clear('autoRefresh');
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoRefresh') {
    queryTab()
  }
});

function queryTab() {
  chrome.tabs.query({}, (tabs) => {
    let tab = tabs.find(tab => tab.url.startsWith("https://www.upwork.com/nx/search/jobs"));
    if (tab) {
      chrome.tabs.reload(tab.id, () => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            executeScript(tab.id, true);
          }
        });
      });
    }
  });
}

function executeScript(tabId, notFirstTime) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: getHTMLContent
  }, (results) => {
    if (!results || results.length === 0) return;

    newJobs = results[0].result.filter(element => !oldJobs.includes(element));
    oldJobs = results[0].result

    if (newJobs.length > 0 && notFirstTime) {
      notifyUser(tabId)
    }
  });
}

function getHTMLContent() {
  const jobElements = document.querySelectorAll('article[data-ev-label="search_results_impression"]');
  return Array.from(jobElements).map(element => {
    const title = element.querySelector('h2');
    return title ? title.innerText.trim() : ""
  })
}

function notifyUser(tabId) {
  // chrome.runtime.sendMessage({ action: 'playSound' });
  // chrome.tabs.sendMessage(tabId, { type: 'changeColor', newJobs });
}
