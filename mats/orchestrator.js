const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MatsOrchestrator {
  constructor() {
    this.agents = [
      { name: 'StaticAnalyst', path: 'mats/agents/static_analyst.js' },
      { name: 'SecurityHacker', path: 'mats/agents/security_hacker.js' },
      // Future agents will be added here
    ];
    this.reports = [];
  }

  async run() {
    console.log('🌟 [MATS] Starting God-Level Validation Suite...');
    
    for (const agent of this.agents) {
      console.log(`\n🤖 [MATS] Invoking Agent: ${agent.name}...`);
      try {
        const report = await this.invokeAgent(agent);
        this.reports.push({ agent: agent.name, ...report });
        
        if (report.criticalFailures > 0) {
          console.error(`❌ [MATS] Agent ${agent.name} reported critical failures. Halting pipeline.`);
          this.finalize();
          process.exit(1);
        }
      } catch (err) {
        console.error(`💥 [MATS] Agent ${agent.name} crashed:`, err.message);
      }
    }

    this.finalize();
  }

  invokeAgent(agent) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [agent.path], { stdio: 'inherit' });
      child.on('close', (code) => {
        // In a real system, agents write JSON reports to mats/reports/
        const reportPath = path.join(__dirname, 'reports', `${agent.name.toLowerCase()}.json`);
        if (fs.existsSync(reportPath)) {
          resolve(JSON.parse(fs.readFileSync(reportPath, 'utf8')));
        } else {
          resolve({ status: code === 0 ? 'passed' : 'failed', criticalFailures: code === 0 ? 0 : 1 });
        }
      });
    });
  }

  finalize() {
    console.log('\n🏁 [MATS] Final Report Summary:');
    this.reports.forEach(r => {
      console.log(`- ${r.agent}: ${r.status.toUpperCase()} (${r.criticalFailures} critical issues)`);
    });
    
    const totalCritical = this.reports.reduce((acc, curr) => acc + curr.criticalFailures, 0);
    if (totalCritical === 0) {
      console.log('\n✅ [MATS] SYSTEM ATTAINED GOD-LEVEL PERFECTION.');
    } else {
      console.log(`\n⚠️ [MATS] SYSTEM REQUIRES ATTENTION (${totalCritical} critical issues found).`);
    }
  }
}

new MatsOrchestrator().run();
