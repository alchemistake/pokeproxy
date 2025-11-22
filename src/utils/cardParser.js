// Cache for dynamic set code mapping
let dynamicSetCodeMap = null;

// Cache for card sets (setId or ptcgoCode -> cards array)
// Use global window object to persist across hot reloads
if (typeof window !== 'undefined') {
    if (!window.__setDataCache) {
        window.__setDataCache = new Map();
    }
    if (!window.__setFetchPromises) {
        window.__setFetchPromises = new Map();
    }
}
const setDataCache = typeof window !== 'undefined' ? window.__setDataCache : new Map();
const setFetchPromises = typeof window !== 'undefined' ? window.__setFetchPromises : new Map();

/**
 * Initialize the dynamic set code map by fetching all sets
 * Call this once when the app loads
 * @returns {Promise<void>}
 */
export async function initializeSetCodeMap() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch sets data: ${response.statusText}`);
        }

        const sets = await response.json();
        dynamicSetCodeMap = {};

        // Build map from ptcgoCode to set id
        sets.forEach(set => {
            if (set.ptcgoCode) {
                dynamicSetCodeMap[set.ptcgoCode.toUpperCase()] = set.id;
            }
        });

    } catch (error) {
        // Fall back to hardcoded map only
        dynamicSetCodeMap = {};
    }
}

/**
 * Convert a set code to Pokemon TCG API set ID
 * @param {string} code - Set code (e.g., 'TWM', 'SVI')
 * @returns {string|null} - Set ID or null if not found
 */
export function getSetId(code) {
    const upperCode = code.toUpperCase();

    // Use the dynamic map (if initialized)
    if (dynamicSetCodeMap && dynamicSetCodeMap[upperCode]) {
        return dynamicSetCodeMap[upperCode];
    }

    return null;
}

/**
 * Fetch and cache set data from API
 * @param {string} setId - Set ID (e.g., 'sv6')
 * @returns {Promise<Array>} - Array of cards in the set
 */
async function fetchSetFromAPI(setId) {
    const cacheKey = `api:${setId}`;
    
    // Check cache first
    if (setDataCache.has(cacheKey)) {
        return setDataCache.get(cacheKey);
    }

    // Check if fetch is already in progress
    if (setFetchPromises.has(cacheKey)) {
        return setFetchPromises.get(cacheKey);
    }

    console.log(`Cache miss: fetching API set ${setId}`);
    const fetchPromise = (async () => {
        const url = `https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/${setId}.json`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch set data: ${response.statusText}`);
        }

        const cards = await response.json();
        setDataCache.set(cacheKey, cards);
        setFetchPromises.delete(cacheKey);
        
        return cards;
    })();

    setFetchPromises.set(cacheKey, fetchPromise);
    return fetchPromise;
}

/**
 * Fetch and cache set data from local storage
 * @param {string} ptcgoCode - PTCGO code (e.g., 'TWM')
 * @returns {Promise<Array>} - Array of cards in the set
 */
async function fetchSetFromLocal(ptcgoCode) {
    const cacheKey = `local:${ptcgoCode.toUpperCase()}`;
    
    // Check cache first
    if (setDataCache.has(cacheKey)) {
        return setDataCache.get(cacheKey);
    }

    // Check if fetch is already in progress
    if (setFetchPromises.has(cacheKey)) {
        return setFetchPromises.get(cacheKey);
    }

    console.log(`Cache miss: fetching local set ${ptcgoCode.toUpperCase()}`);
    const fetchPromise = (async () => {
        const localUrl = `/pokeproxy/data/int/en/${ptcgoCode.toUpperCase()}.json`;
        const response = await fetch(localUrl);
        
        if (!response.ok) {
            throw new Error(`Local data not found for set ${ptcgoCode} (status: ${response.status})`);
        }

        const cards = await response.json();
        setDataCache.set(cacheKey, cards);
        setFetchPromises.delete(cacheKey);
        
        return cards;
    })();

    setFetchPromises.set(cacheKey, fetchPromise);
    return fetchPromise;
}

