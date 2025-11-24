#NOTE: NO IMPORTS ALLOWED INTO utils.py!

def convert_coord(coord, wish): # e4
    tiles = ["a", "b", "c", "d", "e", "f", "g", "h"]
    print("wish: ",wish)
    if wish == 0 or wish == 1:
        letter = coord[0]
        print("letter: ",letter)
        number = int(coord[1]) 
        print("number: ",number)
        #NOTE: Above is fine
        row = number -1 # now, the 1 in a1 stays an 1, so I have to remove 1 
        print("row: ",row)
        col = tiles.index(letter)
        print("col: ",col)
        if wish == 1:
            col += 1 
            row += 1
        return [row, col]
    
    if wish == "a(0)":
        coord = [int(c) for c in str(coord)]
        letter = tiles[coord[1]] # 03 => d1
        number = coord[0] +1
        return str(letter)+str(number)
    if wish == "a(1)":
        coord = [int(c) for c in str(coord)]
        coord[0] -= 1
        coord[1] -= 1
        letter = tiles[coord[1]]
        number = coord[0] +1
        return str(letter)+str(number)