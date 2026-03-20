import { getGameOverAsset, getEloChangeColor } from './popupLogic';

// CRA's Jest config stubs binary assets (GIFs, SVGs) as filename strings.
// We verify truthy returns and that the three outcomes map to distinct values.

describe('getGameOverAsset', () => {
    test('returns a truthy value for "You win"', () => {
        expect(getGameOverAsset('You win')).toBeTruthy();
    });

    test('returns a truthy value for "You lose"', () => {
        expect(getGameOverAsset('You lose')).toBeTruthy();
    });

    test('returns a truthy value for any other result', () => {
        expect(getGameOverAsset('Draw')).toBeTruthy();
    });

    test('win, lose, and draw return distinct assets', () => {
        const win = getGameOverAsset('You win');
        const lose = getGameOverAsset('You lose');
        const draw = getGameOverAsset('Draw');
        expect(win).not.toBe(lose);
        expect(win).not.toBe(draw);
        expect(lose).not.toBe(draw);
    });
});

describe('getEloChangeColor', () => {
    test('positive change returns "green"', () => {
        expect(getEloChangeColor(10)).toBe('green');
        expect(getEloChangeColor(1)).toBe('green');
    });

    test('negative change returns "red"', () => {
        expect(getEloChangeColor(-10)).toBe('red');
        expect(getEloChangeColor(-1)).toBe('red');
    });

    test('zero returns "gray"', () => {
        expect(getEloChangeColor(0)).toBe('gray');
    });
});
