import fs from 'fs';
import path from 'path';

/**
 * Combine individual card JSON files into a single set file
 */
function combineSet(setCode, region = 'en') {
    const inprogressDir = path.join('public', 'data', 'inprogress', 'int', region, setCode);
    const outputDir = path.join('public', 'data', 'int', region);
    const outputFile = path.join(outputDir, `${setCode}.json`);

    // Check if inprogress directory exists
    if (!fs.existsSync(inprogressDir)) {
        console.error(`Error: Directory not found: ${inprogressDir}`);
        process.exit(1);
    }

    // Read all JSON files from the inprogress directory
    const files = fs.readdirSync(inprogressDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
            // Sort by card number (extract number from filename like "PRE_42.json")
            const numA = parseInt(a.match(/_(\d+)\.json$/)?.[1] || '0');
            const numB = parseInt(b.match(/_(\d+)\.json$/)?.[1] || '0');
            return numA - numB;
        });

    if (files.length === 0) {
        console.error(`Error: No JSON files found in ${inprogressDir}`);
        process.exit(1);
    }

    console.log(`Found ${files.length} cards in ${setCode}`);

    // Read and combine all cards
    const cards = [];
    for (const file of files) {
        const filePath = path.join(inprogressDir, file);
        try {
            const cardData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            cards.push(cardData);
        } catch (error) {
            console.error(`Warning: Failed to read ${file}:`, error.message);
        }
    }

    // Create output directory if it doesn't exist
    fs.mkdirSync(outputDir, { recursive: true });

    // Write combined file
    fs.writeFileSync(outputFile, JSON.stringify(cards, null, 2));
    console.log(`✓ Combined ${cards.length} cards into ${outputFile}`);
}

/**
 * Combine all sets in the inprogress folder for a given region
 */
function combineAllSets(region = 'en') {
    const inprogressBase = path.join('public', 'data', 'inprogress', 'int', region);

    // Check if inprogress directory exists
    if (!fs.existsSync(inprogressBase)) {
        console.error(`Error: Directory not found: ${inprogressBase}`);
        process.exit(1);
    }

    // Get all set directories
    const setDirs = fs.readdirSync(inprogressBase)
        .filter(item => {
            const itemPath = path.join(inprogressBase, item);
            return fs.statSync(itemPath).isDirectory();
        });

    if (setDirs.length === 0) {
        console.error(`Error: No set directories found in ${inprogressBase}`);
        process.exit(1);
    }

    console.log(`Found ${setDirs.length} sets to combine\n`);

    let successCount = 0;
    let failCount = 0;

    for (const setCode of setDirs) {
        try {
            combineSet(setCode, region);
            successCount++;
        } catch (error) {
            console.error(`✗ Failed to combine ${setCode}:`, error.message);
            failCount++;
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Total: ${setDirs.length}`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('Usage:');
    console.log('  Combine single set: node combine_set.js <SET_CODE> [region]');
    console.log('  Combine all EN sets: node combine_set.js --all');
    console.log('  Combine all JP sets: node combine_set.js --all jp');
    console.log('\nExamples:');
    console.log('  node combine_set.js PRE');
    console.log('  node combine_set.js PRE jp');
    console.log('  node combine_set.js --all');
    console.log('  node combine_set.js --all jp');
    process.exit(1);
}

if (args[0] === '--all') {
    const region = args[1] || 'en';
    combineAllSets(region);
} else {
    const setCode = args[0];
    const region = args[1] || 'en';
    combineSet(setCode, region);
}
