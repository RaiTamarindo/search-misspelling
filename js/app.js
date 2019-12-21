'use strict';

window.onload = (function () {
    const alternatives = document.getElementById('alternatives');
    document.getElementById('search')
        .addEventListener('keyup', (ev) => {
            alternatives.innerHTML = buildSearchAlternatives(ev.target.value)
                .sort((alt1, alt2) => alt2[1] - alt1[1])
                .map(([searchAlt, weight]) => `<span style="font-size: ${weight}em">${searchAlt} </span>`)
                .reduce((html, alt) => html + alt, '');
        });
});

function buildSearchAlternatives(search) {
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
        'sse': 'ce',
        'ce': 'sse',
        'ssi': 'ci',
        'ci': 'ssi',
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
        'sse': 'ce',
        'ce': 'sse',
        'ssi': 'ci',
        'ci': 'ssi',
        'u': 'l',
        'l': 'u',
        'n': 'm',
        'm': 'n',
        'ão': 'am',
        'am': 'ão',
    }
};

function buildMisspellingAlternatives(term) {
    const alternatives = [[term, 1]];
    const matches = [];

    for (const pattern of Object.keys(replacements.prefix)) {
        const prefix = term.substr(0, pattern.length);
        if (prefix == pattern) {
            matches.push([pattern, 0]);
        }
    }

    if (term.length > 2) {
        const middle = term.substring(1, term.length - 1);
        for (const pattern of Object.keys(replacements.middle)) {
            for (let i = 0; i < middle.length; i++) {
                const prefix = middle.substr(i, pattern.length);
                if (prefix == pattern) {
                    matches.push([pattern, i + 1]);
                }
            }
        }
    }

    for (const pattern of Object.keys(replacements.suffix)) {
        const i = term.length - pattern.length;
        const suffix = term.substr(i, pattern.length);
        if (suffix == pattern) {
            matches.push([pattern, i]);
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
        const weight = (term.length - replacementsCount) / term.length;
        alternatives.push([alt, weight]);
    }

    return alternatives;
}
