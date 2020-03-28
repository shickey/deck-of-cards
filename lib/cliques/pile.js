import Clique from '../clique'

export default function Pile(deck, cards, params) {
  var {x, y} = params
  x = x || 0;
  y = y || 0;
  var self = Object.assign(Clique(deck, cards), {x, y, canDraw: false});
  
  cards.forEach(card => {
    card.$el.onclick = null; // No clicking!
  });
  
  self.setup = function(pos) {
    self.queued(function(next) {
      self.cards.forEach(function (card, i) {
        var z = i / 4;
        card.setSide('back');
        card.$el.style.zIndex = i;
        card.animateTo({
          delay: 0,
          duration: 200,

          x: self.x - z,
          y: self.y - z,
          rot: 0,

          onComplete: function () {
            if (i === self.cards.length - 1) {
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
  }
  
  self.setup();
  
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