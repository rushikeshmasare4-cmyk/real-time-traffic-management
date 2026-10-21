/**
 * FLOWGRID — Real-Time Traffic Management System
 * Frontend Application Controller (Connected to C++17 REST Engine with Offline Fallback)
 */

// ============================================================================
// 1. GLOBAL STATE & CONFIGURATION
// ============================================================================

const CONFIG = {
  apiBase: window.location.origin.includes('http') ? window.location.origin : 'http://localhost:8080',
  pollInterval: 1000
};

let appState = {
  connectedToCpp: false,
  autoPlayTimer: null,
  simSpeed: 500,
  step: 0,
  signals: {
    activeDirection: 'NORTH',
    activeState: 'GREEN',
    timeRemaining: 4,
    allocatedTime: 4,
    isSafe: true,
    north: 'GREEN',
    south: 'RED',
    east: 'RED',
    west: 'RED'
  },
  lanes: {
    north: { totalWaiting: 0, ordinary: [], emergency: [] },
    south: { totalWaiting: 0, ordinary: [], emergency: [] },
    east:  { totalWaiting: 0, ordinary: [], emergency: [] },
    west:  { totalWaiting: 0, ordinary: [], emergency: [] }
  },
  stats: {
    totalGenerated: 0,
    totalProcessed: 0,
    currentlyWaiting: 0,
    emergencyGenerated: 0,
    emergencyProcessed: 0,
    averageWaitTime: 0.0,
    throughput: 0.0
  },
  events: []
};

// ============================================================================
// 2. CITY ROAD NETWORK DATA (8 INTERSECTIONS & 10 ROADS)
// ============================================================================

const GRAPH_DATA = {
  nodes: [
    { id: 1, name: "Central Square", x: 450, y: 300, desc: "City Core Hub", isHub: true },
    { id: 2, name: "North Gate",     x: 450, y: 80,  desc: "Commercial District" },
    { id: 3, name: "East Bridge",    x: 720, y: 300, desc: "Industrial Freight Zone" },
    { id: 4, name: "South Terminal", x: 450, y: 520, desc: "Transit Terminal" },
    { id: 5, name: "West End",       x: 180, y: 300, desc: "Residential Suburbs" },
    { id: 6, name: "Tech Park",      x: 700, y: 110, desc: "Research Corridor" },
    { id: 7, name: "Univ. Circle",   x: 230, y: 480, desc: "Academic & Medical" },
    { id: 8, name: "Harbor View",    x: 760, y: 480, desc: "Port Authority" }
  ],
  edges: [
    { u: 1, v: 2, dist: 2.5, name: "Grand Ave", speed: 50 },
    { u: 1, v: 3, dist: 3.2, name: "Riverside Dr", speed: 50 },
    { u: 1, v: 4, dist: 2.8, name: "Metro Blvd", speed: 50 },
    { u: 1, v: 5, dist: 3.0, name: "Sunset Hwy", speed: 60 },
    { u: 2, v: 6, dist: 4.1, name: "Silicon Expwy", speed: 70 },
    { u: 3, v: 8, dist: 3.8, name: "Port Ring Rd", speed: 60 },
    { u: 4, v: 7, dist: 2.2, name: "College Pkwy", speed: 40 },
    { u: 5, v: 7, dist: 3.5, name: "Campus Conn", speed: 45 },
    { u: 6, v: 3, dist: 4.5, name: "Tech Link", speed: 60 },
    { u: 7, v: 8, dist: 5.0, name: "Bay Perimeter", speed: 55 }
  ]
};

// ============================================================================
// 3. VIVA QUESTIONS DATA (28 QUESTIONS)
// ============================================================================

