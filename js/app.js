'use strict';

window.onload = (function() {

});


const replacements = {
    prefix: {
        'se': 'ce',
        'ce': 'se',
        'si': 'ci',
        'ci': 'si',
        'h': '',
        'a': 'ha',
        'e': 'he',
        'i': 'hi',
        'o': 'ho',
        'u': 'hu',
        'x': 'ch',
        'ch': 'x',
    },
    middle: {
        'ç': 'ss',
        'ss': 'ç',
        'x': 'ch',
        'ch': 'x',
        'np': 'mp',
        'nb': 'mb',
        'z': 's',
        's': 'z',
        'y': 'i',
        'i': 'y',
    },
    suffix: {
        'u': 'l',
        'l': 'u',
        'n': 'm',
        'm': 'n',
    }
};

function buildMisspellingAlternatives(term) {
    const alternatives = [[term, 1]];
    const matches = [];
    
    for (const pattern of Object.keys(replacements.prefix)) {
        const prefix = term.substr(0, pattern.length);
        if (prefix == pattern) {
            matches.push([pattern, 0]);
            break;
        }
    }

    if (term.length > 2) {
        const middle = term.substr(1, term.length - 1);
        for (const pattern of Object.keys(replacements.middle)) {
            for (let i = 0;i < middle.length; i += pattern.length) {
                const prefix = term.substr(i, pattern.length);
                if (prefix == pattern) {
                    matches.push([pattern, i]);
                }
            }
        }
    }

    for (const pattern of Object.keys(replacements.suffix)) {
        const i = term.length - pattern.length;
        const suffix = term.substr(i, pattern.length)
        if (suffix == pattern) {
            matches.push([pattern, i]);
            break;
        }
    }

    const n = 1 << matches.length;
    for (let i = 1; i < n; i++) {
        let alt = term;
        let replacementsCount = 0;
        for (let j = 0; j < matches.length; j++) {
            if ((i >> j) & 1) {
                const offset = matches[j][1];
                const pattern = matches[j][0];
                let replacement = replacements.middle[matches[j][0]];
                if (!offset) {
                    replacement = replacements.prefix[matches[j][0]];
                } else if (term.length - offset == pattern.length) {
                    replacement = replacements.suffix[matches[j][0]];
                }
                alt = alt.substr(0, offset) + alt.substr(offset).replace(pattern, replacement);
                replacementsCount++;
            }
        }
        const weight = (term.length - replacementsCount)/term.length;
        alternatives.push([alt, weight]);
    }

    return alternatives;
}

console.log(buildMisspellingAlternatives('tylenol ascorbico'));

function buildSearchAlternatives(search) {
    const ALTERNATIVES_LIMIT = 100;
    const terms = search.split(' ');
    const termsAlts = [];
    const searchAlts = [];
    
    for (const term of terms) {
        termsAlts.push(buildMisspellingAlternatives(term.trim()));
    }

    let n = 1;
    for (const termAlts of termsAlts) {
        n *= termAlts.length;
    }

    for (let i = 0; i < n && i < ALTERNATIVES_LIMIT; i++) {
        const searchAlt = ['', 0];
        let base = 1;
        for (const termAlts of termsAlts) {
            const termAlt = termAlts[Math.floor(i / base) % termAlts.length];
            searchAlt[0] = `${searchAlt[0]} ${termAlt}`;
            searchAlt[1] = searchAlt[1] + termAlt[1]/termsAlts.length;
            base *= termAlts.length;
        }
        searchAlt[0] = searchAlt[0].substr(1);
        searchAlts.push(searchAlt);
    }

    return searchAlts;
}

console.log(buildSearchAlternatives('tylenol ascorbico'));