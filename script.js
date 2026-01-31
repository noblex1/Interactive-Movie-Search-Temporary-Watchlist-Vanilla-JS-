// Replace with your OMDb API key. Get one at https://www.omdbapi.com/apikey.aspx
const API_KEY = 'a0a60565';

const refs = {
	input: document.getElementById('searchInput'),
	btn: document.getElementById('searchBtn'),
	status: document.getElementById('statusMessage'),
	grid: document.getElementById('movieGrid'),
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
		</div>
	`;

	return card;
}

function renderMovies(list) {
	clearGrid();
	list.forEach(m => {
		const card = createMovieCard(m);
		refs.grid.appendChild(card);
	});
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

// Small helpful hint if API key not set
if (API_KEY === 'YOUR_API_KEY_HERE') {
	setStatus('Remember to set your OMDb API key in script.js', true);
}

