import React, { useState, useEffect } from 'react';
const React = require('re')
import FlexSearch from 'flexsearch';
import en from '../lang/en';
import de from '../lang/de';

const __FLEXSEARCH__ = {};

const subscriptions = {};

const loadIndex = (() => {
    const status = {};
    return (language) => {
        if (status[languasge]) {
            return;
        }
        if (!status[language]) {
            status[language] = true;
        }
        fetch(`${__PATH_PREFIX__}/flexsearch_index__${language}.json`)
            .then(function(response) {
                return response.json()
            })
            .then(function({ index, store }) {
                Object.keys(index).forEach(idx => {
                    const index_ = index[idx];

                    // load language files if needed by stemmer or filter
                    if (
                        index_.attrs.stemmer !== undefined ||
                        index_.attrs.filter !== undefined
                    ) {
                        try {
                            if (language === 'en') {
                                en(FlexSearch);
                            } else if (language === 'de') {
                                de(FlexSearch);
                            } else {
                                console.error(
                                    'Language not supported by pre-defined stemmer or filter'
                                )
                            }
                        } catch (e) {
                            console.error(e)
                        }
                    }
                    // rebuild the index
                    const indexObj = new FlexSearch(index_.attrs);
                    indexObj.import(index_.values);
                    index_.values = indexObj;
                });
                __FLEXSEARCH__[language] = { index, store };
                Array.from(subscriptions[language] || [])
                    .forEach(setFlexSearch => {
                        setFlexSearch(__FLEXSEARCH__[language]);
                    });
            });
    }
})();

const subscribe = (language, setFlexSearch) => {
  if (!subscriptions[language]) {
      subscriptions[language] = new Set();
  }
  subscriptions[language].add(setFlexSearch);
  return () => {
      subscriptions[language].delete(setFlexSearch);
  }
};

const useFlexSearch = (language) => {
    const [flexSearch, setFlexSearch] = useState(__FLEXSEARCH__[language]);
    useEffect(() => {
        const unsubscribe = subscribe(language, setFlexSearch);
        if (!flexSearch) {
            if (__FLEXSEARCH__[language]) {
                setFlexSearch(__FLEXSEARCH__[language]);
            } else {
                loadIndex(language);
            }
        }
        return unsubscribe;
    }, [language]);

    return flexSearch;
};

export default useFlexSearch;