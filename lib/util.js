import fisherYates from './fisherYates'

function getFontSize(deck) {
    return window.getComputedStyle(deck.$root).getPropertyValue('font-size').slice(0, -2);
}

function getCardWidth(deck) {
    let emHeight = getFontSize(deck);
    return (62 / 16) * emHeight;
}

function getCardHeight(deck) {
    let emHeight = getFontSize(deck);
    return (88 / 16) * emHeight;
}

export default {
    fisherYates,
    getFontSize,
    getCardWidth,
    getCardHeight
}