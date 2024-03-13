import "./App.css";
import no_image from "./no-image.jpg";
import { useEffect, useRef, useState } from "react";

function useInnerWidth() {
  const [innerWith, setInnerWidth] = useState(window.innerWidth);

  useEffect(function () {
    function handleResize() {
      setInnerWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);

    return function () {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return innerWith;
}

function App() {
  const [query, setQuery] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [currentMovie, setCurrentMovie] = useState(null);

  const [watchedMovies, setWatchedMovies] = useState(function () {
    const watched = localStorage.getItem("watchedMovies");
    return watched ? JSON.parse(watched) : [];
  });

  const totalResults = movieList?.total_results ? movieList.total_results : 0;
  const movies = movieList?.results ? movieList.results : [];

  const viewPortWidth = useInnerWidth();

  function selectCurrentMovie(id) {
    setCurrentMovie((movID) => (movID === id ? null : id));
  }

  function addMovie(movie) {
    setWatchedMovies((watchedMoviez) => [...watchedMoviez, movie]);
  }

  useEffect(
    function () {
      localStorage.setItem("watchedMovies", JSON.stringify(watchedMovies));
    },
    [watchedMovies]
  );

  useEffect(
    function () {
      const controller = new AbortController();
      const signal = controller.signal;
      async function fetchMovies() {
        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?query=${query}&include_adult=false&api_key=3bf00ace9a6286886a6fd8b94eb32f49`,
            { signal }
          );
          const data = await res.json();
          setMovieList(data);
        } catch (err) {
          console.log(err.message);
        }
      }

      setTimeout(fetchMovies, 500);

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <div className="App">
      <SearchHeader
        query={query}
        onSetQuery={setQuery}
        totalResults={totalResults}
      />
      <Container>
        {viewPortWidth >= 751 && (
          <MovieList
            movies={movies}
            onSetCurrentMovie={selectCurrentMovie}
            currentMovie={currentMovie}
          />
        )}

        {viewPortWidth <= 751 && movies.length >= 1 && (
          <MovieList
            movies={movies}
            onSetCurrentMovie={selectCurrentMovie}
            currentMovie={currentMovie}
          />
        )}

        <StatsList
          setCurrentMovie={selectCurrentMovie}
          currentMovie={currentMovie}
        >
          {!currentMovie ? (
            <>
              <Stats data={watchedMovies} />
              <MovieList
                movies={watchedMovies}
                onSetCurrentMovie={selectCurrentMovie}
                watchedMovieList={true}
              />
            </>
          ) : (
            <MovieDetails
              // data={currentMovieData}
              onAddMovie={addMovie}
              watchedMovies={watchedMovies}
              currentMovie={currentMovie}
              setCurrentMovie={setCurrentMovie}
            />
          )}
        </StatsList>
      </Container>
    </div>
  );
}

function SearchHeader({ query, onSetQuery, totalResults }) {
  const domEl = useRef(null);

  useEffect(
    function () {
      function callback(e) {
        if (e.key === "Enter" && document.activeElement !== domEl.current) {
          domEl.current.focus();
          onSetQuery("");
        }
      }

      document.addEventListener("keydown", callback);

      return function () {
        document.removeEventListener("keydown", callback);
      };
    },
    [onSetQuery]
  );

  return (
    <header className="App-header">
      <span className="logo">🍿usePopcorn</span>
      <input
        className="search"
        value={query}
        onChange={(e) => {
          onSetQuery(e.target.value);
        }}
        type="text"
        ref={domEl}
      />
      <span className="results">Found {totalResults} results</span>
    </header>
  );
}

function Stats({ data }) {
  return (
    <div className="Stats">
      <span className="heading">
        <h4>MOVIES YOU WATCHED</h4>
        <p className="description">
          <span>🎥 {data.length} movies watched</span>
        </p>
      </span>
    </div>
  );
}

function MovieDetails({
  onAddMovie,
  watchedMovies,
  currentMovie,
  setCurrentMovie,
}) {
  const [currentMovieData, setCurrentMovieData] = useState(null);

  let genres;
  let watched;
  let movieOnWatchList;

  if (currentMovieData) {
    genres = currentMovieData.genres.map((genre) => genre.name).join(" ");
    watched = watchedMovies.map((movie) => movie.id);
    movieOnWatchList = watched.includes(currentMovieData.id);
  }

  useEffect(
    function () {
      if (!currentMovie) return;
      async function fetchMovie() {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${currentMovie}?api_key=3bf00ace9a6286886a6fd8b94eb32f49`
        );
        const data = await res.json();
        setCurrentMovieData(data);
      }
      fetchMovie();
    },
    [currentMovie]
  );

  const movie = {
    poster_path: currentMovieData?.poster_path,
    title: currentMovieData?.title,
    release_date: currentMovieData?.release_date,
    id: currentMovieData?.id,
  };

  return (
    <div className="MovieDetails">
      {currentMovieData && (
        <>
          <div className="movie-header">
            <img
              className="movie_poster_details"
              src={
                currentMovieData?.poster_path
                  ? `https://image.tmdb.org/t/p/w500/${currentMovieData?.poster_path}`
                  : no_image
              }
              alt="movie poster"
            ></img>
            <div className="description">
              <h4>
                {currentMovieData.title.length >= 20
                  ? currentMovieData.title.slice(0, 20) + "..."
                  : currentMovieData.title}
              </h4>
              <p>
                {currentMovieData.release_date} * {currentMovieData.runtime} min
              </p>
              <p>{genres}</p>
            </div>
          </div>
          <div className="movie-body">
            {!movieOnWatchList ? (
              <button
                onClick={() => {
                  onAddMovie(movie);
                  setCurrentMovieData(null);
                  setCurrentMovie(null);
                }}
              >
                + add movie to watched
              </button>
            ) : (
              <button>movie already watched</button>
            )}

            <p>
              {currentMovieData.overview.length >= 300
                ? currentMovieData.overview.slice(0, 300) + "..."
                : currentMovieData.overview}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatsList({ children, setCurrentMovie, currentMovie }) {
  return (
    <ul className="StatsList">
      {currentMovie && (
        <button className="go-back" onClick={() => setCurrentMovie(null)}>
          &larr;
        </button>
      )}
      {children}
    </ul>
  );
}

function Movie({ title, year, image, onSetCurrentMovie, id, selected }) {
  return (
    <div
      className={`Movie ${selected ? "selected" : ""}`}
      onClick={() => {
        onSetCurrentMovie(id);
      }}
    >
      <span>
        <img
          className="movie-poster"
          src={image ? `https://image.tmdb.org/t/p/w500/${image}` : no_image}
          alt="movie poster"
        ></img>
      </span>
      <span className="title-year">
        <h4>{title.length >= 20 ? title.slice(0, 20) + "..." : title}</h4>
        <p>📅 {year.split("-").at(0)}</p>
      </span>
    </div>
  );
}

function MovieList({
  watchedMovieList,
  movies,
  onSetCurrentMovie,
  currentMovie,
}) {
  let mov = movies.map((movie) => (
    <Movie
      key={movie?.id}
      title={movie.title}
      year={movie.release_date}
      image={movie?.poster_path}
      id={movie?.id}
      onSetCurrentMovie={onSetCurrentMovie}
      selected={movie.id === currentMovie}
    />
  ));

  return (
    <ul className={watchedMovieList ? "watchedMovieList" : "MovieList"}>
      {mov}
    </ul>
  );
}

function Container({ children }) {
  return <div className="Container">{children}</div>;
}

export default App;