/**
 * Fetch card data from Pokemon TCG API
 * @param {string} setId - Set ID (e.g., 'sv6')
 * @param {string} cardNumber - Card number (e.g., '95')
 * @param {string} ptcgoCode - Original PTCGO code for fallback to local data
 * @returns {Promise<Object>} - Card data
 */
export async function fetchCardData(setId, cardNumber, ptcgoCode = null) {
    // Try API first if setId is available
    if (setId) {
        try {
            const cards = await fetchSetFromAPI(setId);
            const card = cards.find(c => c.number === cardNumber);

            if (!card) {
                throw new Error(`Card number ${cardNumber} not found in set ${setId}`);
            }

            return card;
        } catch (error) {
            // Try local data fallback
        }
    }

    // Try local data as fallback
    if (ptcgoCode) {
        try {
            const localCards = await fetchSetFromLocal(ptcgoCode);

            // Try to find by number field first
            let localCard = localCards.find(c => c.number === cardNumber);

            // If not found, try by array index (card number - 1)
            if (!localCard) {
                const cardIndex = parseInt(cardNumber) - 1;
                if (cardIndex >= 0 && cardIndex < localCards.length) {
                    localCard = localCards[cardIndex];
                    // Add the number field for consistency
                    if (localCard) {
                        localCard = { ...localCard, number: cardNumber };
                    }
                }
            }

            if (!localCard) {
                throw new Error(`Card number ${cardNumber} not found in local set ${ptcgoCode} (only ${localCards.length} cards available)`);
            }

            return localCard;
        } catch (localError) {
            throw new Error(`Card not found in API or local data: ${ptcgoCode}/${cardNumber}`);
        }
    }

    throw new Error(`No data source available for card: ${ptcgoCode || setId}/${cardNumber}`);
}

/**
 * Parse a single decklist line
 * Format: "4 Munkidori TWM 95" or "Munkidori TWM 95" or "1 CEC 1" or "1 CEC/44"
 * @param {string} line - Decklist line
 * @returns {Object|null} - Parsed card info or null if invalid
 */
export function parseDecklistLine(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return null;

    // Format: "1 CEC/44" - count, set code/card number
    const slashMatch = trimmed.match(/^(\d+)\s+([A-Z]{2,})\/(\d+[a-z]?)$/i);
    if (slashMatch) {
        const [, countStr, setCode, cardNumber] = slashMatch;
        return {
            count: parseInt(countStr.trim()),
            name: '', // No name provided in this format
            setCode: setCode.trim().toUpperCase(),
            cardNumber: cardNumber.trim(),
        };
    }

    // Format: "1 CEC 1" - count, set code, card number (no name)
    const shortMatch = trimmed.match(/^(\d+)\s+([A-Z]{2,})\s+(\d+[a-z]?)$/i);
    if (shortMatch) {
        const [, countStr, setCode, cardNumber] = shortMatch;
        return {
            count: parseInt(countStr.trim()),
            name: '', // No name provided in this format
            setCode: setCode.trim().toUpperCase(),
            cardNumber: cardNumber.trim(),
        };
    }

    // Format: "4 Munkidori TWM 95" or "Munkidori TWM 95"
    const match = trimmed.match(/^(\d+\s+)?(.+?)\s+([A-Z]{2,})\s+(\d+[a-z]?)$/i);
    if (!match) return null;

    const [, countStr, name, setCode, cardNumber] = match;
    const count = countStr ? parseInt(countStr.trim()) : 1;

    return {
        count,
        name: name.trim(),
        setCode: setCode.trim().toUpperCase(),
        cardNumber: cardNumber.trim(),
    };
}

/**
 * Parse entire decklist text
 * @param {string} decklistText - Full decklist text
 * @returns {Array} - Array of parsed card objects
 */
export function parseDecklist(decklistText) {
    const lines = decklistText.split('\n');
    const cards = [];

    for (const line of lines) {
        const parsed = parseDecklistLine(line);
        if (parsed) {
            cards.push(parsed);
        }
    }

    return cards;
}