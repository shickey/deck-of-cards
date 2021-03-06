
import createElement from './createElement'

import animationFrames from './animationFrames'
import ease from './ease'
import bysuit from './modules/bysuit'
import fan from './modules/fan'
import intro from './modules/intro'
import poker from './modules/poker'
import shuffle from './modules/shuffle'
import shuffleTo from './modules/shuffleTo'
import sort from './modules/sort'
import flip from './modules/flip'

import observable from './observable'
import queue from './queue'
import prefix from './prefix'
import translate from './translate'

import Card from './card'
import Clique from './clique'

import Util from './util'

export default function Deck (jokers) {
  // init cards array
  var cards = new Array(jokers ? 55 : 52)
  var cliques = {};

  var $el = createElement('div')
  var self = observable({mount, unmount, cards, cliques, $el, serialize, generateNextCliqueId})

  var modules = Deck.modules
  var module
  

  // make queueable
  queue(self)

  // load modules
  for (module in modules) {
    addModule(modules[module])
  }

  // add class
  $el.classList.add('deck')

  var card

  // create cards
  for (var i = cards.length; i; i--) {
    card = cards[i - 1] = Card(i - 1)
    card.setSide('back')
    card.mount($el)
  }
  
  // Clique Ids
  var nextCliqueId = 1;
  function generateNextCliqueId() {
      return (((nextCliqueId++) * 1679973079) % (Math.pow(36, 6))).toString(36);
  }

  return self

  function mount (root) {
    // mount deck to root
    self.$root = root
    self.$root.appendChild($el)
  }

  function unmount () {
    // unmount deck from root
    self.$root.removeChild($el)
  }

  function addModule (module) {
    module.deck && module.deck(self)
  }
  
  function serialize() {
    var serialized = {};
    for (var cliqueId in self.cliques) {
      serialized[cliqueId] = self.cliques[cliqueId].serialize();
    }
    return serialized;
  }
}
Deck.animationFrames = animationFrames;
Deck.ease = ease;
Deck.modules = {bysuit, fan, intro, poker, shuffle, shuffleTo, sort, flip};
Deck.Card = Card;
Deck.prefix = prefix;
Deck.translate = translate;
Deck.Util = Util;
Deck.Clique = Clique;
