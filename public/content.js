chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'changeColor') {
        const { newJobs } = request;

        // Get all <a> elements on the page
        const aElements = document.querySelectorAll('a');

        // Iterate over each <a> element
        aElements.forEach(a => {
            // If the <a> text content matches any string in the array
            if (newJobs.includes(a.textContent)) {
                a.style.color = 'red'; // Change color to red
            }
            else {
                a.style.color = 'black';
            }
        });
    }
});