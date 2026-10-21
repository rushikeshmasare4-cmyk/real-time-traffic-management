# PROJECT REPORT: FLOWGRID — REAL-TIME URBAN TRAFFIC MANAGEMENT SYSTEM

**Department of Computer Science & Engineering**  
**Academic Mini Project Report on Data Structures and Algorithms (C++17)**

---

## 1. Title
**FLOWGRID — Real-Time Urban Traffic Management System: An Algorithmic Simulation of Road Network Routing, Emergency Prioritization, and Adaptive Signal Control**

---

## 2. Abstract
Urban traffic congestion leads to substantial economic losses, fuel wastage, and hazardous delays for emergency services. Traditional traffic signal systems operate on rigid, fixed-time schedules that fail to adapt to fluctuating traffic demand, creating unnecessary gridlock while empty approaches receive unutilized green signals. 

This project presents **FLOWGRID**, a modular, high-performance C++17 simulation platform demonstrating how classical Data Structures and Algorithms (DSA) solve urban transit challenges. FLOWGRID models a municipal road grid using an **Adjacency-List Graph**, computes optimal travel corridors via **Dijkstra's Shortest Path Algorithm**, manages ordinary civilian vehicle queues using **FIFO Queues**, dispatches critical emergency response units (Ambulances, Fire Engines, Police) via a **Binary Min-Heap Priority Queue**, and dynamically schedules traffic lights using an **Adaptive Signal Timing Algorithm** with built-in starvation prevention. The system includes an interactive terminal dashboard, real-time metrics tracking, fast $O(1)$ vehicle search, and 14 automated verification tests demonstrating 100% pass rates.

---

## 3. Problem Statement
Modern urban transportation networks suffer from three fundamental inefficiencies:
1. **Static Signal Control:** Fixed-duration traffic lights cannot respond to sudden surges in traffic density, causing long vehicle queues and unnecessary idle delays on empty lanes.
2. **Emergency Vehicle Starvation & Blocking:** Ambulances and fire engines are frequently impeded behind civilian traffic queues due to the lack of algorithmic priority scheduling at signalized intersections.
3. **Inefficient Routing:** Drivers lack algorithmic shortest-path guidance that accounts for intersection connectivity and road network topology.

A software simulation is required to model these interactions, demonstrate algorithmic solutions, and provide a verified, reproducible educational testbed without requiring paid proprietary APIs or specialized field hardware.

---

## 4. Objectives
The primary objectives of the FLOWGRID project are:
- To implement and demonstrate **at least three core data structures** (FIFO Queue, Priority Queue, Graph) in an integrated, meaningful municipal application.
- To implement **Dijkstra's Shortest Path Algorithm** for point-to-point urban routing with step-by-step path reconstruction.
- To implement an **Adaptive Signal Controller** that dynamically adjusts green duration based on real-time queue lengths while strictly preventing conflicting green phases.
- To design a deterministic **Emergency Priority Scheduling Policy** with monotonic sequence tie-breaking and starvation safeguards for civilian traffic.
- To provide live, non-fabricated **traffic performance statistics** (throughput, average wait time, queue lengths).
- To create a comprehensive, robust test suite verifying correctness, edge cases, and safety invariants.

---

## 5. Existing System vs. Proposed System

| Dimension | Existing Conventional System | Proposed FLOWGRID System |
| :--- | :--- | :--- |
| **Signal Scheduling** | Fixed-time cycle timers (e.g., 30s per lane regardless of queue length). | Adaptive dynamic scheduling based on approaching queue length with safety caps. |
| **Emergency Handling** | Manual visual siren spotting; often trapped behind long civilian queues. | Automated Min-Heap priority scheduling with emergency right-of-way. |
| **Fairness / Anti-Starvation** | No formal fairness; high emergency volume can freeze ordinary traffic. | Dual fairness rule: bypass after 3 emergency dispatches or $\ge 5$ ticks delay. |
| **Network Routing** | Drivers follow static intuition or commercial cloud apps requiring internet. | Integrated offline Dijkstra routing engine using topological graph data. |
| **Vehicle Tracking** | No real-time queue state or waiting timestamp monitoring. | Instantaneous $O(1)$ vehicle registry tracking lifecycle and wait steps. |
| **Verification & Testing** | Often untested academic prototypes with hardcoded demo output. | Comprehensive 14-test automated suite verifying all mathematical invariants. |

---

## 6. System Architecture

FLOWGRID is architected around a modular Facade Pattern. The central `TrafficManager` coordinates specialized domain modules:

