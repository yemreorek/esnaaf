const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./src/graph-data/koltuk-yikama.json', 'utf8'));

const fileSlug = 'koltuk-yikama';
const catStr = config.service_category || fileSlug || 'unknown';
const trMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
const catSlug = catStr.toLowerCase().replace(/[çğıöşü]/g, (m) => trMap[m]).replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const stepKeys = Object.keys(config.steps);

const getActualStepId = (idx) => {
   const key = stepKeys[idx];
   const data = config.steps[key];
   return data.step_id || data.id || key;
};

const firstStepIdRaw = config.start_step_id || (stepKeys.length > 0 ? getActualStepId(0) : '1');
const category_routes = {};
category_routes[catSlug] = { start_node_id: `${catSlug}_${firstStepIdRaw}` };

const nodes = {};

for (let i = 0; i < stepKeys.length; i++) {
  const key = stepKeys[i];
  const stepData = config.steps[key];
  const stepId = getActualStepId(i);
  const nextStepIdDefault = i + 1 < stepKeys.length ? getActualStepId(i + 1) : null;

  const rawType = stepData.type || stepData.input_type || stepData.inputType || stepData.question_type;
  const inputType = (rawType === 'single_select' || rawType === 'single_selection') ? 'single_choice' : 
                    (rawType === 'multi_select' || rawType === 'multi_selection') ? 'multi_choice' : 
                    rawType || 'text';
                    
  const namespacedStepId = `${catSlug}_${stepId}`;
  const rawNext = stepData.next_step || stepData.nextStep || stepData.next_node_id || stepData.nextNodeId || stepData.next || stepData.sonraki_adim || stepData.sonrakiAdim || stepData.sonraki || stepData.hedef || stepData.target || stepData.goto || nextStepIdDefault;
  let nextNodeRaw = rawNext !== undefined && rawNext !== null ? String(rawNext) : null;
  if (nextNodeRaw && nextNodeRaw.startsWith(`${catSlug}_`)) {
      nextNodeRaw = nextNodeRaw.replace(`${catSlug}_`, '');
  }
  
  nodes[namespacedStepId] = {
    question_text: stepData.question || stepData.question_text || stepData.questionText || '',
    input_type: inputType,
    next_node_id: nextNodeRaw && nextNodeRaw !== 'none' ? `${catSlug}_${nextNodeRaw}` : null,
    options: stepData.options ? stepData.options.map((opt) => {
      const optRawNext = opt.next_step || opt.nextStep || opt.next_node_id || opt.nextNodeId || opt.next || opt.sonraki_adim || opt.sonrakiAdim || opt.sonraki || opt.hedef || opt.target || opt.goto;
      let optNextRaw = optRawNext !== undefined && optRawNext !== null ? String(optRawNext) : null;
      if (!optNextRaw && nextNodeRaw) {
         optNextRaw = nextNodeRaw;
      }
      if (optNextRaw && optNextRaw.startsWith(`${catSlug}_`)) {
          optNextRaw = optNextRaw.replace(`${catSlug}_`, '');
      }
      return {
        text: opt.label || opt.text || opt.value || opt.name,
        next_node_id: optNextRaw && optNextRaw !== 'none' ? `${catSlug}_${optNextRaw}` : null
      };
    }) : []
  };
}

console.log(JSON.stringify({ category_routes, nodes }, null, 2));
