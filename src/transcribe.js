const { findStress } = require('./stress');
const jsonData = require('./resources/CMU_dict.json');


class ModeType {
    constructor() {
        this.mode = jsonData;
    }
}

/**
 * Takes either a string or list of English words and converts them to IPA.
 *
 * @param {*} text 
 * @param {boolean} [retrieveAll=false] 
 * @param {boolean} [keepPunct=true] 
 * @param {string} [stressMarks='both'] 
 */
export function convert(text, retrieveAll = false, keepPunct = true, stressMarks = 'both') {
    const ipa = ipaList(text, keepPunct, stressMarks);
    return retrieveAll ? getAll(ipa) : getTop(ipa);
}

/**
 * Returns a list of all the discovered IPA transcriptions for each word.
 *
 * @param {*} wordsIn 
 * @param {boolean} [keepPunct=true] 
 * @param {string} [stressMarks='both'] 
 */
function ipaList(wordsIn, keepPunct = true, stressMarks = 'both') {
    const words = typeof wordsIn === 'string'
        ? wordsIn.split(' ').map(w => preservePunc(w.toLowerCase())[0])
        : wordsIn.map(w => preservePunc(w.toLowerCase())[0]);
    const cmu = getCmu(words.map(w => w[1]));
    let ipa = cmuToIpa(cmu, { stressMarking: stressMarks });
    if (keepPunct) {
        ipa = punctReplaceWord(words, ipa);
    }

    return ipa;
}

/**
 * Converts words to IPA and finds punctuation before and after the word.
 *
 * @param {*} words 
 * @returns {{}} 
 */
function preservePunc(words) {
    const wordsPreserved = [];

    for (const w of words.split(' ')) {
        const punctList = ["", preprocess(w), ""];

        const before = w.match(/^([^A-Za-z0-9]+)[A-Za-z]/);
        const after = w.match(/[A-Za-z]([^A-Za-z0-9]+)$/);

        if (before) {
            punctList[0] = before[1];
        }
        if (after) {
            punctList[2] = after[1];
        }

        wordsPreserved.push(punctList);
    }

    return wordsPreserved;
}

/**
 * Returns a string of words stripped of punctuation.
 *
 * @param {*} words 
 */
function preprocess(words) {
    const punctStr = `!"#$%&'()*+,-./:;<=>/?@[\\]^_\`{|}~«» `;
    const punctRegex = new RegExp(`^[${punctStr}]+|[${punctStr}]+$`, 'g');

    return words
        .split(' ')
        .map(w => w.replace(punctRegex, '').toLowerCase())
        .join(' ');
}

/**
 * query the database for the words and return the phonemes in the order.
 *
 * @param {*} tokensIn 
 * @returns {{}} 
 */
function getCmu(tokensIn) {
    const result = fetchWords(tokensIn);
    const ordered = [];

    for (const word of tokensIn) {
        const thisWord = result.filter(([w]) => w === word).map(([_, phoneme]) => phoneme);

        if (thisWord.length > 0) {
            ordered.push(thisWord[0]);
        } else {
            ordered.push([`__IGNORE__${word}`]);
        }
    }

    return ordered;
}

/**
 * Fetches a list of words from the JSON.
 *
 * @param {*} wordsIn 
 * @returns {*} 
 */
function fetchWords(wordsIn) {
    const asset = new ModeType().mode;
    const words = [];
    for (const [key, value] of Object.entries(asset)) {
        if (wordsIn.includes(key)) {
            words.push([key, value]);
        }
    }
    return words;
}

/**
 * Convert "ah1" and "ah0" to markers.
 *
 * @param {*} cmuList 
 * @param {boolean} [mark=true] 
 * @param {string} [stressMarking='all'] 
 * @returns {{}} 
 */
