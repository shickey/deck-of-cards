import Clique from '../clique'
import Card from '../card'

import Util from '../util'

import createElement from '../createElement'
import translate from '../translate'
import prefix from '../prefix'
import Ease from '../ease'
import animationFrames from '../animationFrames'

export default function Hand(deck, cards, params) {
  var {x, y, rot, side} = params
  x = x || 0;
  y = y || 0;
  rot = rot || 0;
  side = side || Card.Side.BACK;
  
  var prominentCards = new Set();
  var self = Object.assign(Clique(deck, cards), {x, y, rot, side, prominentCards, $root: deck.$root});
  
  self.cards.forEach(card => {
    card.$el.onclick = null; // No clicking!
  });
  
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
          if (self.cards.length > 0) {
            var cardWidth = Util.getCardWidth(self.deck);
            var spacing = cardWidth / 10;
            var handWidth = (cardWidth * (self.cards.length - 1)) + (spacing * (self.cards.length - 1));
            var handStartX = -(handWidth / 2);
            var helperX = handStartX + ((cardWidth + spacing) * self.cards.length) - (3 * cardWidth / 8);
            var rads = self.rot * Math.PI / 180;
            var rotatedX = helperX * Math.cos(rads);// Always goes to zero: - (y * Math.sin(rads));
            var rotatedY = helperX * Math.sin(rads);// Always goes to zero: + (y * Math.cos(rads));
            helper.$el.classList.remove('alone');
            helper.$el.style[transform] = translate((self.x + rotatedX)  + 'px', (self.y + rotatedY) + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
          }
          else {
            helper.$el.classList.add('alone');
            helper.$el.style[transform] = translate(self.x  + 'px', self.y + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
          }
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
            });
        }, `HAND (${self.id}) show helper`)();
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
            });
        }, `HAND (${self.id}) hide helper`)();
      }
      helperShowing = false;
    }
  }
  
  self.layout = function(info) {
    if (self.cards.length === 0 && !helperShowing) { return; }
    var cardsToAnimate = self.cards.slice();
    var cardWidth = Util.getCardWidth(self.deck);
    var cardHeight = Util.getCardHeight(self.deck);
    var spacing = cardWidth / 10;
    self.queued(function(next) {
      
      if (cardsToAnimate.length > 0) {
        // The "total width" is slightly weird here because we're actually calculating
        // the distance between the *centers* of the first and last cards.
        // I.e., we don't need to account for the left half of the first card
        // and the right half of the last card, so we subtract a whole card
        // from the `(cardWidth * cards.length)` calculation.
        var totalWidth = (cardWidth * (cardsToAnimate.length - 1)) + (spacing * (cardsToAnimate.length - 1));
        
        var startX = -(totalWidth / 2);
        
        cardsToAnimate.forEach(function(card, i) {
          card.setSide(self.side);
          var cardX = startX + ((cardWidth + spacing) * i);
          var cardY = self.prominentCards.has(i) ? -cardHeight / 4 : 0;
          var rads = self.rot * Math.PI / 180;
          var rotatedX = cardX * Math.cos(rads) - (cardY * Math.sin(rads));
          var rotatedY = cardX * Math.sin(rads) + (cardY * Math.cos(rads));
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
          });
        });
        
        if (helperShowing) {
          var helperX = startX + ((cardWidth + spacing) * cardsToAnimate.length) - (3 * cardWidth / 8);
          var rads = self.rot * Math.PI / 180;
          var rotatedX = helperX * Math.cos(rads);// Always goes to zero: - (y * Math.sin(rads));
          var rotatedY = helperX * Math.sin(rads);// Always goes to zero: + (y * Math.cos(rads));
          helper.$el.classList.remove('alone');
          helper.$el.style[transform] = translate((self.x + rotatedX)  + 'px', (self.y + rotatedY) + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
        }
      }
      else {
        // Only the helper is showing
        if (helperShowing) {
          helper.$el.classList.add('alone');
          helper.$el.style[transform] = translate(self.x  + 'px', self.y + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
        }
      }
      
    }, `HAND (${self.id}) layout ${info ? `: ${info}` : ''}`)();
  }
  
  self.setCardProminentAtIndex = function(index, prominent) {
    if (prominent && !self.prominentCards.has(index)) {
      self.prominentCards.add(index);
    }
    else if (!prominent && self.prominentCards.has(index)) {
      self.prominentCards.delete(index);
    }
  }
  
  self.cardAtIndexIsProminent = function(index) {
    return self.prominentCards.has(index);
  }
  
  self.setCardSelectable = function(card, selectable) {
    if (selectable) {
      card.setGlow(true);
      card.$el.onclick = function() {
        if (typeof self.onSelect === 'function') {
          var cardIdx = self.cards.indexOf(card);
          self.onSelect(card, cardIdx);
        }
      }
    }
    else {
      card.setGlow(false);
      card.$el.onclick = null;
    }
  }
  
  self.enableSelection = function(enable) {
    self.queued(function(next) {
      self.selectionEnabled = enable;
      self.cards.forEach(function(card) {
        self.setCardSelectable(card, enable);
      });
      next();
    }, `HAND (${self.id}) enable selection (${enable})`)();
  }
  
  self.addCard = function(card) {
    self.cards.push(card);
  }
  
  self.removeCardAtIndex = function(index) {
    if (index >= self.cards.length) { return; }
    var card = self.cards[index];
    if (self.selectionEnabled) {
      self.setCardSelectable(card, false);
    }
    self.cards.splice(index, 1);
    if (self.prominentCards.has(index)) {
      self.prominentCards.delete(index);
    }
    
    // Update card prominences
    let newProminences = new Set();
    for (var val in self.prominentCards.values()) {
      if (val.value < index) {
        newProminences.add(val.value);
      }
      else {
        newProminences.add(val.value - 1);
      }
    }
    self.prominentCards = newProminences;
    
    return card;
  }
  
  self.insertCardAtIndex = function(card, index) {
    if (index < 0) { return; }
    if (index > self.cards.length) {
      self.addCard(card, options);
      return;
    }
    self.cards.splice(index, 0, card);
    
    // Update card prominences
    let newProminences = new Set();
    for (var val in self.prominentCards.values()) {
      if (val.value < index) {
        newProminences.add(val.value);
      }
      else {
        newProminences.add(val.value + 1);
      }
    }
    self.prominentCards = newProminences;
  }
  
  self.replaceCardAtIndex = function(index, newCard) {
    var replacing = self.cards[index];
    if (self.selectionEnabled) {
      self.setCardSelectable(replacing, false);
    }
    if (self.selectionEnabled) {
      self.setCardSelectable(newCard, true);
    }
    self.cards[index] = newCard;
    return replacing;
  }
  
  self.layout();
  
  return self
  
}
