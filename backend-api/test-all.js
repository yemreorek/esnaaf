const fs = require('fs');
const path = require('path');

const dirPath = path.join(process.cwd(), 'src', 'graph-data');
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

const trMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };

for (const file of files) {
  try {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    const config = JSON.parse(content);
    
    let nodes = {};
    let category_routes = {};

    if (config.steps) {
      const fileSlug = file.replace(/\.json$/i, '');
      const catStr = config.service_category || fileSlug || 'unknown';
      const catSlug = catStr.toLowerCase().replace(/[çğıöşü]/g, (m) => trMap[m]).replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const stepKeys = Object.keys(config.steps);
      const getActualStepId = (idx) => {
         const key = stepKeys[idx];
         const data = config.steps[key];
         return data.step_id || data.id || key;
      };

      const firstStepIdRaw = config.start_step_id || (stepKeys.length > 0 ? getActualStepId(0) : '1');
      category_routes[catSlug] = { start_node_id: `${catSlug}_${firstStepIdRaw}` };
      
      for (let i = 0; i < stepKeys.length; i++) {
        const key = stepKeys[i];
        const stepData = config.steps[key];
        const stepId = getActualStepId(i);
        // ... logic
      }
      
      console.log(`✅ Passed: ${file} -> slug: ${catSlug}`);
    }
  } catch(e) {
    console.error(`❌ Failed: ${file}`, e.message);
  }
}
