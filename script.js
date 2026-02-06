// API key for OMDb and watchlist array to store movies
const API_KEY = 'a0a60565';
const WATCHLIST_STORAGE_KEY = 'movieWatchlist';
const THEME_STORAGE_KEY = 'movieTheme';
let watchlist = [];

// Load watchlist from local storage
function loadWatchlist() {
  const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
  watchlist = saved ? JSON.parse(saved) : [];
}

// Save watchlist to local storage
function saveWatchlist() {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
}

// Load watchlist on startup
loadWatchlist();
renderWatchlist();

// Load theme preference on startup
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  document.getElementById('themeToggle').textContent = '☀️ Light Mode';
}

// Event listener when search button is clicked
document.getElementById('searchBtn').addEventListener('click', searchMovies);

// Event listener for Enter key in search input
document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchMovies();
});

// Event listener to toggle between light and dark mode
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// Event listener to clear all search results
document.getElementById('clearBtn').addEventListener('click', clearResults);

// Event listener to update character counter as user types
document.getElementById('searchInput').addEventListener('input', updateCharCounter);

// Function to search movies from API
function searchMovies() {
  const query = document.getElementById('searchInput').value; // get text from search box
  
  // validate search input
  if (!query.trim()) {
    document.getElementById('statusMessage').textContent = 'Please enter a search term.';
    document.getElementById('statusMessage').style.color = 'crimson';
    return;
  }

  // show loading message
  document.getElementById('statusMessage').textContent = 'Searching...';
  document.getElementById('movieGrid').innerHTML = '';

  // disable search button and input while fetching
  document.getElementById('searchBtn').disabled = true;
  document.getElementById('searchInput').disabled = true;

  // build API URL with key and search query
  const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`;

  // fetch movies from API
  fetch(url)
    .then(response => response.json()) // convert response to object
    .then(data => {
      // check if movies found
      if (data.Response === 'True') {
        document.getElementById('statusMessage').textContent = `${data.Search.length} results found`;
        document.getElementById('statusMessage').style.color = '';
        displayMovies(data.Search); // show movies on page
      } else {
        document.getElementById('statusMessage').textContent = 'No movies found. Try a different keyword.';
        document.getElementById('statusMessage').style.color = 'crimson';
      }
    })
    .catch(error => {
      // handle network errors
      document.getElementById('statusMessage').textContent = 'Error fetching data. Check your connection.';
      document.getElementById('statusMessage').style.color = 'crimson';
    })
    .finally(() => {
      // re-enable search controls
      document.getElementById('searchBtn').disabled = false;
      document.getElementById('searchInput').disabled = false;
    });
}

// Function to display movies on the page
function displayMovies(movies) {
  const resultsContainer = document.getElementById('movieGrid');
  resultsContainer.innerHTML = ''; // clear previous results

  // loop through each movie and create a card
  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';

    // use poster image or placeholder if not available
    const poster = movie.Poster !== 'N/A' ? movie.Poster : '';

    // build HTML for movie card
    card.innerHTML = `
      <img src="${poster}" alt="${movie.Title}" class="card-img">
      <div class="card-content">
        <h3 class="card-title">${movie.Title}</h3>
        <p class="card-meta">${movie.Year} • ${movie.Type}</p>
        <div class="card-buttons">
          <button class="details-btn" onclick="showDetails('${movie.imdbID}', this)">Show Details</button>
          <button class="watch-btn" onclick="addToWatchlist('${movie.imdbID}', '${movie.Title}', '${poster}')">Add to Watchlist</button>
        </div>
      </div>
      <div class="card-details" id="details-${movie.imdbID}"></div>
    `;

    resultsContainer.appendChild(card);
    animateCard(card);
  });
}

// Function to show movie details when button clicked
function showDetails(movieId, button) {
  const detailsDiv = document.getElementById(`details-${movieId}`);

  // toggle details if already showing
  if (detailsDiv.classList.contains('show')) {
    detailsDiv.classList.remove('show');
    button.textContent = 'Show Details';
    return;
  }

  // show loading state
  button.textContent = 'Loading...';

  // fetch movie details from API
  fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movieId}&plot=short`)
    .then(response => response.json())
    .then(data => {
      button.textContent = 'Hide Details';
      
      // check if data received
      if (data.Response !== 'False') {
        // display plot, actors, and rating
        detailsDiv.innerHTML = `
          <p><strong>Plot:</strong> ${data.Plot || 'N/A'}</p>
          <p><strong>Actors:</strong> ${data.Actors || 'N/A'}</p>
          <p><strong>Rating:</strong> ${data.imdbRating || 'N/A'}</p>`;
      } else {
        detailsDiv.innerHTML = '<p>Details not available.</p>';
      }
      
      detailsDiv.classList.add('show');
    })
    .catch(() => {
      detailsDiv.innerHTML = '<p>Error loading details.</p>';
      detailsDiv.classList.add('show');
    });
}

