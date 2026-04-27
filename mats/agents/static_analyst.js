const fs = require('fs');
const path = require('path');

class StaticAnalyst {
  constructor() {
    this.issues = [];
    this.targetDir = path.join(__dirname, '../../server/src');
  }

  async run() {
    console.log('🔍 [StaticAnalyst] Scanning backend architecture...');
    
    this.checkDatabaseQueries();
    this.checkMiddlewareUsage();
    this.checkEnvironmentVars();

    const report = {
      status: this.issues.length > 5 ? 'failed' : 'passed',
      criticalFailures: this.issues.filter(i => i.severity === 'critical').length,
      issues: this.issues
    };

    fs.writeFileSync(
      path.join(__dirname, '../reports/staticanalyst.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`✅ [StaticAnalyst] Scan complete. Found ${this.issues.length} issues.`);
  }

  checkDatabaseQueries() {
    // Scan for .find() without limit or pagination
    const files = this.walk(this.targetDir);
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('.find(') && !content.includes('.limit(') && !content.includes('.paginate')) {
        this.issues.push({
          file: path.relative(this.targetDir, file),
          issue: 'Unbounded database query detected (.find() without .limit())',
          severity: 'warning'
        });
      }
    });
  }

  checkMiddlewareUsage() {
    // Ensure all routes use errorMiddleware
    const appPath = path.join(this.targetDir, 'app.js');
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      if (!content.includes('app.use(errorMiddleware)')) {
        this.issues.push({
          file: 'app.js',
          issue: 'Global error handler missing in Express app',
          severity: 'critical'
        });
      }
    }
  }

  checkEnvironmentVars() {
    const serverJs = path.join(__dirname, '../../server/server.js');
    if (fs.existsSync(serverJs)) {
      const content = fs.readFileSync(serverJs, 'utf8');
      if (!content.includes('JWT_SECRET')) {
        this.issues.push({
          file: 'server.js',
          issue: 'JWT_SECRET validation missing at startup',
          severity: 'critical'
        });
      }
    }
  }

  walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.walk(file));
      } else if (file.endsWith('.js')) {
        results.push(file);
      }
    });
    return results;
  }
}

new StaticAnalyst().run();
