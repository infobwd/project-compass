// PC-03B: strict scoped owner-repository selection. Public-safe code; no real repo lists.
const FORMAT='BWD-COMPASS-SELECTION-V1';
const FULL_NAME=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;
const LOGIN=/^[a-z0-9](?:[a-z0-9-]{0,38})$/i;
export function parseSelection(text, owner) {
  if (!LOGIN.test(owner||'')) throw new Error('Invalid account name');
  if(typeof text!=='string' || text.length>32768)throw new Error('Invalid or oversized selection file');
  let raw;
  try {raw=JSON.parse(text);}catch{throw new Error('Selection file must be valid JSON');}
  if(!raw || Array.isArray(raw) || typeof raw!=='object' ||
     raw.format!==FORMAT || raw.owner!==owner || !Array.isArray(raw.repositories))
    throw new Error('Selection format, owner or repository list mismatch');
  const keys=Object.keys(raw);
  if(keys.length!==3 || keys.some(k=>!['format','owner','repositories'].includes(k)))
    throw new Error('Selection has unexpected fields');
  if(raw.repositories.length<1 || raw.repositories.length>40)
    throw new Error('Select between 1 and 40 repositories');
  const names=new Set();
  for(const name of raw.repositories) {
    if(typeof name!=='string' || !FULL_NAME.test(name) ||
       name.split('/')[0].toLowerCase()!==owner.toLowerCase())
      throw new Error('Selected repository must belong to authenticated owner');
    const folded=name.toLowerCase();
    if(names.has(folded))throw new Error('Duplicate selected repository');
    names.add(folded);
  }
  return [...raw.repositories];
}
export function selectOwnerRepositories(eligible, names) {
  if(!Array.isArray(eligible)||!Array.isArray(names)||names.length<1)
    throw new Error('Selection is missing');
  const byName=new Map(eligible.map(r=>[r.full_name.toLowerCase(),r]));
  const missing=names.filter(n=>!byName.has(n.toLowerCase()));
  if(missing.length)throw new Error('Cannot access all selected repositories ('+missing.length+' missing); no snapshot saved');
  return names.map(n=>byName.get(n.toLowerCase()));
}