```
+-------------------------------------------------------------------------+
|                               FLOWGRID                                  |
|                      Terminal User Interface (main)                     |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         TrafficManager (Facade)                         |
+-------------------------------------------------------------------------+
       |                  |                   |                 |
       v                  v                   v                 v
+--------------+  +-----------------+  +--------------+  +--------------+
| RoadNetwork  |  | TrafficSignal   |  | Lane Systems |  | Statistics & |
| (Graph &     |  | Controller      |  | (FIFO Queues |  | Event Logger |
|  Dijkstra)   |  | (Adaptive Auto) |  |  & Min-Heap) |  | (Deque/Hash) |
+--------------+  +-----------------+  +--------------+  +--------------+
```

### Module Roles:
1. **`Vehicle`**: Represents transport units with unique IDs, types, priorities, arrival/departure timestamps, and lifecycle states (`WAITING`, `IN_TRANSIT`, `COMPLETED`).
2. **`VehicleQueue` (`VehicleFIFOQueue` & `EmergencyPriorityQueue`)**: Manages the dual-lane queuing architecture.
3. **`RoadNetwork`**: Manages the topological graph, intersections (vertices), roads (edges), and shortest-path calculations.
4. **`TrafficSignalController`**: Manages the 4-way signal state machine (GREEN, YELLOW, RED), enforces safety invariants, and computes adaptive green durations.
5. **`Statistics`**: Aggregates live operational counters and computes throughput, average delay, and conservation invariants.

---

## 7. Data Structures Used

### 7.1 Data Structure A: Custom FIFO Queue (`VehicleFIFOQueue`)
- **Structure:** Singly-linked list with dedicated `head` and `tail` pointers.
- **Role:** Holds ordinary civilian vehicles (Cars, Buses, Trucks) in exact arrival order.
- **Operations:** `enqueue()` ($O(1)$), `dequeue()` ($O(1)$), `peek()` ($O(1)$), `isEmpty()` ($O(1)$).
- **Safety:** Employs `std::unique_ptr` for automatic, leak-free memory management.

### 7.2 Data Structure B: Custom Binary Min-Heap Priority Queue (`EmergencyPriorityQueue`)
- **Structure:** Vector-backed complete binary tree satisfying min-heap ordering.
- **Role:** Dispatches emergency vehicles based on urgency: Ambulance (1) > Fire Engine (2) > Police (3).
- **Tie-Breaking:** Monotonically increasing sequence numbers break ties deterministically.
- **Operations:** `push()` ($O(\log N)$), `pop()` ($O(\log N)$), `peek()` ($O(1)$).

### 7.3 Data Structure C: Graph via Adjacency List (`RoadNetwork`)
- **Structure:** `std::unordered_map<int, Intersection>` where each vertex contains `std::vector<RoadEdge>`.
- **Role:** Models the city road grid. Vertices represent intersections; edges represent road segments with distance, speed limits, and travel costs.
- **Space Efficiency:** $O(V + E)$, optimal for sparse urban topologies.

### 7.4 Supplementary Data Structures
- **Hash Table (`std::unordered_map<std::string, Vehicle>`):** Maps vehicle IDs to `Vehicle` records for instantaneous $O(1)$ search.
- **Bounded Deque (`std::deque<std::string>`):** Implements a circular buffer of the most recent 50 system events with $O(1)$ insertion and pop-front eviction.
- **Dynamic Arrays (`std::vector`):** Utilized for path reconstructions, queue snapshots, and sorting buffers.

---

## 8. Algorithms Used

### 8.1 Dijkstra's Shortest Path Algorithm
Computes the least-distance path between any two intersections:
- **Priority Queue Formulation:** Utilizes a min-heap storing pairs `(accumulated_cost, vertex_id)`.
- **Edge Relaxation:**
  $$\text{if } \text{dist}[u] + \text{weight}(u, v) < \text{dist}[v] \implies \text{dist}[v] = \text{dist}[u] + \text{weight}(u, v)$$
- **Complexity:** $O((V + E) \log V)$ time and $O(V)$ space.
- **Features:** Gracefully detects unreachable vertices and returns detailed step-by-step route descriptions.

### 8.2 Adaptive Traffic Signal Scheduling
- **Phase Sequence:** Cyclic single-approach green rotation: $\text{North} \rightarrow \text{East} \rightarrow \text{South} \rightarrow \text{West}$.
- **Clearance Interval:** A strict 2-second Yellow phase between direction switches.
- **Dynamic Green Calculation:**
  $$T_{\text{green}} = \text{clamp}\left(T_{\text{base}} + \left\lfloor \frac{L}{2} \right\rfloor, T_{\text{min}}, T_{\text{max}}\right)$$
  Where $L$ is the queue length of the approaching lane.
