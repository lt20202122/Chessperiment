import filter from "leo-profanity";

let initialized = false;

export function initProfanity() {
    if (initialized) return filter;

    filter.loadDictionary("en");
    filter.loadDictionary("de");
    initialized = true;

    return filter;
}

export default filter;
