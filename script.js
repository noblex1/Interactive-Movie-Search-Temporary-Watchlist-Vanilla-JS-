// =====================
// CONFIG
// =====================
const API_KEY = "a0a60565";
const API_URL = "https://www.omdbapi.com/";

// =====================
// DOM ELEMENTS
// =====================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const movieGrid = document.getElementById("movieGrid");
const statusMessage = document.getElementById("statusMessage");
const watchlistGrid = document.getElementById("watchlistGrid");
const watchlistEmpty = document.getElementById("watchlistEmpty");
const watchlistCounter = document.getElementById("watchlistCounter");
const themeToggle = document.getElementById("themeToggle");

// =====================
// STATE (IN-MEMORY)
// =====================
let watchlist = [];

// =====================
// EVENT LISTENERS
// =====================
searchBtn.addEventListener("click", handleSearch);

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

themeToggle.addEventListener("click", toggleDarkMode);

// Live character counter (UX polish)
searchInput.addEventListener("input", updateSearchStatus);

// =====================
// FUNCTIONS
// =====================

// Helper: Update search status message
function updateSearchStatus() {
  const length = searchInput.value.length;
  if (length > 0) {
    statusMessage.textContent = `${length} character${length > 1 ? 's' : ''} entered`;
    statusMessage.classList.remove("error");
  } else {
    statusMessage.textContent = "";
  }
}

// Helper: Show loading state
function showLoading() {
  statusMessage.textContent = "🔍 Searching...";
  statusMessage.classList.remove("error");
  movieGrid.innerHTML = '<p class="loading">Loading results...</p>';
}

// Helper: Show error state
function showError(message) {
  statusMessage.textContent = message;
  statusMessage.classList.add("error");
  movieGrid.innerHTML = `<p class="empty-state">${message}</p>`;
}

// Toggle dark mode with smooth transition
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// Handle search button click
function handleSearch() {
  const query = searchInput.value.trim();

  // Edge case: empty search
  if (!query) {
    showError("⚠️ Please enter a movie name");
    return;
  }

  showLoading();

  // Fetch movies using proper .then/.catch
  fetch(`${API_URL}?apikey=${API_KEY}&s=${query}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.Response === "False") {
        showError(data.Error || "No movies found 🎬");
        return;
      }

      statusMessage.textContent = `Found ${data.Search.length} result${data.Search.length > 1 ? 's' : ''}`;
      statusMessage.classList.remove("error");
      renderMovies(data.Search);
    })
    .catch((error) => {
      showError("❌ Network error. Please check your connection.");
      console.error("Fetch error:", error);
    });
}

// Render movie cards with interactive elements
function renderMovies(movies) {
  movieGrid.innerHTML = "";

  movies.forEach((movie) => {
    const card = createMovieCard(movie);
    movieGrid.appendChild(card);
  });
}

// Helper: Create a single movie card
function createMovieCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card";

  const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";
  const isInWatchlist = watchlist.some((m) => m.imdbID === movie.imdbID);

  card.innerHTML = `
    <img src="${posterUrl}" alt="${movie.Title}" class="poster">
    <div class="card-content">
      <h3>${movie.Title}</h3>
      <p class="movie-info">${movie.Year} • ${movie.Type}</p>
      <button class="add-btn ${isInWatchlist ? 'added' : ''}">
        ${isInWatchlist ? '✓ Added' : '➕ Add to Watchlist'}
      </button>
      <div class="details"></div>
    </div>
  `;

  // Click card to toggle details (except when clicking button)
  card.addEventListener("click", (e) => {
    if (!e.target.classList.contains("add-btn")) {
      toggleMovieDetails(movie.imdbID, card);
    }
  });

  // Add to watchlist button
  const addBtn = card.querySelector(".add-btn");
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    addToWatchlist(movie);
  });

  return card;
}

// Toggle movie details on card click
function toggleMovieDetails(imdbID, card) {
  const detailsDiv = card.querySelector(".details");

  // If details are already shown, hide them
  if (detailsDiv.classList.contains("show")) {
    detailsDiv.classList.remove("show");
    detailsDiv.innerHTML = "";
    return;
  }

  // Show loading state
  detailsDiv.innerHTML = '<p class="loading-details">Loading details...</p>';
  detailsDiv.classList.add("show");

  // Fetch detailed movie info
  fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=short`)
    .then((response) => response.json())
    .then((data) => {
      detailsDiv.innerHTML = `
        <p><strong>Plot:</strong> ${data.Plot || 'N/A'}</p>
        <p><strong>Actors:</strong> ${data.Actors || 'N/A'}</p>
        <p><strong>Rating:</strong> ⭐ ${data.imdbRating || 'N/A'}/10</p>
        <p><strong>Genre:</strong> ${data.Genre || 'N/A'}</p>
      `;
    })
    .catch((error) => {
      detailsDiv.innerHTML = '<p class="error">Failed to load details</p>';
      console.error("Details fetch error:", error);
    });
}

// Add movie to watchlist (in-memory array)
function addToWatchlist(movie) {
  // Edge case: prevent duplicates
  if (watchlist.some((m) => m.imdbID === movie.imdbID)) {
    return;
  }

  watchlist.push(movie);
  updateWatchlistDisplay();
}

// Remove movie from watchlist
function removeFromWatchlist(id) {
  watchlist = watchlist.filter((movie) => movie.imdbID !== id);
  updateWatchlistDisplay();
}

// Update watchlist display with clean DOM updates
function updateWatchlistDisplay() {
  // Update counter
  watchlistCounter.textContent = `(${watchlist.length})`;

  // Clear grid
  watchlistGrid.innerHTML = "";

  // Show empty state if no movies
  if (watchlist.length === 0) {
    watchlistEmpty.classList.add("show");
    return;
  }

  watchlistEmpty.classList.remove("show");

  // Render each watchlist item
  watchlist.forEach((movie) => {
    const card = createWatchlistCard(movie);
    watchlistGrid.appendChild(card);
  });
}

// Helper: Create watchlist card
function createWatchlistCard(movie) {
  const card = document.createElement("div");
  card.className = "movie-card watchlist-card";

  const posterUrl = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";

  card.innerHTML = `
    <img src="${posterUrl}" alt="${movie.Title}" class="poster">
    <div class="card-content">
      <h4>${movie.Title}</h4>
      <p class="movie-info">${movie.Year}</p>
      <button class="remove-btn">❌ Remove</button>
    </div>
  `;

  // Remove button event
  card.querySelector(".remove-btn").addEventListener("click", () => {
    removeFromWatchlist(movie.imdbID);
  });

  return card;
}

// Initialize empty state on load
updateWatchlistDisplay();
