import getFontSize from './fontSize'
import fisherYates from './fisherYates'

function getCardWidth() {
    return (62 / 16) * getFontSize();
}

function getCardHeight() {
    return (88 / 16) * getFontSize();
}

export default {
    fisherYates,
    getCardWidth,
    getCardHeight
}