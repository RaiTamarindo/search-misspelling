'use strict';

const colors = [];

window.onload = (function () {
    const alternatives = document.getElementById('alternatives');
    document.getElementById('search').addEventListener('input', (ev) => {
        alternatives.innerHTML = buildSearchAlternatives(ev.target.value)
            .sort((alt1, alt2) => alt2[1] - alt1[1])
            .map(([searchAlt, weight], i) => {
                if (!colors[i]) {
                    colors[i] = getRandomColorWithComplement();
                }
                const [rgb, rgbc] = colors[i];
                return `<span style="font-size: ${weight}em; color: #${rgb}; background-color: #${rgbc};">${searchAlt}</span>`;
            })
            .reduce((html, alt) => html + alt, '');
    });
});

function getRandomColorWithComplement() {
    const [red, green, blue] = [
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
    ];
    const p = Math.max(red, green, blue) / 255;
    const k = p > 0.5 ? 0.5 : 1.5;
    return [
        // RGB
        padStart(2, '0', red.toString(16)) +
        padStart(2, '0', green.toString(16)) +
        padStart(2, '0', blue.toString(16)),
        // RGB complement
        padStart(2, '0', toIntRange(k * red, 0, 255).toString(16)) +
        padStart(2, '0', toIntRange(k * green, 0, 255).toString(16)) +
        padStart(2, '0', toIntRange(k * blue, 0, 255).toString(16)),
    ];
}

function toIntRange(x, min, max) {
    return Math.min(Math.max(Math.floor(x), min), max);
}

function padStart(count, pad, str) {
    while (str.length < count) {
        str = pad + str;
    }
    return str;
}

function buildSearchAlternatives(search) {
    const terms = search.split(' ');
    const termsAlts = terms
        .map(term => term.trim())
        .map(term => buildMisspellingAlternatives(term));
    const n = termsAlts
        .reduce((n, termAlts) => n * termAlts.length, 1);
    const searchAlts = [];

    for (let i = 0; i < n; i++) {
        const searchAlt = ['', 0];
        let base = 1;
        for (const termAlts of termsAlts) {
            const termAlt = termAlts[Math.floor(i / base) % termAlts.length];
            searchAlt[0] = `${searchAlt[0]} ${termAlt[0]}`;
            searchAlt[1] = searchAlt[1] + termAlt[1];
            base *= termAlts.length;
        }
        searchAlt[0] = searchAlt[0].substr(1);
        searchAlt[1] = searchAlt[1] / termsAlts.length;
        searchAlts.push(searchAlt);
    }

    return searchAlts;
}

const misspellings = {
    prefix: { 'se': 'ce', 'ce': 'se', 'si': 'ci', 'ci': 'si', 'h': '', 'a': 'ha', 'e': 'he', 'i': 'hi', 'o': 'ho', 'u': 'hu', 'x': 'ch', 'ch': 'x' },
    middle: {
        'ç': 'ss', 'ss': 'ç', 'sse': 'ce', 'ce': 'sse', 'ssi': 'ci', 'ci': 'ssi', 'x': 'ch', 'ch': 'x', 'np': 'mp', 'nb': 'mb', 'aza': 'asa', 'aze': 'ase',
        'azi': 'asi', 'azo': 'aso', 'azu': 'asu', 'eza': 'esa', 'eze': 'ese', 'ezi': 'esi', 'ezo': 'eso', 'ezu': 'esu', 'iza': 'isa', 'ize': 'ise',
        'izi': 'isi', 'izo': 'iso', 'izu': 'isu', 'oza': 'osa', 'oze': 'ose', 'ozi': 'osi', 'ozo': 'oso', 'ozu': 'osu', 'uza': 'usa', 'uze': 'use',
        'uzi': 'usi', 'uzo': 'uso', 'uzu': 'usu', 'asa': 'aza', 'ase': 'aze', 'asi': 'azi', 'aso': 'azo', 'asu': 'azu', 'esa': 'eza', 'ese': 'eze',
        'esi': 'ezi', 'eso': 'ezo', 'esu': 'ezu', 'isa': 'iza', 'ise': 'ize', 'isi': 'izi', 'iso': 'izo', 'isu': 'izu', 'osa': 'oza', 'ose': 'oze',
        'osi': 'ozi', 'oso': 'ozo', 'osu': 'ozu', 'usa': 'uza', 'use': 'uze', 'usi': 'uzi', 'uso': 'uzo', 'usu': 'uzu', 'y': 'i', 'i': 'y',
    },
    suffix: {
        'sse': 'ce', 'ce': 'sse', 'ssi': 'ci', 'ci': 'ssi', 'au': 'al', 'eu': 'el', 'iu': 'il', 'ou': 'ol', 'al': 'au', 'el': 'eu', 'il': 'iu',
        'ol': 'ou', 'n': 'm', 'm': 'n', 'ão': 'am', 'am': 'ão',
    }
};

