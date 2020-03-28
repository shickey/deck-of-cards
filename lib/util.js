import getFontSize from './fontSize'
import fisherYates from './fisherYates'

function getCardWidth() {
    return (62 / 16) * getFontSize();
}

function getCardHeight() {
    return (88 / 16) * getFontSize();
}

var nextId = 1;
function generateNextCliqueId() {
    return (((nextId++) * 1679973079) % (Math.pow(36, 6))).toString(36);
}

export default {
    fisherYates,
    getCardWidth,
    getCardHeight,
    generateNextCliqueId
}