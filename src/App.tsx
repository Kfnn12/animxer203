import { useState, useEffect } from "react";
import { Search, Play, Info } from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newReleases, setNewReleases] = useState([]);
  const [newAdded, setNewAdded] = useState([]);
  const [justCompleted, setJustCompleted] = useState([]);
  const [estimatedSchedule, setEstimatedSchedule] = useState([]);
  
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [watchHistory, setWatchHistory] = useState<Record<string, any>>(() => {
    try {
      const stored = localStorage.getItem('animeWatchHistory');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [jumpToEp, setJumpToEp] = useState('');

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

    fetch("/api/lists?type=estimated-schedule")
      .then((res) => res.json())
      .then((data) => {
        if (data.results) setEstimatedSchedule(data.results);
      });
  }, []);

  const searchAnime = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchAnimeInfo = async (id) => {
    setAnimeInfo(null);
    setSelectedEpisode(null);
    setVideoUrl(null);
    setServers([]);
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
            ANIMXER
          </h1>
          <form onSubmit={searchAnime} className="relative w-full max-w-md ml-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-10 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors backdrop-blur-md placeholder:text-gray-400"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <button type="submit" className="hidden" />
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {selectedAnime ? (
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
                  
                  <div className="mb-6">
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
                {newReleases.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Play className="w-5 h-5 text-emerald-400" />
                      New Releases
                    </h2>
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
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Play className="w-5 h-5 text-blue-400" />
                      Newly Added
                    </h2>
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
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Play className="w-5 h-5 text-purple-400" />
                      Just Completed
                    </h2>
                    <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x">
                      {justCompleted.map((item, i) => (
                        <div key={i} className="flex-none w-40 sm:w-48 md:w-56 snap-start">
                           <AnimeCard anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {estimatedSchedule.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Play className="w-5 h-5 text-pink-400" />
                      Estimated Schedule
                    </h2>
                    <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide snap-x">
                      {estimatedSchedule.map((item, i) => (
                        <div key={i} className="flex-none w-40 sm:w-48 md:w-56 snap-start">
                           <AnimeCard anime={item} onClick={() => fetchAnimeInfo(item.id)} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
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
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Home</a>
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Trending Anime</a>
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Recently Added</a>
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Movies & OVAs</a>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm flex flex-col">
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Terms of Service</a>
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">DMCA Notice</a>
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Contact Us</a>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h3>
            <ul className="space-y-2 text-sm flex flex-col">
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Discord Community</a>
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Twitter Updates</a>
              <a href="#" className="hover:text-emerald-400 transition-colors duration-300">Reddit Discussions</a>
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

function AnimeCard({ anime, onClick }) {
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
