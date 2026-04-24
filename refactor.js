const fs = require('fs');
const glob = require('glob'); // Note: we can just use simple file paths

const files = [
  'client/src/pages/AdminDashboard.jsx',
  'client/src/pages/UserDashboard.jsx',
  'client/src/components/admin/TickerManager.jsx',
  'client/src/components/admin/AuditHistory.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf-8');
  
  // Add import api from api.js if not present
  if (!content.includes('import api from')) {
    content = content.replace("import axios from 'axios';", "import axios from 'axios';\nimport api from '../services/api';");
    if (file.includes('admin/')) {
        content = content.replace("import api from '../services/api';", "import api from '../../services/api';");
    }
  }

  // Replace axios.get(url, getAuthHeaders()) or config with api.get(url)
  content = content.replace(/axios\.(get|post|put|delete)\(\s*([^,]+),\s*(?:getAuthHeaders\(\)|config|\{\s*headers:\s*\{[^}]+\}\s*\})\s*\)/g, 'api.$1($2)');
  
  // Replace axios.post(url, data, getAuthHeaders()) with api.post(url, data)
  content = content.replace(/axios\.(post|put|patch)\(\s*([^,]+),\s*([^,]+),\s*(?:getAuthHeaders\(\)|config|\{\s*headers:\s*\{[^}]+\}\s*\})\s*\)/g, 'api.$1($2, $3)');

  // For AdminDashboard, the config is passed as an object variable: `const config = getAuthHeaders();`
  // We can just remove `, config` from the calls.
  // We'll run a simpler replace for config variables
  
  fs.writeFileSync(file, content);
});
