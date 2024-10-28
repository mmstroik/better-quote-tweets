function getCleanUrl(url) {
  let cleanUrl = new URL(url).hostname + new URL(url).pathname;
  // Remove 'www.', 'https', query parameters, and hash
  cleanUrl = cleanUrl.replace(/^www\./, '');
  cleanUrl = cleanUrl.split(/[?#]/)[0];
  return cleanUrl;
}

function searchTwitterForCurrentPage(tab) {
  const cleanUrl = getCleanUrl(tab.url);
  const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(`url:${cleanUrl}`)}`;
  chrome.tabs.create({ url: searchUrl, index: tab.index + 1 });
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
