# FLOWGRID — College Viva Voce Examination Questions & Answers

This document provides **28 comprehensive questions with concise, technically accurate answers** designed to prepare students for college evaluations, oral exams, and project defenses.

---

### Section 1: Project Overview & Architecture

#### Q1: What is FLOWGRID and what core problem does it address?
**Answer:** FLOWGRID is an academic urban traffic management simulator implemented in C++17. It models road networks as graphs, approaches as FIFO and Priority queues, and implements adaptive traffic signal scheduling to reduce intersection congestion and expedite emergency vehicle response while preventing civilian starvation.

#### Q2: What are the three non-negotiable core data structures used in FLOWGRID?
**Answer:**
1. **FIFO Queue:** Singly-linked list managing civilian vehicles in arrival order.
2. **Priority Queue:** Binary min-heap managing emergency vehicles (Ambulance, Fire Engine, Police).
3. **Graph:** Adjacency-list representing city intersections (vertices) and road segments (weighted edges).

#### Q3: Why is FLOWGRID built as an offline deterministic system rather than relying on live Google Maps/GPS APIs?
**Answer:** Academic evaluation requires 100% reproducibility, zero paid dependencies, offline reliability, and deterministic testability. Synthetic deterministic models ensure identical behavior across evaluations without external network latency or API rate limits.

#### Q4: What architectural design pattern does FLOWGRID follow?
**Answer:** It follows a **Modular Facade / Coordinator pattern**: `TrafficManager` serves as the facade orchestrating specialized subsystems (`RoadNetwork`, `TrafficSignalController`, `Lane`, `Statistics`, and `VehicleQueue`).

---

### Section 2: FIFO Queue Operations

#### Q5: Why is a FIFO queue appropriate for ordinary civilian traffic lanes?
**Answer:** In single-lane roadway approaches, physical constraints prevent vehicles from overtaking. The first vehicle arriving at the red signal is physically the first to exit when the signal turns green, strictly satisfying First-In, First-Out semantics.

#### Q6: How is the FIFO queue implemented in FLOWGRID, and what is its time complexity?
**Answer:** It is implemented using a custom singly-linked node list maintaining both `head` and `tail` pointers. Both `enqueue()` and `dequeue()` operate in guaranteed $O(1)$ constant time without array shifting overhead.

#### Q7: How does your FIFO queue safely handle empty states?
**Answer:** `dequeue()` and `peek()` return a boolean status (`false` when empty) and pass the retrieved vehicle by reference. This avoids undefined behavior, segmentation faults, or throwing costly exceptions when querying empty lanes.

---

### Section 3: Priority Queue & Emergency Vehicles

#### Q8: How are emergency vehicle priorities structured in FLOWGRID?
**Answer:** Using an integer level where lower numbers denote higher urgency:
- Priority 1: Ambulance (immediate life-saving urgency).
- Priority 2: Fire Engine (active disaster / structure fire response).
- Priority 3: Police Cruiser (rapid law enforcement response).
- Priority 10: Regular civilian vehicles.

#### Q9: How is the Priority Queue implemented under the hood?
**Answer:** It is implemented as a **Binary Min-Heap** stored in a contiguous dynamic array (`std::vector<Vehicle>`). It maintains the min-heap property via `siftUp()` on insertion and `siftDown()` on root extraction.

#### Q10: How does the priority queue break ties between vehicles of the same priority level?
**Answer:** When two emergency vehicles have equal priority (e.g., two Ambulances), FLOWGRID compares a monotonically increasing 64-bit `sequenceNumber` assigned at arrival. The vehicle with the smaller sequence number arrived earlier and is serviced first, preserving FIFO fairness among equals.

#### Q11: What are the time complexities of your Priority Queue operations?
**Answer:**
- Insertion (`push`): $O(\log N)$ due to tree height bubble-up.
- Extraction (`pop`): $O(\log N)$ due to root replacement and downward sifting.
- Lookup (`peek`/`top`): $O(1)$ constant time inspection of the root at index 0.

---

### Section 4: Graph Theory & Road Networks

#### Q12: How is the city road network represented in FLOWGRID?
**Answer:** As a weighted graph $G = (V, E)$ using an **Adjacency List** (`std::unordered_map<int, Intersection>`). Each `Intersection` stores an adjacency list (`std::vector<RoadEdge>`) representing outgoing road connections.

#### Q13: Why did you choose an Adjacency List over an Adjacency Matrix?
**Answer:** Real-world road networks are sparse (each intersection connects to only 3-5 roads). An adjacency list requires $O(V + E)$ space compared to $O(V^2)$ for an adjacency matrix, saving memory and allowing $O(\text{degree})$ neighbor traversal during shortest-path calculations.

#### Q14: How does the graph support bidirectional vs. unidirectional roads?
**Answer:** When adding a bidirectional road between $u$ and $v$, edges are inserted into both $u$'s adjacency list (to $v$) and $v$'s adjacency list (to $u$). For one-way streets, the edge is inserted only into the source intersection's list.

---

### Section 5: Dijkstra's Algorithm & Pathfinding

