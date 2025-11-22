// --- HARDCODED API KEY (FOR NEWS) ---
const apiKey = 'pub_7f7d8e3f4a7a4c23a323542f32f27e94'; 

// --- PAGINATION STATE & CONSTANTS (FOR NEWS) ---
const HEADLINES_PER_PAGE = 5;
let newsAppState = {
    currentArticles: [],
    currentIndex: 0,
    // Default country is India
    countryCode: 'in', 
    countryName: 'India'
};

// MAPPING: API Country Code (lowercase) to Display Name (Country + Flag)
const countryMap = {
    'au': '🇦🇺 Australia',
    'br': '🇧🇷 Brazil',
    'ca': '🇨🇦 Canada',
    'cn': '🇨🇳 China',
    'de': '🇩🇪 Germany',
    'fr': '🇫🇷 France', 
    'gb': '🇬🇧 United Kingdom',
    'in': '🇮🇳 India',
    'jp': '🇯🇵 Japan',
    'us': '🇺🇸 United States',
};

// ------------------------------------

// --- TRIVIA STATE & CONSTANTS ---
let triviaAppState = {
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    isQuizActive: false,
    timer: null
};
const TRIVIA_API_URL = "https://opentdb.com/api.php?amount=10&type=multiple"; 
// ------------------------------------

// --- MEME STATE & CONSTANTS ---
const MEME_API_URL = "https://meme-api.com/gimme/"; 
const MEME_SUBREDDITS = {
    'memes': 'All',
    'indiameme': '🇮🇳 Indian Memes', 
    'MalayalamMemes': '💚 Malayalam Memes' 
};
let memeAppState = {
    selectedSubreddit: 'memes' // Default to general memes
};
// ------------------------------------

// --- STOCKS CONSTANTS ---
const ALPHA_VANTAGE_API_KEY = '3N8PE82Y2T5DFULO'; 
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query?';
// ------------------------------------


// DOM elements
const headlineList = document.getElementById('headline-list');
const tabButtons = document.querySelectorAll('.tab-button');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreButton = document.getElementById('load-more-button');
const newsView = document.getElementById('news-view');
const triviaView = document.getElementById('trivia-view');

// NEWS SELECTOR
const countrySelect = document.getElementById('country-select');

// MEME ELEMENTS
const memesView = document.getElementById('memes-view');
const memeTitleEl = document.getElementById('meme-title');
const memeImageEl = document.getElementById('meme-image');
const nextMemeButton = document.getElementById('next-meme-button');
const memeErrorEl = document.getElementById('meme-error');
const memeFilterSelect = document.getElementById('meme-filter-select'); 

// TRIVIA ELEMENTS
const triviaInfo = document.getElementById('trivia-info');
const startQuizButton = document.getElementById('start-quiz-button');
const triviaQuestionCard = document.getElementById('trivia-question-card');
const triviaQuestionEl = document.getElementById('trivia-question');
const triviaOptions = document.getElementById('trivia-options');
const nextQuestionButton = document.getElementById('next-question-button');
const currentScoreEl = document.getElementById('current-score');

// STOCKS ELEMENTS
const stocksView = document.getElementById('stocks-view');
const stockSearchInput = document.getElementById('stock-search-input');
const stockSearchButton = document.getElementById('stock-search-button');
const stockResults = document.getElementById('stock-results');
const stockStatus = document.getElementById('stock-status');
const stockAutocompleteResults = document.getElementById('stock-autocomplete-results');


// === UTILITY FUNCTIONS ===

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function displayNewsMessage(message, type = 'info') {
    const color = type === 'error' ? 'text-red-600' : 'text-yellow-600';
    const bgColor = type === 'error' ? 'bg-red-50' : 'bg-yellow-50';

    headlineList.innerHTML = `
        <div class="text-center p-6 ${bgColor} rounded-xl">
            <p class="font-semibold ${color}">${message}</p>
        </div>
    `;
    loadMoreContainer.classList.add('hidden');
}

