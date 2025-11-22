import React, { useState, useEffect } from 'react';
import Card from './components/Card';
import { parseDecklist, getSetId, fetchCardData, initializeSetCodeMap } from './utils/cardParser';
import './App.css';

function App() {
  const [decklistText, setDecklistText] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [colorMode, setColorMode] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-colorMode');
    return saved === 'true';
  });
  const [showCardArt, setShowCardArt] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-showCardArt');
    return saved === 'true';
  });
  const [showControls, setShowControls] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-showControls');
    return saved === 'true';
  });
  const [ignoreBasicEnergy, setIgnoreBasicEnergy] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-ignoreBasicEnergy');
    return saved === 'true';
  });

  const [cardReplacements, setCardReplacements] = useState({});
  const [cardThresholds, setCardThresholds] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-cardThresholds');
    return saved ? JSON.parse(saved) : {};
  });

  const [cardBrightness, setCardBrightness] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-cardBrightness');
    return saved ? JSON.parse(saved) : {};
  });

  const [cardSaturation, setCardSaturation] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-cardSaturation');
    return saved ? JSON.parse(saved) : {};
  });

  // Color mode separate filters
  const [cardThresholdsColor, setCardThresholdsColor] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-cardThresholdsColor');
    return saved ? JSON.parse(saved) : {};
  });

  const [cardBrightnessColor, setCardBrightnessColor] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-cardBrightnessColor');
    return saved ? JSON.parse(saved) : {};
  });

  const [cardSaturationColor, setCardSaturationColor] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-cardSaturationColor');
    return saved ? JSON.parse(saved) : {};
  });

  const [cardOffsets, setCardOffsets] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-cardOffsets');
    return saved ? JSON.parse(saved) : {};
  });

  const [cardZoomScales, setCardZoomScales] = useState(() => {
    const saved = localStorage.getItem('pokeproxy-cardZoomScales');
    return saved ? JSON.parse(saved) : {};
  });

  const [expandedSections, setExpandedSections] = useState({
    howTo: false,
    why: false,
    knownIssues: false,
    report: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Initialize set code map on component mount
  useEffect(() => {
    initializeSetCodeMap();
  }, []);

  // Save color mode preference
  useEffect(() => {
    localStorage.setItem('pokeproxy-colorMode', colorMode);
  }, [colorMode]);

  // Save card art preference
  useEffect(() => {
    localStorage.setItem('pokeproxy-showCardArt', showCardArt);
  }, [showCardArt]);

  // Save controls visibility preference
  useEffect(() => {
    localStorage.setItem('pokeproxy-showControls', showControls);
  }, [showControls]);

  // Save ignore basic energy preference
  useEffect(() => {
    localStorage.setItem('pokeproxy-ignoreBasicEnergy', ignoreBasicEnergy);
  }, [ignoreBasicEnergy]);

  // Save per-card thresholds
  useEffect(() => {
    localStorage.setItem('pokeproxy-cardThresholds', JSON.stringify(cardThresholds));
  }, [cardThresholds]);

  useEffect(() => {
    localStorage.setItem('pokeproxy-cardBrightness', JSON.stringify(cardBrightness));
  }, [cardBrightness]);

  useEffect(() => {
    localStorage.setItem('pokeproxy-cardSaturation', JSON.stringify(cardSaturation));
  }, [cardSaturation]);

  useEffect(() => {
    localStorage.setItem('pokeproxy-cardThresholdsColor', JSON.stringify(cardThresholdsColor));
  }, [cardThresholdsColor]);

  useEffect(() => {
    localStorage.setItem('pokeproxy-cardBrightnessColor', JSON.stringify(cardBrightnessColor));
  }, [cardBrightnessColor]);

  useEffect(() => {
    localStorage.setItem('pokeproxy-cardSaturationColor', JSON.stringify(cardSaturationColor));
  }, [cardSaturationColor]);

  useEffect(() => {
    localStorage.setItem('pokeproxy-cardOffsets', JSON.stringify(cardOffsets));
  }, [cardOffsets]);

  useEffect(() => {
    localStorage.setItem('pokeproxy-cardZoomScales', JSON.stringify(cardZoomScales));
  }, [cardZoomScales]);

  const updateCardThreshold = (setCode, cardNumber, value) => {
    const cardKey = `${setCode}/${cardNumber}`;
    setCardThresholds(prev => ({
      ...prev,
      [cardKey]: value
    }));
  };

  const getCardThreshold = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardThresholds[cardKey] || 1.0;
  };

  const updateCardBrightness = (setCode, cardNumber, value) => {
    const cardKey = `${setCode}/${cardNumber}`;
    setCardBrightness(prev => ({
      ...prev,
      [cardKey]: value
    }));
  };

  const getCardBrightness = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardBrightness[cardKey] || 1.0;
  };

  const updateCardSaturation = (setCode, cardNumber, value) => {
    const cardKey = `${setCode}/${cardNumber}`;
    setCardSaturation(prev => ({
      ...prev,
      [cardKey]: value
    }));
  };

  const getCardSaturation = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardSaturation[cardKey] || 0.0;
  };

  // Color mode filter functions
  const updateCardThresholdColor = (setCode, cardNumber, value) => {
    const cardKey = `${setCode}/${cardNumber}`;
    setCardThresholdsColor(prev => ({
      ...prev,
      [cardKey]: value
    }));
  };

  const getCardThresholdColor = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardThresholdsColor[cardKey] || 1.0;
  };

  const updateCardBrightnessColor = (setCode, cardNumber, value) => {
    const cardKey = `${setCode}/${cardNumber}`;
    setCardBrightnessColor(prev => ({
      ...prev,
      [cardKey]: value
    }));
  };

  const getCardBrightnessColor = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardBrightnessColor[cardKey] || 1.0;
  };

  const updateCardSaturationColor = (setCode, cardNumber, value) => {
    const cardKey = `${setCode}/${cardNumber}`;
    setCardSaturationColor(prev => ({
      ...prev,
      [cardKey]: value
    }));
  };

  const getCardSaturationColor = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardSaturationColor[cardKey] || 1.0;
  };

  const updateCardReplacement = (setCode, cardNumber, replacementValue) => {
    const cardKey = `${setCode}/${cardNumber}`;
    if (!replacementValue || replacementValue === '') {
      // Remove replacement if empty
      setCardReplacements(prev => {
        const newReplacements = { ...prev };
        delete newReplacements[cardKey];
        return newReplacements;
      });
    } else {
      setCardReplacements(prev => ({
        ...prev,
        [cardKey]: replacementValue
      }));
    }
  };

  const getCardReplacement = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardReplacements[cardKey] || '';
  };

  const updateCardOffset = (setCode, cardNumber, offsetX, offsetY) => {
    const cardKey = `${setCode}/${cardNumber}`;
    setCardOffsets(prev => ({
      ...prev,
      [cardKey]: { x: offsetX, y: offsetY }
    }));
  };

  const getCardOffset = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardOffsets[cardKey] || { x: 0, y: 0 };
  };

  const updateCardZoomScale = (setCode, cardNumber, scale) => {
    const cardKey = `${setCode}/${cardNumber}`;
    setCardZoomScales(prev => ({
      ...prev,
      [cardKey]: Math.max(0.01, Math.min(3.0, scale))
    }));
  };

  const getCardZoomScale = (setCode, cardNumber) => {
    const cardKey = `${setCode}/${cardNumber}`;
    return cardZoomScales[cardKey] || 1.0;
  };

  const handleGenerate = async () => {
    setErrors([]);
    setLoading(true);
    setCards([]);

    try {
      const parsedCards = parseDecklist(decklistText);
      
      if (parsedCards.length === 0) {
        setErrors(['No valid cards found in decklist. Format: "Munkidori TWM 95" or "4 Munkidori TWM 95"']);
        setLoading(false);
        return;
      }

      const cardDataPromises = [];
      const cardMetadata = [];

      for (const card of parsedCards) {
        const cardKey = `${card.setCode}/${card.cardNumber}`;
        const replacement = cardReplacements[cardKey];
        
        // Check if there's a replacement for this card
        let targetSetCode = card.setCode;
        let targetCardNumber = card.cardNumber;
        
        if (replacement) {
          // Parse replacement format: "SFA 72", "SFA/72", or "SFA72"
          const replacementMatch = replacement.trim().match(/([A-Z]+)[\s\/]*([\d]+[a-z]?)/i);
          if (replacementMatch) {
            targetSetCode = replacementMatch[1].toUpperCase();
            targetCardNumber = replacementMatch[2];
          } else {
            setErrors(prev => [...prev, `Warning: Invalid replacement format "${replacement}" for ${cardKey}`]);
          }
        }
        
        const setId = getSetId(targetSetCode);
        
        if (!setId) {
          // If setId not found in API map, still try to fetch (will fallback to local data)
        }

        // Fetch each card once, then duplicate based on count
        // Pass both setId (for API) and targetSetCode (for local fallback)
        for (let i = 0; i < card.count; i++) {
          cardDataPromises.push(fetchCardData(setId, targetCardNumber, targetSetCode));
          cardMetadata.push({ setCode: targetSetCode, cardNumber: targetCardNumber });
        }
      }

      const cardDataResults = await Promise.allSettled(cardDataPromises);
      
      // Filter successful cards and collect errors
      const cardsWithMetadata = [];
      const fetchErrors = [];
      
      cardDataResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          cardsWithMetadata.push({
            ...result.value,
            _setCode: cardMetadata[idx].setCode
          });
        } else {
          const errorMsg = `Failed to load ${cardMetadata[idx].setCode}/${cardMetadata[idx].cardNumber}: ${result.reason.message}`;
          fetchErrors.push(errorMsg);
        }
      });
      
      if (fetchErrors.length > 0) {
        setErrors(fetchErrors);
      }
      
      setCards(cardsWithMetadata);
      
      // Update decklist text with replacements
      const updatedLines = [];
      const processedCards = new Map();
      
      for (const card of parsedCards) {
        const cardKey = `${card.setCode}/${card.cardNumber}`;
        const replacement = cardReplacements[cardKey];
        
        if (!processedCards.has(cardKey)) {
          let displaySetCode = card.setCode;
          let displayCardNumber = card.cardNumber;
          
          if (replacement) {
            const replacementMatch = replacement.trim().match(/([A-Z]+)[\s\/]+([\d]+[a-z]?)/i);
            if (replacementMatch) {
              displaySetCode = replacementMatch[1].toUpperCase();
              displayCardNumber = replacementMatch[2];
            }
          }
          
          updatedLines.push(`${card.count} ${card.name} ${displaySetCode} ${displayCardNumber}`);
          processedCards.set(cardKey, true);
        }
      }
      
      if (updatedLines.length > 0) {
        setDecklistText(updatedLines.join('\n'));
      }
      
      // Clear all replacement fields after successful generation
      setCardReplacements({});
      
    } catch (err) {
      setErrors([`Error: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exampleDecklist = `4 Munkidori TWM 95
3 Sinistcha ex TWM 23
2 Poltchageist TWM 20
1 Fezandipiti TWM 96`;

  return (
    <div className="app">
      <div className="beta-triangle no-print">
        <span>BETA</span>
      </div>
      <header className="app-header no-print">
        <h2>💰 Pokemon TCG Low-Ink Proxy Generator</h2>
      </header>

      <div className="main-content">
        <div className="input-section no-print">
        <div className="accordion-section">
          <div className="accordion-item">
            <button className="accordion-header" onClick={() => toggleSection('howTo')}>
              <span>📖 How to use</span>
              <span className="accordion-icon">{expandedSections.howTo ? '−' : '+'}</span>
            </button>
            {expandedSections.howTo && (
              <div className="accordion-content open">
                <div>
                <ol>
                  <li>Enter your decklist with format: <code>CardName SET NUMBER</code></li>
                  <li>Optionally add quantity: <code>4 CardName SET NUMBER</code></li>
                  <li>Click "Generate Proxies"</li>
                  <li>Adjust filters and position for each card if needed</li>
                  <li>Change it with the full art version for better art</li>
                  <li>Click "Print Cards" to print</li>
                </ol>
                </div>
              </div>
            )}
          </div>

          <div className="accordion-item">
            <button className="accordion-header" onClick={() => toggleSection('why')}>
              <span>💜 About</span>
              <span className="accordion-icon">{expandedSections.why ? '−' : '+'}</span>
            </button>
            {expandedSections.why && (
              <div className="accordion-content open">
                <div>
                <p>I was trying to print Fezandipiti ex for proxy, in black and white, it was unreadable. Also, my printer took 15 minutes to get all the pngs over the network.</p>
                <p>I found some tools but those weren't up to date.</p>
                <p>So I decided to make a tool that would help me generate proxies faster and more readable and also uses less ink.</p>
                <p>This tool gets the card list online, so even if i don't update everything will stay up to date.</p>
                <br/>
                <p>Full closure.</p>
                <p>Even though I am a software engineer, I literally wrote 0 lines of this code.</p>
                <p>It is vibe coded.</p>
                </div>
              </div>
            )}
          </div>

          <div className="accordion-item">
            <button className="accordion-header" onClick={() => toggleSection('knownIssues')}>
              <span>⚠️ Known Issues</span>
              <span className="accordion-icon">{expandedSections.knownIssues ? '−' : '+'}</span>
            </button>
            {expandedSections.knownIssues && (
              <div className="accordion-content open">
                <div>
                <p><strong>Current known issues and limitations:</strong></p>
                <ul>
                  <li>Card size is not verified. Don't print</li>
                  <li>Text re-sizing is inconsistent, It needs to be smarter with respect to other content on the card.</li>
                  <li>Some set's data are missing, I'm trying to solve it before release.</li>
                  <li>Some cards are going over border</li>
                  <li>Different Languages are not supported, I'm working on that.</li>
                  <li>Celebrations set is not getting detected</li>
                </ul>
                <p><em>We're actively working on these issues. Check back for updates!</em></p>
                </div>
              </div>
            )}
          </div>

          <div className="accordion-item">
            <button className="accordion-header" onClick={() => toggleSection('report')}>
              <span>🐛 Report Issues / Feedback</span>
              <span className="accordion-icon">{expandedSections.report ? '−' : '+'}</span>
            </button>
            {expandedSections.report && (
              <div className="accordion-content open">
                <div>
                <p><strong>Found a bug or have a feature request?</strong></p>
                <p>You can reach out through any of these channels:</p>
                <ul>
                  <li>🐙 <strong>GitHub Issues:</strong> <a href="https://github.com/alchemistake/pokeproxy/issues" target="_blank" rel="noopener noreferrer">github.com/alchemistake/pokeproxy/issues</a></li>
                  <li>🐦 <strong>Twitter:</strong> <a href="https://twitter.com/alchemistake" target="_blank" rel="noopener noreferrer">@alchemistake</a></li>
                </ul>
                <p>Please include:</p>
                <ul>
                  <li>What you were trying to do</li>
                  <li>What went wrong</li>
                  <li>Browser and OS (if relevant)</li>
                  <li>Example card or decklist that caused the issue</li>
                </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="decklist">
            📝 Enter your decklist
          </label>
          <textarea
            id="decklist"
            value={decklistText}
            onChange={(e) => setDecklistText(e.target.value)}
            placeholder={`Format examples:\nMunkidori TWM 95\n4 Sinistcha ex TWM 23\n\n${exampleDecklist}`}
            rows={15}
          />
          <div className="button-group">
            <button onClick={handleGenerate} disabled={loading || !decklistText.trim()} className="generate-btn">
              {loading ? '⏳ Generating...' : '💫 Generate Proxies'}
            </button>
            {cards.length > 0 && (
              <button onClick={handlePrint} className="print-button">
                🖨️ Print Cards
              </button>
            )}
          </div>
          
          <div className="toggles-compact">
            <div className="toggle-item">
              <label>
                <input 
                  type="checkbox" 
                  checked={colorMode} 
                  onChange={(e) => setColorMode(e.target.checked)}
                />
                <span className="toggle-switch"></span>
                <span>Color</span>
              </label>
            </div>
            <div className="toggle-item">
              <label>
                <input 
                  type="checkbox" 
                  checked={showCardArt} 
                  onChange={(e) => setShowCardArt(e.target.checked)}
                />
                <span className="toggle-switch"></span>
                <span>Card Art</span>
              </label>
            </div>
            {showCardArt && (
              <>
                <div className="toggle-item">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={showControls} 
                      onChange={(e) => setShowControls(e.target.checked)}
                    />
                    <span className="toggle-switch"></span>
                    <span>Controls</span>
                  </label>
                </div>
                <div className="toggle-item">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={ignoreBasicEnergy} 
                      onChange={(e) => setIgnoreBasicEnergy(e.target.checked)}
                    />
                    <span className="toggle-switch"></span>
                    <span>Hide Basic Energy</span>
                  </label>
                </div>
              </>
            )}
          </div>

        </div>

        {errors.length > 0 && (
          <div className="error-message">
            <ul>
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        </div>

        {cards.length > 0 && (
          <div className="cards-container">
            <div className="cards-info no-print">
              <p>Generated {cards.length} card(s). Ready to print!</p>
            </div>
            <div className="cards-grid">
              {cards.map((card, idx) => {
                const cardKey = `${card.id}-${idx}`;
                const setCode = card._setCode || 'UNKNOWN';
                const cardNumber = card.number;
                
                // Check if this is a basic energy card and should be hidden
                const isBasicEnergy = card.supertype === 'Energy' && card.subtypes?.includes('Basic');
                if (ignoreBasicEnergy && isBasicEnergy) {
                  return null;
                }
                
                // Get appropriate filter values based on color mode
                const threshold = colorMode ? getCardThresholdColor(setCode, cardNumber) : getCardThreshold(setCode, cardNumber);
                const brightness = colorMode ? getCardBrightnessColor(setCode, cardNumber) : getCardBrightness(setCode, cardNumber);
                const saturation = colorMode ? getCardSaturationColor(setCode, cardNumber) : getCardSaturation(setCode, cardNumber);
                const offset = getCardOffset(setCode, cardNumber);
                const imageZoom = getCardZoomScale(setCode, cardNumber);
                
                return (
                  <div key={cardKey} className="card-with-controls">
                    <Card 
                      cardData={card} 
                      colorMode={colorMode} 
                      showCardArt={showCardArt} 
                      threshold={threshold}
                      brightness={brightness}
                      saturation={saturation}
                      offsetX={offset.x}
                      offsetY={offset.y}
                      imageZoom={imageZoom}
                    />
                    {showCardArt && showControls && (
                      <div className="card-controls no-print">
                        <div className="card-controls-header">
                          {colorMode ? '(Color)' : '(B&W)'}
                          <span>
                            <a 
                              href={`https://limitlesstcg.com/cards/${setCode}/${cardNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on LimitlessTCG"
                            >
                              {setCode}/{cardNumber} ↗
                            </a>
                          </span>
                          <button 
                            className="reset-button"
                            onClick={() => {
                              if (colorMode) {
                                updateCardThresholdColor(setCode, cardNumber, 1.0);
                                updateCardBrightnessColor(setCode, cardNumber, 1.0);
                                updateCardSaturationColor(setCode, cardNumber, 1.0);
                              } else {
                                updateCardThreshold(setCode, cardNumber, 1.0);
                                updateCardBrightness(setCode, cardNumber, 1.0);
                                updateCardSaturation(setCode, cardNumber, 0.0);
                              }
                            }}
                            title="Reset filters to default"
                          >
                            Reset
                          </button>
                        </div>
                        <div className="replacement-field">
                          <input
                            type="text"
                            placeholder="Replace with: e.g. SFA 72"
                            value={getCardReplacement(setCode, cardNumber)}
                            onChange={(e) => updateCardReplacement(setCode, cardNumber, e.target.value)}
                            onKeyDown={(e) => {
                              // Stop propagation to prevent any parent handlers from blocking space
                              e.stopPropagation();
                            }}
                            onKeyPress={(e) => {
                              // Stop propagation on keypress as well
                              e.stopPropagation();
                            }}
                            onKeyUp={(e) => {
                              e.stopPropagation();
                              // Enter to regenerate
                              if (e.key === 'Enter') {
                                handleGenerate();
                              }
                            }}
                            title="Enter set code and number (e.g. SFA 72) to use different artwork. Press Enter to regenerate."
                          />
                          <button
                            className="regenerate-button"
                            onClick={handleGenerate}
                            title="Regenerate proxies with replacements"
                            disabled={loading}
                          >
                            ↻
                          </button>
                        </div>
                        <label>
                          Contrast: {threshold.toFixed(1)}x
                          <input
                            type="range"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            value={threshold}
                            onChange={(e) => colorMode ? 
                              updateCardThresholdColor(setCode, cardNumber, parseFloat(e.target.value)) :
                              updateCardThreshold(setCode, cardNumber, parseFloat(e.target.value))}
                          />
                        </label>
                        <label>
                          Brightness: {brightness.toFixed(1)}x
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={brightness}
                            onChange={(e) => colorMode ?
                              updateCardBrightnessColor(setCode, cardNumber, parseFloat(e.target.value)) :
                              updateCardBrightness(setCode, cardNumber, parseFloat(e.target.value))}
                          />
                        </label>
                        {colorMode && (
                          <label>
                            Saturation: {saturation.toFixed(1)}x
                            <input
                              type="range"
                              min="0.0"
                              max="2.0"
                              step="0.1"
                              value={saturation}
                              onChange={(e) => updateCardSaturationColor(setCode, cardNumber, parseFloat(e.target.value))}
                            />
                          </label>
                        )}
                        <div className="offset-controls">
                          <label>Position & Zoom ({(imageZoom * 100).toFixed(0)}%)</label>
                          <div className="offset-buttons">
                            <button onClick={() => updateCardOffset(setCode, cardNumber, offset.x, offset.y - 1)} title="Move Up">⬆️</button>
                            <button onClick={() => updateCardOffset(setCode, cardNumber, offset.x, offset.y + 1)} title="Move Down">⬇️</button>
                            <button onClick={() => { updateCardOffset(setCode, cardNumber, 0, 0); updateCardZoomScale(setCode, cardNumber, 1.0); }} title="Reset Position & Zoom">0️⃣</button>
                            <button onClick={() => updateCardOffset(setCode, cardNumber, offset.x - 1, offset.y)} title="Move Left">⬅️</button>
                            <button onClick={() => updateCardOffset(setCode, cardNumber, offset.x + 1, offset.y)} title="Move Right">➡️</button>
                            <button onClick={() => updateCardZoomScale(setCode, cardNumber, imageZoom - 0.01)} title="Zoom Out">➖</button>
                            <button onClick={() => updateCardZoomScale(setCode, cardNumber, imageZoom + 0.01)} title="Zoom In">➕</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
