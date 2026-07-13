const config = {
  "category_id": "ev_temizligi",
  "category_name": "Ev Temizliği",
  "start_step_id": "step_1_evin_buyuklugu",
  "steps": {
    "step_1_evin_buyuklugu": {
      "step_id": "step_1_evin_buyuklugu",
      "question_type": "single_select",
      "question_text": "Evin büyüklüğü nedir?",
      "description": "Evi detaylı temizleyip düzenliyoruz.",
      "options": [
        { "label": "1+0", "value": "1+0", "next_step": "step_2_kac_banyo" },
        { "label": "1+1", "value": "1+1", "next_step": "step_2_kac_banyo" }
      ]
    },
    "step_2_kac_banyo": {
      "step_id": "step_2_kac_banyo",
      "question_type": "single_select",
      "question_text": "Kaç banyo?",
      "options": [
        { "label": "1", "value": "1", "next_step": "step_3_temizlik_suresi" }
      ]
    }
  }
};

const catStr = config.category_id || config.category_name || 'unknown';
const trMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
const catSlug = catStr.toLowerCase().replace(/[çğıöşü]/g, (m) => trMap[m]).replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const nodes = {};
const stepKeys = Object.keys(config.steps);
      
for (let i = 0; i < stepKeys.length; i++) {
  const stepId = stepKeys[i];
  const stepData = config.steps[stepId];
  const nextStepIdDefault = i + 1 < stepKeys.length ? stepKeys[i + 1] : null;

  const inputType = stepData.type === 'single_select' ? 'single_choice' : 
                    stepData.type === 'multi_select' ? 'multi_choice' : 
                    stepData.type || stepData.input_type || stepData.inputType || stepData.question_type || 'text';
                    
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

console.log(JSON.stringify(nodes, null, 2));
