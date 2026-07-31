const saveKey = 'catch-of-the-day-save-v1'

const spots = [
  { id: 'meadow', name: 'Willow Pond', cost: 0, color: '#3e9ac4', sky: '#bfe6ef', description: 'A peaceful pond full of starter fish.' },
  { id: 'river', name: 'Sunstone River', cost: 250, color: '#237b92', sky: '#f5c978', description: 'Fast water hides uncommon and rare catches.' },
  { id: 'lake', name: 'Moonlit Lake', cost: 1200, color: '#294f87', sky: '#322b66', description: 'A deep lake where legendary fish may surface.' },
]

const fish = [
  { name: 'Pond Minnow', rarity: 'common', value: 8, spots: ['meadow', 'river'] },
  { name: 'Golden Carp', rarity: 'uncommon', value: 28, spots: ['meadow', 'river'] },
  { name: 'River Trout', rarity: 'rare', value: 75, spots: ['river', 'lake'] },
  { name: 'Moon Koi', rarity: 'epic', value: 220, spots: ['lake'] },
  { name: 'Crownfin', rarity: 'legendary', value: 900, spots: ['lake'] },
]

const gear = [
  { id: 'bobber', name: 'Silver Bobber', type: 'Bobber', cost: 100, bonus: 1, description: 'Makes uncommon fish bite more often.' },
  { id: 'hook', name: 'Barbed Hook', type: 'Hook', cost: 350, bonus: 1, description: 'Improves your chance of rare fish.' },
  { id: 'pole', name: 'Starwood Pole', type: 'Pole', cost: 900, bonus: 1, description: 'Reaches deeper water for epic catches.' },
]

const defaultState = { coins: 0, caught: 0, unlocked: ['meadow'], spot: 'meadow', gear: {}, collection: {}, best: null }
let state = load()
let fishing = false
let message = 'Cast your line to start fishing.'

function load() {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(saveKey)), gear: JSON.parse(localStorage.getItem(saveKey))?.gear || {}, collection: JSON.parse(localStorage.getItem(saveKey))?.collection || {} } }
  catch { return { ...defaultState } }
}

function save() { localStorage.setItem(saveKey, JSON.stringify(state)) }
function currentSpot() { return spots.find((spot) => spot.id === state.spot) }
function rarityWeight(rarity) {
  const upgrades = Object.keys(state.gear).length
  const weights = { common: 66 - upgrades * 9, uncommon: 24 + upgrades * 4, rare: 8 + upgrades * 3, epic: 1.8 + upgrades * 1.5, legendary: 0.2 + upgrades * 0.5 }
  return weights[rarity]
}

function chooseFish() {
  const pool = fish.filter((entry) => entry.spots.includes(state.spot))
  const weighted = pool.map((entry) => ({ entry, weight: rarityWeight(entry.rarity) }))
  const total = weighted.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const item of weighted) { roll -= item.weight; if (roll <= 0) return item.entry }
  return weighted[0].entry
}

function cast() {
  if (fishing) return
  fishing = true
  message = 'Line cast... wait for a bite!'
  render()
  window.setTimeout(() => {
    const catchFish = chooseFish()
    state.coins += catchFish.value
    state.caught += 1
    state.collection[catchFish.name] = (state.collection[catchFish.name] || 0) + 1
    if (!state.best || catchFish.value > state.best.value) state.best = catchFish
    message = `Caught a ${catchFish.rarity} ${catchFish.name}! +${catchFish.value} coins`
    fishing = false
    save()
    render()
  }, 900 + Math.random() * 1200)
}

function buyGear(id) {
  const item = gear.find((entry) => entry.id === id)
  if (state.gear[id]) return
  if (state.coins < item.cost) { message = `You need ${item.cost - state.coins} more coins for the ${item.name}.`; render(); return }
  state.coins -= item.cost
  state.gear[id] = true
  message = `${item.name} equipped! Your rare-fish odds improved.`
  save()
  render()
}

function selectSpot(id) {
  const spot = spots.find((entry) => entry.id === id)
  if (!state.unlocked.includes(id)) {
    if (state.coins < spot.cost) { message = `${spot.name} costs ${spot.cost} coins to unlock.`; render(); return }
    state.coins -= spot.cost
    state.unlocked.push(id)
    message = `${spot.name} unlocked!`
  } else message = `Travelled to ${spot.name}.`
  state.spot = id
  save()
  render()
}

function resetGame() {
  if (!window.confirm('Start over? This removes your fishing progress on this browser.')) return
  state = { ...defaultState }
  save()
  message = 'Fresh tackle, fresh water. Cast your line!'
  render()
}

