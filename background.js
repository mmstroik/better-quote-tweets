function getCleanUrl(url) {
  const urlObj = new URL(url);
  
  // Special case for arXiv URLs (paper ID only)
  if (urlObj.hostname === 'arxiv.org') {
    const arxivIdMatch = urlObj.pathname.match(/\d+\.\d+(?:v\d+)?/);
    if (arxivIdMatch) {
      return arxivIdMatch[0].split('v')[0];
    }
  }
  
  // Special case for YouTube URLs (keep video ID only)
  if (urlObj.hostname === 'youtube.com' || urlObj.hostname === 'www.youtube.com') {
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return `youtube.com/watch?v=${videoId}`;
    }
  }
  
  // Default behavior (remove 'www.', 'https', query parameters, and hash)
  let cleanUrl = urlObj.hostname + urlObj.pathname;
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