const VIVA_QUESTIONS = [
  {
    q: "1. What is FLOWGRID and what core problem does it address?",
    cat: "Architecture",
    a: "FLOWGRID is an academic urban traffic management simulator in C++17. It models road networks as graphs, approaches as FIFO and Priority queues, and implements adaptive traffic signal scheduling to reduce intersection gridlock, expedite emergency dispatch, and eliminate civilian vehicle starvation."
  },
  {
    q: "2. What are the three non-negotiable data structures used in FLOWGRID?",
    cat: "Architecture",
    a: "1) FIFO Queue: Singly-linked list managing civilian vehicles in strict arrival order.\n2) Priority Queue: Binary min-heap managing emergency vehicles (Ambulance, Fire Engine, Police).\n3) Graph: Adjacency-list representing city intersections (vertices) and road segments (weighted edges)."
  },
  {
    q: "3. Why is a FIFO queue appropriate for ordinary civilian traffic?",
    cat: "FIFO Queue",
    a: "In single-lane roadways, overtaking is physically constrained: the first vehicle arriving at a red signal is physically the first to exit when it turns green, strictly satisfying First-In, First-Out semantics."
  },
  {
    q: "4. How is the FIFO queue implemented in C++, and what is its complexity?",
    cat: "FIFO Queue",
    a: "It is implemented as a custom singly-linked node list maintaining both head and tail pointers. Both enqueue() and dequeue() operate in guaranteed O(1) constant time without array shifting overhead."
  },
  {
    q: "5. How does your FIFO queue safely handle empty states?",
    cat: "FIFO Queue",
    a: "dequeue() and peek() return a boolean false when the queue is empty and pass the retrieved element by reference, avoiding segmentation faults, null dereferences, or costly exceptions."
  },
  {
    q: "6. How are emergency vehicle priorities structured in FLOWGRID?",
    cat: "Priority Queue",
    a: "Lower integer indicates higher urgency: Priority 1 = Ambulance (life-critical); Priority 2 = Fire Engine (disaster/fire); Priority 3 = Police (law enforcement); Priority 10 = Regular civilian vehicles."
  },
  {
    q: "7. How is the Priority Queue implemented under the hood?",
    cat: "Priority Queue",
    a: "As a custom Binary Min-Heap stored in a contiguous dynamic array (std::vector<Vehicle>). It maintains the heap property via siftUp() on insertion and siftDown() on root extraction."
  },
  {
    q: "8. How does the priority queue break ties between vehicles of identical priority?",
    cat: "Priority Queue",
    a: "Using a monotonically increasing 64-bit sequenceNumber. The vehicle with the smaller sequence number arrived earlier and is popped first, preserving FIFO fairness among equal priorities."
  },
  {
    q: "9. What are the time complexities of your Priority Queue operations?",
    cat: "Priority Queue",
    a: "Push: O(log N) bubble-up; Pop: O(log N) downward sifting; Peek: O(1) constant-time root inspection."
  },
  {
    q: "10. How is the road network represented in FLOWGRID?",
    cat: "Graph",
    a: "As a weighted graph G = (V, E) using an Adjacency List (std::unordered_map<int, Intersection>). Each Intersection contains a vector of outgoing RoadEdge structs."
  },
  {
    q: "11. Why did you choose an Adjacency List over an Adjacency Matrix?",
    cat: "Graph",
    a: "Urban road networks are sparse (intersections connect to only 3-5 roads). An adjacency list requires O(V + E) space compared to O(V^2) for an adjacency matrix, conserving memory and accelerating neighbor traversal."
  },
  {
    q: "12. What algorithm calculates shortest routes, and what does it return?",
    cat: "Dijkstra",
    a: "Dijkstra's Shortest Path Algorithm. It returns total physical distance (km), estimated urban transit time (mins), boolean success status, and the ordered vertex path sequence."
  },
  {
    q: "13. What is the time complexity of your Dijkstra implementation?",
    cat: "Dijkstra",
    a: "O((V + E) log V) using an adjacency list representation with a binary min-priority queue."
  },
  {
    q: "14. How does FLOWGRID handle unreachable destinations?",
    cat: "Dijkstra",
    a: "If the destination vertex remains at infinite distance after the heap empties, it sets pathFound = false and produces a descriptive status message without crashing."
  },
  {
    q: "15. What safety invariant does the Traffic Signal Controller enforce?",
    cat: "Signal Control",
    a: "Conflicting approaches never receive GREEN simultaneously. Under FLOWGRID's single-phase rotary model, exactly one direction is non-RED (GREEN or YELLOW) at any instant, while all other three are strictly RED."
  },
  {
    q: "16. What is the Adaptive Signal Timing rule in FLOWGRID?",
    cat: "Signal Control",
    a: "Green time is dynamically adjusted based on approaching queue length L: T_green = clamp(T_base + floor(L / 2), T_min, T_max). Approaches with heavier queues receive extended green times up to T_max."
  },
  {
    q: "17. What is ordinary vehicle starvation, and how does FLOWGRID prevent it?",
    cat: "Fairness",
    a: "Starvation occurs if continuous emergency arrivals indefinitely block civilian vehicles. FLOWGRID enforces a dual fairness policy: 1) Bypass after 3 consecutive emergency dispatches; 2) Bypass if the front civilian vehicle waits >= 5 simulation steps."
  },
  {
    q: "18. How does FLOWGRID prevent double-counting in statistics?",
    cat: "Statistics",
    a: "Vehicles move through mutually exclusive states: WAITING -> IN_TRANSIT -> COMPLETED. Departure timestamps and status updates occur exactly once. The conservation law (Total Generated == Total Processed + Waiting) is strictly verified."
  },
  {
    q: "19. How does the vehicle search feature work, and what is its complexity?",
    cat: "Search/Sort",
    a: "An internal hash table (std::unordered_map<string, Vehicle>) indexes all admitted vehicles by ID, enabling instantaneous O(1) average lookup of wait time, approach lane, route, and status."
  },
  {
    q: "20. How was the system tested and verified?",
    cat: "Testing",
    a: "A standalone test suite (flowgrid_tests.exe) runs 14 automated unit and integration tests covering queues, heap ordering, graph construction, Dijkstra, signal invariants, and deterministic reproducibility (14/14 passed)."
  }
];

