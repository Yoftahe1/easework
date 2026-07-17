chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "changeColor") {
    const { newJobs } = request;

    // Get all <a> elements with a job UID attribute
    const jobLinks = document.querySelectorAll("a[data-ev-job-uid]");

    // Iterate over each job link element
    jobLinks.forEach((a) => {
      const jobUid = a.getAttribute("data-ev-job-uid");
      if (newJobs.includes(jobUid)) {
        a.style.color = "red"; // Change color to red for new jobs
      } else {
        a.style.color = ""; // Restore default styles for non-new jobs
      }
    });
  }
});
