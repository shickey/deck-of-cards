
import prefix from './prefix'

export default function (card, $el) {
  var transform = prefix('transform')
  var transformOrigin = prefix('transformOrigin')
  var transition = prefix('transition')
  var transitionDelay = prefix('transitionDelay')

  card.fan = function (i, cb) {
    var z = i / 5
    var delay = i * 10
    var rot = i / 51 * 260 - 130

    $el.style[transformOrigin] = '50% 110%'

    setTimeout(function () {
      $el.style[transition] = '.3s all cubic-bezier(0.645, 0.045, 0.355, 1.000)'
      $el.style[transitionDelay] = delay / 1000 + 's'
      $el.style[transform] = 'translate(-' + z + 'px, -' + z + 'px)'

      setTimeout(function () {
        $el.style[transitionDelay] = ''
        $el.style[transform] = 'rotate(' + rot + 'deg)'
      }, 300 + delay)

    }, 0)

    $el.style.zIndex = i

    setTimeout(function () {
      cb(i)
    }, 1000 + delay)
  }
}