function render() {
  const spot = currentSpot()
  document.title = 'Catch of the Day'
  document.body.innerHTML = `
    <main class="fishing-app">
      <header class="topbar">
        <div><p class="kicker">RELAXING FISHING ADVENTURE</p><h1>Catch of the Day</h1></div>
        <div class="stats"><div><span>COINS</span><strong>🪙 ${state.coins}</strong></div><div><span>CAUGHT</span><strong>🎣 ${state.caught}</strong></div><div><span>BEST CATCH</span><strong>${state.best ? state.best.name : '—'}</strong></div></div>
      </header>
      <section class="game-layout">
        <section class="water-card" style="--water:${spot.color};--sky:${spot.sky}">
          <div class="scene" id="scene"><div class="sun"></div><div class="hills hills-one"></div><div class="hills hills-two"></div><div class="water"><span class="ripple one"></span><span class="ripple two"></span><span class="bobber ${fishing ? 'casting' : ''}">🔴</span></div><div class="dock">🪵</div><div class="angler">🎣</div></div>
          <div class="spot-caption"><p class="kicker">CURRENT FISHING SPOT</p><h2>${spot.name}</h2><p>${spot.description}</p></div>
          <button class="cast-button" id="cast" ${fishing ? 'disabled' : ''}>${fishing ? 'Waiting for bite…' : 'Cast Line'}</button>
          <p class="catch-message" aria-live="polite">${message}</p>
        </section>
        <aside class="side-panel">
          <section class="panel"><div class="panel-title"><h2>Fishing Spots</h2><span>Travel</span></div>${spots.map((entry) => `<button class="spot-button ${entry.id === state.spot ? 'selected' : ''}" data-spot="${entry.id}"><span>${entry.name}</span><small>${state.unlocked.includes(entry.id) ? 'Open' : `Unlock · 🪙 ${entry.cost}`}</small></button>`).join('')}</section>
          <section class="panel"><div class="panel-title"><h2>Tackle Shop</h2><span>Upgrades</span></div>${gear.map((item) => `<article class="gear"><div><p>${item.type}</p><h3>${item.name}</h3><small>${item.description}</small></div><button data-gear="${item.id}" ${state.gear[item.id] ? 'disabled' : ''}>${state.gear[item.id] ? 'Equipped' : `🪙 ${item.cost}`}</button></article>`).join('')}</section>
          <section class="panel journal"><div class="panel-title"><h2>Fish Journal</h2><span>${Object.keys(state.collection).length}/${fish.length}</span></div>${fish.map((entry) => `<div class="journal-row ${state.collection[entry.name] ? 'found' : ''}"><span class="rarity ${entry.rarity}">${state.collection[entry.name] ? entry.rarity : '???'}</span><strong>${state.collection[entry.name] ? entry.name : 'Unknown fish'}</strong><em>${state.collection[entry.name] || 0}</em></div>`).join('')}</section>
        </aside>
      </section>
      <button class="reset" id="reset">Reset progress</button>
    </main>`
  document.querySelector('#cast').onclick = cast
  document.querySelector('#scene').onclick = cast
  document.querySelectorAll('[data-spot]').forEach((button) => { button.onclick = () => selectSpot(button.dataset.spot) })
  document.querySelectorAll('[data-gear]').forEach((button) => { button.onclick = () => buyGear(button.dataset.gear) })
  document.querySelector('#reset').onclick = resetGame
}

