'use strict';

var Deck = (function () {
  'use strict';

  var ticking;
  var animations = [];

  function animationFrames(delay, duration) {
    var now = Date.now();

    // calculate animation start/end times
    var start = now + delay;
    var end = start + duration;

    var animation = {
      start: start,
      end: end
    };

    // add animation
    animations.push(animation);

    if (!ticking) {
      // start ticking
      ticking = true;
      requestAnimationFrame(tick);
    }
    var self = {
      start: function start(cb) {
        // add start callback (just one)
        animation.startcb = cb;
        return self;
      },
      progress: function progress(cb) {
        // add progress callback (just one)
        animation.progresscb = cb;
        return self;
      },
      end: function end(cb) {
        // add end callback (just one)
        animation.endcb = cb;
        return self;
      }
    };
    return self;
  }

  function tick() {
    var now = Date.now();

    if (!animations.length) {
      // stop ticking
      ticking = false;
      return;
    }

    for (var i = 0, animation; i < animations.length; i++) {
      animation = animations[i];
      if (now < animation.start) {
        // animation not yet started..
        continue;
      }
      if (!animation.started) {
        // animation starts
        animation.started = true;
        animation.startcb && animation.startcb();
      }
      // animation progress
      var t = (now - animation.start) / (animation.end - animation.start);
      animation.progresscb && animation.progresscb(t < 1 ? t : 1);
      if (now > animation.end) {
        // animation ended
        animation.endcb && animation.endcb();
        animations.splice(i--, 1);
        continue;
      }
    }
    requestAnimationFrame(tick);
  }

  // fallback
  window.requestAnimationFrame || (window.requestAnimationFrame = function (cb) {
    setTimeout(cb, 0);
  });

  var ease = {
    linear: function linear(t) {
      return t;
    },
    quadIn: function quadIn(t) {
      return t * t;
    },
    quadOut: function quadOut(t) {
      return t * (2 - t);
    },
    quadInOut: function quadInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    cubicIn: function cubicIn(t) {
      return t * t * t;
    },
    cubicOut: function cubicOut(t) {
      return --t * t * t + 1;
    },
    cubicInOut: function cubicInOut(t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    quartIn: function quartIn(t) {
      return t * t * t * t;
    },
    quartOut: function quartOut(t) {
      return 1 - --t * t * t * t;
    },
    quartInOut: function quartInOut(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    },
    quintIn: function quintIn(t) {
      return t * t * t * t * t;
    },
    quintOut: function quintOut(t) {
      return 1 + --t * t * t * t * t;
    },
    quintInOut: function quintInOut(t) {
      return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    }
  };

  var flip = {
    deck: function deck(_deck) {
      _deck.flip = _deck.queued(flip);

      function flip(next, side) {
        var flipped = _deck.cards.filter(function (card) {
          return card.side === 'front';
        }).length / _deck.cards.length;

        _deck.cards.forEach(function (card, i) {
          card.setSide(side ? side : flipped > 0.5 ? 'back' : 'front');
        });
        next();
      }
    }
  };

  var sort = {
    deck: function deck(_deck2) {
      _deck2.sort = _deck2.queued(sort);

      function sort(next, reverse) {
        var cards = _deck2.cards;

        cards.sort(function (a, b) {
          if (reverse) {
            return a.i - b.i;
          } else {
            return b.i - a.i;
          }
        });

        cards.forEach(function (card, i) {
          card.sort(i, cards.length, function (i) {
            if (i === cards.length - 1) {
              next();
            }
          }, reverse);
        });
      }
    },
    card: function card(_card) {
      var $el = _card.$el;

      _card.sort = function (i, len, cb, reverse) {
        var z = i / 4;
        var delay = i * 10;

        _card.animateTo({
          delay: delay,
          duration: 400,

          x: -z,
          y: -150,
          rot: 0,

          onComplete: function onComplete() {
            $el.style.zIndex = i;
          }
        });

        _card.animateTo({
          delay: delay + 500,
          duration: 400,

          x: -z,
          y: -z,
          rot: 0,

          onComplete: function onComplete() {
            cb(i);
          }
        });
      };
    }
  };

  function plusminus(value) {
    var plusminus = Math.round(Math.random()) ? -1 : 1;

    return plusminus * value;
  }

  function fontSize() {
    return window.getComputedStyle(document.body).getPropertyValue('font-size').slice(0, -2);
  }

  /**
   * "Shuffles" the deck using the same animation as the shuffle module
   * but leaves the deck in the specific order passed in the params
   */

  var shuffleTo = {
    deck: function deck(_deck3) {
      _deck3.shuffleTo = shuffleTo;

      function shuffleTo(params) {
        var cards = _deck3.cards;
        var order = params.order;

        var newCards = Array(cards.length);
        order.forEach(function (cardVal, i) {
          newCards[i] = cards.find(function (card) {
            return card.i == cardVal;
          });
        });

        _deck3.cards = newCards.slice();

        _deck3.queued(function (next) {

          newCards.forEach(function (card, i) {
            card.pos = i;

            card.shuffleTo(function (i) {
              if (i === newCards.length - 1) {
                next();
              }
            });
          });
        })();
        return;
      }
    },
    card: function card(_card2) {
      var $el = _card2.$el;

      var fontSize$$ = fontSize();

      _card2.shuffleTo = function (cb) {
        var i = _card2.pos;
        var z = i / 4;
        var delay = i * 2;

        _card2.animateTo({
          delay: delay,
          duration: 200,

          x: plusminus(Math.random() * 40 + 20) * fontSize$$ / 16,
          y: -z,
          rot: 0
        });
        _card2.animateTo({
          delay: 200 + delay,
          duration: 200,

          x: -z,
          y: -z,
          rot: 0,

          onStart: function onStart() {
            $el.style.zIndex = i;
          },

          onComplete: function onComplete() {
            cb(i);
          }
        });
      };
    }
  };

  function fisherYates(array) {
    var rnd, temp;

    for (var i = array.length - 1; i; i--) {
      rnd = Math.floor(Math.random() * (i + 1));
      temp = array[i];
      array[i] = array[rnd];
      array[rnd] = temp;
    }

    return array;
  }

  var ____fontSize;

  var shuffle = {
    deck: function deck(_deck4) {
      _deck4.shuffle = _deck4.queued(shuffle);

      function shuffle(next) {
        var cards = _deck4.cards;

        ____fontSize = fontSize();

        fisherYates(cards);

        cards.forEach(function (card, i) {
          card.pos = i;

          card.shuffle(function (i) {
            if (i === cards.length - 1) {
              next();
            }
          });
        });
        return;
      }
    },

    card: function card(_card3) {
      var $el = _card3.$el;

      _card3.shuffle = function (cb) {
        var i = _card3.pos;
        var z = i / 4;
        var delay = i * 2;

        _card3.animateTo({
          delay: delay,
          duration: 200,

          x: plusminus(Math.random() * 40 + 20) * ____fontSize / 16,
          y: -z,
          rot: 0
        });
        _card3.animateTo({
          delay: 200 + delay,
          duration: 200,

          x: -z,
          y: -z,
          rot: 0,

          onStart: function onStart() {
            $el.style.zIndex = i;
          },

          onComplete: function onComplete() {
            cb(i);
          }
        });
      };
    }
  };

  var __fontSize;

  var poker = {
    deck: function deck(_deck5) {
      _deck5.poker = _deck5.queued(poker);

      function poker(next) {
        var cards = _deck5.cards;
        var len = cards.length;

        __fontSize = fontSize();

        cards.slice(-5).reverse().forEach(function (card, i) {
          card.poker(i, len, function (i) {
            card.setSide('front');
            if (i === 4) {
              next();
            }
          });
        });
      }
    },
    card: function card(_card4) {
      var $el = _card4.$el;

      _card4.poker = function (i, len, cb) {
        var delay = i * 250;

        _card4.animateTo({
          delay: delay,
          duration: 250,

          x: Math.round((i - 2.05) * 70 * __fontSize / 16),
          y: Math.round(-110 * __fontSize / 16),
          rot: 0,

          onStart: function onStart() {
            $el.style.zIndex = len - 1 + i;
          },
          onComplete: function onComplete() {
            cb(i);
          }
        });
      };
    }
  };

  var style = document.createElement('p').style;
  var memoized = {};

  function prefix(param) {
    if (typeof memoized[param] !== 'undefined') {
      return memoized[param];
    }

    if (typeof style[param] !== 'undefined') {
      memoized[param] = param;
      return param;
    }

    var camelCase = param[0].toUpperCase() + param.slice(1);
    var prefixes = ['webkit', 'moz', 'Moz', 'ms', 'o'];
    var test;

    for (var i = 0, len = prefixes.length; i < len; i++) {
      test = prefixes[i] + camelCase;
      if (typeof style[test] !== 'undefined') {
        memoized[param] = test;
        return test;
      }
    }
  }

  var has3d;

  function translate(a, b, c) {
    typeof has3d !== 'undefined' || (has3d = check3d());

    c = c || 0;

    if (has3d) {
      return 'translate3d(' + a + ', ' + b + ', ' + c + ')';
    } else {
      return 'translate(' + a + ', ' + b + ')';
    }
  }

  function check3d() {
    // I admit, this line is stealed from the great Velocity.js!
    // http://julian.com/research/velocity/
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isMobile) {
      return false;
    }

    var transform = prefix('transform');
    var $p = document.createElement('p');

    document.body.appendChild($p);
    $p.style[transform] = 'translate3d(1px,1px,1px)';

    has3d = $p.style[transform];
    has3d = has3d != null && has3d.length && has3d !== 'none';

    document.body.removeChild($p);

    return has3d;
  }

  var intro = {
    deck: function deck(_deck6) {
      _deck6.intro = _deck6.queued(intro);

      function intro(next) {
        var cards = _deck6.cards;

        cards.forEach(function (card, i) {
          card.setSide('back');
          card.intro(i, function (i) {
            animationFrames(250, 0).start(function () {
              card.setSide('back');
            });
            if (i === cards.length - 1) {
              next();
            }
          });
        });
      }
    },
    card: function card(_card5) {
      var transform = prefix('transform');

      var $el = _card5.$el;

      _card5.intro = function (i, cb) {
        var delay = 500 + i * 10;
        var z = i / 4;

        $el.style[transform] = translate(-z + 'px', '-250px');
        $el.style.opacity = 0;

        _card5.x = -z;
        _card5.y = -250 - z;
        _card5.rot = 0;

        _card5.animateTo({
          delay: delay,
          duration: 1000,

          x: -z,
          y: -z,

          onStart: function onStart() {
            $el.style.zIndex = i;
          },
          onProgress: function onProgress(t) {
            $el.style.opacity = t;
          },
          onComplete: function onComplete() {
            $el.style.opacity = '';
            cb && cb(i);
          }
        });
      };
    }
  };

  var _fontSize;

  var fan = {
    deck: function deck(_deck7) {
      _deck7.fan = _deck7.queued(fan);

      function fan(next) {
        var cards = _deck7.cards;
        var len = cards.length;

        _fontSize = fontSize();

        cards.forEach(function (card, i) {
          card.fan(i, len, function (i) {
            if (i === cards.length - 1) {
              next();
            }
          });
        });
      }
    },
    card: function card(_card6) {
      var $el = _card6.$el;

      _card6.fan = function (i, len, cb) {
        var z = i / 4;
        var delay = i * 10;
        var rot = i / (len - 1) * 260 - 130;

        _card6.animateTo({
          delay: delay,
          duration: 300,

          x: -z,
          y: -z,
          rot: 0
        });
        _card6.animateTo({
          delay: 300 + delay,
          duration: 300,

          x: Math.cos(deg2rad(rot - 90)) * 55 * _fontSize / 16,
          y: Math.sin(deg2rad(rot - 90)) * 55 * _fontSize / 16,
          rot: rot,

          onStart: function onStart() {
            $el.style.zIndex = i;
          },

          onComplete: function onComplete() {
            cb(i);
          }
        });
      };
    }
  };

  function deg2rad(degrees) {
    return degrees * Math.PI / 180;
  }

  var ___fontSize;

  var bysuit = {
    deck: function deck(_deck8) {
      _deck8.bysuit = _deck8.queued(bysuit);

      function bysuit(next) {
        var cards = _deck8.cards;

        ___fontSize = fontSize();

        cards.forEach(function (card) {
          card.bysuit(function (i) {
            if (i === cards.length - 1) {
              next();
            }
          });
        });
      }
    },
    card: function card(_card7) {
      var rank = _card7.rank;
      var suit = _card7.suit;

      _card7.bysuit = function (cb) {
        var i = _card7.i;
        var delay = i * 10;

        _card7.animateTo({
          delay: delay,
          duration: 400,

          x: -Math.round((6.75 - rank) * 8 * ___fontSize / 16),
          y: -Math.round((1.5 - suit) * 92 * ___fontSize / 16),
          rot: 0,

          onComplete: function onComplete() {
            cb(i);
          }
        });
      };
    }
  };

  function createElement(type) {
    return document.createElement(type);
  }

  function Card(i) {
    var transform = prefix('transform');

    // calculate rank/suit, etc..
    var rank = i % 13 + 1;
    var suit = i / 13 | 0;
    var z = (52 - i) / 4;

    // create elements
    var $el = createElement('div');
    var $face = createElement('div');
    var $back = createElement('div');

    // states
    // var isDraggable = false
    // var isFlippable = false

    // self = card
    var self = { i: i, rank: rank, suit: suit, pos: i, $el: $el, mount: mount, unmount: unmount, setSide: setSide };

    var modules = Deck.modules;
    var module;

    // add classes
    $face.classList.add('face');
    $back.classList.add('back');

    // add default transform
    $el.style[transform] = translate(-z + 'px', -z + 'px');

    // add default values
    self.x = -z;
    self.y = -z;
    self.z = z;
    self.rot = 0;

    // set default side to back
    self.setSide(Card.Side.BACK);

    // add drag/click listeners
    // addListener($el, 'mousedown', onMousedown)
    // addListener($el, 'touchstart', onMousedown)

    // load modules
    for (module in modules) {
      addModule(modules[module]);
    }

    self.animateTo = function (params) {
      var delay = params.delay;
      var duration = params.duration;
      var _params$x = params.x;
      var x = _params$x === undefined ? self.x : _params$x;
      var _params$y = params.y;
      var y = _params$y === undefined ? self.y : _params$y;
      var _params$rot = params.rot;
      var rot = _params$rot === undefined ? self.rot : _params$rot;
      var ease$$ = params.ease;
      var onStart = params.onStart;
      var onProgress = params.onProgress;
      var onComplete = params.onComplete;

      delay = delay || 0;
      duration = duration || 500;
      var startX, startY, startRot;
      var diffX, diffY, diffRot;

      animationFrames(delay, duration).start(function () {
        startX = self.x || 0;
        startY = self.y || 0;
        startRot = self.rot || 0;
        onStart && onStart();
      }).progress(function (t) {
        var et = ease[ease$$ || 'cubicInOut'](t);

        diffX = x - startX;
        diffY = y - startY;
        diffRot = rot - startRot;

        onProgress && onProgress(t, et);

        self.x = startX + diffX * et;
        self.y = startY + diffY * et;
        self.rot = startRot + diffRot * et;

        $el.style[transform] = translate(self.x + 'px', self.y + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
      }).end(function () {
        onComplete && onComplete();
      });
    };

    // set rank & suit
    self.setRankSuit = function (rank, suit) {
      var suitName = SuitName(suit);
      $el.setAttribute('class', 'card ' + suitName + ' rank' + rank);
    };

    self.setRankSuit(rank, suit);

    // self.enableDragging = function () {
    //   // this activates dragging
    //   if (isDraggable) {
    //     // already is draggable, do nothing
    //     return
    //   }
    //   isDraggable = true
    //   $el.style.cursor = 'move'
    // }

    // self.enableFlipping = function () {
    //   if (isFlippable) {
    //     // already is flippable, do nothing
    //     return
    //   }
    //   isFlippable = true
    // }

    // self.disableFlipping = function () {
    //   if (!isFlippable) {
    //     // already disabled flipping, do nothing
    //     return
    //   }
    //   isFlippable = false
    // }

    // self.disableDragging = function () {
    //   if (!isDraggable) {
    //     // already disabled dragging, do nothing
    //     return
    //   }
    //   isDraggable = false
    //   $el.style.cursor = ''
    // }

    return self;

    function addModule(module) {
      // add card module
      module.card && module.card(self);
    }

    // function onMousedown (e) {
    //   var startPos = {}
    //   var pos = {}
    //   var starttime = Date.now()

    //   e.preventDefault()

    //   // get start coordinates and start listening window events
    //   if (e.type === 'mousedown') {
    //     startPos.x = pos.x = e.clientX
    //     startPos.y = pos.y = e.clientY
    //     addListener(window, 'mousemove', onMousemove)
    //     addListener(window, 'mouseup', onMouseup)
    //   } else {
    //     startPos.x = pos.x = e.touches[0].clientX
    //     startPos.y = pos.y = e.touches[0].clientY
    //     addListener(window, 'touchmove', onMousemove)
    //     addListener(window, 'touchend', onMouseup)
    //   }

    //   if (!isDraggable) {
    //     // is not draggable, do nothing
    //     return
    //   }

    //   // move card
    //   $el.style[transform] = translate(self.x + 'px', self.y + 'px') + (self.rot ? ' rotate(' + self.rot + 'deg)' : '')
    //   $el.style.zIndex = maxZ++

    //   function onMousemove (e) {
    //     if (!isDraggable) {
    //       // is not draggable, do nothing
    //       return
    //     }
    //     if (e.type === 'mousemove') {
    //       pos.x = e.clientX
    //       pos.y = e.clientY
    //     } else {
    //       pos.x = e.touches[0].clientX
    //       pos.y = e.touches[0].clientY
    //     }

    //     // move card
    //     $el.style[transform] = translate(Math.round(self.x + pos.x - startPos.x) + 'px', Math.round(self.y + pos.y - startPos.y) + 'px') + (self.rot ? ' rotate(' + self.rot + 'deg)' : '')
    //   }

    //   function onMouseup (e) {
    //     if (isFlippable && Date.now() - starttime < 200) {
    //       // flip sides
    //       self.setSide(self.side === 'front' ? 'back' : 'front')
    //     }
    //     if (e.type === 'mouseup') {
    //       removeListener(window, 'mousemove', onMousemove)
    //       removeListener(window, 'mouseup', onMouseup)
    //     } else {
    //       removeListener(window, 'touchmove', onMousemove)
    //       removeListener(window, 'touchend', onMouseup)
    //     }
    //     if (!isDraggable) {
    //       // is not draggable, do nothing
    //       return
    //     }

    //     // set current position
    //     self.x = self.x + pos.x - startPos.x
    //     self.y = self.y + pos.y - startPos.y
    //   }
    // }

    function mount(target) {
      // mount card to target (deck)
      target.appendChild($el);

      self.$root = target;
    }

    function unmount() {
      // unmount from root (deck)
      self.$root && self.$root.removeChild($el);
      self.$root = null;
    }

    function setSide(newSide) {
      // flip sides
      if (newSide === Card.Side.FRONT) {
        if (self.side === Card.Side.BACK) {
          $el.removeChild($back);
        }
        self.side = Card.Side.FRONT;
        $el.appendChild($face);
        self.setRankSuit(self.rank, self.suit);
      } else {
        if (self.side === Card.Side.FRONT) {
          $el.removeChild($face);
        }
        self.side = Card.Side.BACK;
        $el.appendChild($back);
        $el.setAttribute('class', 'card');
      }
    }
  }

  Card.Side = Object.freeze({
    FRONT: 'front',
    BACK: 'back'
  });

  function SuitName(suit) {
    // return suit name from suit value
    return suit === 0 ? 'spades' : suit === 1 ? 'hearts' : suit === 2 ? 'clubs' : suit === 3 ? 'diamonds' : 'joker';
  }

  function getCardWidth() {
    return 62 / 16 * fontSize();
  }

  function getCardHeight() {
    return 88 / 16 * fontSize();
  }

  var nextId = 1;
  function generateNextCliqueId() {
    return (nextId++ * 1679973079 % Math.pow(36, 6)).toString(36);
  }

  var util = {
    fisherYates: fisherYates,
    getCardWidth: getCardWidth,
    getCardHeight: getCardHeight,
    generateNextCliqueId: generateNextCliqueId
  };

  function Pile(deck, cards, params) {
    var x = params.x;
    var y = params.y;
    var rot = params.rot;
    var side = params.side;

    x = x || 0;
    y = y || 0;
    rot = rot || 0;
    side = side || Card.Side.BACK;
    var self = Object.assign(Clique(deck, cards), { x: x, y: y, rot: rot, side: side, canDraw: false });

    cards.forEach(function (card) {
      card.$el.onclick = null; // No clicking!
    });

    self.layout = function () {
      if (self.cards.length === 0) {
        return;
      }
      var cardsToAnimate = self.cards.slice();
      self.queued(function (next) {
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

            onComplete: function onComplete() {
              if (i === cardsToAnimate.length - 1) {
                next();
              }
            }
          });
        });
      })();
    };

    self.draw = function (num) {
      if (typeof num === "undefined") {
        num = 1;
      }
      if (num == 1) {
        return self.cards.pop();
      }
      var drawnCards = [];
      for (var i = 0; i < num; ++i) {
        drawnCards.push(self.cards.pop());
      }
      return drawnCards;
    };

    self.prepareForDraw = function (cb) {
      if (self.cards.length == 0) {
        return false;
      }
      self.queued(function (next) {
        if (cb) {
          self.canDraw = true;
          var topCard = self.cards[self.cards.length - 1];
          topCard.$el.classList.add('glow');
          topCard.$el.onclick = setupDrawClickHandler(cb);
        } else {
          self.canDraw = false;
          var topCard = self.cards[self.cards.length - 1];
          topCard.$el.classList.remove('glow');
          topCard.$el.onclick = null;
        }
        next();
      })();
      return true;
    };

    self.addCard = function (card) {
      self.cards.push(card);
      self.layout();
    };

    self.layout();

    return self;

    function setupDrawClickHandler(cb) {
      return function () {
        var card = self.cards.pop();
        card.$el.classList.remove('glow');
        card.$el.onclick = null;
        self.canDraw = false;
        if (cb) {
          cb(card);
        }
      };
    }
  }

  function Hand(deck, cards, params) {
    var x = params.x;
    var y = params.y;
    var rot = params.rot;

    x = x || 0;
    y = y || 0;
    rot = rot || 0;
    var self = Object.assign(Clique(deck, cards), { x: x, y: y, rot: rot });

    self.cards.forEach(function (card) {
      card.$el.onclick = null; // No clicking!
    });

    self.layout = function () {
      if (self.cards.length === 0) {
        return;
      }
      var cardsToAnimate = self.cards.slice();
      var cardWidth = util.getCardWidth();
      var spacing = cardWidth / 10;
      self.queued(function (next) {

        // The "total width" is slightly weird here because we're actually calculating
        // the distance between the *centers* of the first and last cards.
        // I.e., we don't need to account for the left half of the first card
        // and the right half of the last card, so we subtract a whole card
        // from the `(cardWidth * cards.length)` calculation.
        var totalWidth = cardWidth * (cardsToAnimate.length - 1) + spacing * (cardsToAnimate.length - 1);

        var startX = -(totalWidth / 2);

        cardsToAnimate.forEach(function (card, i) {
          var cardX = startX + (cardWidth + spacing) * i;
          var rads = self.rot * Math.PI / 180;
          var rotatedX = cardX * Math.cos(rads); // Always goes to zero: - (y * Math.sin(rads));
          var rotatedY = cardX * Math.sin(rads); // Always goes to zero: + (y * Math.cos(rads));
          card.animateTo({
            duration: 200,
            x: self.x + rotatedX,
            y: self.y + rotatedY,
            rot: self.rot,
            onComplete: function onComplete() {
              if (i === cardsToAnimate.length - 1) {
                next();
              }
            }
          });
        });
      })();
    };

    self.addCard = function (card) {
      self.cards.push(card);
      self.layout();
    };

    self.peek = function (num, handler) {
      var totalClicks = 0;
      var cards = self.cards.slice();
      self.queued(function (next) {
        cards.forEach(function (card) {
          card.$el.classList.add('glow');
          var clickFunction = function clickFunction() {
            totalClicks++;
            if (totalClicks < num) {
              card.setSide(Card.Side.FRONT);
              card.$el.onclick = null;
              card.$el.classList.remove('glow');
            } else if (totalClicks == num) {
              card.setSide(Card.Side.FRONT);
              cards.forEach(function (card) {
                card.$el.onclick = clickFunction;
                card.$el.classList.remove('glow'); // To keep them all in sync
                card.$el.classList.add('glow');
              });
            } else {
              cards.forEach(function (card) {
                card.setSide(Card.Side.BACK);
                card.$el.onclick = null;
                if (handler) {
                  handler();
                }
              });
            }
          };
          card.$el.onclick = clickFunction;
        });
        next();
      })();
    };

    self.layout();

    return self;
  }

  function observable(target) {
    target || (target = {});
    var listeners = {};

    target.on = on;
    target.one = one;
    target.off = off;
    target.trigger = trigger;

    return target;

    function on(name, cb, ctx) {
      listeners[name] || (listeners[name] = []);
      listeners[name].push({ cb: cb, ctx: ctx });
    }

    function one(name, cb, ctx) {
      listeners[name] || (listeners[name] = []);
      listeners[name].push({
        cb: cb, ctx: ctx, once: true
      });
    }

    function trigger(name) {
      var self = this;
      var args = Array.prototype.slice(arguments, 1);

      var currentListeners = listeners[name] || [];

      currentListeners.filter(function (listener) {
        listener.cb.apply(self, args);

        return !listener.once;
      });
    }

    function off(name, cb) {
      if (!name) {
        listeners = {};
        return;
      }

      if (!cb) {
        listeners[name] = [];
        return;
      }

      listeners[name] = listeners[name].filter(function (listener) {
        return listener.cb !== cb;
      });
    }
  }

  function Clique(deck, cards, params) {
    var id = params && params.id || util.generateNextCliqueId();

    var self = observable({ id: id, deck: deck, cards: cards, queued: deck.queued });

    // Add all the deck modules to the clique
    var modules = Deck.modules;
    for (var module in modules) {
      addModule(modules[module]);
    }

    self.serialize = function () {
      return {
        id: self.id,
        cardIds: self.cards.map(function (card) {
          return card.i;
        })
      };
    };

    self.gatherCards = function (cardIds) {
      var newCards = [];
      cardIds.forEach(function (id) {
        newCards.push(self.deck.cards.find(function (c) {
          return id == c.i;
        }));
      });
      self.cards = newCards;
      if (typeof self.layout === "function") {
        self.layout();
      }
    };

    // Register clique with its deck
    deck.cliques[self.id] = self;

    return self;

    function addModule(module) {
      module.deck && module.deck(self);
    }
  }

  Clique.Pile = Pile;
  Clique.Hand = Hand;

  function queue(target) {
    var array = Array.prototype;

    var queueing = [];

    target.queue = queue;
    target.queued = queued;

    return target;

    function queued(action) {
      return function () {
        var self = this;
        var args = arguments;

        queue(function (next) {
          action.apply(self, array.concat.apply(next, args));
        });
      };
    }

    function queue(action) {
      if (!action) {
        return;
      }

      queueing.push(action);

      if (queueing.length === 1) {
        next();
      }
    }
    function next() {
      queueing[0](function (err) {
        if (err) {
          throw err;
        }

        queueing = queueing.slice(1);

        if (queueing.length) {
          next();
        }
      });
    }
  }

  function Deck(jokers) {
    // init cards array
    var cards = new Array(jokers ? 55 : 52);
    var cliques = {};

    var $el = createElement('div');
    var self = observable({ mount: mount, unmount: unmount, cards: cards, cliques: cliques, $el: $el, serialize: serialize });
    var $root;

    var modules = Deck.modules;
    var module;

    // make queueable
    queue(self);

    // load modules
    for (module in modules) {
      addModule(modules[module]);
    }

    // add class
    $el.classList.add('deck');

    var card;

    // create cards
    for (var i = cards.length; i; i--) {
      card = cards[i - 1] = Card(i - 1);
      card.setSide('back');
      card.mount($el);
    }

    return self;

    function mount(root) {
      // mount deck to root
      $root = root;
      $root.appendChild($el);
    }

    function unmount() {
      // unmount deck from root
      $root.removeChild($el);
    }

    function addModule(module) {
      module.deck && module.deck(self);
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
  Deck.modules = { bysuit: bysuit, fan: fan, intro: intro, poker: poker, shuffle: shuffle, shuffleTo: shuffleTo, sort: sort, flip: flip };
  Deck.Card = Card;
  Deck.prefix = prefix;
  Deck.translate = translate;
  Deck.Util = util;
  Deck.Clique = Clique;

  return Deck;
})();
