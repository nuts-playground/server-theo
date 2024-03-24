export const createInitTictactoe = () => {
    const initData = [];
    for (let i = 0; i < 3; i++) {
        const row = [];
        for (let j = 0; j < 3; j++) {
            row.push({ player: "", marker: false });
        }
        initData.push(row);
    }
    return initData;
};
