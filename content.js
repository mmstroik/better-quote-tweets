const quoteIcon = `<svg width="1.6em" height="1.6em" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor"><path d="M10 12H5C4.44772 12 4 11.5523 4 11V7.5C4 6.94772 4.44772 6.5 5 6.5H9C9.55228 6.5 10 6.94772 10 7.5V12ZM10 12C10 14.5 9 16 6 17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path d="M20 12H15C14.4477 12 14 11.5523 14 11V7.5C14 6.94772 14.4477 6.5 15 6.5H19C19.5523 6.5 20 6.94772 20 7.5V12ZM20 12C20 14.5 19 16 16 17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>`;

const tweetDetailsCache = new WeakMap(); // Permanent cache for tweet details per article
const containerCache = new Map(); // Temporary cache for container lookups (using Map instead of WeakMap so we can clear it)

function getTweetDetails(article) {
  // Check cache first
  const cachedDetails = tweetDetailsCache.get(article);
  if (cachedDetails) {
    return cachedDetails;
  }

  const defaultTwitterHandle = "x";
  let twitterHandle = defaultTwitterHandle;
  let tweetId = null;

  // try to get handle from user name element
  const handleElement = article.querySelector(
    '[data-testid*="User-Name"] > div:nth-child(2)'
  );
  if (handleElement) {
    const handleMatch = handleElement.textContent.match(
      /@([a-zA-Z0-9_]+)(?:[\s·]|$)/
    );
    if (handleMatch) {
      twitterHandle = handleMatch[1];
    }
  }

  const selector = `a[href*="${
    twitterHandle !== defaultTwitterHandle ? twitterHandle : ""
  }/status"]`;

  // find tweet ID from status link
  const tweetAnchor = article.querySelector(selector);
  if (tweetAnchor) {
    const hrefParts = tweetAnchor.getAttribute("href").split("/");
    tweetId = hrefParts[hrefParts.indexOf("status") + 1];
  }

  if (!tweetId) {
    // Fallback: try to get from URL if we're on a tweet page
    const match = window.location.pathname.match(/\/status\/(\d+)/);
    if (match) {
      tweetId = match[1];
    }
  }

  const details = tweetId ? { tweetId, twitterHandle } : null;
  
  // Cache the result (even if null, to avoid re-querying)
  if (details) {
    tweetDetailsCache.set(article, details);
  }
  
  return details;
}

function findSuitableContainer(article) {
  // Check temporary cache first
  const cachedContainer = containerCache.get(article);
  if (cachedContainer) {
    return cachedContainer;
  }

  const strategies = [
    // Direct bookmark approach
    () => {
      const bookmark = article.querySelector('[data-testid="bookmark"]') ||
                      article.querySelector('[data-testid="removeBookmark"]');
      return bookmark?.parentNode;
    },
    // Look for the engagement group
    () => {
      const group = article.querySelector('div[role="group"]');
      if (!group) return null;
      
      // Find the last interactive element in the group
      const elements = Array.from(group.querySelectorAll('[data-testid]'))
        .filter(el => ['bookmark', 'removeBookmark', 'share'].includes(el.getAttribute('data-testid')));
      return elements[elements.length - 1]?.parentNode;
    },
    // Look for share button as anchor
    () => {
      const share = article.querySelector('[data-testid="share"]');
      return share?.parentNode;
    }
  ];

  for (const strategy of strategies) {
    const container = strategy();
    if (container) {
      // Cache the result temporarily
      containerCache.set(article, container);
      return container;
    }
  }

  return null;
}

function createQuoteButton(article) {
  try {
    // Skip if already has quote button
    if (article.querySelector('.quoted-tweets-container')) {
      return;
    }

    if (!article.querySelector('time')) {
      return;
    }

    const tweetDetails = getTweetDetails(article);
    if (!tweetDetails) {
      console.log('No tweet details found');
      return;
    }

    const container = findSuitableContainer(article);
    if (!container) {
      // Only log once per actual attempt at finding a container
      if (article.getAttribute('data-quote-button-attempted') !== 'true') {
        console.log('No suitable container found');
        article.setAttribute('data-quote-button-attempted', 'true');
      }
      return;
    }

    const quotedTweetsContainer = document.createElement('div');
    quotedTweetsContainer.className = 'quoted-tweets-container';

    const innerDiv = document.createElement('div');
    innerDiv.innerHTML = quoteIcon;
    
    innerDiv.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { twitterHandle, tweetId } = tweetDetails;
      const quotesUrl = `https://x.com/${twitterHandle}/status/${tweetId}/quotes`;
      
      if (e.button === 1) { // Middle mouse button
        window.open(quotesUrl, '_blank');
      } else if (e.button === 0) { // Left mouse button
        window.location.href = quotesUrl;
      }
    });

    quotedTweetsContainer.appendChild(innerDiv);
    container.insertAdjacentElement('beforebegin', quotedTweetsContainer);
    
    // Clear the attempted flag if we succeeded
    article.removeAttribute('data-quote-button-attempted');
  } catch (error) {
    console.log(`Error creating button: ${error.message}`);
  }
}

function addSearchButton() {
  // Only add if we're on a quotes page
  if (!window.location.pathname.endsWith("/quotes")) return;

  const headers = document.querySelectorAll(
    ".css-175oi2r.r-16y2uox.r-1wbh5a2.r-1pi2tsx.r-1777fci"
  );
  let headerContainer = null;

  for (const header of headers) {
    if (header.textContent.includes("Post engagements")) {
      headerContainer = header;
      break;
    }
  }

  if (!headerContainer) return;

  // Don't add if we already added the button
  if (headerContainer.querySelector(".search-quotes-btn")) return;

  const tweetId = window.location.pathname.split("/status/")[1]?.split("/")[0];
  if (!tweetId) return;

  // Create wrapper div to maintain flex layout
  const wrapper = document.createElement("div");
  wrapper.className = "header-container";

  // Move existing content into wrapper
  while (headerContainer.firstChild) {
    wrapper.appendChild(headerContainer.firstChild);
  }

  // Create and add search button
  const searchButton = document.createElement("div");
  searchButton.className = "search-quotes-btn";
  searchButton.textContent = "Search all quotes";
  searchButton.addEventListener("mouseup", (e) => {
    e.preventDefault();
    const searchUrl = `https://x.com/search?q=url:${tweetId}`;
    
    if (e.button === 1) { // Middle mouse button
      window.open(searchUrl, '_blank');
    } else if (e.button === 0) { // Left mouse button
      window.location.href = searchUrl;
    }
  });

  wrapper.appendChild(searchButton);
  headerContainer.appendChild(wrapper);
}

function init() {
  const observer = new MutationObserver((mutations) => {
    // Clear the container cache at the start of each batch
    containerCache.clear();
    
    // Keep track of processed articles in this batch
    const processedInBatch = new Set();
    
    for (let mutation of mutations) {
      if (mutation.addedNodes.length) {
        const articles = document.querySelectorAll("article");
        Array.from(articles).forEach((article) => {
          // Skip if we already processed this article in this batch
          if (processedInBatch.has(article)) return;
          processedInBatch.add(article);
          
          createQuoteButton(article);
        });
        addSearchButton();
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial load
  const processedInitially = new Set();
  document.querySelectorAll('article').forEach(article => {
    if (!processedInitially.has(article)) {
      processedInitially.add(article);
      createQuoteButton(article);
    }
  });
  addSearchButton();
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle navigation
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
      lastUrl = url;
      document.querySelectorAll('article').forEach(createQuoteButton);
      addSearchButton();
  }
}).observe(document, {subtree: true, childList: true});
