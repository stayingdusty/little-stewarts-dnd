const sheet = document.querySelector('#sheet');

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const field = (label, value, strong = false) =>
  `<div class="field"><div class="label">${escapeHtml(label)}</div><div>${strong ? `<strong>${escapeHtml(value)}</strong>` : escapeHtml(value)}</div></div>`;

const stat = (label, value, modifier) =>
  `<div class="stat"><div class="label">${escapeHtml(label)}</div><div class="score">${escapeHtml(value)}</div><div class="modifier">Modifier: <span>${escapeHtml(modifier)}</span></div></div>`;

const miniValue = (label, value) =>
  `<div><b>${escapeHtml(label)}:</b><div class="mini">${escapeHtml(value)}</div></div>`;

const ability = (power) => `
  <div class="ability" data-power-card>
    <h3>${escapeHtml(power.name)}</h3>
    <p>${escapeHtml(power.description)}</p>
    <div class="ability-lines">${miniValue('Roll / Check', power.rollCheck)}${miniValue('Uses / Range', power.usesRange)}</div>
  </div>`;

const paddedRows = (items, length, blank) => {
  const rows = [...(items || [])];
  while (rows.length < length) rows.push(blank);
  return rows;
};

const balancePowers = () => {
  const page = sheet.querySelector('.page:first-child');
  const primary = page?.querySelector('[data-powers-primary]');
  const overflow = page?.querySelector('[data-powers-overflow]');
  const continuation = page?.querySelector('[data-powers-continuation]');
  const leftColumn = page?.querySelector('[data-page-one-left]');
  const rightColumn = page?.querySelector('[data-page-one-right]');

  if (!primary || !overflow || !continuation || !leftColumn || !rightColumn) return;

  primary.append(...overflow.querySelectorAll('[data-power-card]'));
  continuation.hidden = true;

  if (window.matchMedia('(max-width: 720px)').matches) return;

  let bestHeight = Math.max(leftColumn.scrollHeight, rightColumn.scrollHeight);
  const powerCards = [...primary.querySelectorAll('[data-power-card]')];

  for (let index = powerCards.length - 1; index > 0; index -= 1) {
    overflow.prepend(powerCards[index]);
    continuation.hidden = false;
    const candidateHeight = Math.max(leftColumn.scrollHeight, rightColumn.scrollHeight);

    if (candidateHeight >= bestHeight) {
      primary.append(powerCards[index]);
      break;
    }

    bestHeight = candidateHeight;
  }

  continuation.hidden = overflow.childElementCount === 0;
};

const attackRows = (attacks) => paddedRows(attacks, 5, { name: '', toHit: '', range: '', effect: '' }).map((attack) => `
  <div class="attack-row">
    <div><b>${escapeHtml(attack.name)}</b></div>
    <div class="cell">${escapeHtml(attack.toHit)}</div>
    <div class="cell">${escapeHtml(attack.range)}</div>
    <div class="cell">${escapeHtml(attack.effect)}</div>
  </div>`).join('');

const inventoryRows = (items) => paddedRows(items, 8, { name: '', quantity: '', charges: '' }).map((item) => `
  <div class="inventory-row">
    <div>${escapeHtml(item.name)}</div>
    <div>${escapeHtml(item.quantity)}</div>
    <div>${escapeHtml(item.charges)}</div>
  </div>`).join('');

