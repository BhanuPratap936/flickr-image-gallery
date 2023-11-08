import React, {useState, useEffect, useRef} from "react"

// even after using safe_search query parameter some time result still not safe
const mainUrl = `https://www.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=${import.meta.env.VITE_API_KEY}&format=json&nojsoncallback=1&safe_search=3&per_page=20`
const searchUrl = `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${import.meta.env.VITE_API_KEY}&format=json&nojsoncallback=1&safe_search=3&per_page=20`

const App = () => {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [images, setImages] = useState([])
  const [page, setPage] = useState(1)
  const [suggestedQueries, setSuggestedQueries] = useState([])
  const mounted = useRef(false)
  const [newImages, setNewImages] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [isSticky, setIsSticky] = useState(false)

  // To load the recent searches
  useEffect(() => {
    
    loadSuggestQuery()
  }, [])

  //  Fetches recent photos from the Flickr API and updates the photos state variable.
  const fetchImages = async() => {
    setLoading(true)
    let url;
    const urlPage = `&page=${page}`
    const urlQuery = `&text=${searchQuery}`
    if(searchQuery) {
      url = `${searchUrl}${urlPage}${urlQuery}`
    } else {
      url = `${mainUrl}${urlPage}`
    }
    try {
      const response = await fetch(url)
      const data = await response.json()
      setImages((prevImages) => {
        if (searchQuery && page === 1) {
          return data.photos.photo
        } else if (searchQuery) {
          return [...prevImages, ...data.photos.photo]
        } else {
          return [...prevImages, ...data.photos.photo]
        }
      })
      setNewImages(false)
      setLoading(false)
    } catch (error) {
      setNewImages(false)
      setLoading(false)
      console.log('Error fetching images: ', error)   
    }
  }

  useEffect(() => {
    fetchImages()
  }, [page, searchQuery])

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return
    }
    if (!newImages) return
    if (loading) return
    setPage((oldPage) => oldPage + 1)
  }, [newImages])


  // The event function is called when the user scrolls to the bottom of the page. It sets the newImages state variable to true to trigger fetching more images.
  const event = () => {
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
      setNewImages(true)
    }
  }

  const handleInputFocus = () => {
    setShowSuggestion(true)
  }

  // useEffect hook is used to listen for scroll events and call the event function.
  useEffect(() => {
    window.addEventListener('scroll', event)
    return () => window.removeEventListener('scroll', event)
  }, [])

  

  const loadSuggestQuery = () => {
    const savedQueries = localStorage.getItem('searchQueries')
    if(savedQueries) {
      setSuggestedQueries(JSON.parse(savedQueries))
    }
  }

  //  Saves the search query to the browser's local storage.
  const saveSuggestQuery = () => {
    const updatedQueries = [...suggestedQueries, searchQuery]
    setSuggestedQueries(updatedQueries)
    localStorage.setItem('searchQueries', JSON.stringify(updatedQueries))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if(!searchQuery) return
    if (page === 1) {
      fetchImages()
    }
    saveSuggestQuery()
    setPage(1)
    // setSearchQuery('')

  }

  const handleImageClick = (image) => {
    setSelectedImage(image)
  }

  const handleCloseModal = () => {
    setSelectedImage(null)
  }

  

  const uniqueQueries = [ ...new Set(suggestedQueries)]
  const filteredQuery = uniqueQueries.filter((query) => {
    if(searchQuery === '') {
      return query
    } else {
      return query.toLowerCase().includes(searchQuery)
    }
  })

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScroll = () => {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition + windowHeight >= documentHeight) {
      setIsSticky(true);
    } else {
      setIsSticky(false);
    }
  };

  return (
    <div>
      {/* The component renders a header with a search input field and a button. */}
      <header className={`${isSticky ? 'sticky' : ''}`}>
        <form className="input-container">
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search for images"
          className="input-field"
          onFocus={handleInputFocus}
        />
        <button type="submit" className="search-button" onClick={handleSubmit}>Search</button>
        </form>
        {/* The suggested queries are displayed below the search input field when it is focused. */}
        {showSuggestion && (<div>
          <h3>Recent Searches</h3>
          <ul className="suggested-queries">
            {filteredQuery.map((query, index) => {
              return <li key={index} onClick={() => (setSearchQuery(query))} className="suggested-query">{query}</li>
            })}
          </ul>
          <div className="suggested-buttons">
          <button onClick={() => setShowSuggestion(false)} className="suggested-close">Close</button>
          <button onClick={() => setSuggestedQueries([])} className="suggested-clear">Clear</button>
          </div>
        </div>)}
        
      </header>
      {/* The image gallery is rendered using the images state variable. */}
    <div className="gallery">
      {images.map((image, index) => {
        return (
          <img key={index} src={`https://live.staticflickr.com/${image.server}/${image.id}_${image.secret}.jpg`} alt={image.title} style={{height: '300px', width: '300px'}} onClick={() => handleImageClick(image)} />
        )
      })}
    </div>
    {/* Clicking on an image opens a modal with a larger version of the image. */}
    {selectedImage && (
      <div className="modal">
        <img
            src={`https://live.staticflickr.com/${selectedImage.server}/${selectedImage.id}_${selectedImage.secret}_b.jpg`}
            alt={selectedImage.title}
          />
          <button onClick={handleCloseModal}>Close</button>
      </div>
    )}
    {/* A loading spinner is displayed when images are being fetched. */}
    {loading && <div className="loading">
  <div className="loading-spinner"></div>
</div>
}
    </div>
  )
}

export default App