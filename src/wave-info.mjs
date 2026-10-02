export const showFightTutorial = game => !(game.wins > 0 || game.bossDefeated);
export function waveRoster(encounter) {
  const entry=(name,count,drops)=>({name,count,drops});
  if(encounter.type==='skeleton') return [entry('The Marrow King',1,'Phase I · 3,000 HP'),entry('Unbound Marrow King',1,'Phase II · 5,000 HP. First victory: Summoning Sigil · next bat guarantees one Vampire Shard, then consumes the sigil.')];
  if(encounter.type==='boss') return [
    entry('Undead Goblin',100,'No item drops'),
    entry('Sir Calder',1,'No item drops · first boss form'),
    entry('Necromancer',1,'Teleporter Key · 100% on victory. 1,500 EXP + 1,000 gold.'),
  ];
  if(encounter.type==='sentinel') return [entry('Oathbound Sentinel',1,'No random drops. First victory: 750 gold, 500 EXP, +1 AOE altar level.')];
  if(encounter.type==='bat') return [entry('Bat',8,'Bat Wing · 30% | Vampire Shard · 0.099%')];
  if(encounter.type==='rock') return [entry('Rock Monster',1,'No item drops')];
  const roster=[entry('Goblin',6,'Goblin Bone · 10%')];
  if(encounter.orc) roster.push(entry('Orc',1,'Orc Tusk · 25%'));
  return roster;
}
