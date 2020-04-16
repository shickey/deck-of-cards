import Util from '../util'
import plusMinus from '../plusminus'

/**
 * "Shuffles" the deck using the same animation as the shuffle module
 * but leaves the deck in the specific order passed in the params
 */
 
var fontSize

export default {
  deck: function (deck) {
    deck.shuffleTo = shuffleTo;

    function shuffleTo (params) {
      fontSize = Util.getFontSize(deck)
      
      var cards = deck.cards;
      var order = params.order;
      
      var newCards = Array(cards.length);
      order.forEach((cardVal, i) => {
        newCards[i] = cards.find(card => card.i == cardVal);
      })
      
      deck.cards = newCards.slice();
      
      deck.queued(function(next) {
      
        newCards.forEach(function (card, i) {
          card.pos = i;
          
          card.shuffleTo(function (i) {
            if (i === newCards.length - 1) {
              next();
            }
          })
        })
      })();
      return;
    }
  },
  card: function (card) {
    var $el = card.$el

    card.shuffleTo = function (cb) {
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