/**
 * Creates a debounced version of a function.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}


// === NEWS LOGIC ===

function updateLoadMoreButton() {
    const remainingCount = newsAppState.currentArticles.length - newsAppState.currentIndex;
    if (remainingCount > 0) {
        loadMoreButton.textContent = `Load More`;
        loadMoreContainer.classList.remove('hidden');
    } else {
        loadMoreContainer.classList.add('hidden');
    }
}

async function fetchNews(countryCode) {
    let url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&language=en&category=politics,sports,technology`;
    
    // Check if the country code is in the map to get the display name
    const countryDisplayName = countryMap[countryCode] || 'Selected Region';
    newsAppState.countryCode = countryCode;
    newsAppState.countryName = countryDisplayName;

    // Only add country filter if a specific country is selected
    if (countryCode) {
        url += `&country=${countryCode}`;
    } 

    headlineList.innerHTML = `
        <div class="flex justify-center items-center py-10">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-indigo-500 font-medium">Loading trending headlines for ${countryDisplayName}...</p>
        </div>
    `;
    loadMoreContainer.classList.add('hidden'); 

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'error') {
            let errorMessage = data.message || "An unknown Newsdata.io API error occurred.";
            displayNewsMessage(`API Error for ${countryDisplayName}: ${errorMessage}`, 'error');
            return;
        }
        
        newsAppState.currentArticles = data.results || [];
        newsAppState.currentIndex = 0;
        
        renderHeadlines(true);

    } catch (error) {
        console.error("Fetch failed:", error);
        displayNewsMessage(`Network error while fetching news for ${countryDisplayName}.`, 'error');
    }
}

/**
 * Renders news headlines to the DOM, including image thumbnails on the left.
 * @param {boolean} isNewLoad - True if starting a new fetch (clear list), false if loading more.
 */
function renderHeadlines(isNewLoad = false) {
    const articles = newsAppState.currentArticles;
    const countryDisplayName = newsAppState.countryName; 
    
    // 1. Get the current number of children BEFORE adding new articles (important for scrolling)
    const currentListCount = headlineList.children.length;

    if (isNewLoad) {
        headlineList.innerHTML = ''; 
        
        if (!articles || articles.length === 0) {
            headlineList.innerHTML = `<p class="text-center text-gray-500 py-10">No trending news found for ${countryDisplayName} at this time.</p>`;
            updateLoadMoreButton();
            return;
        }
    }
    
    const startIndex = newsAppState.currentIndex;
    const endIndex = Math.min(startIndex + HEADLINES_PER_PAGE, articles.length);
    const articlesToRender = articles.slice(startIndex, endIndex);

    articlesToRender.forEach(item => { 
        // 1. Create the main link container (set to flex for layout)
        const newsItem = document.createElement('a');
        newsItem.href = item.link || '#';
        newsItem.target = "_blank";
        newsItem.className = 'block flex items-center p-4 border border-gray-100 bg-white rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:border-indigo-400 cursor-pointer';

        // 2. Create Text Content container (flex-grow for remaining space)
        const textContainer = document.createElement('div');
        // Use min-w-0 to prevent text overflow issues in a flex container
        textContainer.className = 'flex-grow min-w-0'; 

        const headlineText = document.createElement('p');
        headlineText.className = 'text-base font-semibold text-gray-800 leading-relaxed mb-1';
        headlineText.textContent = item.title;

        const sourceText = document.createElement('p');
        sourceText.className = 'text-xs text-indigo-500 font-medium italic';
        sourceText.textContent = `Source: ${item.source_id || 'Unknown'}`;

        textContainer.appendChild(headlineText);
        textContainer.appendChild(sourceText);

        // --- IMAGE FIRST (LEFT) ---
        if (item.image_url) {
            const imageEl = document.createElement('img');
            imageEl.src = item.image_url;
            imageEl.alt = item.title;
            // w-32 h-32 = 128x128 pixels (larger thumbnail)
            imageEl.className = 'w-32 h-32 object-cover rounded-md flex-shrink-0 mr-4'; 
            newsItem.appendChild(imageEl); 
        }
        
        // --- TEXT CONTAINER SECOND (RIGHT) ---
        newsItem.appendChild(textContainer);

        // 4. Append to list
        headlineList.appendChild(newsItem);
    });

    newsAppState.currentIndex = endIndex;

    // 5. Autoscroll to the first newly added article (only if not a new initial load)
    if (!isNewLoad && articlesToRender.length > 0) {
        // The first newly loaded element is at the index of the list's previous length
        const firstNewItem = headlineList.children[currentListCount];
        if (firstNewItem) {
            firstNewItem.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' // Scroll to align the top of the element with the top of the list container
            });
        }
    }

    updateLoadMoreButton();
}

