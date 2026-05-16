import React, { useState, useEffect } from "react";
import { Search, Play, Info, Calendar, Filter, X, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Comments from "./components/Comments";

const typesList = [
    { title: "Movie", id: "Movie" }, { title: "TV", id: "TV" }, { title: "OVA", id: "OVA" },
    { title: "ONA", id: "ONA" }, { title: "Special", id: "Special" }, { title: "Music", id: "Music" }
];

const genresList = [
    { title: "Action", id: "action", filterId: "1" }, { title: "Adventure", id: "adventure", filterId: "2" }, { title: "Cars", id: "cars", filterId: "538" },
    { title: "Comedy", id: "comedy", filterId: "8" }, { title: "Dementia", id: "dementia", filterId: "453" }, { title: "Demons", id: "demons", filterId: "119" },
    { title: "Drama", id: "drama", filterId: "62" }, { title: "Ecchi", id: "ecchi", filterId: "214" }, { title: "Fantasy", id: "fantasy", filterId: "3" },
    { title: "Game", id: "game", filterId: "180" }, { title: "Harem", id: "harem", filterId: "215" }, { title: "Historical", id: "historical", filterId: "70" },
    { title: "Horror", id: "horror", filterId: "222" }, { title: "Isekai", id: "isekai", filterId: "74" }, { title: "Josei", id: "josei", filterId: "404" },
    { title: "Kids", id: "kids", filterId: "46" }, { title: "Magic", id: "magic", filterId: "203" }, { title: "Martial Arts", id: "martial-arts", filterId: "114" },
    { title: "Mecha", id: "mecha", filterId: "123" }, { title: "Military", id: "military", filterId: "125" }, { title: "Music", id: "music", filterId: "242" },
    { title: "Mystery", id: "mystery", filterId: "57" }, { title: "Parody", id: "parody", filterId: "162" }, { title: "Police", id: "police", filterId: "136" },
    { title: "Psychological", id: "psychological", filterId: "73" }, { title: "Romance", id: "romance", filterId: "28" }, { title: "Samurai", id: "samurai", filterId: "163" },
    { title: "School", id: "school", filterId: "14" }, { title: "Sci-Fi", id: "sci-fi", filterId: "12" }, { title: "Seinen", id: "seinen", filterId: "50" },
    { title: "Shoujo", id: "shoujo", filterId: "252" }, { title: "Shoujo Ai", id: "shoujo-ai", filterId: "235" }, { title: "Shounen", id: "shounen", filterId: "15" },
    { title: "Shounen Ai", id: "shounen-ai", filterId: "233" }, { title: "Slice of Life", id: "slice-of-life", filterId: "35" }, { title: "Space", id: "space", filterId: "124" },
    { title: "Sports", id: "sports", filterId: "29" }, { title: "Super Power", id: "super-power", filterId: "16" }, { title: "Supernatural", id: "supernatural", filterId: "9" },
    { title: "Thriller", id: "thriller", filterId: "54" }, { title: "Vampire", id: "vampire", filterId: "58" }
];

export default function App() {
  const [query, setQuery] = useState("");
  const [searchGenres, setSearchGenres] = useState<string[]>([]);
  const [searchTypes, setSearchTypes] = useState<string[]>([]);
  const [isSearchFiltersOpen, setIsSearchFiltersOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newReleases, setNewReleases] = useState([]);
  const [newAdded, setNewAdded] = useState([]);
  const [justCompleted, setJustCompleted] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [scheduleDay, setScheduleDay] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(false);
  
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [viewListMode, setViewListMode] = useState<{type: string, title: string, param?: any} | null>(null);
  const [staticPage, setStaticPage] = useState<string | null>(null);
  const [viewListResults, setViewListResults] = useState([]);
  const [viewListPage, setViewListPage] = useState(1);
  const [viewListLoading, setViewListLoading] = useState(false);
  
  const fetchViewList = async (type: string, title: string, page = 1, param?: any) => {
    setStaticPage(null);
    setSelectedAnime(null);
    setViewListMode({ type, title, param });
    setViewListPage(page);
    setViewListLoading(true);
    if (page === 1) {
        setViewListResults([]); // Clear previous results on initial load
    }
    try {
      let route = `/api/lists?type=${type}&page=${page}`;
      if (param) {
         if (type === 'az-list') route += `&letter=${encodeURIComponent(param)}`;
         else if (type === 'genre') route += `&genre=${encodeURIComponent(param)}`;
         else if (type === 'filter') {
            const queryParams = new URLSearchParams();
            if (param.genres && param.genres.length > 0) queryParams.append('genres', param.genres.join(','));
            if (param.types && param.types.length > 0) queryParams.append('types', param.types.join(','));
            route += `&${queryParams.toString()}`;
         }
      }
      const res = await fetch(route);
      const data = await res.json();
      if (data.results) {
        if (page === 1) {
             setViewListResults(data.results);
        } else {
             setViewListResults(prev => [...prev, ...data.results]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setViewListLoading(false);
    }
  };

  const [filterGenres, setFilterGenres] = useState<string[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  const [watchHistory, setWatchHistory] = useState<Record<string, any>>(() => {
    try {
      const stored = localStorage.getItem('animeWatchHistory');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [jumpToEp, setJumpToEp] = useState('');

  const handleAdvancedFilter = () => {
    fetchViewList('filter', 'Advanced Filter Results', 1, { genres: filterGenres, types: filterTypes });
  };

  useEffect(() => {
    fetch("/api/lists?type=new-release")
      .then((res) => res.json())
      .then((data) => {
        if (data.results) setNewReleases(data.results);
      });
      
    fetch("/api/lists?type=new-added")
      .then((res) => res.json())
      .then((data) => {
        if (data.results) setNewAdded(data.results);
      });

    fetch("/api/lists?type=just-completed")
      .then((res) => res.json())
      .then((data) => {
        if (data.results) setJustCompleted(data.results);
      });
      
    setScheduleLoading(true);
    setScheduleError(false);
    fetch("/api/schedule")
      .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch schedule");
          return res.json();
      })
      .then((data) => {
         if (data.data) {
             setWeeklySchedule(data.data);
             const d = new Date();
             const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
             setScheduleDay(days[d.getDay()]);
         }
      })
      .catch((e) => {
          console.error(e);
          setScheduleError(true);
      })
      .finally(() => {
          setScheduleLoading(false);
      });
  }, []);

  const searchAnime = async (e) => {
    e.preventDefault();
    if (!query && searchGenres.length === 0 && searchTypes.length === 0) return;
    setLoading(true);
    setIsSearchFiltersOpen(false);
    try {
      const qParams = new URLSearchParams();
      if (query) qParams.append('keyword', query);
      if (searchGenres.length > 0) qParams.append('genres', searchGenres.join(','));
      if (searchTypes.length > 0) qParams.append('types', searchTypes.join(','));
      
      const res = await fetch(`/api/search?${qParams.toString()}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchScheduleDay = async (day: string) => {
    setScheduleDay(day);
    setWeeklySchedule([]);
    setScheduleLoading(true);
    setScheduleError(false);
    try {
        const res = await fetch(`/api/schedule?day=${day}`);
        if (!res.ok) throw new Error("Failed to fetch schedule");
        const data = await res.json();
        if (data.data) {
           setWeeklySchedule(data.data);
        }
    } catch (e) {
        console.error(e);
        setScheduleError(true);
    } finally {
        setScheduleLoading(false);
    }
  };

  const fetchAnimeFromSchedule = async (title: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(title)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
          fetchAnimeInfo(data.results[0].id);
      } else {
          alert("Could not find this anime on our servers.");
      }
    } catch (err) {
      console.error(err);
      alert("Error searching for anime.");
    }
    setLoading(false);
  };

  const fetchAnimeInfo = async (id) => {
    setAnimeInfo(null);
    setSelectedEpisode(null);
    setVideoUrl(null);
    setServers([]);
    setStaticPage(null);
    setSelectedAnime(id);
    try {
      const res = await fetch(`/api/info?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setAnimeInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectEpisode = async (ep) => {
    setSelectedEpisode(ep);
    setServers([]);
    setVideoUrl(null);

    setWatchHistory((prev) => {
      const newHistory = { ...prev, [selectedAnime]: ep };
      localStorage.setItem('animeWatchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
    
    if (ep.id) {
       try {
          const res = await fetch(`/api/servers?epId=${encodeURIComponent(ep.id)}`);
          const data = await res.json();
          if (data.servers) {
             setServers(data.servers);
             if (data.servers.length > 0) {
                selectServer(data.servers[0]);
             }
          }
       } catch (e) { console.error(e); }
    } else {
       setVideoUrl(`/api/watch?url=${encodeURIComponent(ep.url || animeInfo.sourceUrl)}`);
    }
  };

  const selectServer = async (server) => {
    setSelectedServer(server);
    setVideoUrl(null);
    try {
       const res = await fetch(`/api/server-url?linkId=${encodeURIComponent(server.linkId)}`);
       const data = await res.json();
       if (data.url) {
          setVideoUrl(data.url);
       }
    } catch (e) { console.error(e); }
  };

  const currentIndex = selectedEpisode && animeInfo?.episodes 
    ? animeInfo.episodes.findIndex((ep) => ep.url === selectedEpisode.url) 
    : -1;
  const hasPrevEpisode = currentIndex > 0;
  const hasNextEpisode = currentIndex !== -1 && currentIndex < (animeInfo?.episodes?.length || 0) - 1;

  const goToPrevEpisode = () => {
    if (hasPrevEpisode && animeInfo?.episodes) {
      selectEpisode(animeInfo.episodes[currentIndex - 1]);
    }
  };

  const goToNextEpisode = () => {
    if (hasNextEpisode && animeInfo?.episodes) {
      selectEpisode(animeInfo.episodes[currentIndex + 1]);
    }
  };

  const handleJumpToEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!animeInfo?.episodes) return;
    const num = parseFloat(jumpToEp);
    if (!isNaN(num)) {
       const ep = animeInfo.episodes.find(e => parseFloat(e.num) === num);
       if (ep) {
         selectEpisode(ep);
         setJumpToEp('');
         // Scroll to selected?
       } else {
         alert('Episode not found');
       }
    }
  };

  return (
    <div className="min-h-screen text-white font-sans">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm cursor-pointer" onClick={() => { setSelectedAnime(null); setSelectedEpisode(null); setViewListMode(null); }}>
              ANIMXER
            </h1>
            <nav className="hidden sm:flex items-center gap-4">
              <button onClick={() => { setSelectedAnime(null); setSelectedEpisode(null); setViewListMode(null); }} className="text-sm font-medium hover:text-blue-400 transition-colors">
                Home
              </button>
            </nav>
          </div>
          <div className="relative w-full max-w-md flex flex-col items-end">
            <div className="flex w-full items-center gap-2">
              <form onSubmit={searchAnime} className="relative w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search anime..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors backdrop-blur-md placeholder:text-gray-400"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <button type="submit" className="hidden" />
              </form>
              <button
                onClick={() => setIsSearchFiltersOpen(!isSearchFiltersOpen)}
                className={`flex-none p-2 rounded-full border transition-colors ${
                  isSearchFiltersOpen || searchGenres.length > 0 || searchTypes.length > 0
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
            
            <AnimatePresence>
              {isSearchFiltersOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-12 right-0 w-[400px] max-w-[calc(100vw-2rem)] bg-zinc-900 border border-white/10 rounded-2xl shadow-xl shadow-black/50 p-4 z-50 overflow-hidden"
                >
                  <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold">Search Filters</h3>
                      <button onClick={() => setIsSearchFiltersOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                         <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Type</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {typesList.map((type) => {
                          const isActive = searchTypes.includes(type.id);
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                if (isActive) setSearchTypes(searchTypes.filter(t => t !== type.id));
                                else setSearchTypes([...searchTypes, type.id]);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                isActive ? 'bg-emerald-500 text-zinc-900' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {type.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Genres</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {genresList.map((genre) => {
                          const isActive = searchGenres.includes(genre.filterId);
                          return (
                            <button
                              key={genre.id}
                              type="button"
                              onClick={() => {
                                if (isActive) setSearchGenres(searchGenres.filter(g => g !== genre.filterId));
                                else setSearchGenres([...searchGenres, genre.filterId]);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                isActive ? 'bg-emerald-500 text-zinc-900' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {genre.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between gap-2">
                     <button
                       className="text-xs text-gray-400 hover:text-white px-3 py-2"
                       onClick={() => { setSearchGenres([]); setSearchTypes([]); }}
                     >
                        Clear Filters
                     </button>
                     <button
                       className="bg-emerald-500 text-zinc-900 hover:bg-emerald-400 text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                       onClick={(e) => { searchAnime(e); }}
                     >
                        Apply & Search
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {staticPage ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
            <button
              onClick={() => setStaticPage(null)}
              className="mb-6 text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-2"
            >
              &larr; Back to Home
            </button>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{staticPage}</h1>
              <div className="space-y-6 text-white/80 leading-relaxed">
                <p>
                  This is a placeholder for the {staticPage} page. Since this is a demo application,
                  the full legal text is not provided here.
                </p>
                <p>
                  In a real-world scenario, this page would outline the full terms, conditions, 
                  and policies relevant to the users of this platform. It would cover areas such as:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-white/70">
                  <li>User responsibilities and acceptable use.</li>
                  <li>Data collection, storage, and processing practices (Privacy Policy).</li>
                  <li>Copyright and intellectual property rules (DMCA).</li>
                  <li>Dispute resolution and limitation of liability.</li>
                </ul>
                <p className="pt-4 border-t border-white/10 text-sm text-white/50">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        ) : selectedAnime ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => { setSelectedAnime(null); setSelectedEpisode(null); }}
              className="mb-4 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2"
            >
              &larr; Back to browsing
            </button>
            {animeInfo ? (
              <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row gap-8 rounded-2xl">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4">{animeInfo.title}</h2>
                  
                  {animeInfo.metadata && Object.keys(animeInfo.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm">
                       {Object.entries(animeInfo.metadata).map(([key, value]) => (
                         <div key={key} className="flex gap-2">
                           <span className="text-gray-400 font-medium">{key}:</span>
                           <span className="text-white">{value as React.ReactNode}</span>
                         </div>
                       ))}
                    </div>
                  )}

                  {watchHistory[selectedAnime] && !selectedEpisode && (
                    <button
                      onClick={() => selectEpisode(watchHistory[selectedAnime])}
                      className="inline-flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 py-3 px-6 rounded-xl font-medium transition-colors mb-6 shadow-lg shadow-emerald-500/10"
                    >
                      <Play className="w-5 h-5" /> 
                      Resume {watchHistory[selectedAnime].title || watchHistory[selectedAnime].text} {watchHistory[selectedAnime].num ? `(EP ${watchHistory[selectedAnime].num})` : ''}
                    </button>
                  )}

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {animeInfo.description || "No description available."}
                  </p>

                  {selectedEpisode && (
                    <div className="mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                        <h3 className="font-semibold text-lg text-emerald-400">
                           Now Playing: {selectedEpisode.text}
                        </h3>
                        <div className="flex gap-2">
                           <button 
                             onClick={goToPrevEpisode} 
                             disabled={!hasPrevEpisode}
                             className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                           >
                             &larr; Prev
                           </button>
                           <button 
                             onClick={goToNextEpisode} 
                             disabled={!hasNextEpisode}
                             className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                           >
                             Next &rarr;
                           </button>
                        </div>
                      </div>
                      <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-white/10 mb-4 shadow-xl">
                        {videoUrl ? (
                          <iframe 
                            src={videoUrl} 
                            className="absolute inset-0 w-full h-full border-0"
                            allowFullScreen
                            allow="autoplay; fullscreen"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-400">
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      
                      {servers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-sm text-gray-400 flex items-center mr-2">Servers:</span>
                          {servers.map((sv, i) => (
                             <button
                               key={i}
                               onClick={() => selectServer(sv)}
                               className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedServer?.linkId === sv.linkId ? 'bg-blue-500 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'}`}
                             >
                               {sv.type.toUpperCase()}: {sv.name}
                             </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedEpisode && (
                    <Comments episodeId={`${selectedAnime}-${selectedEpisode.num || selectedEpisode.id || 'unknown'}`} />
                  )}
                  
                  <div className="mb-6 mt-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <h3 className="font-semibold text-lg">Watch Episodes</h3>
                      {animeInfo.episodes && animeInfo.episodes.length > 0 && (
                        <form onSubmit={handleJumpToEpisode} className="flex flex-row items-center gap-2">
                           <input 
                             type="number" 
                             placeholder="Go to EP..." 
                             value={jumpToEp}
                             onChange={(e) => setJumpToEp(e.target.value)}
                             className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-white/30"
                           />
                           <button type="submit" className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                             Jump
                           </button>
                        </form>
                      )}
                    </div>
                    {animeInfo.episodes && animeInfo.episodes.length > 0 ? (
                      <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide snap-x">
                        {animeInfo.episodes.map((ep, i) => {
                           const isPlaying = selectedEpisode?.url === ep.url;
                           return (
                             <button
                               key={i}
                               onClick={() => selectEpisode(ep)}
                               className={`flex-none w-48 md:w-56 glass-card rounded-xl overflow-hidden text-left text-sm font-medium flex flex-col snap-start group relative ${isPlaying ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''}`}
                             >
                               <div className="aspect-video w-full bg-white/5 relative overflow-hidden">
                                 {animeInfo.image ? (
                                   <img src={animeInfo.image} alt={ep.text} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                                 ) : (
                                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                                 )}
                                 <div className="absolute inset-0 flex items-center justify-center">
                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPlaying ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50' : 'bg-black/50 text-white backdrop-blur-md group-hover:bg-blue-500 transition-colors'}`}>
                                      {isPlaying ? (
                                        <div className="flex items-center gap-0.5">
                                          <div className="w-1 bg-white h-2 animate-bounce" style={{animationDelay: '0ms'}} />
                                          <div className="w-1 bg-white h-4 animate-bounce" style={{animationDelay: '150ms'}} />
                                          <div className="w-1 bg-white h-3 animate-bounce" style={{animationDelay: '300ms'}} />
                                        </div>
                                      ) : (
                                        <Play className="w-5 h-5 ml-0.5" />
                                      )}
                                   </div>
                                 </div>
                                 <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold font-mono">
                                    EP {ep.num}
                                 </div>
                               </div>
                               <div className="p-3">
                                 <span className="truncate w-full block text-white/90" title={ep.title || ep.text}>
                                   {ep.title || ep.text}
                                 </span>
                               </div>
                             </button>
                           );
                        })}
                      </div>
                    ) : (
                      <div className="glass-card rounded-xl p-6 text-center">
                        <p className="text-gray-400 mb-3">Episode list not fully extracted.</p>
                        <button 
                          onClick={() => selectEpisode({ id: animeInfo.watchDataId, url: animeInfo.sourceUrl })}
                          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          <Play className="w-4 h-4" /> Watch
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-12 flex flex-col gap-8">
                    {animeInfo.related && animeInfo.related.length > 0 && (
                       <div className="mb-6">
                         <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
                            <Play className="w-5 h-5 text-emerald-400" />
                            Related Anime
                         </h3>
                         <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide snap-x">
                           {animeInfo.related.map((item, i) => (
                             <div key={i} className="flex-none w-40 sm:w-48 md:w-56 snap-start">
                               <AnimeCard anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                             </div>
                           ))}
                         </div>
                       </div>
                    )}

                    {animeInfo.recommended && animeInfo.recommended.length > 0 && (
                       <div className="mb-6">
                         <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
                           <Play className="w-5 h-5 text-purple-400" />
                           Recommended for you
                         </h3>
                         <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide snap-x">
                           {animeInfo.recommended.map((item, i) => (
                             <div key={i} className="flex-none w-40 sm:w-48 md:w-56 snap-start">
                               <AnimeCard anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                             </div>
                           ))}
                         </div>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        ) : viewListMode ? (
          <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between mb-2">
                 <h2 className="text-2xl font-bold text-white capitalize">{viewListMode.title}</h2>
                 <button 
                   onClick={() => setViewListMode(null)}
                   className="text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                 >
                   Back to Home
                 </button>
             </div>

             {viewListMode.type === 'az-list' && (
                 <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2 mb-6 p-4 rounded-2xl bg-white/5 border border-white/10"
                 >
                    {['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0-9', 'Other'].map((letter) => {
                      const isActive = viewListMode.param === letter;
                      return (
                      <motion.button
                        key={letter}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchViewList('az-list', `A-Z List: ${letter}`, 1, letter)}
                        className={`relative ${['All', 'Other'].includes(letter) ? 'px-5' : 'w-10'} h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${isActive ? 'text-white' : 'text-white/60 bg-white/5 hover:bg-white/10 hover:text-white'}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeLetter"
                            className="absolute inset-0 bg-indigo-500 rounded-xl"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{letter === 'Other' ? 'Other' : letter}</span>
                      </motion.button>
                    )})}
                 </motion.div>
             )}
             
             {viewListMode.type === 'genre' && (
                 <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2 mb-6 p-4 rounded-2xl bg-white/5 border border-white/10"
                 >
                    {genresList.map((genre) => {
                      const isActive = viewListMode.param === genre.id;
                      return (
                      <motion.button
                        key={genre.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchViewList('genre', `Genre: ${genre.title}`, 1, genre.id)}
                        className={`relative px-4 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${isActive ? 'text-white' : 'text-white/60 bg-white/5 hover:bg-white/10 hover:text-white'}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeGenre"
                            className="absolute inset-0 bg-emerald-500 rounded-xl"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{genre.title}</span>
                      </motion.button>
                    )})}
                 </motion.div>
             )}
             
             <motion.div 
                 layout
                 className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
             >
               <AnimatePresence mode="popLayout">
               {viewListResults.map((item, i) => (
                 <motion.div
                   key={`${item.id}-${i}`}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   transition={{ duration: 0.2 }}
                 >
                   <AnimeCard anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                 </motion.div>
               ))}
               </AnimatePresence>
             </motion.div>
             
             {viewListLoading && (
               <div className="flex justify-center py-6">
                 <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
               </div>
             )}
             
             {!viewListLoading && viewListResults.length > 0 && (
               <div className="flex justify-center mt-6">
                 <button
                   onClick={() => fetchViewList(viewListMode.type, viewListMode.title, viewListPage + 1, viewListMode.param)}
                   className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-8 rounded-xl font-bold transition-colors"
                 >
                   Load More
                 </button>
               </div>
             )}
          </div>
        ) : (
          <>
            {(results.length > 0 || loading) && (
              <section className="mb-12">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  Search Results
                </h2>
                {loading ? (
                   <div className="flex justify-center py-10">
                     <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                   </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {results.map((item, i) => (
                      <AnimeCard key={i} anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {!query && (
              <div className="flex flex-col gap-12">
                <HeroSlider animeList={newReleases} onSelect={fetchAnimeInfo} />
                
                {newReleases.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Play className="w-5 h-5 text-emerald-400" />
                        New Releases
                      </h2>
                      <button onClick={() => fetchViewList('new-release', 'New Releases')} className="text-sm font-medium hover:text-emerald-400 transition-colors">View All</button>
                    </div>
                    <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x">
                      {newReleases.map((item, i) => (
                        <div key={i} className="flex-none w-40 sm:w-48 md:w-56 snap-start">
                           <AnimeCard anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                
                {newAdded.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Play className="w-5 h-5 text-blue-400" />
                        Newly Added
                      </h2>
                      <button onClick={() => fetchViewList('new-added', 'Newly Added')} className="text-sm font-medium hover:text-blue-400 transition-colors">View All</button>
                    </div>
                    <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x">
                      {newAdded.map((item, i) => (
                        <div key={i} className="flex-none w-40 sm:w-48 md:w-56 snap-start">
                           <AnimeCard anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                
                {justCompleted.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Play className="w-5 h-5 text-purple-400" />
                        Just Completed
                      </h2>
                      <button onClick={() => fetchViewList('just-completed', 'Just Completed')} className="text-sm font-medium hover:text-purple-400 transition-colors">View All</button>
                    </div>
                    <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x">
                      {justCompleted.map((item, i) => (
                        <div key={i} className="flex-none w-40 sm:w-48 md:w-56 snap-start">
                           <AnimeCard anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Weekly Anime Schedule
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-6 p-2 rounded-2xl bg-white/5 border border-white/10">
                     {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <button
                          key={day}
                          onClick={() => fetchScheduleDay(day)}
                          className={`flex-1 text-center py-2 px-3 rounded-xl text-sm font-bold capitalize transition-colors ${scheduleDay === day ? 'bg-indigo-500 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                        >
                          {day.substring(0, 3)}
                        </button>
                     ))}
                  </div>
                  
                  {scheduleLoading ? (
                    <div className="flex justify-center py-10">
                       <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : scheduleError ? (
                    <div className="flex justify-center py-10 text-center text-red-400 font-medium">
                       Failed to load the schedule. Please try again later.
                    </div>
                  ) : weeklySchedule.length === 0 ? (
                    <div className="flex justify-center py-10 text-center text-white/50 font-medium whitespace-pre-wrap">
                       No schedule available for this day.
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x">
                        {[...weeklySchedule].sort((a: any, b: any) => {
                            const timeA = a.broadcast?.time || '23:59';
                            const timeB = b.broadcast?.time || '23:59';
                            return timeA.localeCompare(timeB);
                        }).map((item: any, i: number) => (
                           <motion.div 
                              key={`${item.mal_id}-${i}`} 
                              className="flex-none w-48 sm:w-56 snap-start cursor-pointer group"
                              onClick={() => fetchAnimeFromSchedule(item.title)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                           >
                              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-white/5 border border-white/10">
                                 <img src={item.images?.jpg?.large_image_url || 'https://via.placeholder.com/225x318.jpg?text=No+Image'} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                                 <div className="absolute bottom-2 left-2 right-2">
                                    <div className="text-xs bg-indigo-500/80 backdrop-blur-sm text-white px-2 py-1 rounded inline-block font-bold mb-1">
                                       {item.broadcast?.time || 'Unknown'} JST
                                    </div>
                                 </div>
                              </div>
                              <h3 className="font-bold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                              <p className="text-xs text-white/50 mt-1">{item.broadcast?.string || ''}</p>
                           </motion.div>
                        ))}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-400" />
                    A-Z List
                  </h2>
                  <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
                    {['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0-9', 'Other'].map((letter) => (
                      <motion.button
                        key={letter}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchViewList('az-list', `A-Z List: ${letter}`, 1, letter)}
                        className={`relative ${['All', 'Other'].includes(letter) ? 'px-5' : 'w-10'} h-10 flex items-center justify-center bg-white/5 text-white/60 hover:text-white hover:bg-indigo-500 rounded-xl text-sm font-bold transition-colors`}
                      >
                        <span className="relative z-10">{letter === 'Other' ? 'Other' : letter}</span>
                      </motion.button>
                    ))}
                  </div>
                </section>
                
                <section>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 mt-12">
                    <Search className="w-5 h-5 text-emerald-400" />
                    Browse by Genre
                  </h2>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="mb-6">
                      <h3 className="text-white font-medium mb-3">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {genresList.map((genre) => {
                          const isActive = filterGenres.includes(genre.filterId);
                          return (
                          <motion.button
                            key={genre.id}
                            onClick={() => {
                              if (isActive) {
                                setFilterGenres(filterGenres.filter(g => g !== genre.filterId));
                              } else {
                                setFilterGenres([...filterGenres, genre.filterId]);
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative px-4 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                          >
                            <span className="relative z-10">{genre.title}</span>
                          </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-white font-medium mb-3">Types</h3>
                      <div className="flex flex-wrap gap-2">
                        {typesList.map((type) => {
                          const isActive = filterTypes.includes(type.id);
                          return (
                          <motion.button
                            key={type.id}
                            onClick={() => {
                              if (isActive) {
                                setFilterTypes(filterTypes.filter(t => t !== type.id));
                              } else {
                                setFilterTypes([...filterTypes, type.id]);
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative px-4 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${isActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                          >
                            <span className="relative z-10">{type.title}</span>
                          </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                       <button
                         onClick={handleAdvancedFilter}
                         disabled={filterGenres.length === 0 && filterTypes.length === 0}
                         className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-600 disabled:text-gray-400 text-black px-6 py-2 rounded-xl font-bold transition-colors"
                       >
                         <Search className="w-4 h-4" /> Filter Anime
                       </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>

      {/* Advanced Footer */}
      <footer className="mt-20 border-t border-white/10 bg-black/40 backdrop-blur-xl py-12 px-4 text-white/70">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm mb-4">
              ANIMXER
            </h2>
            <p className="text-sm leading-relaxed mb-6">
              Your ultimate platform for discovering and watching the best anime. Always updated, minimal ads, and a sleek user experience.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-2 text-sm flex flex-col">
              <button onClick={() => { setSelectedAnime(null); setViewListMode(null); setStaticPage(null); window.scrollTo(0, 0); }} className="text-left hover:text-emerald-400 transition-colors duration-300">Home</button>
              <button onClick={() => { fetchViewList('new-release', 'Trending Anime'); window.scrollTo(0, 0); }} className="text-left hover:text-emerald-400 transition-colors duration-300">Trending Anime</button>
              <button onClick={() => { fetchViewList('new-added', 'Recently Added'); window.scrollTo(0, 0); }} className="text-left hover:text-emerald-400 transition-colors duration-300">Recently Added</button>
              <button onClick={() => { fetchViewList('just-completed', 'Movies & OVAs'); window.scrollTo(0, 0); }} className="text-left hover:text-emerald-400 transition-colors duration-300">Movies & OVAs</button>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm flex flex-col">
              <button onClick={(e) => { e.preventDefault(); setStaticPage('Terms of Service'); window.scrollTo(0, 0); }} className="text-left hover:text-emerald-400 transition-colors duration-300">Terms of Service</button>
              <button onClick={(e) => { e.preventDefault(); setStaticPage('Privacy Policy'); window.scrollTo(0, 0); }} className="text-left hover:text-emerald-400 transition-colors duration-300">Privacy Policy</button>
              <button onClick={(e) => { e.preventDefault(); setStaticPage('DMCA Notice'); window.scrollTo(0, 0); }} className="text-left hover:text-emerald-400 transition-colors duration-300">DMCA Notice</button>
              <button onClick={(e) => { e.preventDefault(); setStaticPage('Contact Us'); window.scrollTo(0, 0); }} className="text-left hover:text-emerald-400 transition-colors duration-300">Contact Us</button>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h3>
            <ul className="space-y-2 text-sm flex flex-col">
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors duration-300">Discord Community</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors duration-300">Twitter Updates</a>
              <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors duration-300">Reddit Discussions</a>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-xs">
          <p className="mb-2">
            ANIMXER does not store any files on our server, we only linked to the media which is hosted on 3rd party services.
          </p>
          <p className="text-white/40">&copy; {new Date().getFullYear()} ANIMXER. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroSlider({ animeList, onSelect }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (animeList.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(animeList.length, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, [animeList.length]);

  if (animeList.length === 0) return null;

  const featuredList = animeList.slice(0, 5);
  const currentAnime = featuredList[currentIndex];

  return (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] rounded-2xl overflow-hidden mb-2 shadow-2xl glass-card border border-white/5 mx-auto group">
      <AnimatePresence mode="wait">
        <motion.div
           key={currentIndex}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.8 }}
           className="absolute inset-0"
        >
           <img
             src={currentAnime.image}
             alt={currentAnime.title}
             className="w-full h-full object-cover scale-105"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
           
           <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full md:w-2/3">
             {currentAnime.type && (
               <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 backdrop-blur-md rounded border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-4">
                 {currentAnime.type}
               </span>
             )}
             <motion.h2 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg line-clamp-2"
             >
               {currentAnime.title}
             </motion.h2>
             
             <motion.button 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.3 }}
               onClick={() => onSelect(currentAnime.id)}
               className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black py-3 px-8 rounded-xl font-bold transition-colors shadow-xl shadow-emerald-500/20"
             >
               <Play className="w-5 h-5 fill-current" /> Watch Now
             </motion.button>
           </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex gap-2 z-10">
        {featuredList.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-emerald-400' : 'w-2 bg-white/30 hover:bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}

const AnimeCard: React.FC<{ anime: any; onClick: any }> = ({ anime, onClick }) => {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="text-left group relative aspect-[2/3] rounded-xl overflow-hidden glass-card w-full"
    >
      {anime.image ? (
        <img
          src={anime.image}
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
          <span className="text-gray-400 text-center font-medium">{anime.title}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-bold text-sm line-clamp-2 mb-1 text-white shadow-sm">{anime.title}</h3>
        {anime.type && (
          <span className="text-[10px] uppercase tracking-wider text-white font-medium bg-white/20 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded inline-block mt-1">
            {anime.type}
          </span>
        )}
      </div>
    </motion.button>
  );
}
