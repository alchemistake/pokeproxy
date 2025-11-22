import https from 'https';
import * as cheerio from 'cheerio';
import path from 'path';

/**
 * Fetch HTML content from a URL
 */
function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

/**
 * Map Limitless TCG data to Pokemon TCG API format
 */
function mapToTCGFormat(limitlessData) {
    const card = {
        name: limitlessData.name,
        supertype: limitlessData.supertype || 'Pokémon',
        subtypes: limitlessData.subtypes || [],
    };

    // Add HP if present
    if (limitlessData.hp) {
        card.hp = limitlessData.hp.toString();
    }

    // Add types if present
    if (limitlessData.types && limitlessData.types.length > 0) {
        card.types = limitlessData.types;
    }

    // Add evolvesFrom if present
    if (limitlessData.evolvesFrom) {
        card.evolvesFrom = limitlessData.evolvesFrom;
    }

    // Add evolvesTo if present
    if (limitlessData.evolvesTo && limitlessData.evolvesTo.length > 0) {
        card.evolvesTo = limitlessData.evolvesTo;
    }

    // Add abilities if present
    if (limitlessData.abilities && limitlessData.abilities.length > 0) {
        card.abilities = limitlessData.abilities;
    }

    // Add attacks if present
    if (limitlessData.attacks && limitlessData.attacks.length > 0) {
        card.attacks = limitlessData.attacks;
    }

    // Add weaknesses if present
    if (limitlessData.weaknesses && limitlessData.weaknesses.length > 0) {
        card.weaknesses = limitlessData.weaknesses;
    }

    // Add resistances if present
    if (limitlessData.resistances && limitlessData.resistances.length > 0) {
        card.resistances = limitlessData.resistances;
    }

    // Add retreat cost if present
    if (limitlessData.retreatCost && limitlessData.retreatCost.length > 0) {
        card.retreatCost = limitlessData.retreatCost;
    }

    // Add rules if present
    if (limitlessData.rules && limitlessData.rules.length > 0) {
        card.rules = limitlessData.rules;
    }

    // Add images in the format expected by Card.jsx
    if (limitlessData.imageUrl) {
        card.images = {
            large: limitlessData.imageUrl
        };
    }

    return card;
}

/**
 * Energy type mapping
 */
const energyTypeMap = {
    'G': 'Grass',
    'R': 'Fire',
    'W': 'Water',
    'L': 'Lightning',
    'P': 'Psychic',
    'F': 'Fighting',
    'D': 'Darkness',
    'M': 'Metal',
    'C': 'Colorless',
    'N': 'Dragon',
    'Y': 'Fairy'
};

/**
 * Replace energy symbols [X] with full type names
 */
function replaceEnergySymbols(text) {
    if (!text) return text;
    return text.replace(/\[([GRWLPFDMCNY])\]/g, (match, type) => {
        return energyTypeMap[type] || match;
    });
}

/**
 * Parse energy cost from text like "G" or "GC" 
 */
function parseEnergyCost(costText) {
    if (!costText) return [];
    return costText.trim().split('').map(char => energyTypeMap[char] || 'Colorless');
}

/**
 * Scrape card data from Limitless TCG
 */
