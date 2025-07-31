def layout(N, C, L):
    # Convert restriction list to a set of pairs for quick lookup
    restrictions = set()
    for a, b in L:
        restrictions.add((a, b))
        restrictions.add((b, a))  # Ensure symmetry

    # Table assignments (guest -> table)
    assignment = {}

    # Helper function to check if guest can be assigned to table
    def can_assign(guest, table):
        for g, t in assignment.items():
            if t == table and (g, guest) in restrictions:
                return False
        return True

    # Recursive backtracking
    def backtrack(guest_id):
        if guest_id == N:
            return True  # All guests assigned

        for table in range(C):
            if can_assign(guest_id, table):
                assignment[guest_id] = table
                if backtrack(guest_id + 1):
                    return True
                del assignment[guest_id]  # Backtrack

        return False

    if backtrack(0):
        return assignment
    else:
        return False

print("===============When there's a solution===================")
print(layout(4, 2, [(0, 2), (1, 3)]))
# Possible output: {0: 0, 1: 0, 2: 1, 3: 1}

print("===============When there's no solution we get False===================")
print(layout(3, 1, [(0, 1), (1, 2)]))
# Output: False
