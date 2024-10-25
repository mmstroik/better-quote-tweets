function getCleanUrl(url) {
  let cleanUrl = new URL(url).hostname + new URL(url).pathname;
  // Remove 'www.' if present
  cleanUrl = cleanUrl.replace(/^www\./, '');
  // Remove query parameters and hash
  cleanUrl = cleanUrl.split(/[?#]/)[0];
  return cleanUrl;
}

function searchTwitterForCurrentPage(tab) {
  const cleanUrl = getCleanUrl(tab.url);
  const searchUrl = `https://twitter.com/search?q=url:${encodeURIComponent(cleanUrl)}`;
  chrome.tabs.create({ url: searchUrl });
}

chrome.action.onClicked.addListener(searchTwitterForCurrentPage);

chrome.commands.onCommand.addListener((command) => {
  if (command === "search-twitter") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        searchTwitterForCurrentPage(tabs[0]);
      }
    });
  }
});
