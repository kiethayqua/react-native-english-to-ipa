const PHONES = require('./resources/phones.json');
const hiatus = [["er", "iy"], ["iy", "ow"], ["uw", "ow"], ["iy", "ah"], ["iy", "ey"], ["uw", "eh"], ["er", "eh"]];

/**
 * Remove digits and split the word into phonemes.
 *
 * @param {*} word 
 * @returns {number} 
 */
export function cmuSyllableCount(word) {
    const phonemes = word.replace(/\d/g, '').split(' ');

    if (phonemes[0].includes('__IGNORE__')) {
        return 0;
    } else {
        let nuclei = 0;

        for (let i = 0; i < phonemes.length; i++) {
            const sym = phonemes[i];
            const prevSym = i > 0 ? phonemes[i - 1] : null;
            const phoneType = PHONES[sym];
            const prevPhoneType = i > 0 ? PHONES[prevSym] : null;

            if (phoneType === 'vowel') {
                if (i === 0 || prevPhoneType !== 'vowel') {
                    nuclei += 1;
                } else if (hiatus.some(pair => pair[0] === prevSym && pair[1] === sym)) {
                    nuclei += 1;
                }
            }
        }

        return nuclei;
    }
}
