import Clique from '../clique'
import Card from '../card'

export default function Pile(deck, cards, params) {
  var {x, y, rot, side} = params
  x = x || 0;
  y = y || 0;
  rot = rot || 0;
  side = side || Card.Side.BACK;
  var self = Object.assign(Clique(deck, cards), {x, y, rot, side, canDraw: false});
  
  cards.forEach(card => {
    card.$el.onclick = null; // No clicking!
  });
  
  self.layout = function() {
    if (self.cards.length === 0) { return; }
    var cardsToAnimate = self.cards.slice();
    self.queued(function(next) {
      cardsToAnimate.forEach(function (card, i) {
        var z = i / 4;
        card.setSide(self.side);
        card.$el.style.zIndex = i;
        card.animateTo({
          delay: 0,
          duration: 200,

          x: self.x - z,
          y: self.y - z,
          rot: self.rot,

          onComplete: function () {
            if (i === cardsToAnimate.length - 1) {
              next();
            }
          }
        });
      });
    })();
  }
  
  self.draw = function(num) {
      if (typeof num === "undefined") {
        num = 1;
      }
      if (num == 1) {
        return self.cards.pop();
      }
      var drawnCards = [];
      for (var i = 0; i < num; ++i) {
        drawnCards.push(self.cards.pop());
      }
      return drawnCards;
  }
  
  self.prepareForDraw = function(cb) {
    if (self.cards.length == 0) { return false; }
    self.queued(function(next) {
      if (cb) {
        self.canDraw = true;
        var topCard = self.cards[self.cards.length - 1];
        topCard.$el.classList.add('glow');
        topCard.$el.onclick = setupDrawClickHandler(cb);
      }
      else {
        self.canDraw = false;
        var topCard = self.cards[self.cards.length - 1];
        topCard.$el.classList.remove('glow');
        topCard.$el.onclick = null;
      }
      next();
    })();
    return true;
  }
  
  self.addCard = function(card) {
    self.cards.push(card);
    self.layout();
  }
  
  self.layout();
  
  return self;
  
  function setupDrawClickHandler(cb) {
    return function () {
      var card = self.cards.pop();
      card.$el.classList.remove('glow');
      card.$el.onclick = null;
      self.canDraw = false;
      if (cb) {
        cb(card);
      }
    }
  }
}