import Deck from './deck'

import Pile from './cliques/pile'
import Hand from './cliques/hand'

import observable from './observable'


export default function Clique(deck, cards, params) {
  var id = (params && params.id) || deck.generateNextCliqueId();
  
  var self = observable({
    id, 
    deck, 
    cards, 
    queued: deck.queued, 
    beginQueueTransaction: deck.beginQueueTransaction, 
    endQueueTransaction: deck.endQueueTransaction, 
    withQueueTransaction: deck.withQueueTransaction});
  
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
      var card = self.deck.cards.find(c => id == c.i)
      if (typeof self.side !== 'undefined') {
        card.setSide(self.side);
      }
      newCards.push(card);
    })
    self.cards = newCards;
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

