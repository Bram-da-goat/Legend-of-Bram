export function newBloodBattle(){return {clock:0,active:0,blessing:0,bats:[]};}
export function grantBloodDamage(state,damage){
  if(state.active<=0 || !Number.isFinite(damage) || damage<=0)return;
  state.blessing+=damage;
  for(const bat of state.bats)bat.hp+=damage;
}
export function bloodBat(state){return {t:1,hp:500+state.blessing,damage:500};}
