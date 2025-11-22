import fs from 'fs';
import path from 'path';
import { discoverSets, scrapeSet } from './scraper.js';

/**
 * Scrape all sets for a given region
 */
async function scrapeAllSets(region = 'en') {
    console.log(`\n=== Discovering ${region.toUpperCase()} sets ===`);

    // Discover sets
    const setCodes = await discoverSets(region, true);
    console.log(`Found ${setCodes.length} set codes to scrape\n`);

    // Create output directory
    const outputDir = path.join('public', 'data', 'inprogress', 'int', region);
    fs.mkdirSync(outputDir, { recursive: true });

    // Scrape each set
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < setCodes.length; i++) {
        const setCode = setCodes[i];
        console.log(`\n[${i + 1}/${setCodes.length}] Scraping ${setCode}`);

        try {
            const setDir = path.join(outputDir, setCode);
            await scrapeSet(setCode, setDir);
            console.log(`✓ Saved to ${setDir}`);
            successCount++;

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 5));
        } catch (error) {
            console.error(`✗ Failed to scrape ${setCode}:`, error.message);
            failCount++;
        }
    }

    console.log(`\n=== ${region.toUpperCase()} Summary ===`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Total: ${setCodes.length}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage:');
    console.log('  Scrape all EN sets: node discover_and_scrape.js en');
    console.log('  Scrape all JP sets: node discover_and_scrape.js jp');
    console.log('  Scrape both: node discover_and_scrape.js all');
    process.exit(1);
}

const region = args[0].toLowerCase();

if (region === 'all') {
    scrapeAllSets('en')
        .then(() => scrapeAllSets('jp'))
        .catch(error => {
            console.error('Failed:', error.message);
            process.exit(1);
        });
} else if (region === 'en' || region === 'jp') {
    scrapeAllSets(region)
        .catch(error => {
            console.error('Failed:', error.message);
            process.exit(1);
        });
} else {
    console.error('Invalid region. Use: en, jp, or all');
    process.exit(1);
}
