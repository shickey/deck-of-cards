import Deck from './deck'

import Pile from './cliques/pile'
import Hand from './cliques/hand'

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

Clique.Pile = Pile;
Clique.Hand = Hand;