function buildMisspellingAlternatives(input) {
    const alternatives = [];
    const dedupMap = {};
    const replacementOffsets = [0, countSpecialChars(input)];
    const inputReplaced = replaceSpecialChars(input);

    for (const [t, term] of [input, inputReplaced].entries()) {
        const matches = [];

        for (const pattern of Object.keys(misspellings.prefix)) {
            const prefix = term.substr(0, pattern.length);
            if (prefix == pattern) {
                matches.push([pattern, 0]);
            }
        }

        if (term.length > 2) {
            const middle = term.substring(1, term.length - 1);
            for (const pattern of Object.keys(misspellings.middle)) {
                for (let i = 0; i < middle.length; i++) {
                    const prefix = middle.substr(i, pattern.length);
                    if (prefix == pattern) {
                        matches.push([pattern, i + 1]);
                    }
                }
            }
        }

        for (const pattern of Object.keys(misspellings.suffix)) {
            const i = term.length - pattern.length;
            const suffix = term.substr(i, pattern.length);
            if (suffix == pattern) {
                matches.push([pattern, i]);
            }
        }

        console.log(matches)

        const n = 1 << matches.length;
        for (let i = 0; i < n; i++) {
            let alt = term;
            let replacementsCount = 0;
            for (let j = 0; j < matches.length; j++) {
                if ((i >> j) & 1) {
                    const offset = matches[j][1];
                    const pattern = matches[j][0];
                    let replacement = misspellings.middle[matches[j][0]];
                    if (!offset) {
                        replacement = misspellings.prefix[matches[j][0]];
                    } else if (term.length - offset == pattern.length) {
                        replacement = misspellings.suffix[matches[j][0]] || replacement;
                    }
                    const start = offset + alt.length - term.length;
                    alt = alt.substr(0, start) + alt.substr(start).replace(pattern, replacement);
                    replacementsCount++;
                }
            }
            const weight = (term.length - (replacementsCount + replacementOffsets[t])) / term.length;
            if (!dedupMap[alt]) {
                console.log
                alternatives.push([alt, weight]);
                dedupMap[alt] = true;
            }
        }
    }

    return alternatives;
}

