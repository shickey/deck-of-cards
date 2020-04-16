
import Util from '../util'
import plusMinus from '../plusminus'

var fontSize

export default {
  deck: function (deck) {
    deck.shuffle = shuffle;

    function shuffle (next) {
      fontSize = Util.getFontSize(deck)

      deck.cards = Util.fisherYates(deck.cards)
      
      var cardsToAnimate = deck.cards.slice();

      deck.queued(function(next) {
        cardsToAnimate.forEach(function (card, i) {
          card.pos = i

          card.shuffle(function (i) {
            if (i === cardsToAnimate.length - 1) {
              next()
            }
          })
        })
      })();
      return
    }
  },

  card: function (card) {
    var $el = card.$el

    card.shuffle = function (cb) {
      var i = card.pos
      var z = i / 4
      var delay = i * 2

      card.animateTo({
        delay: delay,
        duration: 200,

        x: plusMinus(Math.random() * 40 + 20) * fontSize / 16,
        y: -z,
        rot: 0
      })
      card.animateTo({
        delay: 200 + delay,
        duration: 200,

        x: -z,
        y: -z,
        rot: 0,

        onStart: function () {
          $el.style.zIndex = i
        },

        onComplete: function () {
          cb(i)
        }
      })
    }
  }
}
