def isLegal(request):
    coord = request.args.get('move')
    coord = coord.split("-")
    startPrev = coord[0]
    endPrev = coord[1]
    start=[]
    end=[]
    for i in startPrev:
        start.append(i)
    for a in endPrev:
        end.append(a)
    return True