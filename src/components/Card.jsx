import React from 'react';
import './Card.css';

const Card = ({ cardData, colorMode, showCardArt, threshold, brightness = 1.0, saturation = 0.0, offsetX = 0, offsetY = 0, imageZoom = 1.0 }) => {
  
  if (!cardData) return null;

  const {
    name,
    supertype,
    subtypes = [],
    hp,
    types = [],
    evolvesFrom,
    abilities = [],
    attacks = [],
    weaknesses = [],
    resistances = [],
    retreatCost = [],
    rules = [],
    images = {},
  } = cardData;

  const energySymbolMap = {
    'Colorless': 'c',
    'Grass': 'g',
    'Fire': 'r',
    'Water': 'w',
    'Lightning': 'l',
    'Psychic': 'p',
    'Fighting': 'f',
    'Darkness': 'd',
    'Metal': 'm',
    'Dragon': 'n',
    'Fairy': 'y',
  };

  const renderEnergyCost = (cost = []) => {
    if (!cost || cost.length === 0) return null;
    return cost.map((energy, idx) => {
      const symbol = energySymbolMap[energy] || energy.charAt(0).toLowerCase();
      return <span key={idx} className={`energy-symbol energy-${symbol}`}>{symbol}</span>;
    });
  };

  const renderAttack = (attack, idx) => {
    const filteredText = attack.text?.replace(/\(You can't use more than 1 GX attack in a game\.\)/g, '').trim();
    
    return (
      <div key={idx} className="attack">
        <div className="attack-header">
          <span className="attack-cost">{renderEnergyCost(attack.cost)}</span>
          <span className="attack-name">{attack.name}</span>
          {attack.damage && <span className="attack-damage">{attack.damage}</span>}
        </div>
        {filteredText && (
          <div 
            className="attack-text" 
            style={{'--text-length': filteredText.length}}
          >
            {filteredText}
          </div>
        )}
      </div>
    );
  };

  const renderAbility = (ability, idx) => (
    <div key={idx} className="ability">
      <div className="ability-header">
        <span className="ability-type">{ability.type}:</span>
        <span className="ability-name">{ability.name}</span>
      </div>
      {ability.text && (
        <div 
          className="ability-text" 
          style={{'--text-length': ability.text.length}}
        >
          {ability.text}
        </div>
      )}
    </div>
  );

  const isAceSpec = subtypes.some(s => s === 'ACE SPEC');
  const cardTypeForColor = types.length > 0 ? types[0] : null;
  const isBasicEnergy = supertype === 'Energy' && subtypes.some(s => s === 'Basic');
  const isSpecialEnergy = supertype === 'Energy' && subtypes.some(s => s === 'Special');
  const isTagTeam = subtypes.some(s => s === 'TAG TEAM');
  
  return (
    <div className={`card ${colorMode ? 'color-mode' : ''}`} data-type={cardTypeForColor} data-ace-spec={isAceSpec}>
      <div className="card-header">
        <div className="card-title">
          <span className="card-name" style={{'--name-length': name.replace('Technical Machine:', 'TM:').length}}>
            {name.replace('Technical Machine:', 'TM:')}
          </span>
          {supertype === 'Pokémon' ? (
            hp && types.length > 0 && (
              <span className="card-hp">
                HP {hp} {types.map((t, idx) => {
                  const symbol = energySymbolMap[t] || t.charAt(0).toLowerCase();
                  return <span key={idx} className={`energy-symbol energy-${symbol}`}>{symbol}</span>;
                })}
              </span>
            )
          ) : (
            subtypes.length > 0 && (
              <span className="card-type">{subtypes[0].replace('Pokémon Tool', 'Tool')}</span>
            )
          )}
        </div>
      </div>

      {isBasicEnergy ? (
        <div className="basic-energy-symbol">
          {(() => {
            // Extract energy type from card name (e.g., "Fire Energy" -> "Fire")
            const energyType = name.replace(' Energy', '');
            const symbol = energySymbolMap[energyType] || energyType.charAt(0).toLowerCase();
            return <span className={`energy-symbol energy-${symbol}`}>{symbol}</span>;
          })()}
        </div>
      ) : (
        <div className={`card-art${isSpecialEnergy ? ' special-energy-art' : ''}${isTagTeam ? ' tag-team-art' : ''}`} data-trainer={supertype === 'Trainer' || supertype === 'Energy'} style={{'--threshold': threshold, '--brightness': brightness, '--saturation': saturation, '--offset-x': `${offsetX}px`, '--offset-y': `${offsetY}px`, '--image-zoom': imageZoom}}>
          {showCardArt && images.large && (
            <img 
              src={images.large} 
              alt={name}
            />
          )}
        {supertype === 'Pokémon' && (
          <>
            {subtypes.some(s => ['Ancient', 'Future'].includes(s)) && (
              <div className="card-art-overlay">
                {subtypes.filter(s => ['Ancient', 'Future'].includes(s)).join(', ')}
              </div>
            )}
            {(subtypes.some(s => ['Stage 1', 'Stage 2'].includes(s)) || evolvesFrom) && (
              <div className="card-art-evolution">
                {subtypes.find(s => ['Stage 1', 'Stage 2'].includes(s))?.replace('Stage ', 'S') || ''}
                {evolvesFrom && ` (${evolvesFrom})`}
              </div>
            )}
          </>
        )}
          {supertype !== 'Pokémon' && subtypes.length > 1 && (
            <div className="card-art-overlay">
              {subtypes.slice(1).map(s => s.replace('Pokémon Tool', 'Tool')).join(', ')}
            </div>
          )}
        </div>
      )}

      {rules.length > 0 && supertype !== 'Pokémon' && (() => {
        const ruleText = rules[0];
        
        const renderRuleWithEnergySymbols = (text) => {
          // Replace energy type names with symbols
          const parts = [];
          let lastIndex = 0;
          const energyPattern = /\b(Colorless|Grass|Fire|Water|Lightning|Psychic|Fighting|Darkness|Metal|Dragon|Fairy) Energy\b/g;
          let match;
          
          while ((match = energyPattern.exec(text)) !== null) {
            if (match.index > lastIndex) {
              parts.push(text.substring(lastIndex, match.index));
            }
            const energyType = match[1];
            const symbol = energySymbolMap[energyType] || energyType.charAt(0).toLowerCase();
            parts.push(
              <span key={match.index} className={`energy-symbol energy-${symbol}`}>{symbol}</span>
            );
            lastIndex = match.index + match[0].length;
          }
          
          if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
          }
          
          return parts.length > 0 ? parts : text;
        };
        
        return (
          <div className="rules-section" style={{'--total-text-length': ruleText.length}}>
            <div className="rule-text">
              {renderRuleWithEnergySymbols(ruleText)}
            </div>
          </div>
        );
      })()}

      {abilities.length > 0 && (
        <div className="abilities-section">
          {abilities.map(renderAbility)}
        </div>
      )}

      {attacks.length > 0 && (
        <div className="attacks-section">
          {attacks.map(renderAttack)}
        </div>
      )}

      {supertype === 'Pokémon' && (
        <div className="card-footer">
          {rules.length > 0 && (
            <div className="rule-box">
              <strong>
                RULE BOX: {subtypes.includes('VMAX') ? '3 Prize, VMAX' :
                           subtypes.includes('VUNION') ? '3 Prize, VUNION' :
                           subtypes.includes('MEGA') && subtypes.includes('ex') ? '3 Prize, Mega ex' :
                           subtypes.includes('ex') ? '2 Prize, ex' : 
                           subtypes.includes('V') ? '2 Prize, V' :
                           subtypes.includes('VSTAR') ? '2 Prize, VSTAR' :
                           'Special'}
              </strong>
            </div>
          )}
          <div className="footer-line">
            <span>
              Weak: {weaknesses.length > 0 ? (
                weaknesses.map((w, i) => {
                  const symbol = energySymbolMap[w.type] || w.type.charAt(0).toLowerCase();
                  return (
                    <span key={i}>
                      <span className={`energy-symbol energy-${symbol}`}>{symbol}</span>
                      {w.value}
                      {i < weaknesses.length - 1 ? ', ' : ''}
                    </span>
                  );
                })
              ) : '-'}
            </span>
            <span> | </span>
            <span>
              Res: {resistances.length > 0 ? (
                resistances.map((r, i) => {
                  const symbol = energySymbolMap[r.type] || r.type.charAt(0).toLowerCase();
                  return (
                    <span key={i}>
                      <span className={`energy-symbol energy-${symbol}`}>{symbol}</span>
                      {r.value}
                      {i < resistances.length - 1 ? ', ' : ''}
                    </span>
                  );
                })
              ) : '-'}
            </span>
            <span> | </span>
            <span>
              Retreat: {retreatCost.length > 0 ? renderEnergyCost(retreatCost) : '-'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
