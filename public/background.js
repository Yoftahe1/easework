chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    let tab = tabs.find((tab) =>
      tab.url.startsWith("https://www.upwork.com/nx/search/jobs"),
    );
    if (tab) {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "start") {
    // Clear old jobs in storage on subscription start
    chrome.storage.local.set({ oldJobs: [] }, () => {
      chrome.tabs.query({}, (tabs) => {
        let tab = tabs.find((tab) =>
          tab.url.startsWith("https://www.upwork.com/nx/search/jobs"),
        );
        if (tab) {
          executeScript(tab.id, false);
        }
      });
    });

    const min = message.minMinutes || 1;
    const max = message.maxMinutes || 1;
    const randomMinutes = getRandomMinutes(min, max);

    chrome.storage.local.set(
      {
        isSubscribed: true,
        startTime: Date.now(),
        minMinutes: min,
        maxMinutes: max,
        currentIntervalMinutes: randomMinutes,
      },
      () => {
        chrome.alarms.create("autoRefresh", { delayInMinutes: randomMinutes });
      },
    );
  } else if (message.action === "stop") {
    chrome.alarms.clear("autoRefresh");
    // Clear subscription and job storage on stop
    chrome.storage.local.remove([
      "isSubscribed",
      "startTime",
      "currentIntervalMinutes",
      "oldJobs",
    ]);
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "autoRefresh") {
    queryTab();

    // Reschedule next random alarm
    chrome.storage.local.get(["minMinutes", "maxMinutes"], (result) => {
      const min = result.minMinutes || 1;
      const max = result.maxMinutes || 1;
      const randomMinutes = getRandomMinutes(min, max);

      chrome.storage.local.set(
        {
          startTime: Date.now(),
          currentIntervalMinutes: randomMinutes,
        },
        () => {
          chrome.alarms.create("autoRefresh", {
            delayInMinutes: randomMinutes,
          });
        },
      );
    });
  }
});

function getRandomMinutes(min, max) {
  if (min >= max) return min;
  const val = Math.random() * (max - min) + min;
  return Math.round(val * 10) / 10;
}

function setupAlarmIfSubscribed() {
  chrome.storage.local.get(
    ["isSubscribed", "minMinutes", "maxMinutes"],
    (result) => {
      if (result.isSubscribed) {
        chrome.alarms.get("autoRefresh", (alarm) => {
          if (!alarm) {
            const min = result.minMinutes || 1;
            const max = result.maxMinutes || 1;
            const randomMinutes = getRandomMinutes(min, max);
            chrome.storage.local.set(
              {
                startTime: Date.now(),
                currentIntervalMinutes: randomMinutes,
              },
              () => {
                chrome.alarms.create("autoRefresh", {
                  delayInMinutes: randomMinutes,
                });
              },
            );
          }
        });
      }
    },
  );
}

chrome.runtime.onStartup.addListener(setupAlarmIfSubscribed);
chrome.runtime.onInstalled.addListener(setupAlarmIfSubscribed);

function queryTab() {
  chrome.tabs.query({}, (tabs) => {
    let tab = tabs.find((tab) =>
      tab.url.startsWith("https://www.upwork.com/nx/search/jobs"),
    );
    if (tab) {
      chrome.tabs.reload(tab.id, () => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            executeScript(tab.id, true);
          }
        });
      });
    }
  });
}

function executeScript(tabId, notFirstTime) {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      func: getHTMLContent,
    },
    (results) => {
      if (!results || results.length === 0) return;

      const currentJobs = results[0].result;

      chrome.storage.local.get(["oldJobs"], (data) => {
        const storedOldJobs = data.oldJobs || [];

        // Find jobs that are not in the stored list
        const newJobsList = currentJobs.filter(
          (element) => !storedOldJobs.includes(element),
        );

        if (newJobsList.length > 0) {
          // Append new jobs to the stored list
          const updatedOldJobs = [...storedOldJobs, ...newJobsList];

          chrome.storage.local.set({ oldJobs: updatedOldJobs }, () => {
            if (notFirstTime) {
              notifyUser(tabId, newJobsList);
            }
          });
        }
      });
    },
  );
}

function getHTMLContent() {
  const jobElements = document.querySelectorAll("article[data-ev-job-uid]");
  return Array.from(jobElements)
    .map((element) => element.getAttribute("data-ev-job-uid"))
    .filter(Boolean);
}

function notifyUser(tabId, newJobsList) {
  chrome.tabs.sendMessage(tabId, { type: "changeColor", newJobs: newJobsList });

  chrome.storage.local.get(["notificationsEnabled"], (data) => {
    if (data.notificationsEnabled !== false) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "up.png",
        title: "New Upwork Jobs Found!",
        message: `${newJobsList.length} new job(s) found on Upwork. Click to view!`,
        priority: 2,
      });
    }
  });
}
