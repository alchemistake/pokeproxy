// Cache for dynamic set code mapping
let dynamicSetCodeMap = null;

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

        console.log(`Loaded ${Object.keys(dynamicSetCodeMap).length} set codes from API`);
    } catch (error) {
        console.error('Error fetching sets:', error);
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
}/**
 * Fetch card data from Pokemon TCG API
 * @param {string} setId - Set ID (e.g., 'sv6')
 * @param {string} cardNumber - Card number (e.g., '95')
 * @returns {Promise<Object>} - Card data
 */
export async function fetchCardData(setId, cardNumber) {
    const url = `https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en/${setId}.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch set data: ${response.statusText}`);
        }

        const cards = await response.json();
        const card = cards.find(c => c.number === cardNumber);

        if (!card) {
            throw new Error(`Card number ${cardNumber} not found in set ${setId}`);
        }

        return card;
    } catch (error) {
        console.error('Error fetching card:', error);
        throw error;
    }
}

/**
 * Parse a single decklist line
 * Format: "4 Munkidori TWM 95" or "Munkidori TWM 95"
 * @param {string} line - Decklist line
 * @returns {Object|null} - Parsed card info or null if invalid
 */
export function parseDecklistLine(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return null;

    // Match patterns like: "4 Munkidori TWM 95" or "Munkidori TWM 95"
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