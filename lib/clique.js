import Deck from './deck'

import Pile from './cliques/pile'
import Hand from './cliques/hand'

import Util from './util'
import observable from './observable'


export default function Clique(deck, cards, params) {
  var id = (params && params.id) || Util.generateNextCliqueId();
  
  var self = observable({id, deck, cards, queued: deck.queued});
  
  // Add all the deck modules to the clique
  var modules = Deck.modules;
  for (var module in modules) {
    addModule(modules[module]);
  }
  
  self.serialize = function() {
    return {
      id: self.id,
      cardIds: self.cards.map(card => card.i)
    }
  }
  
  self.gatherCards = function(cardIds) {
    var newCards = [];
    cardIds.forEach(id => {
      newCards.push(self.deck.cards.find(c => id == c.i));
    })
    self.cards = newCards;
    if (typeof self.layout === "function") {
      self.layout();
    }
  }
  
  self.addCard = function(card) {
    self.cards.push(card);
    if (typeof self.layout === "function") {
      self.layout();
    }
  }
  
  // Register clique with its deck
  deck.cliques[self.id] = self;
  
  return self;
  
  function addModule (module) {
    module.deck && module.deck(self);
  }
  
}

Clique.Pile = Pile;
Clique.Hand = Hand;