/**
 * Populates the country selection dropdown with options from the countryMap, sorted alphabetically.
 */
function populateCountrySelector() {
    // 1. Convert the map object into an array of [code, name] pairs
    let sortedCountries = Object.entries(countryMap);
    
    // 2. Sort the array alphabetically by the country name (index 1)
    sortedCountries.sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB));

    // 3. Clear existing options
    countrySelect.innerHTML = ''; 

    // 4. Populate the dropdown with sorted options
    sortedCountries.forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        countrySelect.appendChild(option);
    });
    
    // Set default selection to India
    countrySelect.value = newsAppState.countryCode;
}

/**
 * Handles the change event from the country selection dropdown.
 */
function handleCountryChange() {
    const selectedCountryCode = countrySelect.value;
    // Clear previously loaded articles when changing country
    newsAppState.currentArticles = []; 
    fetchNews(selectedCountryCode);
}


// === MEME LOGIC ===

/**
 * Populates the meme filter selection dropdown.
 */
function populateMemeSelector() {
    // Clear existing options
    memeFilterSelect.innerHTML = ''; 

    for (const subreddit in MEME_SUBREDDITS) {
        const option = document.createElement('option');
        option.value = subreddit;
        option.textContent = MEME_SUBREDDITS[subreddit];
        memeFilterSelect.appendChild(option);
    }
    memeFilterSelect.value = memeAppState.selectedSubreddit;
}

/**
 * Handles the change event from the meme filter dropdown.
 */
function handleMemeFilterChange() {
    memeAppState.selectedSubreddit = memeFilterSelect.value;
    // Fetch a new meme immediately after changing the filter
    fetchRandomMeme(); 
}

async function fetchRandomMeme() {
    memeTitleEl.textContent = "Fetching trending meme...";
    memeImageEl.classList.add('hidden');
    memeImageEl.src = '';
    memeErrorEl.classList.add('hidden');
    
    // Construct the URL using the base and the selected subreddit
    const fetchUrl = `${MEME_API_URL}${memeAppState.selectedSubreddit}`;

    try {
        const response = await fetch(fetchUrl);
        
        if (!response.ok) {
            throw new Error(`Meme API failed to load (Status: ${response.status})`);
        }

        const meme = await response.json();
        
        if (meme && meme.url && meme.url.match(/\.(jpeg|jpg|gif|png)$/i)) {
             memeTitleEl.textContent = meme.title || "Random Meme";
             memeImageEl.src = meme.url;
             memeImageEl.classList.remove('hidden');
             memeErrorEl.classList.add('hidden');
             memeErrorEl.textContent = 'Error loading image, please try again.';

        } else {
            memeTitleEl.textContent = "Meme found, but it's not a direct image link. Try again!";
            memeImageEl.classList.add('hidden');
            memeErrorEl.classList.remove('hidden');
            memeErrorEl.textContent = 'Meme found, but it\'s not a direct image link. Try again!';
        }
        
    } catch (error) {
        console.error("Meme fetch failed:", error);
        memeTitleEl.textContent = "Sorry, couldn't fetch a meme.";
        memeImageEl.classList.add('hidden');
        memeErrorEl.textContent = `Error: ${error.message}`;
        memeErrorEl.classList.remove('hidden');
    }
}


