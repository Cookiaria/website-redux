document.addEventListener('DOMContentLoaded', function() {
  let searchObserver;
  let postsContainer;
  let originalPosts = [];
  let searchInput;

  function initializeSearch() {
    postsContainer = document.querySelector('.ca-posts-container');
    searchInput = document.getElementById('ca-search-input');
    
    if (!postsContainer || !searchInput) return;
    
    originalPosts = Array.from(postsContainer.children);
    searchInput.addEventListener('input', handleSearch);
    
    searchObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.removedNodes.forEach(function(removedNode) {
          if (removedNode === postsContainer) {
            cleanupSearch();
          }
        });
      });
    });
    
    searchObserver.observe(postsContainer.parentNode, { childList: true });
  }
  
  function handleSearch() {
    const searchTerm = this.value.trim().toLowerCase();
    
    if (!searchTerm) {
      resetPosts();
      return;
    }
    
    // Check if search term matches a date pattern (dd-mm-yyyy or variations)
    const datePattern = /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/;
    const dateMatch = searchTerm.match(datePattern);
    
    // Filter posts based on search term
    const filteredPosts = originalPosts.filter(post => {
      // Always check title and description
      const title = post.querySelector('h2 a')?.textContent.toLowerCase() || '';
      const description = post.querySelector('p:not(.ca-post-date)')?.textContent.toLowerCase() || '';
      
      // Check if we found a date pattern in search term
      if (dateMatch) {
        const postDate = post.querySelector('.ca-post-date')?.textContent.toLowerCase() || '';
        const normalizedSearchDate = normalizeDate(searchTerm);
        const normalizedPostDate = postDate.replace('posted @', '').trim();
        
        // Return true if either text matches OR date matches
        return title.includes(searchTerm) || 
               description.includes(searchTerm) ||
               normalizedPostDate.includes(normalizedSearchDate);
      }
      
      // Regular text search
      return title.includes(searchTerm) || description.includes(searchTerm);
    });
    
    updatePosts(filteredPosts);
  }
  
  function normalizeDate(dateString) {
    // Convert various date formats to dd-mm-yyyy format
    return dateString
      .replace(/\//g, '-')  // Replace slashes with dashes
      .split('-')           // Split by dashes
      .map(part => part.padStart(2, '0')) // Pad day/month with leading zero
      .join('-');           // Rejoin with dashes
  }
  
  function resetPosts() {
    postsContainer.innerHTML = '';
    originalPosts.forEach(post => postsContainer.appendChild(post));
  }
  
  function updatePosts(posts) {
    postsContainer.innerHTML = '';
    posts.forEach(post => postsContainer.appendChild(post));
  }
  
  function cleanupSearch() {
    if (searchInput) {
      searchInput.removeEventListener('input', handleSearch);
      searchInput.value = '';
    }
    
    if (searchObserver) {
      searchObserver.disconnect();
      searchObserver = null;
    }
    
    postsContainer = null;
    originalPosts = [];
  }
  
  initializeSearch();
  
  const dynamicObserver = new MutationObserver(function() {
    if (document.querySelector('.ca-posts-container') && 
        document.getElementById('ca-search-input') && 
        !postsContainer) {
      initializeSearch();
    }
  });
  
  dynamicObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
});