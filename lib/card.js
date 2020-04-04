
import Deck from './deck'

import animationFrames from './animationFrames'
import createElement from './createElement'
import Ease from './ease'
import translate from './translate'
import prefix from './prefix'

var maxZ = 52

export default function Card(i) {
  var transform = prefix('transform')

  // calculate rank/suit, etc..
  var rank = i % 13 + 1
  var suit = i / 13 | 0
  var z = (52 - i) / 4

  // create elements
  var $el = createElement('div')
  var $face = createElement('div')
  var $back = createElement('div')

  // self = card
  var self = {i, rank, suit, pos: i, $el, mount, unmount, setSide}

  var modules = Deck.modules
  var module

  // add classes
  $face.classList.add('face')
  $back.classList.add('back')

  // add default transform
  $el.style[transform] = translate(-z + 'px', -z + 'px')

  // add default values
  self.x = -z
  self.y = -z
  self.z = z
  self.rot = 0

  // set default side to back
  self.setSide(Card.Side.BACK)

  // load modules
  for (module in modules) {
    addModule(modules[module])
  }

  self.animateTo = function (params) {
    var {delay, duration, x = self.x, y = self.y, rot = self.rot, ease, onStart, onProgress, onComplete} = params
    delay = delay || 0;
    duration = duration || 500;
    var startX, startY, startRot
    var diffX, diffY, diffRot

    animationFrames(delay, duration)
      .start(function () {
        startX = self.x || 0
        startY = self.y || 0
        startRot = self.rot || 0
        onStart && onStart()
      })
      .progress(function (t) {
        var et = Ease[ease || 'cubicInOut'](t)

        diffX = x - startX
        diffY = y - startY
        diffRot = rot - startRot

        onProgress && onProgress(t, et)

        self.x = startX + diffX * et
        self.y = startY + diffY * et
        self.rot = startRot + diffRot * et

        $el.style[transform] = translate(self.x + 'px', self.y + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '')
      })
      .end(function () {
        onComplete && onComplete()
      })
  }
  
  self.setGlow = function(enable) {
    if (enable) {
      self.$el.classList.add('glow');
    }
    else {
      self.$el.classList.remove('glow');
    }
  }

  // set rank & suit
  self.setRankSuit = function (rank, suit) {
    var suitName = SuitName(suit)
    $el.setAttribute('class', 'card ' + suitName + ' rank' + rank)
  }

  self.setRankSuit(rank, suit)

  return self

  function addModule (module) {
    // add card module
    module.card && module.card(self)
  }

  function mount (target) {
    // mount card to target (deck)
    target.appendChild($el)

    self.$root = target
  }

  function unmount () {
    // unmount from root (deck)
    self.$root && self.$root.removeChild($el)
    self.$root = null
  }

  function setSide (newSide) {
    // flip sides
    if (newSide === Card.Side.FRONT) {
      if (self.side === Card.Side.BACK) {
        $el.removeChild($back)
      }
      self.side = Card.Side.FRONT
      $el.appendChild($face)
      self.setRankSuit(self.rank, self.suit)
    } else {
      if (self.side === Card.Side.FRONT) {
        $el.removeChild($face)
      }
      self.side = Card.Side.BACK
      $el.appendChild($back)
      $el.setAttribute('class', 'card')
    }
  }
}

Card.Side = Object.freeze({
  FRONT: 'front',
  BACK: 'back'
});

function SuitName (suit) {
  // return suit name from suit value
  return suit === 0 ? 'spades' : suit === 1 ? 'hearts' : suit === 2 ? 'clubs' : suit === 3 ? 'diamonds' : 'joker'
}

function addListener (target, name, listener) {
  target.addEventListener(name, listener)
}

function removeListener (target, name, listener) {
  target.removeEventListener(name, listener)
}
