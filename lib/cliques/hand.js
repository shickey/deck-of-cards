import Clique from '../clique'

import Util from '../util'

export default function Hand(deck, cards, params) {
  var {x, y, rot} = params
  x = x || 0;
  y = y || 0;
  rot = rot || 0;
  var self = Object.assign(Clique(deck, cards), {x, y, rot});
  
  self.cards.forEach(card => {
    card.$el.onclick = null; // No clicking!
  });
  
  
  self.layout = function() {
    if (self.cards.length === 0) { return; }
    var cardsToAnimate = self.cards.slice();
    var cardWidth = Util.getCardWidth();
    var spacing = cardWidth / 10;
    self.queued(function(next) {
      
      // The "total width" is slightly weird here because we're actually calculating
      // the distance between the *centers* of the first and last cards.
      // I.e., we don't need to account for the left half of the first card
      // and the right half of the last card, so we subtract a whole card
      // from the `(cardWidth * cards.length)` calculation.
      var totalWidth = (cardWidth * (cardsToAnimate.length - 1)) + (spacing * (cardsToAnimate.length - 1));
      
      var startX = -(totalWidth / 2);
      
      cardsToAnimate.forEach(function(card, i) {
        var cardX = startX + ((cardWidth + spacing) * i);
        var rads = self.rot * Math.PI / 180;
        var rotatedX = cardX * Math.cos(rads);// Always goes to zero: - (y * Math.sin(rads));
        var rotatedY = cardX * Math.sin(rads);// Always goes to zero: + (y * Math.cos(rads));
        card.animateTo({
          duration: 200,
          x: self.x + rotatedX,
          y: self.y + rotatedY,
          rot: self.rot,
          onComplete: function () {
            if (i === cardsToAnimate.length - 1) {
              next();
            }
          }
        })
      })
    })();
  }
  
  self.addCard = function(card) {
    self.cards.push(card);
    self.layout();
  }
  
  self.layout();
  
  return self
  
}
