import React, { useEffect, useState } from 'react';
import './App.css';
import Search from './components/Search';
import Spinner from './components/Spinner';
import GameCard from './components/GameCard';
import { getTrendingGames, updateSearchCount } from './appwrite';





const API_BASE_URL = 'https://api.rawg.io/api/games';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
   
  }
}

// fonction useDebounce, on la déclare ici
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
  
};


// App main function
const App = () => {

  const [searchTerm, setSearchTerm] = useState("");

  const [games, setGames] = useState([]);

  const [suggestions, setSuggestions] = useState([]);

  const [fromSuggestion, setFromSuggestion] = useState(false);

   const [errorMessage, setErrorMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false); //on le passe de false à true pour forcer le loading et nas pas afficher d'un coup la liste

  const [trendingGames, setTrendingGames] = useState([]);

    const [scrollY, setScrollY] = useState(0);


  // Debounce the search term to prevent making too many API request
  // by waiting fpr the user to stop typing for 500ms
  
  //on assigne debouncesearchterm la fonction useDebonce
  // qu'on a écrite plus tôt
  

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);


const fetchSuggestions = async (query) => {
  if (!query) {
    setSuggestions([]);
    return;
  }

  try {
    const endpoint = `${API_BASE_URL}?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=5&search_precise=true`;
    const response = await fetch(endpoint, API_OPTIONS);

    if (!response.ok) throw new Error("Failed to fetch suggestions");

    const data = await response.json();

    // Garder seulement les noms
    const names = data.results.map((game) => game.name);
    setSuggestions(names);
  } catch (error) {
    console.error(error);
    setSuggestions([]);
  }
};


// fetchGame function
  const fetchGames = async(query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      
  const endpoint = query
  ? `${API_BASE_URL}?key=${API_KEY}&search=${encodeURIComponent(query)}&search_precise=true&ordering=-rating`
  : `${API_BASE_URL}?key=${API_KEY}&ordering=-added`;


      const response = await fetch(endpoint, API_OPTIONS)

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      console.log(data);

      // ✅ Filtre exact si query fourni
      
   
      //results
      setGames(data.results || []);



       // if game exist from that query
        
  if (query && data.results.length > 0) {
          await updateSearchCount(query, data.results[0]);
        }

    } catch(error) {
      console.error(`Error fetching games: ${error}`);
      setErrorMessage('Error fetching games. Please try again later.'); //if failed, show error msg
    } finally {
      setIsLoading(false); //when we succed or fail, stop the loading
    }
  };


  const loadTrendingGames = async() => {
      try {
        const games = await getTrendingGames();

        setTrendingGames(games);
      } catch (error) {
        console.log(`Error fetch trending games: ${error}`);
      }
  };


useEffect(() => {
  
    fetchGames(debouncedSearchTerm);
    
    
  }, [debouncedSearchTerm]);
  

useEffect(() => {
  loadTrendingGames()
}, []);

// arrow effect 
useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calcul de l’opacité : 1 au top, 0 après 200px
  const arrowOpacity = Math.max(0, 1 - scrollY / 200);


  
  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <img id="vg-img-bg" src="./bg_v2.png" alt="background"/>

        <header>
         
          <img id="vg-img-banner" src="./logo_v1.png" alt="header"/>
          <h1>Explore <span className="text-gradient">games</span>,<br/> find your favorites</h1>
          


        </header>
        <svg className="arrow" style={{ opacity: arrowOpacity }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M297.4 566.6C309.9 579.1 330.2 579.1 342.7 566.6L502.7 406.6C515.2 394.1 515.2 373.8 502.7 361.3C490.2 348.8 469.9 348.8 457.4 361.3L352 466.7L352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 466.7L182.6 361.3C170.1 348.8 149.8 348.8 137.3 361.3C124.8 373.8 124.8 394.1 137.3 406.6L297.3 566.6z"/></svg>


        {trendingGames.length > 0 && (
          <section className="trending">
              <h2>Trending Searched Games</h2>
              <ul className="trending-list">
                {trendingGames.map((game, index) => (
                  <li key={game.$id}>
                    <p className="rank">{index + 1}</p>
                    
                    <img src={game.poster_url} alt={game.name} />
                    <div className="game-search">{game.searchTerm}</div>
                  </li>
                ))}
              </ul>
          </section>
        )}

        <section className="all-games">
            <h2>All Games</h2>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={() => fetchGames(searchTerm)}/>
          {suggestions.length > 0 && (
  <ul className="suggestions">
    {suggestions.map((name, index) => (
      // Quand on clique sur une suggestion
<li 
  key={index} 
  onClick={() => {
    setFromSuggestion(true);
    setSearchTerm(name); 
    fetchGames(name); // 👉 lance la recherche directement
    setSuggestions([]); // 👉 ferme la liste
  }}
>
  {name}
</li>

    ))}
  </ul>
)}
            {isLoading ? (
              
              
      <Spinner />
    
              
            ) : errorMessage ? (
              <p className="text-red-500">{errorMessage}</p> 
            ) : (
              <ul className="games-list">
                {games.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </ul>       
            )} 
        </section>
        
  </div>
    </main>
  )
}

export default App

