# 0 indicates no hole
NONE = 0
# 1 indicates empty hole
EMPTY = 1
# 2 indicates filled hole
FILLED = 2

def copy(m):
    return [row[:] for row in m]

def printPuzzle(p):
    for i in range(N):
        for j in range(M):
            if p[i][j] == NONE:
                print(" ", end="")
            elif p[i][j] == EMPTY:
                print("O", end="")
            elif p[i][j] == FILLED:
                print("X", end="")
        print()

def isSolved(p):
    for i in range(N):
        for j in range(M):
            if p[i][j] == EMPTY:
                return False
    return True

def calculateLeftWeight(p, i, j):
    if p[i][j] != EMPTY:
        return 0
    
    weight = 1

    if i > 0: # left side
        if p[i-1][j] == EMPTY:
            weight += 1
        if j > 0 and p[i-1][j-1] == EMPTY:
            weight += 1
        if j < M-1 and p[i-1][j+1] == EMPTY:
            weight += 1
    if j > 0 and p[i][j-1] == EMPTY: # top
        weight += 1
    if j < M-1 and p[i][j+1] == EMPTY: # bottom
        weight += 1
    if i < N-1: # right side
        if p[i+1][j] == EMPTY:
            weight += 1
        if j > 0 and p[i+1][j-1] == EMPTY:
            weight += 1
        if j < M-1 and p[i+1][j+1] == EMPTY:
            weight += 1

    return weight

def turnLeft(oldP, coordinates):
    p = copy(oldP)
    i = coordinates[0]
    j = coordinates[1]

    if p[i][j] != EMPTY:
        return p
    
    p[i][j] = FILLED

    if i > 0: # left side
        if p[i-1][j] == EMPTY:
            p[i-1][j] = FILLED
        if j > 0 and p[i-1][j-1] == EMPTY:
            p[i-1][j-1] = FILLED
        if j < M-1 and p[i-1][j+1] == EMPTY:
            p[i-1][j+1] = FILLED
    if j > 0 and p[i][j-1] == EMPTY: # top
        p[i][j-1] = FILLED
    if j < M-1 and p[i][j+1] == EMPTY: # bottom
        p[i][j+1] = FILLED
    if i < N-1: # right side
        if p[i+1][j] == EMPTY:
            p[i+1][j] = FILLED
        if j > 0 and p[i+1][j-1] == EMPTY:
            p[i+1][j-1] = FILLED
        if j < M-1 and p[i+1][j+1] == EMPTY:
            p[i+1][j+1] = FILLED

    return p
    

def calculateRightWeight(p, i, j):
    if p[i][j] != EMPTY:
        return 0
    
    weight = 1

    offset = 1
    while i - offset >= 0: # up
        if p[i - offset][j] == NONE:
            break
        if p[i - offset][j] == EMPTY:
            weight += 1
        offset += 1
    
    offset = 1
    while i + offset < N: # down
        if p[i + offset][j] == NONE:
            break
        if p[i + offset][j] == EMPTY:
            weight += 1
        offset += 1

    offset = 1
    while j - offset >= 0: # left
        if p[i][j - offset] == NONE:
            break
        if p[i][j - offset] == EMPTY:
            weight += 1
        offset += 1

    offset = 1
    while j + offset < N: # right
        if p[i][j + offset] == NONE:
            break
        if p[i][j + offset] == EMPTY:
            weight += 1
        offset += 1
    
    return weight

def turnRight(oldP, coordinates):
    p = copy(oldP)
    i = coordinates[0]
    j = coordinates[1]

    if p[i][j] != EMPTY:
        return p
    
    p[i][j] = FILLED

    offset = 1
    while i - offset >= 0: # up
        if p[i - offset][j] == NONE:
            break
        if p[i - offset][j] == EMPTY:
            p[i - offset][j] = FILLED
        offset += 1
    
    offset = 1
    while i + offset < N: # down
        if p[i + offset][j] == NONE:
            break
        if p[i + offset][j] == EMPTY:
            p[i + offset][j] = FILLED
        offset += 1

    offset = 1
    while j - offset >= 0: # left
        if p[i][j - offset] == NONE:
            break
        if p[i][j - offset] == EMPTY:
            p[i][j - offset] = FILLED
        offset += 1

    offset = 1
    while j + offset < N: # right
        if p[i][j + offset] == NONE:
            break
        if p[i][j + offset] == EMPTY:
            p[i][j + offset] = FILLED
        offset += 1
    
    return p

def findMaxWeight(p, calculator):
    # weights = [[0 for j in range(M)] for i in range(N)]
    maxWeightCoordinates = (0, 0)
    maxWeight = 0
    for i in range(N):
        for j in range(M):
            # weights[i][j] = calculator(p, i, j)
            weight = calculator(p, i, j)
            if weight > maxWeight:
                maxWeightCoordinates = (i, j)
                maxWeight = weight
    return maxWeight, maxWeightCoordinates

def getOptimalCoordinatesGreedily(p, selectedCoordinates):
        if isSolved(p):
            return selectedCoordinates
        
        maxLeftWeight, maxLeftWeightCoordinates = findMaxWeight(p, calculateLeftWeight)
        maxRightWeight, maxRightWeightCoordinates = findMaxWeight(p, calculateRightWeight)
        if maxLeftWeight > maxRightWeight:
            newP = turnLeft(p, maxLeftWeightCoordinates)
            newSelectedCoordinates = selectedCoordinates + [maxLeftWeightCoordinates]
        else:
            newP = turnRight(p, maxRightWeightCoordinates)
            newSelectedCoordinates = selectedCoordinates + [maxRightWeightCoordinates]
        
        return getOptimalCoordinatesGreedily(newP, newSelectedCoordinates)

def main():
    puzzleText = None
    with open('puzzle.txt') as f:
        puzzleText = [line.strip() for line in f.readlines()]

    puzzle = [[int(cell) for cell in row] for row in puzzleText]

    global M
    global N
    N = len(puzzle)
    M = len(puzzle[0])

    print(getOptimalCoordinatesGreedily(puzzle, []))


if __name__=="__main__":
    main()