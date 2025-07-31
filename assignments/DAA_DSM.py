import threading
import time
import random

# Shared memory dictionary
shared_memory = {"x": 0}

# Lock for strong consistency
lock = threading.Lock()

def write_strong_consistency(node_id, value):
    with lock:
        print(f"[Node {node_id}] Writing {value} (strong)")
        shared_memory["x"] = value
        print(f"[Node {node_id}] Memory after write: {shared_memory['x']}")

def read_strong_consistency(node_id):
    with lock:
        value = shared_memory["x"]
        print(f"[Node {node_id}] Read {value} (strong)")
        return value

def write_weak_consistency(local_memory, node_id, value):
    print(f"[Node {node_id}] Writing {value} (weak)")
    local_memory["x"] = value
    print(f"[Node {node_id}] Local memory after write: {local_memory['x']}")

def read_weak_consistency(local_memory, node_id):
    value = local_memory["x"]
    print(f"[Node {node_id}] Read {value} (weak)")
    return value

def propagate(local_memory, node_id, delay):
    time.sleep(delay)
    shared_memory["x"] = local_memory["x"]
    print(f"[Node {node_id}] Propagated {local_memory['x']} to shared memory after {delay}s")

def simulate_strong():
    print("\n=== STRONG CONSISTENCY SIMULATION ===")
    threads = [
        threading.Thread(target=write_strong_consistency, args=(1, 10)),
        threading.Thread(target=read_strong_consistency, args=(2,))
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

def simulate_weak():
    print("\n=== WEAK CONSISTENCY SIMULATION ===")
    local1 = {"x": shared_memory["x"]}
    local2 = {"x": shared_memory["x"]}

    t1 = threading.Thread(target=write_weak_consistency, args=(local1, 1, 20))
    t2 = threading.Thread(target=read_weak_consistency, args=(local2, 2))
    t3 = threading.Thread(target=propagate, args=(local1, 1, 3))  # delay propagation

    t1.start()
    time.sleep(1)
    t2.start()
    t1.join()
    t2.join()
    t3.start()
    t3.join()

simulate_strong()
simulate_weak()