#### Q15: What algorithm calculates the shortest route between intersections, and what does it return?
**Answer:** **Dijkstra's Shortest Path Algorithm**. It returns a `RouteResult` struct containing the boolean status, total physical distance (km), estimated urban transit time (minutes), and the ordered sequence of intersection IDs and names.

#### Q16: What is the time complexity of your Dijkstra implementation?
**Answer:** $O((V + E) \log V)$ using an adjacency list and a binary min-priority queue storing accumulated distance pairs `(cost, vertex)`.

#### Q17: How does your Dijkstra implementation prevent infinite loops on cycles or stale queue entries?
**Answer:** It maintains a `dist` map initialized to infinity. When popping `(currentCost, u)` from the heap, if `currentCost > dist[u]`, the entry is discarded immediately as stale. Furthermore, edge weights (physical distances) are strictly positive ($w > 0$), preventing negative weight cycles.

#### Q18: How does FLOWGRID handle unreachable destinations?
**Answer:** If the destination vertex remains at infinite distance after the min-heap empties, the algorithm sets `pathFound = false` and generates a descriptive message: *"Unreachable: No navigable road path connects Intersection [X] and [Y]"*.

---

### Section 6: Traffic Signal Simulation & Adaptive Control

#### Q19: What safety invariant does the Traffic Signal Controller enforce?
**Answer:** Conflicting approaches never receive GREEN simultaneously. Under FLOWGRID's single-phase rotary model, exactly one approach is GREEN or YELLOW at any given time, while all three other approaches are strictly RED.

#### Q20: What is the Adaptive Signal Timing rule in FLOWGRID?
**Answer:** Rather than fixed timer cycles, green time is calculated adaptively based on the approaching queue length $L$:
$$T_{\text{green}} = \text{clamp}\left(T_{\text{base}} + \left\lfloor \frac{L}{2} \right\rfloor, T_{\text{min}}, T_{\text{max}}\right)$$
Approaches with longer queues receive extended green durations to maximize throughput, while remaining capped at $T_{\text{max}}$ to prevent starvation.

#### Q21: What is the purpose of the YELLOW signal state?
**Answer:** It provides a 2-second clearance interval during which no new vehicles enter the intersection, allowing any vehicle already inside the junction to safely clear before the conflicting approach turns green.

---

### Section 7: Fairness, Starvation & Edge Cases

#### Q22: What is "ordinary vehicle starvation," and how does FLOWGRID prevent it?
**Answer:** Starvation occurs if high-priority emergency vehicles arrive continuously, indefinitely blocking ordinary traffic. FLOWGRID prevents this with a dual fairness policy:
1. **Consecutive Dispatch Cap:** After serving 3 emergency vehicles consecutively, one civilian vehicle is given right-of-way.
2. **Aging / Wait Threshold:** If the front civilian vehicle has waited $\ge 5$ simulation steps, it receives a bypass clearance.

#### Q23: How does FLOWGRID prevent vehicle double-counting in statistics?
**Answer:** Vehicles transition through mutually exclusive lifecycle states: `WAITING` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `COMPLETED`. When a vehicle departs, its status is updated and its departure timestamp is recorded exactly once. The conservation law `Total Generated == Total Processed + Currently Waiting` is strictly verified.

#### Q24: How does FLOWGRID handle invalid user inputs in the terminal?
**Answer:** All numerical inputs pass through `getValidatedInt()` which checks `std::cin.fail()`, clears error flags with `std::cin.clear()`, discards invalid characters from the stream buffer, and validates range bounds. The system never crashes on alphanumeric input.

---

### Section 8: Testing, Limitations & Future Scope

#### Q25: How was the project tested and verified?
**Answer:** A dedicated test suite (`flowgrid_tests.exe`) executes 14 unit and integration tests covering FIFO ordering, empty queues, emergency priority, tie-breaking, graph construction, Dijkstra routing, unreachability, signal safety invariants, statistics accuracy, input validation, and deterministic reproducibility.

#### Q26: How does the vehicle search feature work, and what is its time complexity?
**Answer:** An internal hash map `std::unordered_map<std::string, Vehicle> vehicleRegistry` indexes all admitted vehicles by ID, enabling $O(1)$ average time lookups of vehicle location, wait time, priority, and completion status.

#### Q27: What are the primary academic limitations of FLOWGRID?
**Answer:**
1. It models a single central 4-way intersection in detail rather than a synchronized grid-wide network (green wave coordination).
2. Vehicle movement is discrete per simulation step rather than simulating continuous physical kinematics (acceleration, braking distance).
3. Weather and road topography conditions are not modeled.

#### Q28: How could FLOWGRID be expanded in future work?
**Answer:**
1. **Networked Signal Synchronization:** Implementing Green Wave offset coordination across multi-intersection grids.
2. **Dynamic Re-routing:** Utilizing dynamic A* search to reroute vehicles en route when an incident blocks a roadway.
3. **Reinforcement Learning:** Training a Q-learning agent to optimize adaptive signal phase transitions based on historical queue patterns.