// Function to add movie to watchlist
function addToWatchlist(movieId, movieTitle, moviePoster) {
  // check if movie already in watchlist
  if (watchlist.some(item => item.id === movieId)) {
    document.getElementById('statusMessage').textContent = 'Already in watchlist';
    return;
  }

  // add movie to array with poster
  watchlist.push({ id: movieId, title: movieTitle, poster: moviePoster });
  
  // show confirmation
  document.getElementById('statusMessage').textContent = 'Added to watchlist';
  document.getElementById('statusMessage').style.color = '';
  
  // update watchlist display
  saveWatchlist();
  renderWatchlist();
}

// Function to display watchlist items on page
function renderWatchlist() {
  const watchlistContainer = document.getElementById('watchlistGrid');
  const emptyMessage = document.getElementById('watchlistEmpty');

  // clear previous watchlist
  watchlistContainer.innerHTML = '';

  // show empty message if no movies
  if (watchlist.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  // loop through watchlist and create cards
  watchlist.forEach(item => {
    const card = document.createElement('div');
    card.className = 'movie-card';

    // build HTML for watchlist item with poster image
    card.innerHTML = `
      <img src="${item.poster}" alt="${item.title}" class="watchlist-img">
      <div class="watchlist-item">
        <h4 class="watchlist-title">${item.title}</h4>
        <button class="remove-watch" onclick="removeFromWatchlist('${item.id}')">Remove from Watchlist</button>
      </div>
    `;

    watchlistContainer.appendChild(card);
    animateCard(card);
  });
}

// Function to remove movie from watchlist
function removeFromWatchlist(movieId) {
  // filter out the selected movie
  watchlist = watchlist.filter(item => item.id !== movieId);
  
  // show confirmation
  document.getElementById('statusMessage').textContent = 'Removed from watchlist';
  
  // update watchlist display
  saveWatchlist();
  renderWatchlist();
}

// Function to clear all search results
function clearResults() {
  document.getElementById('movieGrid').innerHTML = '';
  document.getElementById('statusMessage').textContent = 'Results cleared';
  document.getElementById('statusMessage').style.color = '';
}

// Function to update character counter as user types
function updateCharCounter() {
  const length = document.getElementById('searchInput').value.length;
  document.getElementById('charCounter').textContent = `Search term: ${length} chars`;
}

// Function to toggle dark mode
function toggleTheme() {
  document.body.classList.toggle('dark-mode');

  // update button text
  const isDark = document.body.classList.contains('dark-mode');
  document.getElementById('themeToggle').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
}

// Function to animate cards when they appear
function animateCard(element) {
  element.classList.add('fade-in');
  requestAnimationFrame(() => element.classList.add('show'));
}

// Check if API key is set
if (API_KEY === 'YOUR_API_KEY_HERE') {
  document.getElementById('statusMessage').textContent = 'Remember to set your OMDb API key in script.js';
  document.getElementById('statusMessage').style.color = 'crimson';
}

