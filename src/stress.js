import { cmuSyllableCount } from './syllables';

const phones = require('./resources/phones.json');

/**
 * Assume cmuSyllableCount and stressType are available.
 *
 * @param {*} word 
 * @param {string} [type='all'] 
 * @returns {*} 
 */
export function findStress(word, type = 'all') {
    const syllCount = cmuSyllableCount(word);

    if (!word.startsWith('__IGNORE__') && syllCount > 1) {
        const symbols = word.split(' ');
        const stressMap = stressType(type);
        const newWord = [];
        const clusters = ['sp', 'st', 'sk', 'fr', 'fl'];
        const stopSet = ['nasal', 'fricative', 'vowel'];

        for (const c of symbols) {
            const lastChar = c.slice(-1);
            if (Object.keys(stressMap).includes(lastChar)) {
                if (newWord.length === 0) {
                    const stressMark = stressMap[lastChar];
                    newWord.push(c.replace(/\d/, '').replace(/^/, stressMark));
                } else {
                    const stressMark = stressMap[lastChar];
                    let placed = false;
                    let hiatus = false;
                    newWord.reverse();

                    for (let i = 0; i < newWord.length; i++) {
                        const sym = newWord[i].replace(/[0-9ˈˌ]/g, '');
                        const prevSym = i > 0 ? newWord[i - 1].replace(/[0-9ˈˌ]/g, '') : '';
                        const prevPhone = phones[prevSym];
                        const currentPhone = phones[sym];

                        if (
                            stopSet.includes(currentPhone) ||
                            (i > 0 && prevPhone === 'stop') ||
                            ['er', 'w', 'j'].includes(sym)
                        ) {
                            if (clusters.includes(sym + prevSym)) {
                                newWord[i] = stressMark + newWord[i];
                            } else if (i > 0 && prevPhone !== 'vowel') {
                                newWord[i - 1] = stressMark + newWord[i - 1];
                            } else {
                                if (currentPhone === 'vowel') {
                                    hiatus = true;
                                    newWord.reverse();
                                    return stressMark + c.replace(/\d/g, '') + ' ' + newWord.join(' ');
                                } else {
                                    newWord[i] = stressMark + newWord[i];
                                }
                            }
                            placed = true;
                            break;
                        }
                    }

                    if (!placed && newWord.length > 0) {
                        const lastIdx = newWord.length - 1;
                        newWord[lastIdx] = stressMark + newWord[lastIdx];
                    }

                    newWord.reverse();
                    if (!hiatus) {
                        newWord.push(c.replace(/\d/g, ''));
                    }
                }
            } else {
                if (c.startsWith('__IGNORE__')) {
                    newWord.push(c);
                } else {
                    newWord.push(c.replace(/[0-9]/g, ''));
                }
            }
        }

        return newWord.join(' ');
    } else {
        return word.startsWith('__IGNORE__') ? word : word.replace(/[0-9]/g, '');
    }
}

/**
 * Determine the kind of stress that should be evaluated.
 *
 * @param {*} stress 
 * @returns {({ "1": string; "2": string; } | { "1": string; "2"?: undefined; } | { "2": string; "1"?: undefined; } | { "1"?: undefined; "2"?: undefined; })} 
 */
function stressType(stress) {
    const defaultMap = { "1": "ˈ", "2": "ˌ" };
    const lowerStress = (stress || "").toLowerCase();

    if (lowerStress === "primary") {
        return { "1": "ˈ" };
    } else if (lowerStress === "secondary") {
        return { "2": "ˌ" };
    } else if (lowerStress === "both" || lowerStress === "all") {
        return defaultMap;
    } else if (lowerStress === "none" || !stress) {
        return {};
    } else {
        console.warn(`WARNING: stress type parameter "${stress}" not recognized.`);
        return defaultMap;
    }
}

