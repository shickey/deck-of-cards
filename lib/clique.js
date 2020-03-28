import Deck from './deck'
import Card from './card'

import getFontSize from './fontSize'
import observable from './observable'


export default function Clique(deck, cards) {
  
  var self = observable({deck, cards, queued: deck.queued});
  
  // Add all the deck modules to the clique
  var modules = Deck.modules;
  for (var module in modules) {
    addModule(modules[module]);
  }
  
  return self;
  
  function addModule (module) {
    module.deck && module.deck(self);
  }
}

function DrawPile(deck, cards, params) {
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

function Hand(deck, cards, params) {
  var {x, y, rot} = params
  x = x || 0;
  y = y || 0;
  rot = rot || 0;
  var self = Object.assign(Clique(deck, cards), {x, y, rot});
  
  self.cards.forEach(card => {
    card.$el.onclick = null; // No clicking!
  });
  
  var cardWidth = (62 / 16) * getFontSize();
  var spacing = cardWidth / 10;
  
  self.layout = function() {
    if (self.cards.length === 0) { return; }
    var cardsToAnimate = self.cards.slice();
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

Clique.DrawPile = DrawPile;
Clique.Hand = Hand

