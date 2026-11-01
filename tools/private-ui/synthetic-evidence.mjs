// PC-03D3A — fictional evidence-model contract ONLY.
// Never read encrypted snapshots, credentials, local files or GitHub.
// No real project or host state may be inferred from this fixture.
export const AXES=Object.freeze(['development','git','deployment','decision','confidence']);
const SOURCE='FICTIONAL_FIXTURE';
const PROJECTS=Object.freeze([
  Object.freeze({id:'fictional-atlas',name:'Fictional Atlas',branch:'main',openPRs:2,openIssues:1}),
  Object.freeze({id:'sample-orchard',name:'Sample Orchard',branch:'master',openPRs:0,openIssues:3})
]);
const unknown=()=>({state:'UNKNOWN',evidence:null});
function asProject(p){
  return {
    id:p.id,name:p.name,defaultBranch:p.branch,
    // These Git counts are NOT actual observed or verified GitHub metadata.
    gitDemo:{openPRs:p.openPRs,openIssues:p.openIssues},
    axes:{
      development:{state:'UNKNOWN',evidence:null},
      git:{state:'SIMULATED',evidence:'FICTIONAL_FIXTURE; not a GitHub fetch'},
      deployment:{state:'NOT_VERIFIED',evidence:null},
      decision:{state:'NEEDS_REVIEW',evidence:null},
      confidence:{state:'DEMO_ONLY',evidence:null}
    }
  };
}
export function buildSyntheticEvidence(){
  const model={
    mode:'SYNTHETIC_ONLY',
    source:SOURCE,
    observedAt:null,
    coverage:'NOT_APPLICABLE_SYNTHETIC',
    projects:PROJECTS.map(asProject)
  };
  validateSyntheticEvidence(model);
  return model;
}
export function validateSyntheticEvidence(model){
  if(!model||model.mode!=='SYNTHETIC_ONLY'||model.source!==SOURCE||
     model.observedAt!==null||model.coverage!=='NOT_APPLICABLE_SYNTHETIC'||
     !Array.isArray(model.projects)||model.projects.length!==2)
    throw Error('Invalid synthetic-only evidence');
  for(let i=0;i<model.projects.length;i++){
    const p=model.projects[i],fixture=PROJECTS[i];
    if(p?.id!==fixture.id||p.name!==fixture.name||
       p.defaultBranch!==fixture.branch||p.gitDemo?.openPRs!==fixture.openPRs||
       p.gitDemo?.openIssues!==fixture.openIssues)throw Error('Invalid fictional project');
    if(!p.axes||Object.keys(p.axes).sort().join('|')!==[...AXES].sort().join('|'))
      throw Error('Invalid evidence axes');
    const expected={
      development:'UNKNOWN',git:'SIMULATED',deployment:'NOT_VERIFIED',
      decision:'NEEDS_REVIEW',confidence:'DEMO_ONLY'
    };
    for(const axis of AXES){
      const part=p.axes[axis];
      if(!part||part.state!==expected[axis]||
         (axis==='git'?part.evidence!=='FICTIONAL_FIXTURE; not a GitHub fetch':part.evidence!==null))
         throw Error('Evidence axes cannot assert verified actual state');
    }
  }
  return model;
}
