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

  function getFontSize(deck) {
    return window.getComputedStyle(deck.$root).getPropertyValue('font-size').slice(0, -2);
  }

  function getCardWidth(deck) {
    var emHeight = getFontSize(deck);
    return 62 / 16 * emHeight;
  }

  function getCardHeight(deck) {
    var emHeight = getFontSize(deck);
    return 88 / 16 * emHeight;
  }

  var util = {
    fisherYates: fisherYates,
    getFontSize: getFontSize,
    getCardWidth: getCardWidth,
    getCardHeight: getCardHeight
  };

  /**
   * "Shuffles" the deck using the same animation as the shuffle module
   * but leaves the deck in the specific order passed in the params
   */

  var ___fontSize;

  var shuffleTo = {
    deck: function deck(_deck3) {
      _deck3.shuffleTo = shuffleTo;

      function shuffleTo(params) {
        ___fontSize = util.getFontSize(_deck3);

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

      _card2.shuffleTo = function (cb) {
        var i = _card2.pos;
        var z = i / 4;
        var delay = i * 2;

        _card2.animateTo({
          delay: delay,
          duration: 200,

          x: plusminus(Math.random() * 40 + 20) * ___fontSize / 16,
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

  var ____fontSize;

  var shuffle = {
    deck: function deck(_deck4) {
      _deck4.shuffle = shuffle;

      function shuffle(next) {
        ____fontSize = util.getFontSize(_deck4);

        _deck4.cards = util.fisherYates(_deck4.cards);

        var cardsToAnimate = _deck4.cards.slice();

        _deck4.queued(function (next) {
          cardsToAnimate.forEach(function (card, i) {
            card.pos = i;

            card.shuffle(function (i) {
              if (i === cardsToAnimate.length - 1) {
                next();
              }
            });
          });
        })();
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

        __fontSize = util.getFontSize(_deck5);

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

        _fontSize = util.getFontSize(_deck7);

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

  var fontSize;

  var bysuit = {
    deck: function deck(_deck8) {
      _deck8.bysuit = _deck8.queued(bysuit);

      function bysuit(next) {
        var cards = _deck8.cards;

        fontSize = util.getFontSize(_deck8);

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

          x: -Math.round((6.75 - rank) * 8 * fontSize / 16),
          y: -Math.round((1.5 - suit) * 92 * fontSize / 16),
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

    // self = card
    var self = { i: i, rank: rank, suit: suit, side: Card.Side.BACK, pos: i, $el: $el, mount: mount, unmount: unmount, setSide: setSide };

    var modules = Deck.modules;
    var module;

    // add classes
    $el.classList.add('card');
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

    self.setGlow = function (enable) {
      if (enable) {
        self.$el.classList.add('glow');
      } else {
        self.$el.classList.remove('glow');
      }
    };

    // set rank & suit
    self.setRankSuit = function (rank, suit) {
      var suitName = SuitName(suit);
      $el.classList.add(suitName, 'rank' + rank);
    };

    self.setRankSuit(rank, suit);

    return self;

    function addModule(module) {
      // add card module
      module.card && module.card(self);
    }

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
        $el.classList.remove('rank' + self.rank);
        $el.classList.remove(SuitName(self.suit));
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

  function Pile(deck, cards, params) {
    var x = params.x;
    var y = params.y;
    var rot = params.rot;
    var side = params.side;

    x = x || 0;
    y = y || 0;
    rot = rot || 0;
    side = side || Card.Side.BACK;
    var self = Object.assign(Clique(deck, cards), { x: x, y: y, rot: rot, side: side, $root: deck.$root, selectionEnabled: false });

    cards.forEach(function (card) {
      card.$el.onclick = null; // No clicking!
    });

    // Bottom of pile dummy card
    var pileOutline = { $el: createElement('div') };
    var pileOutlineEl = pileOutline.$el;
    var transform = prefix('transform');
    pileOutlineEl.classList.add('pile-outline');
    pileOutlineEl.style[transform] = translate(self.x + 'px', self.y + 'px');
    pileOutlineEl.style.zIndex = -1;
    pileOutline.setGlow = function (enable) {
      if (enable) {
        this.$el.classList.add('glow');
      } else {
        this.$el.classList.remove('glow');
      }
    };
    self.$root.appendChild(pileOutlineEl);

    // Helper
    var helper = { $el: createElement('div') };
    var helperEl = helper.$el;
    var transform = prefix('transform');
    helperEl.classList.add('helper');
    helperEl.style[transform] = translate(self.x + 'px', self.y + 'px');
    helperEl.style.zIndex = 100; // Put the hlper above any cards

    var helperShowing = false;

    self.showHelper = function (enable, options) {
      var animationDuration = options && options.animationDuration || (enable ? 500 : 250);
      if (enable) {
        if (options && options.content) {
          helper.$el.textContent = ''; // Remove any children, if they exist
          helper.$el.appendChild(options.content);
        }
        if (!helperShowing) {
          self.queued(function (next) {
            // Position the helper
            var cardWidth = util.getCardWidth(self.deck);
            var spacing = cardWidth / 10;
            var helperZ = self.cards.length / 4;
            var helperX = self.x + cardWidth / 2 + spacing + cardWidth / 8 - helperZ + 8 * util.getFontSize(self.deck);
            helper.$el.style[transform] = translate(helperX + 'px', self.y - helperZ + 'px');
            helper.$el.style['opacity'] = 0;

            self.$root.appendChild(helper.$el);
            // Fade in
            animationFrames(0, animationDuration).progress(function (t) {
              var et = ease.cubicInOut(t);
              helper.$el.style['opacity'] = et;
            }).end(function () {
              next();
            });
          }, 'PILE (' + self.id + ') show helper')();
        }
        helperShowing = true;
      } else {
        if (helperShowing) {
          (function () {
            var captureClicks = function captureClicks(e) {
              e.stopPropagation();
            };
            helper.$el.addEventListener('click', captureClicks, true); // Capture click events to prevent them from propagating down to children
            self.queued(function (next) {
              // Fade out
              animationFrames(0, animationDuration).progress(function (t) {
                var et = ease.cubicInOut(t);
                helper.$el.style['opacity'] = 1.0 - et;
              }).end(function () {
                // Remove the capturing event listener
                helper.$el.removeEventListener('click', captureClicks, true);
                self.$root.removeChild(helper.$el);
                next();
              });
            }, 'PILE (' + self.id + ') hide helper')();
          })();
        }
        helperShowing = false;
      }
    };

    self.layout = function (info) {
      if (self.cards.length === 0 && !helperShowing) {
        return;
      }
      var cardsToAnimate = self.cards.slice();
      var cardWidth = util.getCardWidth(self.deck);
      var spacing = cardWidth / 10;
      self.queued(function (next) {
        if (cardsToAnimate.length > 0) {
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
          if (helperShowing) {
            var helperZ = cardsToAnimate.length / 4;
            var helperX = self.x + cardWidth / 2 + spacing + cardWidth / 8 - helperZ + 8 * util.getFontSize(self.deck);
            helper.$el.style[transform] = translate(helperX + 'px', self.y - helperZ + 'px');
          }
        } else {
          // Only the helper is showing
          if (helperShowing) {
            helper.$el.style[transform] = translate(self.x + 'px', self.y + 'px');
          }
        }
      }, 'HAND (' + self.id + ') layout ' + (info ? ': ' + info : ''))();
    };

    self.popCard = function (num) {
      if (self.selectionEnabled) {
        setTopCardSelectable(false);
      }
      if (typeof num === "undefined") {
        num = 1;
      }
      if (num == 1) {
        return self.cards.pop();
      }
      if (num <= 0) {
        return [];
      }
      var drawnCards = [];
      for (var i = 0; i < num; ++i) {
        drawnCards.push(self.cards.pop());
      }

      if (self.selectionEnabled && self.cards.length > 0) {
        setTopCardSelectable(true);
      }

      return drawnCards;
    };

    self.pushCard = function (card) {
      if (self.selectionEnabled) {
        setTopCardSelectable(false);
      }
      self.cards.push(card);

      if (self.selectionEnabled) {
        setTopCardSelectable(true);
      }
    };

    function setTopCardSelectable(selectable) {
      var topCard = {};
      if (self.cards.length === 0) {
        topCard = pileOutline;
      } else {
        topCard = self.cards[self.cards.length - 1];
      }
      if (selectable) {
        topCard.setGlow(true);
        topCard.$el.onclick = function () {
          if (typeof self.onSelect === 'function') {
            self.onSelect();
          }
        };
      } else {
        topCard.setGlow(false);
        topCard.$el.onclick = null;
      }
    }

    self.enableSelection = function (enable) {
      self.queued(function (next) {
        self.selectionEnabled = enable;
        setTopCardSelectable(enable);
        next();
      }, 'PILE (' + self.id + ') enable selection (' + enable + ')')();
    };

    self.layout();

    return self;
  }

  function Hand(deck, cards, params) {
    var x = params.x;
    var y = params.y;
    var rot = params.rot;
    var side = params.side;

    x = x || 0;
    y = y || 0;
    rot = rot || 0;
    side = side || Card.Side.BACK;

    var prominentCards = new Set();
    var self = Object.assign(Clique(deck, cards), { x: x, y: y, rot: rot, side: side, prominentCards: prominentCards, $root: deck.$root });

    self.cards.forEach(function (card) {
      card.$el.onclick = null; // No clicking!
    });

    var helper = { $el: createElement('div') };
    var helperEl = helper.$el;
    var transform = prefix('transform');
    helperEl.classList.add('helper');
    helperEl.style[transform] = translate(self.x + 'px', self.y + 'px');
    helperEl.style.zIndex = 100; // Put the hlper above any cards

    var helperShowing = false;

    self.showHelper = function (enable, options) {
      var animationDuration = options && options.animationDuration || (enable ? 500 : 250);
      if (enable) {
        if (options && options.content) {
          helper.$el.textContent = ''; // Remove any children, if they exist
          helper.$el.appendChild(options.content);
        }
        if (!helperShowing) {
          self.queued(function (next) {
            // Position the helper
            if (self.cards.length > 0) {
              var cardWidth = util.getCardWidth(self.deck);
              var spacing = cardWidth / 10;
              var handWidth = cardWidth * (self.cards.length - 1) + spacing * (self.cards.length - 1);
              var handStartX = -(handWidth / 2);
              var helperX = handStartX + (cardWidth + spacing) * self.cards.length - 3 * cardWidth / 8 + 8 * util.getFontSize(self.deck);
              var rads = self.rot * Math.PI / 180;
              var rotatedX = helperX * Math.cos(rads); // Always goes to zero: - (y * Math.sin(rads));
              var rotatedY = helperX * Math.sin(rads); // Always goes to zero: + (y * Math.cos(rads));
              helper.$el.classList.remove('alone');
              helper.$el.style[transform] = translate(self.x + rotatedX + 'px', self.y + rotatedY + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
            } else {
              helper.$el.classList.add('alone');
              helper.$el.style[transform] = translate(self.x + 'px', self.y + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
            }
            helper.$el.style['opacity'] = 0;

            self.$root.appendChild(helper.$el);
            // Fade in
            animationFrames(0, animationDuration).progress(function (t) {
              var et = ease.cubicInOut(t);
              helper.$el.style['opacity'] = et;
            }).end(function () {
              next();
            });
          }, 'HAND (' + self.id + ') show helper')();
        }
        helperShowing = true;
      } else {
        if (helperShowing) {
          (function () {
            var captureClicks = function captureClicks(e) {
              e.stopPropagation();
            };
            helper.$el.addEventListener('click', captureClicks, true); // Capture click events to prevent them from propagating down to children
            self.queued(function (next) {
              // Fade out
              animationFrames(0, animationDuration).progress(function (t) {
                var et = ease.cubicInOut(t);
                helper.$el.style['opacity'] = 1.0 - et;
              }).end(function () {
                // Remove the capturing event listener
                helper.$el.removeEventListener('click', captureClicks, true);
                self.$root.removeChild(helper.$el);
                next();
              });
            }, 'HAND (' + self.id + ') hide helper')();
          })();
        }
        helperShowing = false;
      }
    };

    self.layout = function (info) {
      if (self.cards.length === 0 && !helperShowing) {
        return;
      }
      var cardsToAnimate = self.cards.slice();
      var cardWidth = util.getCardWidth(self.deck);
      var cardHeight = util.getCardHeight(self.deck);
      var spacing = cardWidth / 10;
      self.queued(function (next) {

        if (cardsToAnimate.length > 0) {
          // The "total width" is slightly weird here because we're actually calculating
          // the distance between the *centers* of the first and last cards.
          // I.e., we don't need to account for the left half of the first card
          // and the right half of the last card, so we subtract a whole card
          // from the `(cardWidth * cards.length)` calculation.
          var totalWidth = cardWidth * (cardsToAnimate.length - 1) + spacing * (cardsToAnimate.length - 1);

          var startX = -(totalWidth / 2);

          cardsToAnimate.forEach(function (card, i) {
            card.setSide(self.side);
            var cardX = startX + (cardWidth + spacing) * i;
            var cardY = self.prominentCards.has(i) ? -cardHeight / 4 : 0;
            var rads = self.rot * Math.PI / 180;
            var rotatedX = cardX * Math.cos(rads) - cardY * Math.sin(rads);
            var rotatedY = cardX * Math.sin(rads) + cardY * Math.cos(rads);
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

          if (helperShowing) {
            var helperX = startX + (cardWidth + spacing) * cardsToAnimate.length - 3 * cardWidth / 8 + 8 * util.getFontSize(self.deck);
            var rads = self.rot * Math.PI / 180;
            var rotatedX = helperX * Math.cos(rads); // Always goes to zero: - (y * Math.sin(rads));
            var rotatedY = helperX * Math.sin(rads); // Always goes to zero: + (y * Math.cos(rads));
            helper.$el.classList.remove('alone');
            helper.$el.style[transform] = translate(self.x + rotatedX + 'px', self.y + rotatedY + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
          }
        } else {
          // Only the helper is showing
          if (helperShowing) {
            helper.$el.classList.add('alone');
            helper.$el.style[transform] = translate(self.x + 'px', self.y + 'px') + (self.rot ? 'rotate(' + self.rot + 'deg)' : '');
          }
        }
      }, 'HAND (' + self.id + ') layout ' + (info ? ': ' + info : ''))();
    };

    self.setCardProminentAtIndex = function (index, prominent) {
      if (prominent && !self.prominentCards.has(index)) {
        self.prominentCards.add(index);
      } else if (!prominent && self.prominentCards.has(index)) {
        self.prominentCards['delete'](index);
      }
    };

    self.cardAtIndexIsProminent = function (index) {
      return self.prominentCards.has(index);
    };

    self.setCardSelectable = function (card, selectable) {
      if (selectable) {
        card.setGlow(true);
        card.$el.onclick = function () {
          if (typeof self.onSelect === 'function') {
            var cardIdx = self.cards.indexOf(card);
            self.onSelect(card, cardIdx);
          }
        };
      } else {
        card.setGlow(false);
        card.$el.onclick = null;
      }
    };

    self.enableSelection = function (enable) {
      self.queued(function (next) {
        self.selectionEnabled = enable;
        self.cards.forEach(function (card) {
          self.setCardSelectable(card, enable);
        });
        next();
      }, 'HAND (' + self.id + ') enable selection (' + enable + ')')();
    };

    self.addCard = function (card) {
      self.cards.push(card);
    };

    self.removeCardAtIndex = function (index) {
      if (index >= self.cards.length) {
        return;
      }
      var card = self.cards[index];
      if (self.selectionEnabled) {
        self.setCardSelectable(card, false);
      }
      self.cards.splice(index, 1);
      if (self.prominentCards.has(index)) {
        self.prominentCards['delete'](index);
      }

      // Update card prominences
      var newProminences = new Set();
      for (var val in self.prominentCards.values()) {
        if (val.value < index) {
          newProminences.add(val.value);
        } else {
          newProminences.add(val.value - 1);
        }
      }
      self.prominentCards = newProminences;

      return card;
    };

    self.insertCardAtIndex = function (card, index) {
      if (index < 0) {
        return;
      }
      if (index > self.cards.length) {
        self.addCard(card, options);
        return;
      }
      self.cards.splice(index, 0, card);

      // Update card prominences
      var newProminences = new Set();
      for (var val in self.prominentCards.values()) {
        if (val.value < index) {
          newProminences.add(val.value);
        } else {
          newProminences.add(val.value + 1);
        }
      }
      self.prominentCards = newProminences;
    };

    self.replaceCardAtIndex = function (index, newCard) {
      var replacing = self.cards[index];
      if (self.selectionEnabled) {
        self.setCardSelectable(replacing, false);
      }
      if (self.selectionEnabled) {
        self.setCardSelectable(newCard, true);
      }
      self.cards[index] = newCard;
      return replacing;
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
    var id = params && params.id || deck.generateNextCliqueId();

    var self = observable({
      id: id,
      deck: deck,
      cards: cards,
      queued: deck.queued,
      beginQueueTransaction: deck.beginQueueTransaction,
      endQueueTransaction: deck.endQueueTransaction,
      withQueueTransaction: deck.withQueueTransaction });

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
        var card = self.deck.cards.find(function (c) {
          return id == c.i;
        });
        if (typeof self.side !== 'undefined') {
          card.setSide(self.side);
        }
        newCards.push(card);
      });
      self.cards = newCards;
      if (typeof self.layout === "function") {
        self.layout('gather cards');
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

    var transacting = false;
    var transactionEntries = [];

    target.queue = queue;
    target.queued = queued;
    target.beginQueueTransaction = beginQueueTransaction;
    target.endQueueTransaction = endQueueTransaction;
    target.withQueueTransaction = withQueueTransaction;

    return target;

    function queued(action, description) {
      return function () {
        var self = this;
        var args = arguments;

        queue(function (next) {
          action.apply(self, array.concat.apply(next, args));
        }, description);
      };
    }

    function queue(action, description) {
      if (!action) {
        return;
      }

      if (transacting) {
        transactionEntries.push({ action: action, description: description });
      } else {
        queueing.push({ action: action, description: description });
        // console.log("QUEUE:\n" + queueing.map(entry => '\t' + entry.description).join('\n'));

        if (queueing.length === 1) {
          next();
        }
      }
    }

    function next() {
      var frame = queueing[0];
      frame.action(function (err) {
        if (err) {
          throw err;
        }

        queueing = queueing.slice(1);

        if (queueing.length) {
          next();
        }
      });
    }

    // @NOTE/@TODO: It's not currently possible to nest transactions
    function beginQueueTransaction() {
      if (transacting) {
        console.log("WARNING: Tried to begin a queue transaction while another was open. Ignoring.");
        return;
      }
      transactionEntries = [];
      transacting = true;
    }

    function endQueueTransaction() {
      if (!transacting) {
        console.log("WARNING: Tried to close a queue transaction without opening it first.");
        return;
      }
      transacting = false;
      if (transactionEntries.length === 0) {
        return;
      }

      var entriesToRun = transactionEntries;
      var transactionDescription = "Transaction:\n" + entriesToRun.map(function (entry) {
        return '\t\t' + entry.description;
      }).join('\n');
      queue(function (next) {
        // Keep track of total number of concurrent actions in the transaction
        var totalEntriesToRun = entriesToRun.length;

        // Kick off all the actions
        entriesToRun.forEach(function (entry) {
          // Run each action with a patched `next` that decrements the total entries left to run
          entry.action(function () {
            totalEntriesToRun--;
            if (totalEntriesToRun === 0) {
              // If all the entries have run, move on in the queue
              next();
            }
          });
        });
      }, transactionDescription);
    }

    function withQueueTransaction(code) {
      beginQueueTransaction();
      code();
      endQueueTransaction();
    }
  }

  function Deck(jokers) {
    // init cards array
    var cards = new Array(jokers ? 55 : 52);
    var cliques = {};

    var $el = createElement('div');
    var self = observable({ mount: mount, unmount: unmount, cards: cards, cliques: cliques, $el: $el, serialize: serialize, generateNextCliqueId: generateNextCliqueId });

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

    // Clique Ids
    var nextCliqueId = 1;
    function generateNextCliqueId() {
      return (nextCliqueId++ * 1679973079 % Math.pow(36, 6)).toString(36);
    }

    return self;

    function mount(root) {
      // mount deck to root
      self.$root = root;
      self.$root.appendChild($el);
    }

    function unmount() {
      // unmount deck from root
      self.$root.removeChild($el);
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
