// Replace with your OMDb API key. Get one at https://www.omdbapi.com/apikey.aspx
const API_KEY = 'a0a60565';

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

function setStatus(text, isError = false) {
	refs.status.textContent = text;
	refs.status.style.color = isError ? 'crimson' : '';
}

function toggleControls(disabled) {
	refs.btn.disabled = disabled;
	refs.input.disabled = disabled;
}

function clearGrid() {
	refs.grid.innerHTML = '';
}

function createMovieCard(movie) {
	const card = document.createElement('div');
	card.className = 'movie-card';

	const poster = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '';

	card.innerHTML = `
		<img src="${poster}" alt="${movie.Title} poster" style="width:100%;height:330px;object-fit:cover;background:#ddd" />
		<div style="padding:10px">
			<h3 style="margin:6px 0;font-size:1rem">${movie.Title}</h3>
			<p style="margin:2px 0;color:#666">${movie.Year} • ${movie.Type}</p>
			<div style="margin-top:8px;display:flex;gap:8px">
				<button class="details-btn">Show Details</button>
				<button class="watch-btn">Add to Watchlist</button>
			</div>
		</div>
		<div class="extra-details" style="padding:10px;display:none;border-top:1px solid rgba(0,0,0,0.06)"></div>
	`;

	// Details button: fetch extra info when opened
	const detailsBtn = card.querySelector('.details-btn');
	const extraDiv = card.querySelector('.extra-details');
	detailsBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		if (extraDiv.style.display === 'block') {
			extraDiv.style.display = 'none';
			detailsBtn.textContent = 'Show Details';
			return;
		}
		detailsBtn.textContent = 'Loading...';
		fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}&plot=short`)
			.then(r => r.json())
			.then(d => {
				detailsBtn.textContent = 'Hide Details';
				if (d && d.Response !== 'False') {
					extraDiv.innerHTML = `
						<p style="margin:6px 0"><strong>Plot:</strong> ${d.Plot || 'N/A'}</p>
						<p style="margin:6px 0"><strong>Actors:</strong> ${d.Actors || 'N/A'}</p>
						<p style="margin:6px 0"><strong>IMDB Rating:</strong> ${d.imdbRating || 'N/A'}</p>
					`;
					extraDiv.style.display = 'block';
				} else {
					extraDiv.innerHTML = '<p>Details not available.</p>';
					extraDiv.style.display = 'block';
				}
			})
			.catch(() => {
				detailsBtn.textContent = 'Show Details';
				extraDiv.innerHTML = '<p>Error loading details.</p>';
				extraDiv.style.display = 'block';
			});
	});

	// Watchlist button
	const watchBtn = card.querySelector('.watch-btn');
	watchBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		addToWatchlist(movie);
	});

	return card;
}

// ----- Watchlist (in-memory) -----
const watchlist = [];

function renderWatchlist() {
  refs.watchlistGrid.innerHTML = '';
  if (watchlist.length === 0) {
    refs.watchlistEmpty.style.display = 'block';
    return;
  }
  refs.watchlistEmpty.style.display = 'none';

  watchlist.forEach(item => {
    const div = document.createElement('div');
    div.className = 'movie-card';
    const poster = item.Poster && item.Poster !== 'N/A' ? item.Poster : '';
    div.innerHTML = `
      <img src="${poster}" alt="${item.Title} poster" style="width:100%;height:200px;object-fit:cover;background:#ddd" />
      <div style="padding:8px">
        <h4 style="margin:6px 0;font-size:0.95rem">${item.Title}</h4>
        <button class="remove-watch">Remove</button>
      </div>
    `;
    const rm = div.querySelector('.remove-watch');
    rm.addEventListener('click', () => removeFromWatchlist(item.imdbID));
		refs.watchlistGrid.appendChild(div);
		animateShow(div);
  });
}

function addToWatchlist(movie) {
  if (watchlist.some(w => w.imdbID === movie.imdbID)) {
    setStatus('Already in watchlist');
    return;
  }
  watchlist.push(movie);
  setStatus('Added to watchlist');
  renderWatchlist();
}

function removeFromWatchlist(id) {
  const idx = watchlist.findIndex(w => w.imdbID === id);
  if (idx === -1) return;
  watchlist.splice(idx, 1);
  setStatus('Removed from watchlist');
  renderWatchlist();
}

function renderMovies(list) {
	clearGrid();
	list.forEach(m => {
		const card = createMovieCard(m);
		refs.grid.appendChild(card);
		animateShow(card);
	});
}

function animateShow(el) {
  el.classList.add('fade-in');
  // allow browser to paint then add show
  requestAnimationFrame(() => el.classList.add('show'));
}

function clearResults() {
  clearGrid();
  setStatus('Results cleared');
}

function searchMovies(query) {
	if (!query || !query.trim()) {
		setStatus('Please enter a search term.', true);
		return;
	}
	setStatus('Searching...');
	clearGrid();
	toggleControls(true);

	fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`)
		.then(res => res.json())
		.then(data => {
			if (!data) throw new Error('No response data');
			if (data.Response === 'False') {
				const err = data.Error || 'No results.';
				if (err.toLowerCase().includes('invalid api key')) {
					setStatus('Invalid API key. Check your API key in script.js', true);
				} else if (err.toLowerCase().includes('movie not found')) {
					setStatus('No movies found. Try a different keyword.', true);
				} else {
					setStatus(err, true);
				}
				return;
			}

			setStatus(`${data.Search.length} results`);
			renderMovies(data.Search);
		})
		.catch(err => {
			console.error(err);
			setStatus('Network or server error. Check connection and try again.', true);
		})
		.finally(() => {
			toggleControls(false);
		});
}

// Events
refs.btn.addEventListener('click', () => searchMovies(refs.input.value));
refs.input.addEventListener('keydown', (e) => {
	if (e.key === 'Enter') searchMovies(refs.input.value);
});

// live char counter
if (refs.charCounter) {
	refs.input.addEventListener('input', () => {
		refs.charCounter.textContent = `Search term: ${refs.input.value.length} chars`;
	});
}

// clear results
if (refs.clearBtn) {
	refs.clearBtn.addEventListener('click', () => clearResults());
}

// Theme toggle
if (refs.themeToggle) {
	refs.themeToggle.addEventListener('click', () => {
		const isDark = document.body.classList.toggle('dark-mode');
		refs.themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
	});
}

// Small helpful hint if API key not set
if (API_KEY === 'YOUR_API_KEY_HERE') {
	setStatus('Remember to set your OMDb API key in script.js', true);
}