const specialChars = {
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U', 'Ý': 'Y', 'à': 'a', 'á': 'a',
    'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ñ': 'n', 'ò': 'o',
    'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y', 'ÿ': 'y', 'Ā': 'A', 'ā': 'a', 'Ă': 'A', 'ă': 'a',
    'Ą': 'A', 'ą': 'a', 'Ć': 'C', 'ć': 'c', 'Ĉ': 'C', 'ĉ': 'c', 'Ċ': 'C', 'ċ': 'c', 'Č': 'C', 'č': 'c', 'Ď': 'D', 'ď': 'd', 'Đ': 'D', 'đ': 'd', 'Ē': 'E',
    'ē': 'e', 'Ĕ': 'E', 'ĕ': 'e', 'Ė': 'E', 'ė': 'e', 'Ę': 'E', 'ę': 'e', 'Ě': 'E', 'ě': 'e', 'Ĝ': 'G', 'ĝ': 'g', 'Ğ': 'G', 'ğ': 'g', 'Ġ': 'G', 'ġ': 'g',
    'Ģ': 'G', 'ģ': 'g', 'Ĥ': 'H', 'ĥ': 'h', 'Ħ': 'H', 'ħ': 'h', 'Ĩ': 'I', 'ĩ': 'i', 'Ī': 'I', 'ī': 'i', 'Ĭ': 'I', 'ĭ': 'i', 'Į': 'I', 'į': 'i', 'İ': 'I',
    'ı': 'i', 'Ĵ': 'J', 'ĵ': 'j', 'Ķ': 'K', 'ķ': 'k', 'Ĺ': 'L', 'ĺ': 'l', 'Ļ': 'L', 'ļ': 'l', 'Ľ': 'L', 'ľ': 'l', 'Ŀ': 'L', 'ŀ': 'l', 'Ł': 'l', 'ł': 'l',
    'Ń': 'N', 'ń': 'n', 'Ņ': 'N', 'ņ': 'n', 'Ň': 'N', 'ň': 'n', 'ŉ': 'n', 'Ō': 'O', 'ō': 'o', 'Ŏ': 'O', 'ŏ': 'o', 'Ő': 'O', 'ő': 'o', 'Ŕ': 'R', 'ŕ': 'r',
    'Ŗ': 'R', 'ŗ': 'r', 'Ř': 'R', 'ř': 'r', 'Ś': 'S', 'ś': 's', 'Ŝ': 'S', 'ŝ': 's', 'Ş': 'S', 'ş': 's', 'Š': 'S', 'š': 's', 'Ţ': 'T', 'ţ': 't', 'Ť': 'T',
    'ť': 't', 'Ŧ': 'T', 'ŧ': 't', 'Ũ': 'U', 'ũ': 'u', 'Ū': 'U', 'ū': 'u', 'Ŭ': 'U', 'ŭ': 'u', 'Ů': 'U', 'ů': 'u', 'Ű': 'U', 'ű': 'u', 'Ų': 'U', 'ų': 'u',
    'Ŵ': 'W', 'ŵ': 'w', 'Ŷ': 'Y', 'ŷ': 'y', 'Ÿ': 'Y', 'Ź': 'Z', 'ź': 'z', 'Ż': 'Z', 'ż': 'z', 'Ž': 'Z', 'ž': 'z', 'ſ': 's', 'ƒ': 'f', 'Ơ': 'O', 'ơ': 'o',
    'Ư': 'U', 'ư': 'u', 'Ǎ': 'A', 'ǎ': 'a', 'Ǐ': 'I', 'ǐ': 'i', 'Ǒ': 'O', 'ǒ': 'o', 'Ǔ': 'U', 'ǔ': 'u', 'Ǖ': 'U', 'ǖ': 'u', 'Ǘ': 'U', 'ǘ': 'u', 'Ǚ': 'U',
    'ǚ': 'u', 'Ǜ': 'U', 'ǜ': 'u', 'Ǻ': 'A', 'ǻ': 'a', 'Ǿ': 'O', 'ǿ': 'o', 'Ά': 'Α', 'ά': 'α', 'Έ': 'Ε', 'Ό': 'Ο', 'ό': 'ο', 'Ί': 'Ι', 'Ύ': 'Υ', 'Ή': 'Η',
    '"': ' ', '!': ' ', '@': ' ', '#': ' ', '$': ' ', '%': ' ', '¨': ' ', '&': ' ', '*': ' ', '(': ' ', ')': ' ', '_': ' ', '+': ' ', "'": ' ', '-': ' ',
    '=': ' ', '¹': ' ', '²': ' ', '³': ' ', '£': ' ', '¢': ' ', '¬': ' ', '§': ' ', '`': ' ', '´': ' ', '^': ' ', '~': ' ', '{': ' ', '}': ' ', '[': ' ',
    ']': ' ', 'ª': ' ', 'º': ' ', ':': ' ', '>': ' ', '<': ' ', ';': ' ', '.': ' ', ',': ' ', '?': ' ', '/': ' ', '|': ' ', '\\': ' ', '°': ' ',
};

function countSpecialChars(str) {
    return str.split('')
        .reduce((count, c) => count + (!specialChars[c] ? 0 : 1), 0)
}

function replaceSpecialChars(str) {
    return str.split('')
        .reduce((replaced, c) => replaced + (specialChars[c] || c), '');
}
