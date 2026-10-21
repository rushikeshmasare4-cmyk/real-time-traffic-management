# FLOWGRID — Real-Time Urban Traffic Management System

**FLOWGRID** is a high-performance, modular, college-level Data Structures and Algorithms (DSA) mini project implemented in **modern C++17**. It models urban traffic flow through graph theory, FIFO vehicle queues, binary min-heap emergency priority dispatching, and adaptive traffic signal scheduling.

> **Academic Disclaimer:** FLOWGRID is an academic simulation designed for computer science education and DSA evaluation. It models traffic dynamics deterministically using synthetic inputs and does not represent live physical GPS feeds or certified municipal road control hardware.

---

## 1. Key Features

The system implements 17 core operations accessible through an interactive terminal dashboard:

1. **Road Network Graph Display:** Adjacency-list representation of city intersections and connecting roads.
2. **Intersection & Road Inspection:** Detailed list of vertices, coordinates, speed limits, and distance costs.
3. **Vehicle Ingestion Engine:** Add single vehicles manually or simulate realistic batches (Cars, Buses, Trucks).
4. **Lane Queue Breakdown:** Inspect vehicles queued at North, South, East, and West approaches.
5. **Traffic Signal Control:** Manual stepping, batch ticks, and real-time automated simulation modes.
6. **Configurable Signal Timings:** Dynamic modification of Base Green, Clearance Yellow, Min Green, and Max Green caps within verified safety limits.
7. **Emergency Vehicle Injection:** Add Ambulances (Priority 1), Fire Engines (Priority 2), and Police Squads (Priority 3).
8. **Emergency Priority Schedule:** Display dispatch urgency rankings, tie-breaking rules, and fairness policies.
9. **Dijkstra's Shortest Path Calculation:** Computes optimal route, total distance (km), estimated transit time, and vertex path.
10. **Congestion Analysis:** Real-time visual ranking of approaches by queued vehicle density.
11. **Comprehensive Traffic Statistics:** Live metrics for total generated/processed vehicles, waiting queues, throughput, and average delay.
12. **Fast $O(1)$ Vehicle Search:** Search any vehicle by unique ID (`VEH-XXXX` or `EMG-XXX`) using an internal hash index.
13. **Data Sorting Subsystem:** Sort approaches by queue length and waiting vehicles by delay duration ($O(N \log N)$).
14. **System Event History:** Bounded circular event log recording vehicle arrivals, signal switches, and fairness overrides.
15. **Deterministic Demonstration Mode:** One-click reproducible scenario for classroom and viva presentations.
16. **Simulation State Reset:** Restores counters, queues, signals, and registry to a pristine initial state.
17. **Safe Exit:** Graceful shutdown with zero resource leaks.

### 2. Available Interfaces

FLOWGRID offers **two professional interfaces** sharing the exact same C++17 engine:

1. **🌐 Interactive Web Dashboard & DSA Visualizer:** Modern, responsive dark-mode web application featuring animated 4-way intersection visualization, interactive SVG city graph with Dijkstra path highlighting, binary heap / FIFO queue inspectors, and viva preparation tools. Powered directly by an embedded C++17 Winsock REST server.
2. **💻 Terminal Dashboard:** Classical ANSI/ASCII dashboard with interactive text menus, ideal for direct CLI evaluation.

---

## 3. Project Directory Structure

| Category | Component | Underlying DSA | Purpose & Complexity |
| :--- | :--- | :--- | :--- |
| **Data Structure A** | `VehicleFIFOQueue` | Custom Singly-Linked Node FIFO Queue | Manages ordinary civilian traffic in arrival order. $O(1)$ enqueue and dequeue. |
| **Data Structure B** | `EmergencyPriorityQueue` | Custom Binary Min-Heap | Dispatches emergency vehicles by urgency (1=Ambulance > 2=Fire > 3=Police). $O(\log N)$ push/pop, $O(1)$ peek. |
| **Data Structure C** | `RoadNetwork` | Graph using Adjacency List (`std::unordered_map<int, Intersection>`) | Models city road topology, intersections (vertices), and roads (edges). |
| **Data Structure D** | `Vehicle Registry` | Hash Map (`std::unordered_map<std::string, Vehicle>`) | Enables instantaneous $O(1)$ vehicle status search by ID. |
| **Data Structure E** | `Event Log` | Bounded Deque (`std::deque<std::string>`) | Circular buffer for the latest 50 system events with $O(1)$ push/pop. |
| **Algorithm A** | Shortest Route | Dijkstra's Algorithm | Computes least-distance paths across the road network in $O((V + E) \log V)$ time. |
| **Algorithm B** | Signal Control | Adaptive Phase Scheduling | Adjusts green duration dynamically: $T_g = \text{clamp}(\text{base} + \lfloor L / 2 \rfloor, \text{min}, \text{max})$. |
| **Algorithm C** | Starvation Prevention | Fairness Clearance Rule | Bypasses emergency priority after 3 consecutive dispatches or if front civilian vehicle waits $\ge 5$ ticks. |
| **Algorithm D** | Sorting Subsystem | Introsort (`std::sort`) | Sorts congestion rankings and vehicle waiting durations in $O(N \log N)$ time. |

---

## 3. Project Directory Structure

