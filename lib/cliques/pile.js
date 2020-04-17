import Clique from '../clique'
import Card from '../card'

import Util from '../util'

import createElement from '../createElement'
import translate from '../translate'
import prefix from '../prefix'
import Ease from '../ease'
import animationFrames from '../animationFrames'

export default function Pile(deck, cards, params) {
  var {x, y, rot, side} = params
  x = x || 0;
  y = y || 0;
  rot = rot || 0;
  side = side || Card.Side.BACK;
  var self = Object.assign(Clique(deck, cards), {x, y, rot, side, $root: deck.$root, selectionEnabled: false});
  
  cards.forEach(card => {
    card.$el.onclick = null; // No clicking!
  });
  
  // Bottom of pile dummy card
  var pileOutline = { $el: createElement('div') };
  var pileOutlineEl = pileOutline.$el;
  var transform = prefix('transform');
  pileOutlineEl.classList.add('pile-outline');
  pileOutlineEl.style[transform] = translate(self.x + 'px', self.y + 'px');
  pileOutlineEl.style.zIndex = -1;
  pileOutline.setGlow = function(enable) {
    if (enable) {
      this.$el.classList.add('glow');
    }
    else {
      this.$el.classList.remove('glow');
    }
  }
  self.$root.appendChild(pileOutlineEl);
  
  
  // Helper 
  var helper = { $el: createElement('div') };
  var helperEl = helper.$el;
  var transform = prefix('transform');
  helperEl.classList.add('helper');
  helperEl.style[transform] = translate(self.x + 'px', self.y + 'px');
  helperEl.style.zIndex = 100; // Put the hlper above any cards
  
  var helperShowing = false;
  
  self.showHelper = function(enable, options) {
    let animationDuration = (options && options.animationDuration) || (enable ? 500 : 250);
    if (enable) {
      if (options && options.content) {
        helper.$el.textContent = ''; // Remove any children, if they exist
        helper.$el.appendChild(options.content);
      }
      if (!helperShowing) {
        self.queued((next) => {
          // Position the helper
          var cardWidth = Util.getCardWidth(self.deck);
          var spacing = cardWidth / 10;
          var helperZ = self.cards.length / 4;
          var helperX = self.x + (cardWidth / 2) + spacing + (cardWidth / 8) - helperZ + (8 * Util.getFontSize(self.deck));
          helper.$el.style[transform] = translate(helperX  + 'px', (self.y - helperZ) + 'px');
          helper.$el.style['opacity'] = 0;
          
          self.$root.appendChild(helper.$el);
          // Fade in
          animationFrames(0, animationDuration)
            .progress(function (t) {
              var et = Ease.cubicInOut(t)
              helper.$el.style['opacity'] = et;
            })
            .end(function() {
              next();
            })
        }, `PILE (${self.id}) show helper`)();
      }
      helperShowing = true;
    }
    else {
      if (helperShowing) {
        let captureClicks = (e) => { e.stopPropagation(); }
        helper.$el.addEventListener('click', captureClicks, true); // Capture click events to prevent them from propagating down to children
        self.queued((next) => {
          // Fade out
          animationFrames(0, animationDuration)
            .progress(function (t) {
              var et = Ease.cubicInOut(t)
              helper.$el.style['opacity'] = 1.0 - et;
            })
            .end(function() {
              // Remove the capturing event listener
              helper.$el.removeEventListener('click', captureClicks, true);
              self.$root.removeChild(helper.$el);
              next();
            })
        }, `PILE (${self.id}) hide helper`)();
      }
      helperShowing = false;
    }
  }
  
  self.layout = function(info) {
    if (self.cards.length === 0 && !helperShowing) { return; }
    var cardsToAnimate = self.cards.slice();
    var cardWidth = Util.getCardWidth(self.deck);
    var spacing = cardWidth / 10;
    self.queued(function(next) {
      if (cardsToAnimate.length > 0) {
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
        if (helperShowing) {
          var helperZ = cardsToAnimate.length / 4;
          var helperX = self.x + (cardWidth / 2) + spacing + (cardWidth / 8) - helperZ + (8 * Util.getFontSize(self.deck));
          helper.$el.style[transform] = translate(helperX  + 'px', (self.y - helperZ) + 'px');
        }
      }
      else {
        // Only the helper is showing
        if (helperShowing) {
          helper.$el.style[transform] = translate(self.x  + 'px', self.y + 'px');
        }
      }
      
    }, `HAND (${self.id}) layout ${info ? `: ${info}` : ''}`)();
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
  
  self.pushCard = function(card) {
    if (self.selectionEnabled) {
      setTopCardSelectable(false);
    }
    self.cards.push(card);
    
    if (self.selectionEnabled) {
      setTopCardSelectable(true);
    }
  }
  
  self.removeAllCards = function() {
    self.enableSelection(false);
    self.cards = [];
  }
  
  function setTopCardSelectable(selectable) {
    var topCard = {};
    if (self.cards.length === 0) {
      topCard = pileOutline;
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
    }, `PILE (${self.id}) enable selection (${enable})`)();
  }

  self.layout();
  
  return self;
  
}