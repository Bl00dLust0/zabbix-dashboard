// ============================================================
//  Zabbix Dashboard — Backend Server (with crash diagnostics)
// ============================================================
console.log('Step 1: server.js started');

try {
  require('dotenv').config();
  console.log('Step 2: dotenv loaded OK');
} catch(e) { console.error('CRASH at dotenv:', e.message); process.exit(1); }

let express, axios, cors;
try {
  express = require('express');
  console.log('Step 3: express loaded OK');
} catch(e) { console.error('CRASH: express not found. Run: npm install'); process.exit(1); }

try {
  axios = require('axios');
  console.log('Step 4: axios loaded OK');
} catch(e) { console.error('CRASH: axios not found. Run: npm install'); process.exit(1); }

try {
  cors = require('cors');
  console.log('Step 5: cors loaded OK');
} catch(e) { console.error('CRASH: cors not found. Run: npm install'); process.exit(1); }

console.log('Step 6: checking .env values...');
console.log('  ZABBIX_URL  =', process.env.ZABBIX_URL  || '❌ NOT SET');
console.log('  ZABBIX_USER =', process.env.ZABBIX_USER || '❌ NOT SET');
console.log('  ZABBIX_PASS =', process.env.ZABBIX_PASS ? '✓ set' : '❌ NOT SET');
console.log('  PORT        =', process.env.PORT || '5000 (default)');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const ZABBIX_URL  = process.env.ZABBIX_URL;
const ZABBIX_USER = process.env.ZABBIX_USER;
const ZABBIX_PASS = process.env.ZABBIX_PASS;

// ============================================================
//  ZABBIX API HELPER
// ============================================================
async function zabbixCall(method, params, authToken = null) {
  const body = {
    jsonrpc: '2.0',
    method:  method,
    params:  params,
    id:      1,
  };
  if (authToken) body.auth = authToken;

  const response = await axios.post(ZABBIX_URL, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  if (response.data.error) {
    throw new Error(response.data.error.data || response.data.error.message);
  }
  return response.data.result;
}

// ============================================================
//  LOGIN
// ============================================================
async function getAuthToken() {
  return await zabbixCall('user.login', {
    user:     ZABBIX_USER,
    password: ZABBIX_PASS,
  });
}

// ============================================================
//  HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Zabbix backend is running' });
});

// ============================================================
//  ROUTE 1:  GET /api/stats
// ============================================================
app.get('/api/stats', async (req, res) => {
  try {
    const token = await getAuthToken();
    const allHosts = await zabbixCall('host.get', {
      output:           ['hostid', 'host'],
      selectInterfaces: ['ip', 'available', 'type'],  // read availability from interface
    }, token);

    // interface.available: '1' = Online, '2' = Offline, '0' = Unknown
    // A host is Online if ANY of its interfaces is available
    const onlineHosts  = allHosts.filter(h => h.interfaces.some(i => i.available === '1')).length;
    const offlineHosts = allHosts.filter(h => h.interfaces.every(i => i.available === '2')).length;

    const activeProblems = await zabbixCall('problem.get', {
      output:     ['eventid', 'name', 'severity'],
      suppressed: false,
      recent:     true,
    }, token);

    res.json({
      totalHosts:   allHosts.length,
      onlineHosts:  onlineHosts,
      offlineHosts: offlineHosts,
      activeAlerts: activeProblems.length,
    });
  } catch (err) {
    console.error('Error in /api/stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  ROUTE 2:  GET /api/hosts
// ============================================================
app.get('/api/hosts', async (req, res) => {
  try {
    const token = await getAuthToken();
    const hosts = await zabbixCall('host.get', {
      output:           ['hostid', 'host'],
      selectInterfaces: ['ip', 'available', 'type'],  // type: 1=Agent,2=SNMP,3=IPMI,4=JMX
    }, token);

    const hostsWithMetrics = await Promise.all(
      hosts.map(async (host) => {
        const cpuItems = await zabbixCall('item.get', {
          output:  ['lastvalue'],
          hostids: host.hostid,
          search:  { key_: 'system.cpu.util' },
          limit:   1,
        }, token);

        const memItems = await zabbixCall('item.get', {
          output:  ['lastvalue'],
          hostids: host.hostid,
          search:  { key_: 'vm.memory.util' },
          limit:   1,
        }, token);

        const pingItems = await zabbixCall('item.get', {
          output:  ['lastvalue'],
          hostids: host.hostid,
          search:  { key_: 'icmpping' },
          limit:   1,
        }, token);

        const cpu    = cpuItems[0]  ? parseFloat(cpuItems[0].lastvalue).toFixed(1) + '%' : 'N/A';
        const memory = memItems[0]  ? parseFloat(memItems[0].lastvalue).toFixed(1) + '%' : 'N/A';
        const ping   = pingItems[0] ? (pingItems[0].lastvalue === '1' ? 'UP' : 'DOWN') : 'N/A';

        // Determine status from interfaces (not the deprecated host.available field)
        // Online = at least one interface is available
        // Offline = all interfaces are unavailable
        // Unknown = interfaces not yet checked (available = '0')
        let status = 'Unknown';
        if (host.interfaces.some(i => i.available === '1'))       status = 'Online';
        else if (host.interfaces.every(i => i.available === '2')) status = 'Offline';

        return {
          id:     host.hostid,
          name:   host.host,
          ip:     host.interfaces[0]?.ip || 'N/A',
          status,
          cpu, memory, ping,
        };
      })
    );

    res.json(hostsWithMetrics);
  } catch (err) {
    console.error('Error in /api/hosts:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  ROUTE 3:  GET /api/alerts
// ============================================================
app.get('/api/alerts', async (req, res) => {
  try {
    const token = await getAuthToken();
    const severityMap = {
      '0': 'Not classified', '1': 'Information', '2': 'Warning',
      '3': 'Average', '4': 'High', '5': 'Disaster',
    };

    const problems = await zabbixCall('problem.get', {
      output:      ['eventid', 'name', 'severity', 'clock', 'acknowledged'],
      suppressed:  false,
      recent:      true,
      sortfield:   'eventid',
      sortorder:   'DESC',
      selectHosts: ['host'],
    }, token);

    const alerts = problems.map(p => ({
      id:            p.eventid,
      name:          p.name,
      severity:      severityMap[p.severity] || 'Unknown',
      severityLevel: parseInt(p.severity),
      host:          p.hosts?.[0]?.host || 'Unknown',
      time:          new Date(parseInt(p.clock) * 1000).toLocaleString(),
      acknowledged:  p.acknowledged === '1',
    }));

    res.json(alerts);
  } catch (err) {
    console.error('Error in /api/alerts:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('✅ Backend running at http://localhost:' + PORT);
  console.log('   Health: http://localhost:' + PORT + '/health');
  console.log('   Stats:  http://localhost:' + PORT + '/api/stats');
  console.log('   Hosts:  http://localhost:' + PORT + '/api/hosts');
  console.log('   Alerts: http://localhost:' + PORT + '/api/alerts');
  console.log('');
}).on('error', (err) => {
  console.error('CRASH: Could not start server:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is already in use. Kill the other process or change PORT in .env');
  }
});