// === TRIVIA LOGIC ===

async function startQuiz() {
    triviaAppState.isQuizActive = true;
    triviaAppState.score = 0;
    triviaAppState.currentQuestionIndex = 0;
    currentScoreEl.textContent = `Score: 0`;
    triviaInfo.textContent = "Loading questions...";
    startQuizButton.classList.add('hidden');
    triviaQuestionCard.classList.add('hidden');

    try {
        const response = await fetch(TRIVIA_API_URL);
        const data = await response.json();

        if (data.response_code !== 0 || !data.results || data.results.length === 0) {
            triviaInfo.innerHTML = "Failed to load trivia questions. Please try again later.";
            startQuizButton.classList.remove('hidden');
            return;
        }
        
        triviaAppState.questions = data.results;
        triviaInfo.textContent = `Quiz started! ${triviaAppState.questions.length} questions loaded.`;
        triviaQuestionCard.classList.remove('hidden');
        displayQuestion();

    } catch (error) {
        console.error("Trivia fetch failed:", error);
        triviaInfo.innerHTML = "Network error. Could not fetch trivia questions.";
        startQuizButton.classList.remove('hidden');
    }
}

function displayQuestion() {
    clearTimeout(triviaAppState.timer);
    triviaOptions.innerHTML = '';
    nextQuestionButton.classList.add('hidden');
    nextQuestionButton.disabled = true;

    if (triviaAppState.currentQuestionIndex >= triviaAppState.questions.length) {
        endQuiz();
        return;
    }

    const questionData = triviaAppState.questions[triviaAppState.currentQuestionIndex];
    
    // 1. Combine and decode answers
    let answers = [questionData.correct_answer, ...questionData.incorrect_answers].map(decodeHTMLEntities);
    shuffleArray(answers);
    
    // 2. Display question and info
    triviaQuestionEl.textContent = decodeHTMLEntities(questionData.question);
    triviaInfo.textContent = `Question ${triviaAppState.currentQuestionIndex + 1} of ${triviaAppState.questions.length} | Category: ${questionData.category}`;
    
    // 3. Render answer buttons
    answers.forEach(answer => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.className = 'answer-button w-full px-4 py-3 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-indigo-100 hover:text-indigo-600';
        button.addEventListener('click', () => handleAnswer(button, answer, questionData.correct_answer));
        triviaOptions.appendChild(button);
    });
}

function handleAnswer(clickedButton, selectedAnswer, correctAnswer) {
    if (!triviaAppState.isQuizActive) return;

    // 1. Disable all buttons to prevent double-clicking
    document.querySelectorAll('.answer-button').forEach(btn => btn.disabled = true);
    
    // 2. Mark selected button
    clickedButton.classList.remove('hover:bg-indigo-100', 'hover:text-indigo-600');
    clickedButton.classList.add('selected-answer');

    // 3. Check answer and update score/styling
    if (selectedAnswer === decodeHTMLEntities(correctAnswer)) {
        triviaAppState.score++;
        currentScoreEl.textContent = `Score: ${triviaAppState.score}`;
        
        clickedButton.classList.remove('bg-gray-100', 'text-gray-800'); 
        clickedButton.classList.add('correct-answer');
    } else {
        clickedButton.classList.add('incorrect-answer');

        const correctText = decodeHTMLEntities(correctAnswer);
        document.querySelectorAll('.answer-button').forEach(btn => {
            if (btn.textContent === correctText) {
                // Remove all generic color classes
                btn.classList.remove('bg-gray-100', 'text-gray-800', 'hover:bg-indigo-100', 'hover:text-indigo-600', 'selected-answer'); 
                // Apply the green correct-answer style
                btn.classList.add('correct-answer');
            }
        });
    }

    // 4. Show the next question button
    nextQuestionButton.classList.remove('hidden');
    // Enable the button so the user can click it immediately
    nextQuestionButton.disabled = false; 

    let countdown = 5;
    nextQuestionButton.textContent = `Next Question (${countdown}s)`;

    triviaAppState.timer = setInterval(() => {
        countdown--;
        nextQuestionButton.textContent = `Next Question (${countdown}s)`;
        if (countdown <= 0) {
            clearInterval(triviaAppState.timer);
            nextQuestion();
        }
    }, 1000);
}

