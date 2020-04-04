import Clique from '../clique'
import Card from '../card'

import createElement from '../createElement'
import translate from '../translate'
import prefix from '../prefix'

export default function Pile(deck, cards, params) {
  var {x, y, rot, side} = params
  x = x || 0;
  y = y || 0;
  rot = rot || 0;
  side = side || Card.Side.BACK;
  var self = Object.assign(Clique(deck, cards), {x, y, rot, side, $root: deck.$root, selectionEnabled: false});
  
  var dummyCard = { $el: createElement('div') };
  var dummyCardEl = dummyCard.$el;
  var transform = prefix('transform');
  dummyCardEl.classList.add('card');
  dummyCardEl.style[transform] = translate(self.x + 'px', self.y + 'px');
  dummyCardEl.style.zIndex = -1;
  dummyCard.setGlow = function(enable) {
    if (enable) {
      this.$el.classList.add('glow');
    }
    else {
      this.$el.classList.remove('glow');
    }
  }
  self.$root.appendChild(dummyCardEl);
  
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
  
  self.popCard = function(num) {
    if (self.selectionEnabled) {
      setTopCardSelectable(false);
    }
    if (typeof num === "undefined") {
      num = 1;
    }
    if (num == 1) {
      return self.cards.pop();
    }
    if (num <= 0) { return []; }
    var drawnCards = [];
    for (var i = 0; i < num; ++i) {
      drawnCards.push(self.cards.pop());
    }
    
    if (self.selectionEnabled && self.cards.length > 0) {
      setTopCardSelectable(true);
    }
    
    return drawnCards;
  }
  
  self.pushCard = function(card, options) {
    if (self.selectionEnabled) {
      setTopCardSelectable(false);
    }
    
    if (options && options.side) {
      card.setSide(options.side);
    }
    else {
      card.setSide(self.side);
    }
    self.cards.push(card);
    
    if (self.selectionEnabled) {
      setTopCardSelectable(true);
    }
  }
  
  function setTopCardSelectable(selectable) {
    var topCard = {};
    if (self.cards.length === 0) {
      topCard = dummyCard;
    }
    else {
      topCard = self.cards[self.cards.length - 1];
    }
    if (selectable) {
      topCard.setGlow(true);
      topCard.$el.onclick = function() {
        if (typeof self.onSelect === 'function') {
          self.onSelect();
        }
      }
    }
    else {
      topCard.setGlow(false);
      topCard.$el.onclick = null;
    }
  }
  
  self.enableSelection = function(enable) {
    self.queued(function(next) {
      self.selectionEnabled = enable;
      setTopCardSelectable(enable);
      next();
    })();
  }

  self.layout();
  
  return self;
  
}