async function scrapeCard(setCode, cardNumber) {
    const url = `https://limitlesstcg.com/cards/${setCode}/${cardNumber}`;
    try {
        const html = await fetchHTML(url);
        const $ = cheerio.load(html);

        // Extract card name from the title or card-text-name
        let cardName = '';
        const titleText = $('title').text();

        // Check if page not found
        if (titleText.includes('Page not found') || titleText.includes('404')) {
            throw new Error('Card not found (404)');
        }

        const titleMatch = titleText.match(/^([^-]+)/);
        if (titleMatch) {
            cardName = titleMatch[1].trim();
        }

        // Extract full header text containing type and HP from first <p>
        const firstP = $('p').eq(0);
        const headerText = firstP.text();

        // Extract type and HP from header
        const typeHPMatch = headerText.match(/-\s*([A-Za-z]+)\s*-\s*(\d+)\s*HP/);
        const cardType = typeHPMatch ? typeHPMatch[1].trim() : '';
        const hp = typeHPMatch ? parseInt(typeHPMatch[2]) : null;

        // Extract supertype and stage info from second <p>
        const secondP = $('p').eq(1);
        const stageText = secondP.text();

        const supertype = stageText.includes('Pokémon') ? 'Pokémon' :
            stageText.includes('Trainer') ? 'Trainer' :
                stageText.includes('Energy') ? 'Energy' : 'Pokémon';

        // Extract stage and evolvesFrom (for Pokémon) or trainer subtype
        let subtypes = [];
        let evolvesFrom = null;

        if (supertype === 'Pokémon') {
            if (stageText.includes('Basic')) {
                subtypes.push('Basic');
            } else if (stageText.includes('Stage 1')) {
                subtypes.push('Stage 1');
                // Get evolvesFrom from the link in second p
                const evolvesLink = secondP.find('a[href*="/cards?q=name:"]').first();
                if (evolvesLink.length) {
                    evolvesFrom = evolvesLink.text().trim();
                }
            } else if (stageText.includes('Stage 2')) {
                subtypes.push('Stage 2');
                const evolvesLink = secondP.find('a[href*="/cards?q=name:"]').first();
                if (evolvesLink.length) {
                    evolvesFrom = evolvesLink.text().trim();
                }
            }
        } else if (supertype === 'Trainer') {
            // Extract trainer subtype (Item, Supporter, Stadium, Tool)
            if (stageText.includes('Item')) {
                subtypes.push('Item');
            } else if (stageText.includes('Supporter')) {
                subtypes.push('Supporter');
            } else if (stageText.includes('Stadium')) {
                subtypes.push('Stadium');
            } else if (stageText.includes('Tool')) {
                subtypes.push('Tool');
            }
        } else if (supertype === 'Energy') {
            // Extract energy subtype (Special, Basic)
            if (stageText.includes('Special')) {
                subtypes.push('Special');
            } else if (stageText.includes('Basic')) {
                subtypes.push('Basic');
            }
        }

        // Extract special subtypes from Pokémon card names only (order matters!)
        // Add MEGA first, then ex/EX/GX/V/VMAX/VSTAR
        if (supertype === 'Pokémon') {
            if (cardName.includes('Mega ') || cardName.includes('M ')) {
                if (!subtypes.includes('MEGA')) {
                    subtypes.push('MEGA');
                }
            }
            if (cardName.includes(' ex')) {
                subtypes.push('ex');
            }
            if (cardName.includes('EX')) {
                subtypes.push('EX');
            }
            if (cardName.includes('GX')) {
                subtypes.push('GX');
            }
            if (cardName.includes(' V')) {
                subtypes.push('V');
            }
            if (cardName.includes('VMAX')) {
                subtypes.push('VMAX');
            }
            if (cardName.includes('VSTAR')) {
                subtypes.push('VSTAR');
            }
        }

        // Extract abilities and attacks
        const abilities = [];
        const attacks = [];
        const bodyText = $('body').text();
        const lines = bodyText.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for abilities (format: "Ability:" on one line, name on next, text after)
            if (line === 'Ability:' || line.startsWith('Ability:')) {
                const abilityName = lines[i + 1]?.trim() || '';
                if (abilityName) {
                    // Look for ability text in following lines
                    let abilityText = '';
                    for (let j = i + 2; j < Math.min(i + 15, lines.length); j++) {
                        const nextLine = lines[j].trim();
                        if (!nextLine) continue;
                        // Stop if we hit another ability, attack, or card stats
                        if (nextLine.includes('Ability:') ||
                            nextLine.match(/^[GRWLPFDMCNY]+$/) ||
                            nextLine.includes('Weakness:') ||
                            nextLine.includes('Resistance:')) {
                            break;
                        }
                        abilityText += (abilityText ? ' ' : '') + nextLine;
                    }

                    abilities.push({
                        name: abilityName,
                        text: replaceEnergySymbols(abilityText),
                        type: 'Ability'
                    });
                }
            }

            // Check for attacks (format: energy symbols on one line, name+damage on next)
            if (line.match(/^[GRWLPFDMCNY]+$/)) {
                const costStr = line;
                const nextLine = lines[i + 1]?.trim() || '';
                // Match attack name with optional damage (or no damage at all)
                // Allow letters, spaces, apostrophes, hyphens in attack names
                const attackMatch = nextLine.match(/^([A-Z][A-Za-z\s'\-]+?)(?:\s+(\d+[×+]?))?\s*$/);

                if (attackMatch) {
                    const [, attackName, damage] = attackMatch;
                    const attack = {
                        name: attackName.trim(),
                        cost: parseEnergyCost(costStr),
                        damage: damage || ''
                    };

                    // Look for attack text in the following lines
                    let attackText = '';
                    for (let j = i + 2; j < Math.min(i + 20, lines.length); j++) {
                        const textLine = lines[j].trim();
                        if (!textLine) continue;
                        // Stop if we hit another attack's energy cost or card stats
                        if (textLine.includes('Weakness:') ||
                            textLine.includes('Resistance:') ||
                            textLine.includes('Retreat:')) {
                            break;
                        }
                        // Stop if we see another energy cost pattern (next attack)
                        if (textLine.match(/^[GRWLPFDMCNY]+$/) && j > i + 2) {
                            break;
                        }
                        attackText += (attackText ? ' ' : '') + textLine;
                    }

                    if (attackText && attackText.length > 5) {
                        attack.text = replaceEnergySymbols(attackText);
                    } else {
                        attack.text = '';
                    }

                    attacks.push(attack);
                }
            }
        }

        // Extract rules for Trainer and Energy cards
        const rules = [];
        if (supertype === 'Trainer' || supertype === 'Energy') {
            // Find lines containing the trainer/energy subtype, then extract text after it
            let foundSubtype = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Look for the subtype line
                if (line === 'Item' || line === 'Supporter' || line === 'Stadium' || line === 'Tool' || line === 'Special' ||
                    line.includes('- Item') || line.includes('- Supporter') || line.includes('- Stadium') || line.includes('- Tool') || line.includes('- Special')) {
                    foundSubtype = true;
                    continue;
                }

                // After finding subtype, collect rule text until we hit "Illustrated by"
                if (foundSubtype && line) {
                    if (line.includes('Illustrated by')) {
                        break;
                    }
                    // Check if this looks like actual card text (not navigation/UI elements)
                    if (line.match(/^[A-Z]/) && line.length > 20 && line.length < 300 &&
                        !line.includes('TCGplayer') && !line.includes('Cardmarket') &&
                        !line.includes('Database') && !line.includes('Regulation Mark') &&
                        !line.includes('Calculator') && !line.includes('Deck Builder')) {
                        // Clean up [X] energy symbols
                        const cleanedLine = replaceEnergySymbols(line);
                        rules.push(cleanedLine);
                        break; // Only take the first rule line for now
                    }
                }
            }

            // Add standard trainer rules based on subtype
            if (subtypes.includes('Item')) {
                rules.push('You may play any number of Item cards during your turn.');
            } else if (subtypes.includes('Supporter')) {
                rules.push('You may play only 1 Supporter card during your turn.');
            } else if (subtypes.includes('Stadium')) {
                rules.push('You may play only 1 Stadium card during your turn. Put it next to the Active Spot, and discard it if another Stadium comes into play. A Stadium with the same name can\'t be played.');
            }
        }

        // Get plain text for other extractions
        const pageText = bodyText.replace(/\s+/g, ' ');

        // Extract weakness
        const weaknesses = [];
        const weaknessMatch = pageText.match(/Weakness:\s*([A-Za-z]+)/);
        if (weaknessMatch && !['none', 'None'].includes(weaknessMatch[1])) {
            weaknesses.push({
                type: weaknessMatch[1],
                value: '×2'
            });
        }

        // Extract resistance  
        const resistances = [];
        const resistanceMatch = pageText.match(/Resistance:\s*([A-Za-z]+)/);
        if (resistanceMatch && !['none', 'None'].includes(resistanceMatch[1])) {
            resistances.push({
                type: resistanceMatch[1],
                value: '-30'
            });
        }

        // Extract retreat cost
        const retreatCost = [];
        const retreatMatch = pageText.match(/Retreat:\s*(\d+)/);
        if (retreatMatch) {
            const retreatCount = parseInt(retreatMatch[1]);
            for (let i = 0; i < retreatCount; i++) {
                retreatCost.push('Colorless');
            }
        }

        // Extract image URL
        let imageUrl = '';
        const imgElement = $('img.card').first();
        if (imgElement.length) {
            imageUrl = imgElement.attr('src') || '';
        }

        // Build the card object with only fields used by Card.jsx
        const limitlessData = {
            name: cardName,
            supertype: supertype,
            subtypes: subtypes,
            hp: hp,
            types: cardType ? [cardType] : [],
            evolvesFrom: evolvesFrom,
            abilities: abilities,
            attacks: attacks,
            weaknesses: weaknesses,
            resistances: resistances,
            retreatCost: retreatCost,
            rules: rules,
            imageUrl: imageUrl
        };

        const tcgCard = mapToTCGFormat(limitlessData);
        return tcgCard;

    } catch (error) {
        console.error('Error scraping card:', error);
        throw error;
    }
}

/**
 * Discover all available set codes from Limitless TCG
 */
async function discoverSets(region = 'en', silent = false) {
    const url = `https://limitlesstcg.com/cards/${region}`;
    try {
        if (!silent) console.log(`Discovering available ${region.toUpperCase()} sets...`);
        const html = await fetchHTML(url);
        const $ = cheerio.load(html);

        const setCodes = new Set();

        // Find all links that point to set pages (format: /cards/REGION/XXX where XXX is the set code)
        $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            // Match /cards/REGION/SETCODE pattern
            const match = href.match(new RegExp(`^\\/cards\\/${region}\\/([A-Z0-9]{1,4})$`));
            if (match) {
                setCodes.add(match[1]);
            }
        });

        const sortedCodes = Array.from(setCodes).sort();
        if (!silent) {
            console.log(`Found ${sortedCodes.length} sets:`);
            sortedCodes.forEach(code => console.log(code));
        }

        return sortedCodes;
    } catch (error) {
        console.error('Error discovering sets:', error);
        throw error;
    }
}