function nextQuestion() {
    triviaAppState.currentQuestionIndex++;
    displayQuestion();
}

function endQuiz() {
    triviaAppState.isQuizActive = false;
    triviaQuestionCard.classList.add('hidden');
    nextQuestionButton.classList.add('hidden');
    startQuizButton.classList.remove('hidden');

    triviaInfo.innerHTML = `
        <p class="text-xl font-bold text-indigo-600 mb-2">Quiz Complete!</p>
        <p class="text-2xl font-extrabold">Final Score: ${triviaAppState.score} / ${triviaAppState.questions.length}</p>
        <p class="mt-4">Click "Start Quiz" to play again.</p>
    `;
}


// === STOCKS LOGIC ===

/**
 * Determines the currency symbol based on the stock's region.
 * @param {string} region - The region string from Alpha Vantage (e.g., 'India/Bombay Stock Exchange').
 * @returns {string} The currency symbol.
 */
function getCurrencySymbol(region) {
    // Check for common Indian exchange names
    if (region && (region.includes('India') || region.includes('BSE') || region.includes('NSE'))) {
        return '₹'; // Indian Rupee
    }
    return '$'; // Default to US Dollar
}

/**
 * Searches for stock ticker symbols based on user input for autocomplete.
 * @param {string} keywords - The company name or symbol fragment.
 */
