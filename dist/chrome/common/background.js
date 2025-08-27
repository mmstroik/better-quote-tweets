function getCleanUrl(url) {
  const urlObj = new URL(url);

  // Special case for X/Twitter URLs (tweet ID only)
  if (urlObj.hostname === "x.com" || urlObj.hostname === "twitter.com") {
    const tweetIdMatch = urlObj.pathname.match(/\/status\/(\d+)/);
    if (tweetIdMatch) {
      return `url:${tweetIdMatch[1]}`;
    }
  }

  // Special case for arXiv URLs (paper ID only)
  if (urlObj.hostname === "arxiv.org") {
    const arxivIdMatch = urlObj.pathname.match(/\d+\.\d+(?:v\d+)?/);
    if (arxivIdMatch) {
      return `url:${arxivIdMatch[0].split("v")[0]}`;
    }
  }

  // Special case for YouTube URLs (video ID only)
  if (
    urlObj.hostname === "youtube.com" ||
    urlObj.hostname === "www.youtube.com"
  ) {
    // Check for /live/{videoId} format
    const liveMatch = urlObj.pathname.match(/\/live\/([^\/]+)/);
    if (liveMatch) {
      return `url:${liveMatch[1]}`;
    }
    // Check for standard video format
    const videoId = urlObj.searchParams.get("v");
    if (videoId) {
      return `url:${videoId}`;
    }
  }

  // Default behavior (keep full URL but handle query parameters specially)
  let cleanUrl = urlObj.protocol + "//" + urlObj.host + urlObj.pathname;

  // Special handling for ?id= parameter
  const idParam = urlObj.searchParams.get("id");
  if (idParam && urlObj.search.startsWith("?id=")) {
    cleanUrl += `?id=${idParam}`;
  }

  return cleanUrl;
}

function searchTwitterForCurrentPage(tab) {
  const cleanUrl = getCleanUrl(tab.url);
  const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(
    cleanUrl
  )}`;
  
  // Use cross-browser compatible API
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  browserAPI.tabs.create({ url: searchUrl, index: tab.index + 1 });
}

// Use cross-browser compatible API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Handle browser action click (Firefox uses browserAction, Chrome uses action)
if (browserAPI.browserAction && browserAPI.browserAction.onClicked) {
  browserAPI.browserAction.onClicked.addListener(searchTwitterForCurrentPage);
} else if (browserAPI.action && browserAPI.action.onClicked) {
  browserAPI.action.onClicked.addListener(searchTwitterForCurrentPage);
}

// Handle keyboard commands
browserAPI.commands.onCommand.addListener((command) => {
  if (command === "search-twitter") {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        searchTwitterForCurrentPage(tabs[0]);
      }
    });
  }
});

// Add context menu when extension is installed
browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.contextMenus.create({
    id: "search-twitter-link",
    title: "Search X for this link",
    contexts: ["link"],
  });
});

// Handle context menu clicks
browserAPI.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "search-twitter-link") {
    // Only handle non-Twitter sites
    const isTwitter = tab.url.match(/^https?:\/\/(.*\.)?(twitter|x)\.com/);
    if (!isTwitter) {
      const cleanUrl = getCleanUrl(info.linkUrl);
      const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(
        `url:${cleanUrl}`
      )}`;
      browserAPI.tabs.create({ url: searchUrl, index: tab.index + 1 });
    }
  }
});