/**
 * Scrape all cards from a set until 3 consecutive 404s
 */
async function scrapeSet(setCode, outputDir) {
    const cards = [];
    let successCount = 0;
    let failCount = 0;
    let consecutiveFailures = 0;
    let currentNumber = 1;

    // Create output directory if specified
    if (outputDir) {
        const fs = await import('fs');
        fs.mkdirSync(outputDir, { recursive: true });
    }

    while (consecutiveFailures < 3) {
        try {
            // Check if card file already exists
            if (outputDir) {
                const fs = await import('fs');
                const path = await import('path');
                const cardFile = path.join(outputDir, `${setCode}_${currentNumber}.json`);
                if (fs.existsSync(cardFile)) {
                    // console.log(`${currentNumber}: Skipping (already exists)`);
                    successCount++;
                    consecutiveFailures = 0;
                    currentNumber++;
                    continue;
                }
            }

            const card = await scrapeCard(setCode, currentNumber.toString());
            console.log(`${setCode}/${currentNumber}: ${card.name}`);
            cards.push(card);

            // Save individual card file if outputDir is specified
            if (outputDir) {
                const fs = await import('fs');
                const path = await import('path');
                const cardFile = path.join(outputDir, `${setCode}_${currentNumber}.json`);
                fs.writeFileSync(cardFile, JSON.stringify(card, null, 2));
            }

            successCount++;
            consecutiveFailures = 0; // Reset on success
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 5));
        } catch (error) {
            console.error(`Failed to scrape card ${currentNumber}: ${error.message}`);
            failCount++;
            consecutiveFailures++;

            // Stop if we hit 3 consecutive failures (likely reached end of set)
            if (consecutiveFailures >= 3) {
                console.log('\nStopping: 3 consecutive card not found errors detected.');
                break;
            }
        }
        currentNumber++;
    }

    console.log(`\nScraping complete: ${successCount} successful, ${failCount} failed`);

    return cards;
}