```
Flowgrid/
├── CMakeLists.txt          # CMake build configuration (C++17)
├── .gitignore              # Build and IDE ignore rules
├── README.md               # Project overview and instructions
├── DSA_EXPLANATION.md      # Comprehensive DSA implementation theory
├── VIVA_QUESTIONS.md       # 25+ viva interview questions and answers
├── PROJECT_REPORT.md       # 15-section college project report
├── data/
│   └── demo_network.txt    # Urban road network dataset
├── include/
│   ├── Vehicle.h           # Vehicle representation and enums
│   ├── VehicleQueue.h      # FIFO Queue, Min-Heap, and Lane classes
│   ├── RoadNetwork.h       # Graph adjacency list and Dijkstra's algorithm
│   ├── TrafficSignal.h     # 4-way signal controller with adaptive timing
│   ├── Statistics.h        # Live simulation performance metrics
│   └── TrafficManager.h    # Central orchestrator and facade
├── src/
│   ├── Vehicle.cpp
│   ├── VehicleQueue.cpp
│   ├── RoadNetwork.cpp
│   ├── TrafficSignal.cpp
│   ├── Statistics.cpp
│   ├── TrafficManager.cpp
│   └── main.cpp            # Interactive terminal dashboard UI
└── tests/
    └── tests.cpp           # 14 automated verification tests
```

---

## 4. Build and Compilation Instructions

### Prerequisites
- A modern C++17 compiler (GCC 9+, Clang 10+, or MSVC 2019+).
- CMake 3.15 or newer.
- *Recommended on Windows:* MinGW-w64 with GCC 14+.

### Build Commands (Windows PowerShell)

```powershell
# 1. Add MinGW to PATH (if not already in system PATH)
$env:PATH = "C:\Program Files\CodeBlocks\MinGW\bin;" + $env:PATH

# 2. Create and navigate to build directory
New-Item -ItemType Directory -Force -Path "build" | Out-Null
Set-Location -Path "build"

# 3. Configure project with CMake
cmake -G "MinGW Makefiles" ..

# 4. Compile project and test suite
mingw32-make -j4
```

### Build Commands (Linux / macOS)

```bash
mkdir -p build && cd build
cmake ..
make -j4
```

---

## 6. Execution Instructions

### A. Launching the Web Application (C++ Backend + Web Frontend)

```powershell
# From the project root:
$env:PATH = "C:\Program Files\CodeBlocks\MinGW\bin;" + $env:PATH
.\build\flowgrid_server.exe
```

This starts the embedded C++17 HTTP REST server on port `8080` and automatically opens your web browser to:
👉 **`http://localhost:8080`**

*(Note: You can also open [`web/index.html`](file:///c:/Users/DELL/Downloads/Flowgrid/web/index.html) directly in any browser for standalone offline mode!)*

### B. Launching the Terminal Interface

```powershell
# From the build directory:
.\build\flowgrid.exe
```

### C. Running the Automated Test Suite

```powershell
# From the build directory:
.\build\flowgrid_tests.exe
```

Expected verification output:
```
==============================================================
         FLOWGRID AUTOMATED VERIFICATION TEST SUITE           
==============================================================
[RUNNING] 1. FIFO Queue Insertion & Removal ... [PASS]
[RUNNING] 2. Empty Queue Handling ... [PASS]
[RUNNING] 3. Emergency Priority Ordering ... [PASS]
[RUNNING] 4. Emergency Sequence Tie-Breaking ... [PASS]
[RUNNING] 5. Graph Construction (Adjacency List) ... [PASS]
[RUNNING] 6. Dijkstra's Shortest Path Calculation ... [PASS]
[RUNNING] 7. Unreachable Destinations Handling ... [PASS]
[RUNNING] 8. Traffic Signal Phase Transitions ... [PASS]
[RUNNING] 9. Conflicting Green Signals Prevention ... [PASS]
[RUNNING] 10. Vehicle Arrival & Departure Counting ... [PASS]
[RUNNING] 11. Statistics & Derived Metrics Calculations ... [PASS]
[RUNNING] 12. Invalid User Input & Edge Cases Handling ... [PASS]
[RUNNING] 13. Simulation Reset to Clean Initial State ... [PASS]
[RUNNING] 14. Reproducibility of Deterministic Demo Mode ... [PASS]
==============================================================
 TEST EXECUTION SUMMARY: 14 PASSED, 0 FAILED
==============================================================
```

---

## 6. Recommended College Viva Demonstration Workflow

For an effective 5-minute college evaluation:

1. **Launch the Demo Scenario (Option 15):** Shows graph loading, Dijkstra routing, vehicle arrivals, emergency injection, and step-by-step clearance.
2. **Demonstrate Shortest Path (Option 9):** Enter Source `2` (North Gate) and Destination `4` (South Terminal). Explain how Dijkstra utilizes the min-priority queue and adjacency list.
3. **Inspect Vehicle Queues (Option 4):** Show how ordinary vehicles preserve strict arrival order (FIFO) while emergency vehicles are ordered by urgency (Min-Heap).
4. **Step Simulation & Observe Dashboard (Option 5):** Run 4-5 steps and show the active green phase, yellow transition, and non-conflicting red signals.
5. **Demonstrate Anti-Starvation Rule:** Explain how civilian traffic is never permanently blocked by emergency bursts.
6. **Review Traffic Statistics (Option 11):** Highlight average wait time, throughput, and verification that `Total Generated == Total Processed + Currently Waiting`.

---

## 7. Limitations & Future Scope

- **Isolated 4-Way Model:** The signal controller simulates a primary central junction; grid-wide networked signal coordination (green waves) is left for future work.
- **Fixed Acceleration/Deceleration:** Vehicles are processed as discrete units per tick rather than micro-simulated continuous kinematics.
- **Dynamic Re-routing:** In the current version, routes are computed upon arrival; future versions can introduce dynamic A* re-routing during active transit when sudden congestion occurs.
