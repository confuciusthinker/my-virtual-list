let cachedPositions: any[] = [];
const updateCachedPositions = (startIdx: number) => {

    const cachedPositionsLen = cachedPositions.length;
    let cumulativeDiffHeight = cachedPositions[startIdx].dValue;
    cachedPositions[startIdx].dValue = 0;

    for (let i = startIdx + 1; i < cachedPositionsLen; ++i) {
      const item = cachedPositions[i];
      cachedPositions[i].top = cachedPositions[i - 1].bottom;
      cachedPositions[i].bottom = cachedPositions[i].bottom - cumulativeDiffHeight;
      if (item.dValue !== 0) {
        cumulativeDiffHeight += item.dValue;
        item.dValue = 0;
      }
    }

    return cachedPositions[cachedPositionsLen - 1].bottom;
};

onmessage = (e) => {
    if (e.data[0] === 'update') {
        cachedPositions = e.data[2];
        const bottom = updateCachedPositions(e.data[1]);
        postMessage([cachedPositions, bottom]);
    }
};