- **Safety Invariant:** Never permits two conflicting approaches to show non-RED signals simultaneously.

### 8.3 Starvation Prevention & Fairness Algorithm
- **Problem:** Uninterrupted emergency vehicle arrivals can permanently starve civilian vehicles.
- **Solution:** Enforces a dual-trigger bypass rule:
  1. If 3 consecutive emergency vehicles have been cleared from a lane, the next slot is granted to civilian traffic.
  2. If the front civilian vehicle has waited $\ge 5$ simulation steps, it receives an immediate priority bypass.

### 8.4 Searching and Sorting
- **Vehicle Search:** $O(1)$ average time hash lookup by Vehicle ID.
- **Traffic Sorting:** $O(N \log N)$ Introsort (`std::sort`) ranking approaches by queue size and ranking vehicles by elapsed wait steps.

---

## 9. Implementation Details

- **Language:** C++17 (compiled using MinGW-w64 GCC 14.2.0).
- **Build System:** CMake 3.31.5.
- **Compilation Flags:** `-std=c++17 -Wall -Wextra -pedantic` (0 errors, 0 warnings).
- **Safety & Standards:** Zero raw pointers for dynamic ownership; memory managed via `std::unique_ptr` and STL RAII containers.
- **Portability:** Builds cleanly on Windows, Linux, and macOS without platform-specific system calls or external dependencies.

---

## 10. Test Cases and Observed Results

A standalone verification suite (`tests/tests.cpp`) was compiled and executed. All 14 test cases passed successfully:

| Test ID | Test Case Name | Objective | Observed Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | FIFO Queue Insertion & Removal | Verify strict arrival order (V1, V2, V3) and size tracking. | Dequeued in exact arrival order; size=0 on empty. | **PASS** |
| **TC-02** | Empty Queue Handling | Verify safe failure on empty queue operations. | Dequeue and peek safely return false; no crashes. | **PASS** |
| **TC-03** | Emergency Priority Ordering | Verify Ambulance (1) > Fire (2) > Police (3) ordering. | Pop order: Ambulance $\rightarrow$ Fire $\rightarrow$ Police. | **PASS** |
| **TC-04** | Emergency Sequence Tie-Breaking| Verify earlier arrival sequence breaks priority ties. | Earlier sequence number dispatched first. | **PASS** |
| **TC-05** | Graph Construction | Verify vertex and edge insertion and degree tracking. | Vertices: 3, Out-degrees correctly match connectivity. | **PASS** |
| **TC-06** | Dijkstra Shortest Path | Compute shortest path between Node 1 and Node 6. | Optimal route 1 $\rightarrow$ 2 $\rightarrow$ 6 (6.6 km) found. | **PASS** |
| **TC-07** | Unreachable Destinations | Test routing to an isolated disconnected intersection. | `pathFound = false`; descriptive message generated. | **PASS** |
| **TC-08** | Signal Phase Transitions | Verify Green $\rightarrow$ Yellow $\rightarrow$ Next Green cycle. | Transitions at exact allocated timestamps. | **PASS** |
| **TC-09** | Conflicting Green Prevention | Verify safety invariant across 100 continuous steps. | Non-active directions remained strictly RED. | **PASS** |
| **TC-10** | Vehicle Arrival/Departure Count| Verify conservation law: Generated == Processed + Waiting. | Generated: 4, Processed: 4, Waiting: 0. Strict match. | **PASS** |
| **TC-11** | Statistics Calculations | Verify wait time and throughput math from actual events. | Average wait time = 4.0, Throughput = 0.2. Match. | **PASS** |
| **TC-12** | Invalid Input Handling | Test rejection of negative or illogical signal timings. | Invalid configs rejected; non-existent search returns null. | **PASS** |
| **TC-13** | Simulation Reset | Verify restoration of clean state from dirty state. | Steps, counters, queues, and registry zeroed out. | **PASS** |
| **TC-14** | Deterministic Reproducibility | Verify identical runs with fixed pseudo-random seeds. | Two independent instances produced identical counts. | **PASS** |

**Summary: 14 Executed, 14 Passed, 0 Failed.**

---

## 11. Sample Output