// Export functions for use in other modules
export { scrapeCard, scrapeSet, discoverSets };

// Main execution (only runs when script is executed directly)
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage:');
        console.log('  Discover sets: node scraper.js --discover');
        console.log('  Discover JP sets: node scraper.js --discover-jp');
        console.log('  Single card: node scraper.js <SET_CODE>/<CARD_NUMBER>');
        console.log('  Full set scrape: node scraper.js <SET_CODE>');
        console.log('\nExamples:');
        console.log('  node scraper.js --discover');
        console.log('  node scraper.js --discover-jp');
        console.log('  node scraper.js PRE/42');
        console.log('  node scraper.js PRE');
        process.exit(1);
    }

    if (args.length !== 1) {
        console.error('Invalid arguments. Use --discover, --discover-jp, SET_CODE, or SET_CODE/CARD_NUMBER format.');
        process.exit(1);
    }

    // Check for discovery mode
    if (args[0] === '--discover') {
        discoverSets('en')
            .catch(error => {
                console.error('Failed to discover sets:', error.message);
                process.exit(1);
            });
    } else if (args[0] === '--discover-jp') {
        discoverSets('jp')
            .catch(error => {
                console.error('Failed to discover JP sets:', error.message);
                process.exit(1);
            });
    } else if (args[0].includes('/')) {
        // Check if argument contains a slash (SET_CODE/CARD_NUMBER format)
        // Single card mode: PRE/42
        const [setCode, cardNumber] = args[0].split('/');
        scrapeCard(setCode, cardNumber)
            .then(card => {
                console.log(JSON.stringify(card, null, 2));
            })
            .catch(error => {
                console.error('Failed to scrape card:', error.message);
                process.exit(1);
            });
    } else {
        // Full set mode: PRE (scrape until 3 consecutive 404s)
        const setCode = args[0];
        const outputDir = path.join('public', 'data', 'inprogress', 'en', setCode);
        scrapeSet(setCode, outputDir)
            .catch(error => {
                console.error('Failed to scrape set:', error.message);
                process.exit(1);
            });
    }
}
