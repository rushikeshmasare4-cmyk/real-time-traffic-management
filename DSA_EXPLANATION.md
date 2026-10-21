# FLOWGRID — Data Structures & Algorithms (DSA) In-Depth Technical Guide

This document provides a thorough, college-level explanation of the Data Structures and Algorithms implemented within **FLOWGRID**. It is structured to help students understand, explain, and defend every algorithmic decision during academic vivas and technical evaluations.

---

## 1. Data Structure A: FIFO Queue (First-In, First-Out)

### 1.1 Purpose in FLOWGRID
In real-world single-lane roadways, overtaking is physically constrained: the first vehicle to reach an intersection is the first vehicle permitted to cross when the signal turns green. To faithfully replicate this physical behavior, FLOWGRID uses a dedicated **FIFO Queue** (`VehicleFIFOQueue`) for ordinary civilian vehicles (Cars, Buses, Trucks) on each approach lane (North, South, East, West).

### 1.2 Implementation Details
Rather than treating a container as an opaque black box, `VehicleFIFOQueue` is implemented using a custom **singly-linked node structure**:

```cpp
struct Node {
    Vehicle data;
    std::unique_ptr<Node> next;
    explicit Node(const Vehicle& v) : data(v), next(nullptr) {}
};
```

- **Head Pointer (`head`):** Points to the front vehicle eligible for immediate departure.
- **Tail Pointer (`tail`):** Points to the rear vehicle that most recently arrived.
- **Count (`count`):** Maintains the instantaneous queue size without needing to traverse nodes.

### 1.3 Algorithmic Complexity

| Operation | Method | Time Complexity | Space Complexity | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Enqueue** | `enqueue(v)` | $O(1)$ | $O(1)$ | Appends `v` to `tail->next` and advances `tail`. |
| **Dequeue** | `dequeue(out)` | $O(1)$ | $O(1)$ | Extracts `head->data`, advances `head = head->next`. |
| **Peek** | `peek(out)` | $O(1)$ | $O(1)$ | Reads `head->data` without modifying pointers. |
| **Size** | `size()` | $O(1)$ | $O(1)$ | Returns pre-computed integer `count`. |
| **Clear** | `clear()` | $O(N)$ | $O(1)$ | Recursively deallocates node chain via smart pointers. |

---

## 2. Data Structure B: Priority Queue (Binary Min-Heap)

### 2.1 Purpose in FLOWGRID
Emergency vehicles (Ambulances, Fire Engines, Police Squads) carry critical urgency that supercedes standard arrival order. FLOWGRID implements a custom **Binary Min-Heap Priority Queue** (`EmergencyPriorityQueue`) to ensure life-safety vehicles receive prompt right-of-way.

### 2.2 Urgency Ranking Policy
Dispatch priorities are assigned using integer levels where a **lower integer represents higher urgency**:

1. **Priority 1 (`PRIORITY_AMBULANCE`):** Medical emergencies where human life is in immediate peril.
2. **Priority 2 (`PRIORITY_FIRE_ENGINE`):** Active structural fire or hazard response requiring heavy equipment.
3. **Priority 3 (`PRIORITY_POLICE`):** Law enforcement and public order response.
4. **Priority 10 (`PRIORITY_REGULAR`):** Civilian transportation.

### 2.3 Deterministic Tie-Breaking
When two vehicles have identical priority levels (e.g., two Ambulances arrive simultaneously), FIFO order must be preserved. FLOWGRID tracks a monotonically increasing 64-bit `sequenceNumber`:

$$\text{hasHigherPriority}(A, B) = \begin{cases} \text{true} & \text{if } A.\text{priority} < B.\text{priority} \\ A.\text{seq} < B.\text{seq} & \text{if } A.\text{priority} == B.\text{priority} \\ \text{false} & \text{otherwise} \end{cases}$$

### 2.4 Binary Heap Mechanics
The heap is stored in a contiguous dynamic array (`std::vector<Vehicle>`):
- Root is at index `0`.
- For an element at index $i$:
  - $\text{Parent}(i) = \lfloor (i - 1) / 2 \rfloor$
  - $\text{Left Child}(i) = 2i + 1$
  - $\text{Right Child}(i) = 2i + 2$