### 11.1 4-Way Intersection Terminal Dashboard
```
======================================================================
                 FLOWGRID 4-WAY INTERSECTION DASHBOARD                
======================================================================
 Simulation Step: 0 | Active Phase: NORTH GREEN (4s left of 4s allocated)
 Safety Status  : PASS (No Conflicting Greens)
----------------------------------------------------------------------
                        |   NORTH APPROACH   |
                        |   Signal: [GREEN ]  |
                        |   Queue :  2 v      |
                        |   Emg   :  0 v      |
   ---------------------+                    +---------------------
   WEST APPROACH        |                    |        EAST APPROACH
   Signal: [ RED  ]    |   CENTRAL SQUARE   |   Signal: [ RED  ]
   Queue :  1 v         |                    |   Queue :  3 v
   Emg   :  0 v         |    (Node ID: 1)    |   Emg   :  1 v
   ---------------------+                    +---------------------
                        |   SOUTH APPROACH   |
                        |   Signal: [ RED  ]  |
                        |   Queue :  2 v      |
                        |   Emg   :  2 v      |
======================================================================
```

### 11.2 Dijkstra Routing Sample Output
```
[✓] Optimal Path Found:
    Route: North Gate (ID 2) -> Central Square (ID 1) -> South Terminal (ID 4)
    Total Physical Distance: 5.30 km
    Estimated Urban Transit: 7.1 minutes
    Algorithm Explanation  : Optimal route successfully computed via Dijkstra's algorithm.
```

### 11.3 Traffic Statistics Performance Report
```
==============================================================
                 FLOWGRID TRAFFIC PERFORMANCE REPORT          
==============================================================
 Simulation Ticks Completed : 8
 Active Signal Phase Status : EAST GREEN (3s left)
--------------------------------------------------------------
 Total Vehicles Generated   : 8
 Total Vehicles Processed   : 4
 Vehicles Currently Waiting : 4
 Emergency Vehicles Handled : 0 / 3
 Average Vehicle Wait Time  : 3.50 time steps
 Intersection Throughput    : 0.50 vehicles / step
 Most Congested Approach    : SOUTH (2 vehicles queued)
--------------------------------------------------------------
 CURRENT APPROACH QUEUES:
  - NORTH  Queue: 0 vehicles []
  - SOUTH  Queue: 2 vehicles [##]
  - EAST   Queue: 1 vehicles [#]
  - WEST   Queue: 1 vehicles [#]
==============================================================
```

---

## 12. Limitations
1. **Isolated Central Intersection Focus:** The detailed queue and signal simulator models one primary central 4-way intersection; network-wide signal coordination across all intersections is not fully simulated.
2. **Discrete Time Stepping:** Vehicles move in discrete time steps (1 vehicle per green tick) rather than micro-simulating acceleration curves, vehicle lengths, and braking physics.
3. **Static Turn Ratios:** Vehicles select origin and destination at generation rather than making real-time turn decisions based on en-route dynamic lane blockages.

---

## 13. Future Scope
1. **Network-Wide Green Waves:** Extending signal scheduling across multiple adjacent intersections using arterial coordination (green wave synchronization).
2. **Dynamic In-Transit Re-Routing (Dynamic A*):** Enabling vehicles to re-evaluate their shortest paths mid-transit when accident incidents or heavy bottlenecks occur.
3. **Machine Learning / Q-Learning Signals:** Training reinforcement learning models to adjust green phases dynamically based on historical surge trends.
4. **GUI / Web Visualization:** Coupling the C++ simulation core to a lightweight WebAssembly or OpenGL visual interface.

---

## 14. Conclusion
The FLOWGRID project successfully demonstrates that core Data Structures and Algorithms provide powerful, practical solutions to real-world urban transit challenges. By integrating FIFO Queues for lane realism, Binary Min-Heaps for emergency prioritization, Adjacency-List Graphs for road network modeling, and Dijkstra's algorithm for route optimization, FLOWGRID delivers a responsive, mathematically sound simulation. The project adheres to strict C++17 software engineering practices, maintains full offline autonomy, and provides a polished academic testbed for college demonstration and viva defense.

---

## 15. References
1. Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms* (3rd ed.). MIT Press. (Chapters on Heaps, Graph Representations, and Dijkstra's Algorithm).
2. Stroustrup, B. (2018). *A Tour of C++* (2nd ed.). Addison-Wesley Professional.
3. Roess, R. P., Prassas, E. S., & McShane, W. R. (2010). *Traffic Engineering* (4th ed.). Pearson.
4. Federal Highway Administration (FHWA). (2008). *Traffic Signal Timing Manual*. U.S. Department of Transportation.
