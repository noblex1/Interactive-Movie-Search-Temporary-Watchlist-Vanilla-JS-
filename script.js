// =============== API & DOM SETUP ===============

const API_KEY = 'a0a60565';

// DOM element references
const refs = {
  input: document.getElementById('searchInput'),
  btn: document.getElementById('searchBtn'),
  status: document.getElementById('statusMessage'),
  grid: document.getElementById('movieGrid'),
  watchlistGrid: document.getElementById('watchlistGrid'),
  watchlistEmpty: document.getElementById('watchlistEmpty'),
  themeToggle: document.getElementById('themeToggle'),
  clearBtn: document.getElementById('clearBtn'),
  charCounter: document.getElementById('charCounter'),
};

// In-memory watchlist storage
const watchlist = [];

// =============== UTILITY FUNCTIONS ===============

// Display status message with optional error styling
const setStatus = (text, err = false) => {
  refs.status.textContent = text;
  refs.status.style.color = err ? 'crimson' : '';
};

// Enable or disable search controls
const toggleControls = disabled => {
  refs.btn.disabled = refs.input.disabled = disabled;
};

// Clear movie grid
const clearGrid = () => refs.grid.innerHTML = '';

// Animate element on load
const animateShow = el => {
  el.classList.add('fade-in');
  requestAnimationFrame(() => el.classList.add('show'));
};

// =============== MOVIE DETAILS FUNCTIONS ===============

// Fetch and display movie details from API
const fetchMovieDetails = (id, btn, div) => {
  fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}&plot=short`)
    .then(r => r.json())
    .then(data => {
      btn.textContent = 'Hide Details';
      if (data?.Response !== 'False') {
        div.innerHTML = `
          <p><strong>Plot:</strong> ${data?.Plot || 'N/A'}</p>
          <p><strong>Actors:</strong> ${data?.Actors || 'N/A'}</p>
          <p><strong>Rating:</strong> ${data?.imdbRating || 'N/A'}</p>`;
      } else {
        div.innerHTML = '<p>Details not available.</p>';
      }
      div.classList.add('show');
    })
    .catch(() => {
      div.innerHTML = '<p>Error loading details.</p>';
      div.classList.add('show');
    });
};

// =============== MOVIE CARD CREATION ===============

// Create a movie card with poster, info, and action buttons
const createMovieCard = movie => {
  const card = document.createElement('div');
  card.className = 'movie-card';
  const poster = movie.Poster !== 'N/A' ? movie.Poster : '';
  
  card.innerHTML = `
    <img src="${poster}" alt="${movie.Title}" class="card-img">
    <div class="card-content">
      <h3 class="card-title">${movie.Title}</h3>
      <p class="card-meta">${movie.Year} • ${movie.Type}</p>
      <div class="card-buttons">
        <button class="details-btn">Show Details</button>
        <button class="watch-btn">Add to Watchlist</button>
      </div>
    </div>
    <div class="card-details"></div>`;

  const detailsBtn = card.querySelector('.details-btn');
  const detailsDiv = card.querySelector('.card-details');
  const watchBtn = card.querySelector('.watch-btn');

  // Toggle movie details
  detailsBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (detailsDiv.classList.contains('show')) {
      detailsDiv.classList.remove('show');
      detailsBtn.textContent = 'Show Details';
    } else {
      detailsBtn.textContent = 'Loading...';
      fetchMovieDetails(movie.imdbID, detailsBtn, detailsDiv);
    }
  });

  // Add to watchlist
  watchBtn.addEventListener('click', e => {
    e.stopPropagation();
    addToWatchlist(movie);
  });

  return card;
};

// =============== WATCHLIST MANAGEMENT ===============

// Render all watchlist items
const renderWatchlist = () => {
  refs.watchlistGrid.innerHTML = '';
  
  if (watchlist.length === 0) {
    refs.watchlistEmpty.style.display = 'block';
    return;
  }
  
  refs.watchlistEmpty.style.display = 'none';
  
  watchlist.forEach(item => {
    const div = document.createElement('div');
    div.className = 'movie-card';
    const poster = item.Poster !== 'N/A' ? item.Poster : '';
    
    div.innerHTML = `
      <img src="${poster}" alt="${item.Title}" class="watchlist-img">
      <div class="watchlist-item">
        <h4 class="watchlist-title">${item.Title}</h4>
        <button class="remove-watch">Remove from Watchlist</button>
      </div>`;
    
    div.querySelector('.remove-watch').addEventListener('click', () => {
      removeFromWatchlist(item.imdbID);
    });
    
    refs.watchlistGrid.appendChild(div);
    animateShow(div);
  });
};

// Add movie to watchlist
const addToWatchlist = movie => {
  if (watchlist.some(w => w.imdbID === movie.imdbID)) {
    setStatus('Already in watchlist');
    return;
  }
  watchlist.push(movie);
  setStatus('Added to watchlist');
  renderWatchlist();
};

// Remove movie from watchlist
const removeFromWatchlist = id => {
  watchlist.splice(watchlist.findIndex(w => w.imdbID === id), 1);
  setStatus('Removed from watchlist');
  renderWatchlist();
};

// =============== SEARCH & DISPLAY ===============

// Display search results
const renderMovies = list => {
  clearGrid();
  list.forEach(m => {
    const card = createMovieCard(m);
    refs.grid.appendChild(card);
    animateShow(card);
  });
};

// Search movies from OMDb API
const searchMovies = query => {
  if (!query?.trim()) {
    setStatus('Please enter a search term.', true);
    return;
  }
  
  setStatus('Searching...');
  clearGrid();
  toggleControls(true);
  
  fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (data.Response === 'False') {
        const msg = data.Error?.toLowerCase() || '';
        const errorText = msg.includes('invalid api key') ? 'Invalid API key. Check script.js' :
                         msg.includes('movie not found') ? 'No movies found. Try different keyword.' :
                         data.Error || 'No results.';
        setStatus(errorText, true);
        return;
      }
      setStatus(`${data.Search.length} results`);
      renderMovies(data.Search);
    })
    .catch(() => setStatus('Network error. Check your connection.', true))
    .finally(() => toggleControls(false));
};

// =============== EVENT LISTENERS ===============

// Search button click
refs.btn.addEventListener('click', () => searchMovies(refs.input.value));

// Search on Enter key
refs.input.addEventListener('keydown', e => {
  if (e.key === 'Enter') searchMovies(refs.input.value);
});

// Update character counter on input
refs.input.addEventListener('input', () => {
  refs.charCounter.textContent = `Search term: ${refs.input.value.length} chars`;
});

// Clear results button
refs.clearBtn.addEventListener('click', () => {
  clearGrid();
  setStatus('Results cleared');
});

// Theme toggle
refs.themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  refs.themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// =============== INITIALIZATION ===============

// Warn if API key not set
if (API_KEY === 'YOUR_API_KEY_HERE') {
  setStatus('Remember to set your OMDb API key in script.js', true);
}