function cmuToIpa(cmuList, mark = true, stressMarking = 'all') {
    for (let i = 0; i < cmuList.length; i++) {
        for (let j = 0; j < cmuList[i].length; j++) {
            cmuList[i][j] = cmuList[i][j].replace(/ah1/g, 'q1').replace(/ah0/g, '+0');
        }
    }

    const symbols = {
        a: 'ə', ey: 'eɪ', aa: 'ɑ', ae: 'æ', '+': 'ə', ao: 'ɔ', q: 'ʌ',
        aw: 'aʊ', ay: 'aɪ', ch: 'ʧ', dh: 'ð', eh: 'ɛ', er: 'ər',
        hh: 'h', ih: 'ɪ', jh: 'ʤ', ng: 'ŋ', ow: 'oʊ', oy: 'ɔɪ',
        sh: 'ʃ', th: 'θ', uh: 'ʊ', uw: 'u', zh: 'ʒ', iy: 'i', y: 'j'
    };

    const finalList = [];

    for (const wordList of cmuList) {
        const ipaWordList = [];

        for (let word of wordList) {
            if (stressMarking) {
                word = findStress(word, stressMarking);
            } else {
                if (!/[^0-9]/.test(word.replace('__IGNORE__', ''))) {
                } else {
                    word = word.replace(/[0-9]/g, '');
                }
            }

            let ipaForm = '';

            if (word.startsWith('__IGNORE__')) {
                ipaForm = word.replace('__IGNORE__', '');
                if (mark && /[^\d]/.test(ipaForm)) {
                    ipaForm += '*';
                }
            } else {
                for (const piece of word.split(' ')) {
                    let marked = false;
                    let unmarked = piece;
                    let stressMark = '';

                    if (['ˈ', 'ˌ'].includes(piece[0])) {
                        marked = true;
                        stressMark = piece[0];
                        unmarked = piece.slice(1);
                    }

                    if (symbols.hasOwnProperty(unmarked)) {
                        ipaForm += marked ? stressMark + symbols[unmarked] : symbols[unmarked];
                    } else {
                        ipaForm += piece;
                    }
                }
            }

            const swapList = [['ˈər', 'əˈr'], ['ˈie', 'iˈe']];
            for (const [from, to] of swapList) {
                if (!ipaForm.startsWith(from)) {
                    ipaForm = ipaForm.replace(new RegExp(from, 'g'), to);
                }
            }

            ipaWordList.push(ipaForm);
        }

        finalList.push([...ipaWordList]);
    }

    return finalList;
}

/**
 * Get the IPA transcription of word with the original punctuation marks
 *
 * @param {*} original 
 * @param {*} transcription 
 * @returns {*} 
 */
function punctReplaceWord(original, transcription) {
    for (let i = 0; i < transcription.length; i++) {
        for (let j = 0; j < transcription[i].length; j++) {
            const triple = [original[i][0], transcription[i][j], original[i][2]];
            transcription[i][j] = applyPunct(triple, true);
        }
    }
    return transcription;
}

/**
 * Places surrounding punctuation back on center on a list of preserve_punc triples.
 *
 * @param {*} triple 
 * @param {boolean} [asStr=false] 
 * @returns {*} 
 */
function applyPunct(triple, asStr = false) {
    if (Array.isArray(triple[0])) {
        for (let i = 0; i < triple.length; i++) {
            triple[i] = triple[i].join('');
        }
        return asStr ? triple.join(' ') : triple;
    }

    if (asStr) {
        return triple.join('');
    }

    return [triple.join('')];
}

/**
 * Utilizes an algorithm to discover and return all possible combinations of IPA transcriptions.
 *
 * @param {*} ipaList 
 * @returns 
 */
function getAll(ipaList) {
    let finalSize = 1;
    for (const wordList of ipaList) {
        finalSize *= wordList.length;
    }

    const listAll = new Array(finalSize).fill("");

    let switchRate;
    for (let i = 0; i < ipaList.length; i++) {
        if (i === 0) {
            switchRate = finalSize / ipaList[i].length;
        } else {
            switchRate /= ipaList[i].length;
        }

        let k = 0;
        for (let j = 0; j < finalSize; j++) {
            if ((j + 1) % switchRate === 0) {
                k++;
            }
            if (k === ipaList[i].length) {
                k = 0;
            }
            listAll[j] += ipaList[i][k] + " ";
        }
    }

    return listAll.map(sent => sent.slice(0, -1)).sort();
}

/**
 * Returns only the one result for a query. If multiple entries for words are found, only the first is used.
 *
 * @param {*} ipaList 
 * @returns 
 */
function getTop(ipaList) {
    return ipaList.map(wordList => wordList[0]).join(' ');
}