const renderSheet = (character) => `
<section class="page">
  <header><h1 id="${escapeHtml(character.source?.anchor || character.id)}">${escapeHtml(character.name)}</h1><div class="subtitle">${escapeHtml(character.subtitle)}</div></header>
  <section class="identity">${field('Player', character.player, true)}${field('Character', character.name, true)}${field('Title / Role', character.title, true)}</section>
  <section class="identity second">${field('Species / Ancestry', character.species)}${field(character.spiritFormMovement ? 'Calvin Movement' : 'Movement', character.movement)}${field('Initiative', character.initiative)}${field('Level / Rank', character.levelRank)}</section>
  <div class="grid page-one-grid">
    <section data-page-one-left>
      <div class="card soft"><h2>Character Overview</h2><p>${escapeHtml(character.summary)}</p></div>
      <div class="card"><h2>Ability Scores &amp; Modifiers <span class="score-total">${escapeHtml(character.abilityPointTotal)}</span></h2><div class="stat-list">
        ${stat('Strength', character.abilityScores?.strength, character.abilityModifiers?.strength)}${stat('Dexterity', character.abilityScores?.dexterity, character.abilityModifiers?.dexterity)}${stat('Constitution', character.abilityScores?.constitution, character.abilityModifiers?.constitution)}${stat('Intelligence', character.abilityScores?.intelligence, character.abilityModifiers?.intelligence)}${stat('Wisdom', character.abilityScores?.wisdom, character.abilityModifiers?.wisdom)}${stat('Charisma', character.abilityScores?.charisma, character.abilityModifiers?.charisma)}
      </div></div>
      <div class="card"><h2>Powers &amp; Abilities</h2><div data-powers-primary>${(character.powers || []).map(ability).join('')}</div></div>
    </section>
    <aside data-page-one-right>
      <div class="card"><h2>Combat</h2><div class="combat-grid">
        <div class="combat-box"><div class="label">Current HP</div><div class="value">${escapeHtml(character.combat?.currentHp)}</div></div>
        <div class="combat-box"><div class="label">Maximum HP</div><div class="value">${escapeHtml(character.combat?.maximumHp)}</div></div>
        <div class="combat-box"><div class="label">Temporary HP</div><div class="value">${escapeHtml(character.combat?.temporaryHp)}</div></div>
        <div class="combat-box"><div class="label">Armor Class</div><div class="value">${escapeHtml(character.combat?.armorClass)}</div></div>
      </div></div>
      <div class="card"><h2>Modifier Boosts</h2><div class="choice-box large">${escapeHtml(character.modifierBoosts)}</div></div>
      <div class="card"><h2>External Bonds &amp; Relationships</h2><div class="choice-box medium">${escapeHtml(character.relationships)}</div></div>
      <div class="card"><h2>Special Rules &amp; Notes</h2><div class="choice-box large">${escapeHtml(character.specialRules)}</div></div>
      <div class="card powers-continuation" data-powers-continuation hidden><h2>Powers &amp; Abilities <span class="continued-label">continued</span></h2><div data-powers-overflow></div></div>
    </aside>
  </div>
  <div class="footer">Page 1 - Identity, statistics, combat values, modifiers, powers, and relationships</div>
</section>
<section class="page">
  <header><h1>${escapeHtml(character.name)}</h1><div class="subtitle">Attacks, Equipment, Inventory &amp; Session Notes</div></header>
  ${character.spiritFormMovement ? `<section class="form-details">${field('Spirit Form', character.spiritFormName, true)}${field(`${character.spiritFormName || 'Spirit Form'} Movement`, character.spiritFormMovement, true)}</section>` : ''}
  <div class="grid">
    <section>
      <div class="card"><h2>Attacks &amp; Damage / Healing Dice</h2><div class="attack-table"><div class="attack-header"><div>Attack / Action</div><div>To Hit</div><div>Range</div><div>Damage / HP Dice Combination</div></div>${attackRows(character.attacks)}</div><div class="damage-note">Write the complete combination, such as 2d8 + modifier, and note the damage, healing, or effect type.</div></div>
      <div class="card soft"><h2>Attack &amp; Power Rules</h2><div class="choice-box large">${escapeHtml(character.attackRules)}</div></div>
      <div class="card"><h2>Campaign Growth / Future Upgrades</h2><div class="choice-box large">${escapeHtml(character.futureUpgrades)}</div></div>
    </section>
    <aside>
      <div class="card"><h2>Equipped Items &amp; Inventory</h2><div class="inventory"><div class="inventory-head"><div>Item / Treasure</div><div>Qty.</div><div>Charges</div></div>${inventoryRows(character.inventory)}</div></div>
      <div class="card"><h2>Currency &amp; Resources</h2><div class="coins">
        <div class="coin"><div class="label">Gold</div><div>${escapeHtml(character.currency?.gold)}</div></div>
        <div class="coin"><div class="label">Silver</div><div>${escapeHtml(character.currency?.silver)}</div></div>
        <div class="coin"><div class="label">Copper</div><div>${escapeHtml(character.currency?.copper)}</div></div>
        <div class="coin"><div class="label">Other</div><div>${escapeHtml(character.currency?.other)}</div></div>
      </div><div class="choice-box"><b>Special Resources / Uses:</b><div>${escapeHtml(character.specialResources)}</div></div></div>
      <div class="card"><h2>Session Notes</h2><div class="choice-box large">${escapeHtml(character.sessionNotes)}</div></div>
    </aside>
  </div>
  <div class="footer">Page 2 - Attacks, dice combinations, equipment, inventory, resources, and campaign notes</div>
</section>`;

const loadCharacter = async () => {
  const response = await fetch('../data/characters.json', { cache: 'no-store' });
  const manifest = await response.json();
  const requestedAnchor = window.location.hash.replace(/^#/, '') || manifest[0]?.sourceAnchor;
  const entry = manifest.find((item) => item.sourceAnchor === requestedAnchor) || manifest[0];

  if (!entry) {
    sheet.innerHTML = '<section class="page"><h1>No character sheets found</h1></section>';
    return;
  }

  const characterResponse = await fetch(`../${entry.path}`, { cache: 'no-store' });
  const character = await characterResponse.json();
  document.title = `Character Sheet - ${character.name}`;
  sheet.innerHTML = renderSheet(character);
  balancePowers();
};

window.addEventListener('hashchange', loadCharacter);
window.addEventListener('beforeprint', balancePowers);
window.addEventListener('afterprint', balancePowers);
window.addEventListener('resize', balancePowers);
loadCharacter().catch((error) => {
  sheet.innerHTML = `<section class="page"><h1>Unable to load character sheet</h1><p>${escapeHtml(error.message)}</p></section>`;
});