async function fetchAutocompleteSuggestions(keywords) {
    stockAutocompleteResults.innerHTML = '';
    
    if (keywords.length < 2) {
        stockAutocompleteResults.classList.add('hidden');
        return;
    }

    const url = `${ALPHA_VANTAGE_URL}function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data["Error Message"] || !data.bestMatches || data.bestMatches.length === 0) {
            stockAutocompleteResults.classList.add('hidden');
            return;
        }

        data.bestMatches.slice(0, 5).forEach(match => {
            const symbol = match['1. symbol'];
            const name = match['2. name'];
            const region = match['4. region'];
            
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `<span class="font-bold text-indigo-600">${symbol}</span> - ${name} (${region})`;
            
            item.addEventListener('click', () => {
                // 1. Set the input value
                stockSearchInput.value = symbol;
                // 2. Clear and hide suggestions
                stockAutocompleteResults.innerHTML = '';
                stockAutocompleteResults.classList.add('hidden');
                // 3. Immediately fetch the stock quote, passing the region
                fetchStockQuote(symbol, region);
            });
            
            stockAutocompleteResults.appendChild(item);
        });

        stockAutocompleteResults.classList.remove('hidden');

    } catch (error) {
        console.error("Alpha Vantage Autocomplete failed:", error);
        stockAutocompleteResults.innerHTML = '<div class="p-2 text-red-500">Error fetching suggestions.</div>';
        stockAutocompleteResults.classList.remove('hidden');
    }
}

/**
 * Fetches the latest global quote for a given stock ticker and renders the results.
 * @param {string} ticker - The stock ticker symbol (e.g., 'AAPL').
 * @param {string} region - The stock's region/exchange (e.g., 'India/Bombay Stock Exchange').
 */
async function fetchStockQuote(ticker, region = 'Unknown') {
    // Hide autocomplete results
    stockAutocompleteResults.classList.add('hidden');
    stockAutocompleteResults.innerHTML = '';

    // Set loading status
    stockStatus.textContent = `Fetching latest quote for ${ticker}...`;
    stockResults.innerHTML = '';
    stockResults.appendChild(stockStatus);

    // Get currency symbol based on the region provided
    const currencySymbol = getCurrencySymbol(region); 

    // FUNCTION: GLOBAL_QUOTE
    const url = `${ALPHA_VANTAGE_URL}function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Check for error messages from API
        if (data["Error Message"]) {
            stockStatus.textContent = `API Error: ${data["Error Message"]}. Check console for details.`;
            return;
        }
        
        const quote = data["Global Quote"];

        if (quote && quote["05. price"] && quote["05. price"] !== "0.0000") {
            const symbol = quote["01. symbol"];
            const price = parseFloat(quote["05. price"]).toFixed(2);
            const open = parseFloat(quote["02. open"]).toFixed(2);
            const high = parseFloat(quote["03. high"]).toFixed(2);
            const low = parseFloat(quote["04. low"]).toFixed(2);
            const change = parseFloat(quote["09. change"]);
            const changePercent = parseFloat(quote["10. change percent"].replace('%', '')).toFixed(2);
            
            const changeSign = change >= 0 ? 'text-green-600' : 'text-red-600';
            const changeArrow = change >= 0 ? '▲' : '▼';
            
            // Clear status and render results
            stockResults.innerHTML = ''; 

            const resultHtml = `
                <div class="text-left w-full space-y-3">
                    <h3 class="text-3xl font-extrabold text-gray-900">${symbol} <span class="text-sm font-semibold text-gray-500">(${region})</span></h3>
                    <p class="text-xl font-bold text-gray-700">Latest Price: <span class="text-indigo-600">${currencySymbol}${price}</span></p>
                    
                    <p class="text-xl font-bold ${changeSign}">
                        ${changeArrow} ${change.toFixed(2)} (${changePercent}%)
                    </p>
                    
                    <div class="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-gray-200">
                        <p><strong>Open:</strong> ${currencySymbol}${open}</p>
                        <p><strong>High:</strong> ${currencySymbol}${high}</p>
                        <p><strong>Low:</strong> ${currencySymbol}${low}</p>
                        <p><strong>Volume:</strong> ${quote["06. volume"]}</p>
                    </div>
                    <p class="text-xs text-gray-400 mt-3">Last Refreshed: ${quote["07. latest trading day"]}</p>
                </div>
            `;
            stockResults.innerHTML = resultHtml;

        } else {
            stockStatus.textContent = `Could not retrieve live quote for ticker: ${ticker}. Please verify the symbol.`;
        }
    } catch (error) {
        console.error("Alpha Vantage Global Quote failed:", error);
        stockStatus.textContent = "Network error fetching stock quote.";
    }
}

/**
 * Main handler for the stock search button click.
 * This now always uses SYMBOL_SEARCH first to find the region and exact ticker.
 */