- **Sift-Up ($O(\log N)$):** After appending a new vehicle at the end of the array, it bubbles upward until the min-heap invariant is satisfied.
- **Sift-Down ($O(\log N)$):** When the root is popped, the last leaf replaces the root, and bubbles downward by swapping with its highest-priority child.

---

## 3. Data Structure C: Graph via Adjacency List

### 3.1 Purpose in FLOWGRID
An urban road network is topologically a **directed/undirected weighted graph** $G = (V, E)$:
- **Vertices ($V$):** City intersections where vehicles make routing decisions.
- **Edges ($E$):** Road segments connecting intersections.
- **Weights ($W$):** Physical road length (km) adjusted by real-time congestion penalties.

### 3.2 Adjacency List vs. Adjacency Matrix

| Feature | Adjacency List (Used in FLOWGRID) | Adjacency Matrix |
| :--- | :--- | :--- |
| **Space Complexity** | $O(V + E)$ — Highly optimal for sparse urban maps | $O(V^2)$ — Wasteful for road grids |
| **Edge Traversal** | $O(\text{deg}(u))$ — Inspect only actual connected roads | $O(V)$ — Must check every cell |
| **Edge Insertion** | $O(1)$ push to vector | $O(1)$ matrix write |
| **Memory Locality** | High within each intersection's edge vector | High in contiguous 2D array |

In FLOWGRID, `RoadNetwork` represents the graph as:
```cpp
std::unordered_map<int, Intersection> intersections;
// Where each Intersection contains:
std::vector<RoadEdge> adjacencyList;
```

---

## 4. Algorithm A: Dijkstra's Shortest Path

### 4.1 Problem Definition
Given a source intersection $S$ and a target destination $D$, find the path minimizing total travel distance or effective traversal cost.

### 4.2 Algorithm Step-by-Step
1. Initialize distance map $\text{dist}[u] = \infty$ for all $u \in V$, and $\text{dist}[S] = 0$.
2. Maintain a predecessor map $\text{parent}[u] = \text{null}$ to enable path reconstruction.
3. Push $(0, S)$ into a min-priority queue `minHeap`.
4. While `minHeap` is not empty:
   - Extract $(d, u)$ with minimum distance.
   - If $d > \text{dist}[u]$, skip (stale heap entry).
   - If $u == D$, break early (optimal path to target found).
   - For each edge $(u, v, w)$ outgoing from $u$:
     $$\text{newDist} = \text{dist}[u] + w$$
     $$\text{if } \text{newDist} < \text{dist}[v] \implies \text{dist}[v] = \text{newDist}, \quad \text{parent}[v] = u, \quad \text{push}(\text{newDist}, v)$$
5. Reconstruct the path by back-tracing from $D$ to $S$ using `parent`, then reverse the list.

### 4.3 Time and Space Complexity
- With $V$ vertices, $E$ edges, and a binary min-heap:
  - Each vertex is extracted from the heap at most once: $V \cdot O(\log V)$.
  - Each edge is relaxed at most once, triggering a heap push: $E \cdot O(\log V)$.
  - **Total Time Complexity:** $O((V + E) \log V)$.
  - **Total Space Complexity:** $O(V)$ for distance, parent, and heap tracking.

---

## 5. Algorithm B: Adaptive Signal Scheduling & Starvation Prevention

### 5.1 Signal State Machine
Each 4-way intersection operates through strict cyclic phases:
$$\text{NORTH GREEN} \longrightarrow \text{NORTH YELLOW} \longrightarrow \text{EAST GREEN} \longrightarrow \dots \longrightarrow \text{WEST YELLOW} \longrightarrow \text{NORTH GREEN}$$

- **Safety Invariant:** At most **one** direction is non-RED (GREEN or YELLOW) at any instant. All three conflicting approaches are held at RED.

### 5.2 Adaptive Green Calculation
Fixed-time signals cause unnecessary idle delays during unbalanced traffic. FLOWGRID adapts green duration based on real-time lane queue length $L$:

$$T_{\text{green}} = \text{clamp}\left(T_{\text{base}} + \left\lfloor \frac{L}{2} \right\rfloor, T_{\text{min}}, T_{\text{max}}\right)$$

Where default parameters are:
- $T_{\text{base}} = 4$ steps
- $T_{\text{min}} = 3$ steps
- $T_{\text{max}} = 10$ steps
- $T_{\text{yellow}} = 2$ steps (clearance interval)

### 5.3 Fairness & Starvation Prevention Safeguards
A common failure mode in pure priority queue systems is **ordinary vehicle starvation** (e.g., a continuous stream of emergency vehicles permanently blocking civilian traffic). FLOWGRID enforces a dual-condition **Fairness Policy**:

1. **Consecutive Emergency Burst Cap:** After $K = 3$ consecutive emergency dispatches on a lane, if the ordinary queue is non-empty, exactly one civilian vehicle is granted right-of-way.
2. **Maximum Wait Threshold:** If the civilian vehicle at the front of the FIFO queue has waited $\ge 5$ simulation steps, it receives an immediate priority bypass.

---

## 6. Algorithm C: Searching and Sorting

### 6.1 Fast Vehicle Search via Hash Map ($O(1)$)
Every vehicle admitted to FLOWGRID is registered in a hash table:
```cpp
std::unordered_map<std::string, Vehicle> vehicleRegistry;
```
- **Average Time Complexity:** $O(1)$ retrieval by Vehicle ID (`VEH-0001` or `EMG-001`).
- **Worst-case Time Complexity:** $O(N)$ (in the rare event of all-bucket hash collisions).

### 6.2 Traffic Sorting Subsystem ($O(N \log N)$)
FLOWGRID utilizes `std::sort` (Introsort — hybrid of Quicksort, Heapsort, and Insertion Sort) with custom lambda predicates:
1. **Approach Congestion Ranking:** Sorts the 4 approach lanes descending by queue length to identify traffic bottlenecks.
2. **Wait Duration Ranking:** Sorts waiting vehicles descending by elapsed wait steps $(T_{\text{now}} - T_{\text{arrival}})$ for delay monitoring.
- **Time Complexity:** $O(N \log N)$ comparisons.
- **Space Complexity:** $O(\log N)$ auxiliary stack frames.

---

## 7. Master Algorithmic Complexity Table

| Component | Operation | Data Structure / Algorithm | Average Time | Worst Time | Space |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Lane Queue | Enqueue Ordinary | Singly-Linked FIFO Queue | $O(1)$ | $O(1)$ | $O(1)$ |
| Lane Queue | Dequeue Ordinary | Singly-Linked FIFO Queue | $O(1)$ | $O(1)$ | $O(1)$ |
| Emergency Queue | Insert Emergency | Binary Min-Heap | $O(\log N)$ | $O(\log N)$ | $O(1)$ |
| Emergency Queue | Extract Urgent | Binary Min-Heap | $O(\log N)$ | $O(\log N)$ | $O(1)$ |
| Emergency Queue | Inspect Top | Binary Min-Heap | $O(1)$ | $O(1)$ | $O(1)$ |
| Road Network | Add Vertex/Edge | Adjacency List Graph | $O(1)$ | $O(1)$ | $O(V + E)$ |
| Routing Engine | Shortest Path | Dijkstra's Algorithm | $O((V+E)\log V)$ | $O((V+E)\log V)$ | $O(V)$ |
| Signal Scheduler | Adaptive Green | Linear Math Clamp | $O(1)$ | $O(1)$ | $O(1)$ |
| Vehicle Search | Search by ID | Hash Table (`unordered_map`) | $O(1)$ | $O(N)$ | $O(N)$ |
| Congestion Rank | Sort Approaches | Introsort (`std::sort`) | $O(K \log K)$ | $O(K \log K)$ | $O(\log K)$ |
| Delay Ranking | Sort by Wait Time| Introsort (`std::sort`) | $O(N \log N)$ | $O(N \log N)$ | $O(\log N)$ |
