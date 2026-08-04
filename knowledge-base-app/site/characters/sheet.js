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

const stat = (label, value) =>
  `<div class="stat"><div class="label">${escapeHtml(label)}</div><div class="score">${escapeHtml(value)}</div><div class="modifier">Modifier: <span></span></div></div>`;

const miniValue = (label, value) =>
  `<div><b>${escapeHtml(label)}:</b><div class="mini">${escapeHtml(value)}</div></div>`;

const ability = (power) => `
  <div class="ability">
    <h3>${escapeHtml(power.name)}</h3>
    <p>${escapeHtml(power.description)}</p>
    <div class="ability-lines">${miniValue('Roll / Check', power.rollCheck)}${miniValue('Uses / Range', power.usesRange)}</div>
  </div>`;

const paddedRows = (items, length, blank) => {
  const rows = [...(items || [])];
  while (rows.length < length) rows.push(blank);
  return rows;
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
  <section class="identity second">${field('Species / Ancestry', character.species)}${field('Movement', character.movement)}${field('Initiative', character.initiative)}${field('Level / Rank', character.levelRank)}</section>
  <div class="grid">
    <section>
      <div class="card soft"><h2>Character Overview</h2><p>${escapeHtml(character.summary)}</p></div>
      <div class="card"><h2>Ability Scores &amp; Modifiers <span class="score-total">${escapeHtml(character.abilityPointTotal)}</span></h2><div class="stat-list">
        ${stat('Strength', character.abilityScores?.strength)}${stat('Dexterity', character.abilityScores?.dexterity)}${stat('Constitution', character.abilityScores?.constitution)}${stat('Intelligence', character.abilityScores?.intelligence)}${stat('Wisdom', character.abilityScores?.wisdom)}${stat('Charisma', character.abilityScores?.charisma)}
      </div></div>
      <div class="card"><h2>Powers &amp; Abilities</h2>${(character.powers || []).map(ability).join('')}</div>
    </section>
    <aside>
      <div class="card"><h2>Combat</h2><div class="combat-grid">
        <div class="combat-box"><div class="label">Current HP</div><div class="value">${escapeHtml(character.combat?.currentHp)}</div></div>
        <div class="combat-box"><div class="label">Maximum HP</div><div class="value">${escapeHtml(character.combat?.maximumHp)}</div></div>
        <div class="combat-box"><div class="label">Temporary HP</div><div class="value">${escapeHtml(character.combat?.temporaryHp)}</div></div>
        <div class="combat-box"><div class="label">Armor Class</div><div class="value">${escapeHtml(character.combat?.armorClass)}</div></div>
      </div></div>
      <div class="card"><h2>Modifier Boosts</h2><div class="choice-box large"></div></div>
      <div class="card"><h2>External Bonds &amp; Relationships</h2><div class="choice-box medium">${escapeHtml(character.relationships)}</div></div>
      <div class="card"><h2>Special Rules &amp; Notes</h2><div class="choice-box large">${escapeHtml(character.specialRules)}</div></div>
    </aside>
  </div>
  <div class="footer">Page 1 - Identity, statistics, combat values, modifiers, powers, and relationships</div>
</section>
<section class="page">
  <header><h1>${escapeHtml(character.name)}</h1><div class="subtitle">Attacks, Equipment, Inventory &amp; Session Notes</div></header>
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
};

window.addEventListener('hashchange', loadCharacter);
loadCharacter().catch((error) => {
  sheet.innerHTML = `<section class="page"><h1>Unable to load character sheet</h1><p>${escapeHtml(error.message)}</p></section>`;
});