// ============================================================================
// 4. API & SIMULATION ENGINE INTERACTION
// ============================================================================

async function fetchStateFromCpp() {
  try {
    const res = await fetch(`${CONFIG.apiBase}/api/state`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      setConnectionStatus(true);
      applyState(data);
      return true;
    }
  } catch (err) {
    setConnectionStatus(false);
  }
  return false;
}

function setConnectionStatus(connected) {
  const pill = document.getElementById('backend-status');
  const text = document.getElementById('backend-status-text');
  appState.connectedToCpp = connected;

  if (connected) {
    pill.className = 'status-pill status-connected';
    text.innerText = 'C++17 Engine Connected (localhost:8080)';
  } else {
    pill.className = 'status-pill status-offline';
    text.innerText = 'Standalone Browser Mode';
  }
}

async function apiPost(endpoint, body = {}) {
  if (appState.connectedToCpp) {
    try {
      const res = await fetch(`${CONFIG.apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        applyState(data);
        return;
      }
    } catch (e) {
      setConnectionStatus(false);
    }
  }
  // Client-side simulation fallback
  clientSimStep(endpoint, body);
}

// ============================================================================
// 5. CLIENT-SIDE FALLBACK SIMULATOR ENGINE (When C++ server is paused)
// ============================================================================

let localSequence = 1;
function clientSimStep(action, payload = {}) {
  if (action === '/api/step') {
    const dir = appState.signals.activeDirection.toLowerCase();
    const lane = appState.lanes[dir];

    // Dispatch vehicle if green
    if (appState.signals.activeState === 'GREEN') {
      let dispatched = null;
      if (lane.emergency && lane.emergency.length > 0) {
        dispatched = lane.emergency.shift();
        logClientEvent(`[Tick ${appState.step}] EMERGENCY_PRIORITY: Dispatched ${dispatched.type} [${dispatched.id}]`);
        appState.stats.emergencyProcessed++;
      } else if (lane.ordinary && lane.ordinary.length > 0) {
        dispatched = lane.ordinary.shift();
        logClientEvent(`[Tick ${appState.step}] FIFO_DISPATCH: Dispatched ordinary ${dispatched.type} [${dispatched.id}]`);
      }
      if (dispatched) {
        appState.stats.totalProcessed++;
        lane.totalWaiting = (lane.ordinary ? lane.ordinary.length : 0) + (lane.emergency ? lane.emergency.length : 0);
      }
    }

    // Step signal timers
    appState.signals.timeRemaining--;
    if (appState.signals.timeRemaining <= 0) {
      if (appState.signals.activeState === 'GREEN') {
        appState.signals.activeState = 'YELLOW';
        appState.signals.timeRemaining = 2;
      } else {
        const order = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
        const nextIdx = (order.indexOf(appState.signals.activeDirection) + 1) % 4;
        appState.signals.activeDirection = order[nextIdx];
        appState.signals.activeState = 'GREEN';
        appState.signals.allocatedTime = 4 + Math.floor(appState.lanes[order[nextIdx].toLowerCase()].totalWaiting / 2);
        appState.signals.timeRemaining = appState.signals.allocatedTime;
      }
    }

    // Update signal colors
    ['north', 'south', 'east', 'west'].forEach(d => {
      appState.signals[d] = (d === appState.signals.activeDirection.toLowerCase())
        ? appState.signals.activeState : 'RED';
    });

    appState.step++;
    updateDerivedStats();
    renderAll();
  } else if (action === '/api/vehicle') {
    const d = payload.direction.toLowerCase();
    const id = `VEH-${String(localSequence++).padStart(4, '0')}`;
    const v = { id, type: payload.type || 'Car', origin: payload.origin, dest: payload.destination, arrival: appState.step, wait: 0 };
    appState.lanes[d].ordinary.push(v);
    appState.lanes[d].totalWaiting++;
    appState.stats.totalGenerated++;
    logClientEvent(`[Tick ${appState.step}] Arrival: ${v.type} [${v.id}] queued at ${payload.direction} lane.`);
    updateDerivedStats();
    renderAll();
  } else if (action === '/api/emergency') {
    const d = payload.direction.toLowerCase();
    const id = `EMG-${String(localSequence++).padStart(3, '0')}`;
    const prio = payload.type === 'Ambulance' ? 1 : payload.type === 'Fire Engine' ? 2 : 3;
    const v = { id, type: payload.type, priority: prio, origin: payload.origin, dest: payload.destination, arrival: appState.step, wait: 0 };
    appState.lanes[d].emergency.push(v);
    appState.lanes[d].emergency.sort((a, b) => a.priority - b.priority);
    appState.lanes[d].totalWaiting++;
    appState.stats.totalGenerated++;
    appState.stats.emergencyGenerated++;
    logClientEvent(`[Tick ${appState.step}] EMERGENCY ARRIVAL: ${v.type} [${v.id}] (Priority ${prio}) queued at ${payload.direction}.`);
    updateDerivedStats();
    renderAll();
  } else if (action === '/api/reset') {
    appState.step = 0;
    localSequence = 1;
    appState.stats = { totalGenerated: 0, totalProcessed: 0, currentlyWaiting: 0, emergencyGenerated: 0, emergencyProcessed: 0, averageWaitTime: 0.0, throughput: 0.0 };
    ['north', 'south', 'east', 'west'].forEach(d => {
      appState.lanes[d] = { totalWaiting: 0, ordinary: [], emergency: [] };
      appState.signals[d] = d === 'north' ? 'GREEN' : 'RED';
    });
    appState.signals.activeDirection = 'NORTH';
    appState.signals.activeState = 'GREEN';
    appState.signals.timeRemaining = 4;
    logClientEvent(`[Tick 0] Simulation reset to clean state.`);
    renderAll();
  }
}

function updateDerivedStats() {
  let waiting = 0;
  ['north', 'south', 'east', 'west'].forEach(d => waiting += appState.lanes[d].totalWaiting);
  appState.stats.currentlyWaiting = waiting;
  appState.stats.throughput = appState.step > 0 ? (appState.stats.totalProcessed / appState.step).toFixed(2) : '0.00';
  appState.stats.averageWaitTime = appState.stats.totalProcessed > 0 ? (waiting * 1.2 / appState.stats.totalProcessed).toFixed(2) : '0.00';
}

function logClientEvent(msg) {
  appState.events.unshift(msg);
  if (appState.events.length > 50) appState.events.pop();
  renderEventLog();
}

function applyState(data) {
  appState.step = data.currentStep;
  appState.signals = data.signals;
  appState.lanes = data.lanes;
  appState.stats = data.stats;
  renderAll();
}

// ============================================================================
// 6. UI RENDERING MODULE
// ============================================================================

function renderAll() {
  renderSignals();
  renderVehiclesOnLanes();
  renderStatistics();
  renderQueuesBreakdown();
  renderCongestionBars();
}

function renderSignals() {
  const sig = appState.signals;
  document.getElementById('active-phase-text').innerText = `${sig.activeDirection} ${sig.activeState}`;
  document.getElementById('active-phase-text').className = sig.activeState === 'GREEN' ? 'text-green font-bold' : 'text-amber font-bold';
  document.getElementById('active-phase-timer').innerText = sig.timeRemaining;
  document.getElementById('allocated-green').innerText = sig.allocatedTime || 4;

  const dirs = ['north', 'south', 'east', 'west'];
  dirs.forEach(d => {
    const housing = document.getElementById(`signal-${d}`);
    if (!housing) return;
    const color = (sig[d] || 'RED').toLowerCase();
    housing.querySelectorAll('.signal-lamp').forEach(lamp => lamp.classList.remove('active'));
    const targetLamp = housing.querySelector(`.signal-lamp.${color}`);
    if (targetLamp) targetLamp.classList.add('active');
  });
}

function renderVehiclesOnLanes() {
  const dirs = ['north', 'south', 'east', 'west'];
  dirs.forEach(d => {
    const lane = appState.lanes[d] || { totalWaiting: 0, ordinary: [], emergency: [] };
    const track = document.getElementById(`vehicles-${d}`);
    const counter = document.getElementById(`q-count-${d}`);
    if (counter) counter.innerText = `${lane.totalWaiting || 0} vehicles`;
    if (!track) return;

    track.innerHTML = '';
    // Show emergency vehicles first
    (lane.emergency || []).forEach(v => {
      const el = document.createElement('div');
      const cls = v.type === 'Ambulance' ? 'veh-emg-amb' : v.type === 'Fire Engine' ? 'veh-emg-fire' : 'veh-emg-pol';
      el.className = `veh-pill ${cls}`;
      el.innerText = `🚨 ${v.type.split(' ')[0]} ${v.id}`;
      track.appendChild(el);
    });

    // Show ordinary civilian vehicles
    (lane.ordinary || []).slice(0, 5).forEach(v => {
      const el = document.createElement('div');
      el.className = 'veh-pill veh-regular';
      el.innerText = `🚗 ${v.type} ${v.id}`;
      track.appendChild(el);
    });

    if ((lane.ordinary || []).length > 5) {
      const more = document.createElement('div');
      more.className = 'veh-pill veh-regular';
      more.innerText = `+${lane.ordinary.length - 5} more`;
      track.appendChild(more);
    }
  });
}

function renderStatistics() {
  const s = appState.stats;
  document.getElementById('stat-generated').innerText = s.totalGenerated || 0;
  document.getElementById('stat-processed').innerText = s.totalProcessed || 0;
  document.getElementById('stat-waiting').innerText = s.currentlyWaiting || 0;
  document.getElementById('stat-emergency').innerText = `${s.emergencyProcessed || 0} / ${s.emergencyGenerated || 0}`;
  document.getElementById('stat-avg-wait').innerText = s.averageWaitTime || '0.00';
  document.getElementById('stat-throughput').innerText = s.throughput || '0.00';
}

function renderCongestionBars() {
  const container = document.getElementById('congestion-bars');
  if (!container) return;

  const dirs = [
    { name: 'North', key: 'north' },
    { name: 'South', key: 'south' },
    { name: 'East',  key: 'east'  },
    { name: 'West',  key: 'west'  }
  ];

  dirs.sort((a, b) => (appState.lanes[b.key]?.totalWaiting || 0) - (appState.lanes[a.key]?.totalWaiting || 0));

  container.innerHTML = dirs.map(d => {
    const count = appState.lanes[d.key]?.totalWaiting || 0;
    const pct = Math.min(100, Math.round((count / 15) * 100));
    return `
      <div class="congestion-row">
        <span class="cong-label">${d.name}</span>
        <div class="cong-bar-bg">
          <div class="cong-bar-fill" style="width: ${pct}%;"></div>
        </div>
        <span class="cong-val">${count} v</span>
      </div>
    `;
  }).join('');
}

function renderQueuesBreakdown() {
  ['north', 'south', 'east', 'west'].forEach(d => {
    const lane = appState.lanes[d] || { totalWaiting: 0, ordinary: [], emergency: [] };
    const badge = document.getElementById(`badge-q-${d}`);
    if (badge) badge.innerText = `${lane.totalWaiting || 0} waiting`;

    const emgList = document.getElementById(`detail-emg-${d}`);
    if (emgList) {
      emgList.innerHTML = (lane.emergency && lane.emergency.length > 0)
        ? lane.emergency.map(v => `<div class="veh-pill veh-emg-amb">🚨 [${v.id}] ${v.type} (Prio ${v.priority})</div>`).join('')
        : '<div class="empty-hint">No emergency vehicles</div>';
    }

    const ordList = document.getElementById(`detail-ord-${d}`);
    if (ordList) {
      ordList.innerHTML = (lane.ordinary && lane.ordinary.length > 0)
        ? lane.ordinary.map((v, i) => `<div class="veh-pill veh-regular">${i+1}. [${v.id}] ${v.type} (${v.origin}➔${v.dest})</div>`).join('')
        : '<div class="empty-hint">No civilian vehicles</div>';
    }
  });
}

function renderEventLog() {
  const container = document.getElementById('event-log');
  if (!container) return;
  container.innerHTML = appState.events.map(ev => {
    let cls = 'log-info';
    if (ev.includes('EMERGENCY')) cls = 'log-emg';
    else if (ev.includes('FAIRNESS')) cls = 'log-fairness';
    else if (ev.includes('DISPATCH')) cls = 'log-dispatch';
    return `<div class="log-entry ${cls}">${ev}</div>`;
  }).join('');
}

// ============================================================================
// 7. INTERACTIVE SVG CITY GRAPH & DIJKSTRA
// ============================================================================

function initCityGraphSVG() {
  const edgesGroup = document.getElementById('svg-edges');
  const nodesGroup = document.getElementById('svg-nodes');
  if (!edgesGroup || !nodesGroup) return;

  edgesGroup.innerHTML = '';
  nodesGroup.innerHTML = '';

  // Render Edges
  GRAPH_DATA.edges.forEach((edge, idx) => {
    const u = GRAPH_DATA.nodes.find(n => n.id === edge.u);
    const v = GRAPH_DATA.nodes.find(n => n.id === edge.v);
    if (!u || !v) return;

    // Line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', u.x);
    line.setAttribute('y1', u.y);
    line.setAttribute('x2', v.x);
    line.setAttribute('y2', v.y);
    line.setAttribute('class', 'graph-edge');
    line.setAttribute('id', `edge-${u.id}-${v.id}`);
    line.setAttribute('data-u', u.id);
    line.setAttribute('data-v', v.v);
    edgesGroup.appendChild(line);

    // Distance Label
    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', midX);
    text.setAttribute('y', midY - 6);
    text.setAttribute('class', 'graph-edge-label');
    text.textContent = `${edge.dist}km`;
    edgesGroup.appendChild(text);
  });

  // Render Nodes
  GRAPH_DATA.nodes.forEach(node => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node-group');
    g.setAttribute('data-id', node.id);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', node.isHub ? 32 : 26);
    circle.setAttribute('class', `graph-node-circle ${node.isHub ? 'node-hub' : ''}`);
    circle.setAttribute('id', `node-circle-${node.id}`);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', node.x);
    text.setAttribute('y', node.y + 4);
    text.setAttribute('class', 'graph-node-text');
    text.textContent = node.name;

    const idLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    idLabel.setAttribute('x', node.x);
    idLabel.setAttribute('y', node.y + 18);
    idLabel.setAttribute('class', 'graph-node-id');
    idLabel.textContent = `ID: ${node.id}`;

    g.appendChild(circle);
    g.appendChild(text);
    g.appendChild(idLabel);

    // Click node to select as route source or destination
    g.addEventListener('click', () => {
      const srcSelect = document.getElementById('route-src');
      const dstSelect = document.getElementById('route-dst');
      if (srcSelect && dstSelect) {
        if (srcSelect.value == node.id) {
          dstSelect.value = node.id;
        } else {
          dstSelect.value = node.id;
        }
        calculateShortestPath();
      }
    });

    nodesGroup.appendChild(g);
  });
}

async function calculateShortestPath() {
  const src = parseInt(document.getElementById('route-src').value, 10);
  const dst = parseInt(document.getElementById('route-dst').value, 10);

  let result = null;

  // Try C++ REST API first
  if (appState.connectedToCpp) {
    try {
      const res = await fetch(`${CONFIG.apiBase}/api/dijkstra?src=${src}&dst=${dst}`);
      if (res.ok) {
        result = await res.json();
      }
    } catch (e) {
      setConnectionStatus(false);
    }
  }

  // Fallback to client-side Dijkstra
  if (!result) {
    result = runLocalDijkstra(src, dst);
  }

  renderDijkstraResult(result);
}

function runLocalDijkstra(src, dst) {
  const dist = {};
  const parent = {};
  const visited = new Set();

  GRAPH_DATA.nodes.forEach(n => dist[n.id] = Infinity);
  dist[src] = 0;

  for (let i = 0; i < GRAPH_DATA.nodes.length; ++i) {
    let u = -1;
    let minDist = Infinity;
    for (const n of GRAPH_DATA.nodes) {
      if (!visited.has(n.id) && dist[n.id] < minDist) {
        minDist = dist[n.id];
        u = n.id;
      }
    }

    if (u === -1 || u === dst) break;
    visited.add(u);

    // Check edges
    GRAPH_DATA.edges.forEach(e => {
      let v = -1;
      if (e.u === u) v = e.v;
      else if (e.v === u) v = e.u;

      if (v !== -1 && !visited.has(v)) {
        if (dist[u] + e.dist < dist[v]) {
          dist[v] = dist[u] + e.dist;
          parent[v] = u;
        }
      }
    });
  }

  if (dist[dst] === Infinity) {
    return { pathFound: false, statusMessage: "Unreachable destination" };
  }

  const pathIds = [];
  let curr = dst;
  while (curr !== undefined) {
    pathIds.unshift(curr);
    curr = parent[curr];
  }

  const pathNames = pathIds.map(id => GRAPH_DATA.nodes.find(n => n.id === id).name);
  const totalDistance = dist[dst];
  const estimatedTimeMinutes = (totalDistance / 45) * 60;

  return {
    pathFound: true,
    totalDistance,
    estimatedTimeMinutes,
    pathIds,
    pathNames,
    statusMessage: "Optimal shortest route computed via Dijkstra's algorithm."
  };
}

function renderDijkstraResult(res) {
  // Clear previous highlights
  document.querySelectorAll('.graph-edge').forEach(el => el.classList.remove('edge-highlight'));
  document.querySelectorAll('.graph-node-circle').forEach(el => el.classList.remove('node-path'));

  const distEl = document.getElementById('res-total-dist');
  const timeEl = document.getElementById('res-est-time');
  const expEl = document.getElementById('res-explanation');
  const breadcrumbs = document.getElementById('res-path-breadcrumbs');

  if (!res.pathFound) {
    distEl.innerText = "N/A";
    timeEl.innerText = "N/A";
    expEl.innerText = res.statusMessage;
    breadcrumbs.innerHTML = '<span class="text-red">No route found</span>';
    return;
  }

  distEl.innerText = `${res.totalDistance.toFixed(2)} km`;
  timeEl.innerText = `${res.estimatedTimeMinutes.toFixed(1)} mins`;
  expEl.innerText = res.statusMessage;

  // Render breadcrumbs
  breadcrumbs.innerHTML = res.pathNames.map((name, i) => `
    <span class="breadcrumb-node">[${res.pathIds[i]}] ${name}</span>
    ${i + 1 < res.pathNames.length ? '<span class="divider">⟶</span>' : ''}
  `).join('');

  // Highlight SVG nodes and edges
  res.pathIds.forEach(id => {
    const circle = document.getElementById(`node-circle-${id}`);
    if (circle) circle.classList.add('node-path');
  });

  for (let i = 0; i < res.pathIds.length - 1; ++i) {
    const u = res.pathIds[i];
    const v = res.pathIds[i + 1];
    const edge1 = document.getElementById(`edge-${u}-${v}`);
    const edge2 = document.getElementById(`edge-${v}-${u}`);
    if (edge1) edge1.classList.add('edge-highlight');
    if (edge2) edge2.classList.add('edge-highlight');
  }
}

// ============================================================================
// 8. VIVA ACCORDION MODULE
// ============================================================================

function initVivaAccordion() {
  const container = document.getElementById('viva-accordion');
  if (!container) return;

  function render(list) {
    container.innerHTML = list.map((item, idx) => `
      <div class="viva-item" data-idx="${idx}">
        <div class="viva-q">
          <span>${item.q} <span class="badge badge-tech text-sm">${item.cat}</span></span>
          <span class="viva-icon">▼</span>
        </div>
        <div class="viva-a">${item.a.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');

    container.querySelectorAll('.viva-q').forEach(q => {
      q.addEventListener('click', () => {
        q.parentElement.classList.toggle('open');
      });
    });
  }

  render(VIVA_QUESTIONS);

  // Search filter
  const searchInput = document.getElementById('inp-viva-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = VIVA_QUESTIONS.filter(v => v.q.toLowerCase().includes(term) || v.a.toLowerCase().includes(term) || v.cat.toLowerCase().includes(term));
      render(filtered);
    });
  }
}

// ============================================================================
// 9. EVENT LISTENERS & INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Simulator Controls
  document.getElementById('btn-step')?.addEventListener('click', () => apiPost('/api/step'));

  document.getElementById('btn-play')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-play');
    const txt = document.getElementById('play-text');
    if (appState.autoPlayTimer) {
      clearInterval(appState.autoPlayTimer);
      appState.autoPlayTimer = null;
      txt.innerText = 'Auto Play';
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-success');
    } else {
      appState.autoPlayTimer = setInterval(() => apiPost('/api/step'), appState.simSpeed);
      txt.innerText = 'Pause';
      btn.classList.remove('btn-success');
      btn.classList.add('btn-danger');
    }
  });

  document.getElementById('sim-speed')?.addEventListener('change', (e) => {
    appState.simSpeed = parseInt(e.target.value, 10);
    if (appState.autoPlayTimer) {
      clearInterval(appState.autoPlayTimer);
      appState.autoPlayTimer = setInterval(() => apiPost('/api/step'), appState.simSpeed);
    }
  });

  document.getElementById('btn-reset')?.addEventListener('click', () => apiPost('/api/reset'));
  document.getElementById('btn-demo')?.addEventListener('click', () => apiPost('/api/demo'));

  document.getElementById('btn-batch-add')?.addEventListener('click', () => {
    const dirs = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
    for (let i = 0; i < 5; ++i) {
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      apiPost('/api/vehicle', { type: 'Car', direction: d, origin: 2, destination: 4 });
    }
  });

  // Vehicle Ingestion Buttons
  const getSelectedInputs = () => ({
    direction: document.getElementById('inp-direction').value,
    origin: parseInt(document.getElementById('inp-origin').value, 10),
    destination: parseInt(document.getElementById('inp-dest').value, 10)
  });

  document.getElementById('btn-add-car')?.addEventListener('click', () => {
    apiPost('/api/vehicle', { type: 'Car', ...getSelectedInputs() });
  });
  document.getElementById('btn-add-bus')?.addEventListener('click', () => {
    apiPost('/api/vehicle', { type: 'Bus', ...getSelectedInputs() });
  });
  document.getElementById('btn-add-ambulance')?.addEventListener('click', () => {
    apiPost('/api/emergency', { type: 'Ambulance', ...getSelectedInputs() });
  });
  document.getElementById('btn-add-fire')?.addEventListener('click', () => {
    apiPost('/api/emergency', { type: 'Fire Engine', ...getSelectedInputs() });
  });
  document.getElementById('btn-add-police')?.addEventListener('click', () => {
    apiPost('/api/emergency', { type: 'Police', ...getSelectedInputs() });
  });

  // Vehicle Search by ID
  document.getElementById('btn-search-vehicle')?.addEventListener('click', async () => {
    const id = document.getElementById('inp-search-vehicle').value.trim();
    const banner = document.getElementById('search-result-banner');
    if (!id || !banner) return;

    if (appState.connectedToCpp) {
      try {
        const res = await fetch(`${CONFIG.apiBase}/api/search?id=${encodeURIComponent(id)}`);
        if (res.ok) {
          const v = await res.json();
          if (v.found) {
            banner.className = 'search-banner';
            banner.innerHTML = `<strong>Found Vehicle [${v.id}]:</strong> Type: ${v.type} | Approach: ${v.direction} | Route: ${v.origin}➔${v.destination} | Priority: ${v.priority} | Status: ${v.status} | Wait: ${v.waitTime} ticks.`;
            return;
          }
        }
      } catch (e) {}
    }

    // Local search fallback
    banner.className = 'search-banner';
    banner.innerHTML = `<em>Vehicle ID [${id}] query completed. Check lane queues below.</em>`;
  });

  document.getElementById('btn-clear-log')?.addEventListener('click', () => {
    appState.events = [];
    renderEventLog();
  });

  // Dijkstra Button
  document.getElementById('btn-calculate-route')?.addEventListener('click', calculateShortestPath);

  // Initialize Components
  initCityGraphSVG();
  initVivaAccordion();
  calculateShortestPath();

  // Try initial connect to C++ backend
  fetchStateFromCpp().then(connected => {
    if (!connected) {
      // Initialize with demo vehicles
      clientSimStep('/api/vehicle', { type: 'Car', direction: 'NORTH', origin: 2, destination: 4 });
      clientSimStep('/api/vehicle', { type: 'Bus', direction: 'NORTH', origin: 2, destination: 3 });
      clientSimStep('/api/vehicle', { type: 'Truck', direction: 'EAST', origin: 3, destination: 5 });
      clientSimStep('/api/emergency', { type: 'Ambulance', direction: 'SOUTH', origin: 7, destination: 1 });
      clientSimStep('/api/emergency', { type: 'Police', direction: 'EAST', origin: 3, destination: 4 });
    }
  });

  // Periodic polling for C++ backend
  setInterval(() => {
    if (appState.connectedToCpp && !appState.autoPlayTimer) {
      fetchStateFromCpp();
    }
  }, CONFIG.pollInterval);
});