async function handleStockSearch() {
    const query = stockSearchInput.value.trim();
    if (!query) {
        stockStatus.textContent = "Please enter a company name or ticker symbol.";
        stockResults.innerHTML = '';
        stockResults.appendChild(stockStatus);
        return;
    }

    // 1. Search for the ticker symbol and its region/exchange info
    const symbolSearchUrl = `${ALPHA_VANTAGE_URL}function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    stockStatus.textContent = `Searching for ticker and exchange for "${query}"...`;
    stockResults.innerHTML = '';
    stockResults.appendChild(stockStatus);

    try {
        const response = await fetch(symbolSearchUrl);
        const data = await response.json();

        if (data.bestMatches && data.bestMatches.length > 0) {
            const bestMatch = data.bestMatches[0];
            const ticker = bestMatch['1. symbol'];
            const region = bestMatch['4. region'];
            
            // 2. Update the input field with the precise ticker
            stockSearchInput.value = ticker; 
            
            // 3. Fetch the quote using the found ticker and region
            await fetchStockQuote(ticker, region); 
        } else {
            stockStatus.textContent = `No stock symbol found for "${query}". Please try a different query.`;
        }

    } catch (error) {
        console.error("Alpha Vantage Search failed in handleStockSearch:", error);
        stockStatus.textContent = "Network error during stock symbol lookup.";
    }
}


// Debounced version of the autocomplete fetch function
const debouncedFetchSuggestions = debounce(fetchAutocompleteSuggestions, 300);


// === EVENT LISTENERS & INITIALIZATION ===

// 1. Tab switching
function switchRegion(event) {
    const selectedButton = event.currentTarget;
    const contentArea = selectedButton.getAttribute('data-content');

    // Update button styles
    tabButtons.forEach(button => {
        button.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
        button.classList.add('text-gray-600', 'hover:bg-indigo-50', 'hover:text-indigo-600');
    });
    selectedButton.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
    selectedButton.classList.remove('text-gray-600', 'hover:bg-indigo-50', 'hover:text-indigo-600');

    // Hide all views
    newsView.classList.add('hidden');
    memesView.classList.add('hidden');
    triviaView.classList.add('hidden');
    stocksView.classList.add('hidden'); 

    // Show the selected view and fetch data
    if (contentArea === 'news') {
        newsView.classList.remove('hidden');
        // Fetch news for the currently selected dropdown country if no articles are loaded
        if (newsAppState.currentArticles.length === 0) {
            fetchNews(countrySelect.value);
        } else {
            updateLoadMoreButton();
        }
    } else if (contentArea === 'stocks') {
        stocksView.classList.remove('hidden');
        // Reset stock status message
        stockStatus.textContent = "Enter a company name or ticker symbol above to find its stock price.";
        stockResults.innerHTML = '';
        stockResults.appendChild(stockStatus); 
        // Hide autocomplete when switching back
        stockAutocompleteResults.classList.add('hidden');
    }
    else if (contentArea === 'memes') {
        memesView.classList.remove('hidden');
        // Fetch a meme using the currently selected filter
        fetchRandomMeme(); 
    } else if (contentArea === 'trivia') {
        triviaView.classList.remove('hidden');
        if (!triviaAppState.isQuizActive) {
            triviaInfo.textContent = "Click \"Start Quiz\" to begin!";
            startQuizButton.classList.remove('hidden');
            triviaQuestionCard.classList.add('hidden');
            currentScoreEl.textContent = `Score: 0`;
        }
    }
}

// 2. News Load More
loadMoreButton.addEventListener('click', () => renderHeadlines(false));

// 3. News Country Change
countrySelect.addEventListener('change', handleCountryChange);

// 4. Meme Controls
nextMemeButton.addEventListener('click', fetchRandomMeme);
memeFilterSelect.addEventListener('change', handleMemeFilterChange); 

// 5. Trivia Controls
startQuizButton.addEventListener('click', startQuiz);
nextQuestionButton.addEventListener('click', () => {
    clearTimeout(triviaAppState.timer); 
    nextQuestion();
});

// 6. Stocks Controls (Search Button)
stockSearchButton.addEventListener('click', handleStockSearch);

// 7. Stocks Controls (Autocomplete Input)
stockSearchInput.addEventListener('input', (event) => {
    const keywords = event.target.value.trim();
    debouncedFetchSuggestions(keywords);
});

// 8. Stocks Controls (Outside Click to Hide Autocomplete)
document.addEventListener('click', (event) => {
    if (!stockAutocompleteResults.contains(event.target) && event.target !== stockSearchInput) {
        stockAutocompleteResults.classList.add('hidden');
    }
});

// 9. Initial load
tabButtons.forEach(button => {
    button.addEventListener('click', switchRegion);
});

function initializeApp() {
    // Populate selectors
    populateCountrySelector();
    populateMemeSelector(); 
    
    // Set the default active style for the News tab
    const newsButton = document.getElementById('tab-news');
    if (newsButton) {
        newsButton.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
        newsButton.classList.remove('text-gray-600', 'hover:bg-indigo-50', 'hover:text-indigo-600');
    }
    
    // Load news for the default country ('in')
    fetchNews(newsAppState.countryCode);
}

window.onload = initializeApp;