const style = document.createElement('style')
style.textContent = `
  :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#fff8e8;background:#122233}*{box-sizing:border-box}body{margin:0;min-width:320px;background:radial-gradient(circle at 20% 0,#315e70,#122233 63%)}button{font:inherit;cursor:pointer}.fishing-app{max-width:1380px;margin:auto;padding:28px}.topbar{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:22px}.kicker{margin:0;color:#ffd06b;font-size:.68rem;font-weight:800;letter-spacing:.17em}.topbar h1{font-family:Georgia,serif;font-size:clamp(2rem,5vw,3.5rem);margin:.18rem 0}.stats{display:flex;gap:10px;flex-wrap:wrap}.stats div{min-width:105px;padding:10px 13px;background:#132d3adf;border:1px solid #5b8d9c;border-radius:12px}.stats span{display:block;color:#9fc0c3;font-size:.62rem;font-weight:800;letter-spacing:.08em}.stats strong{display:block;margin-top:3px;font-size:.88rem}.game-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:22px}.water-card{position:relative;overflow:hidden;border:1px solid #78aab1;border-radius:22px;background:#173b49;box-shadow:0 24px 55px #030c13a6}.scene{height:540px;position:relative;overflow:hidden;background:linear-gradient(var(--sky) 0 44%,var(--water) 44%);cursor:crosshair}.sun{position:absolute;top:55px;right:15%;width:76px;height:76px;border-radius:50%;background:#fff0ad;box-shadow:0 0 55px #fff6b5}.hills{position:absolute;bottom:48%;width:75%;height:120px;border-radius:55% 55% 0 0;background:#355d49}.hills-one{left:-8%}.hills-two{right:-14%;background:#274936;height:96px}.water{position:absolute;inset:44% 0 0;background:repeating-linear-gradient(0deg,#ffffff11 0 2px,transparent 2px 17px)}.ripple{position:absolute;border:2px solid #ffffff73;border-radius:50%;width:130px;height:34px}.ripple.one{left:42%;top:31%;animation:drift 4s infinite}.ripple.two{left:18%;top:67%;animation:drift 5s 1s infinite}.bobber{position:absolute;left:55%;top:46%;font-size:1.8rem;filter:drop-shadow(0 2px 2px #0008)}.bobber.casting{animation:bob .65s infinite alternate}.dock{position:absolute;bottom:7%;left:0;font-size:7rem;transform:rotate(-6deg)}.angler{position:absolute;bottom:8%;left:18%;font-size:4rem;filter:drop-shadow(0 3px 2px #0008)}@keyframes drift{50%{transform:translateX(30px);opacity:.35}}@keyframes bob{to{transform:translateY(12px) rotate(8deg)}}.spot-caption{position:absolute;left:22px;top:22px;max-width:280px;padding:14px 16px;border:1px solid #ffffff45;border-radius:13px;background:#102a35d9}.spot-caption h2{font:1.55rem Georgia,serif;margin:.2rem 0}.spot-caption p:last-child{margin:.25rem 0 0;color:#d3e5df;font-size:.88rem;line-height:1.35}.cast-button{position:absolute;bottom:72px;left:50%;transform:translateX(-50%);border:0;border-radius:999px;padding:15px 30px;background:#f4b34f;color:#2b2111;font-weight:900;box-shadow:0 5px 0 #9d6129}.cast-button:disabled{opacity:.75;cursor:wait}.catch-message{position:absolute;bottom:16px;left:5%;right:5%;margin:0;text-align:center;color:#fff4c2;font-weight:800;text-shadow:0 2px 3px #000}.side-panel{display:grid;gap:15px;align-content:start}.panel{padding:15px;border:1px solid #406c78;border-radius:16px;background:#132d38e8}.panel-title{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}.panel h2{font:1.25rem Georgia,serif;margin:0}.panel-title span{color:#a7c6c0;font-size:.7rem;text-transform:uppercase;letter-spacing:.09em}.spot-button{display:flex;width:100%;justify-content:space-between;align-items:center;margin:7px 0;padding:11px;border:1px solid #416b74;border-radius:9px;background:#1d4650;color:#e9f2e9;text-align:left}.spot-button.selected{border-color:#f4c45e;background:#285c64}.spot-button small{color:#f8d17c}.gear{display:flex;gap:10px;justify-content:space-between;padding:11px 0;border-top:1px solid #315660}.gear:first-of-type{border-top:0}.gear p{margin:0;color:#f0bb5c;font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.gear h3{margin:2px 0;font-size:.95rem}.gear small{color:#b7d0cb;font-size:.73rem;line-height:1.25;display:block}.gear button{align-self:center;white-space:nowrap;border:1px solid #e3a94e;border-radius:8px;padding:8px;background:#efb24f;color:#2b2111;font-weight:800}.gear button:disabled{background:#385c59;color:#b4d2c6;border-color:#507b74}.journal-row{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #315660;color:#789491}.journal-row.found{color:#f7f0d9}.journal-row strong{flex:1;font-size:.82rem}.journal-row em{font-style:normal;font-size:.75rem}.rarity{font-size:.61rem;width:67px;text-transform:uppercase;font-weight:900}.common{color:#d7e2d9}.uncommon{color:#7ce3a5}.rare{color:#77bbff}.epic{color:#cf84ff}.legendary{color:#ffd15a}.reset{display:block;margin:18px auto 0;border:0;background:transparent;color:#9ec0c1;text-decoration:underline;font-size:.78rem}@media(max-width:900px){.game-layout{grid-template-columns:1fr}.side-panel{grid-template-columns:1fr 1fr}.journal{grid-column:1/-1}}@media(max-width:620px){.fishing-app{padding:16px}.topbar{align-items:flex-start;flex-direction:column}.scene{height:450px}.side-panel{grid-template-columns:1fr}.journal{grid-column:auto}.spot-caption{max-width:210px}.stats{width:100%}.stats div{flex:1}.dock{font-size:5rem}.angler{left:13%;font-size:3rem}}
`
document.head.append(style)
window.addEventListener('keydown', (event) => { if (event.code === 'Space') { event.preventDefault(); cast() } })
render()
