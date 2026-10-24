var Xh = { exports: {} }, hc = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Oy = Symbol.for("react.transitional.element"), zy = Symbol.for("react.fragment");
function Qh(e, t, l) {
  var a = null;
  if (l !== void 0 && (a = "" + l), t.key !== void 0 && (a = "" + t.key), "key" in t) {
    l = {};
    for (var s in t)
      s !== "key" && (l[s] = t[s]);
  } else l = t;
  return t = l.ref, {
    $$typeof: Oy,
    type: e,
    key: a,
    ref: t !== void 0 ? t : null,
    props: l
  };
}
hc.Fragment = zy;
hc.jsx = Qh;
hc.jsxs = Qh;
Xh.exports = hc;
var n = Xh.exports, Zh = { exports: {} }, Z = {};
/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var lo = Symbol.for("react.transitional.element"), My = Symbol.for("react.portal"), _y = Symbol.for("react.fragment"), Ry = Symbol.for("react.strict_mode"), Uy = Symbol.for("react.profiler"), Ly = Symbol.for("react.consumer"), By = Symbol.for("react.context"), Hy = Symbol.for("react.forward_ref"), Yy = Symbol.for("react.suspense"), qy = Symbol.for("react.memo"), Jh = Symbol.for("react.lazy"), Gy = Symbol.for("react.activity"), $y = Symbol.for("react.view_transition"), gd = Symbol.iterator;
function Ky(e) {
  return e === null || typeof e != "object" ? null : (e = gd && e[gd] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Fh = {
  isMounted: function() {
    return !1;
  },
  enqueueForceUpdate: function() {
  },
  enqueueReplaceState: function() {
  },
  enqueueSetState: function() {
  }
}, Ih = Object.assign, Wh = {};
function pn(e, t, l) {
  this.props = e, this.context = t, this.refs = Wh, this.updater = l || Fh;
}
pn.prototype.isReactComponent = {};
pn.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null)
    throw Error(
      "takes an object of state variables to update or a function which returns an object of state variables."
    );
  this.updater.enqueueSetState(this, e, t, "setState");
};
pn.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Ph() {
}
Ph.prototype = pn.prototype;
function ao(e, t, l) {
  this.props = e, this.context = t, this.refs = Wh, this.updater = l || Fh;
}
var no = ao.prototype = new Ph();
no.constructor = ao;
Ih(no, pn.prototype);
no.isPureReactComponent = !0;
var pd = Array.isArray;
function Au() {
}
var je = { H: null, A: null, T: null, S: null }, em = Object.prototype.hasOwnProperty;
function so(e, t, l) {
  var a = l.ref;
  return {
    $$typeof: lo,
    type: e,
    key: t,
    ref: a !== void 0 ? a : null,
    props: l
  };
}
function Vy(e, t) {
  return so(e.type, t, e.props);
}
function io(e) {
  return typeof e == "object" && e !== null && e.$$typeof === lo;
}
function Xy(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(l) {
    return t[l];
  });
}
var yd = /\/+/g;
function Hc(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? Xy("" + e.key) : t.toString(36);
}
function Qy(e) {
  switch (e.status) {
    case "fulfilled":
      return e.value;
    case "rejected":
      throw e.reason;
    default:
      switch (typeof e.status == "string" ? e.then(Au, Au) : (e.status = "pending", e.then(
        function(t) {
          e.status === "pending" && (e.status = "fulfilled", e.value = t);
        },
        function(t) {
          e.status === "pending" && (e.status = "rejected", e.reason = t);
        }
      )), e.status) {
        case "fulfilled":
          return e.value;
        case "rejected":
          throw e.reason;
      }
  }
  throw e;
}
function ka(e, t, l, a, s) {
  var i = typeof e;
  (i === "undefined" || i === "boolean") && (e = null);
  var c = !1;
  if (e === null) c = !0;
  else
    switch (i) {
      case "bigint":
      case "string":
      case "number":
        c = !0;
        break;
      case "object":
        switch (e.$$typeof) {
          case lo:
          case My:
            c = !0;
            break;
          case Jh:
            return c = e._init, ka(
              c(e._payload),
              t,
              l,
              a,
              s
            );
        }
    }
  if (c)
    return s = s(e), c = a === "" ? "." + Hc(e, 0) : a, pd(s) ? (l = "", c != null && (l = c.replace(yd, "$&/") + "/"), ka(s, t, l, "", function(d) {
      return d;
    })) : s != null && (io(s) && (s = Vy(
      s,
      l + (s.key == null || e && e.key === s.key ? "" : ("" + s.key).replace(
        yd,
        "$&/"
      ) + "/") + c
    )), t.push(s)), 1;
  c = 0;
  var u = a === "" ? "." : a + ":";
  if (pd(e))
    for (var r = 0; r < e.length; r++)
      a = e[r], i = u + Hc(a, r), c += ka(
        a,
        t,
        l,
        i,
        s
      );
  else if (r = Ky(e), typeof r == "function")
    for (e = r.call(e), r = 0; !(a = e.next()).done; )
      a = a.value, i = u + Hc(a, r++), c += ka(
        a,
        t,
        l,
        i,
        s
      );
  else if (i === "object") {
    if (typeof e.then == "function")
      return ka(
        Qy(e),
        t,
        l,
        a,
        s
      );
    throw t = String(e), Error(
      "Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead."
    );
  }
  return c;
}
function Bs(e, t, l) {
  if (e == null) return e;
  var a = [], s = 0;
  return ka(e, a, "", "", function(i) {
    return t.call(l, i, s++);
  }), a;
}
function Zy(e) {
  if (e._status === -1) {
    var t = e._result, l = t();
    l.then(
      function(a) {
        (e._status === 0 || e._status === -1) && (e._status = 1, e._result = a, l.status === void 0 && (l.status = "fulfilled", l.value = a));
      },
      function(a) {
        (e._status === 0 || e._status === -1) && (e._status = 2, e._result = a, l.status === void 0 && (l.status = "rejected", l.reason = a));
      }
    ), e._status === -1 && (e._status = 0, e._result = l);
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var vd = typeof reportError == "function" ? reportError : function(e) {
  if (typeof window == "object" && typeof window.ErrorEvent == "function") {
    var t = new window.ErrorEvent("error", {
      bubbles: !0,
      cancelable: !0,
      message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
      error: e
    });
    if (!window.dispatchEvent(t)) return;
  } else if (typeof process == "object" && typeof process.emit == "function") {
    process.emit("uncaughtException", e);
    return;
  }
  console.error(e);
};
function tm(e) {
  var t = je.T, l = {};
  l.types = t !== null ? t.types : null, je.T = l;
  try {
    var a = e(), s = je.S;
    s !== null && s(l, a), typeof a == "object" && a !== null && typeof a.then == "function" && a.then(Au, vd);
  } catch (i) {
    vd(i);
  } finally {
    t !== null && l.types !== null && (t.types = l.types), je.T = t;
  }
}
function lm(e) {
  var t = je.T;
  if (t !== null) {
    var l = t.types;
    l === null ? t.types = [e] : l.indexOf(e) === -1 && l.push(e);
  } else tm(lm.bind(null, e));
}
var Jy = {
  map: Bs,
  forEach: function(e, t, l) {
    Bs(
      e,
      function() {
        t.apply(this, arguments);
      },
      l
    );
  },
  count: function(e) {
    var t = 0;
    return Bs(e, function() {
      t++;
    }), t;
  },
  toArray: function(e) {
    return Bs(e, function(t) {
      return t;
    }) || [];
  },
  only: function(e) {
    if (!io(e))
      throw Error(
        "React.Children.only expected to receive a single React element child."
      );
    return e;
  }
};
Z.Activity = Gy;
Z.Children = Jy;
Z.Component = pn;
Z.Fragment = _y;
Z.Profiler = Uy;
Z.PureComponent = ao;
Z.StrictMode = Ry;
Z.Suspense = Yy;
Z.ViewTransition = $y;
Z.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = je;
Z.__COMPILER_RUNTIME = {
  __proto__: null,
  c: function(e) {
    return je.H.useMemoCache(e);
  }
};
Z.addTransitionType = lm;
Z.cache = function(e) {
  return function() {
    return e.apply(null, arguments);
  };
};
Z.cacheSignal = function() {
  return null;
};
Z.cloneElement = function(e, t, l) {
  if (e == null)
    throw Error(
      "The argument must be a React element, but you passed " + e + "."
    );
  var a = Ih({}, e.props), s = e.key;
  if (t != null)
    for (i in t.key !== void 0 && (s = "" + t.key), t)
      !em.call(t, i) || i === "key" || i === "__self" || i === "__source" || i === "ref" && t.ref === void 0 || (a[i] = t[i]);
  var i = arguments.length - 2;
  if (i === 1) a.children = l;
  else if (1 < i) {
    for (var c = Array(i), u = 0; u < i; u++)
      c[u] = arguments[u + 2];
    a.children = c;
  }
  return so(e.type, s, a);
};
Z.createContext = function(e) {
  return e = {
    $$typeof: By,
    _currentValue: e,
    _currentValue2: e,
    _threadCount: 0,
    Provider: null,
    Consumer: null
  }, e.Provider = e, e.Consumer = {
    $$typeof: Ly,
    _context: e
  }, e;
};
Z.createElement = function(e, t, l) {
  var a, s = {}, i = null;
  if (t != null)
    for (a in t.key !== void 0 && (i = "" + t.key), t)
      em.call(t, a) && a !== "key" && a !== "__self" && a !== "__source" && (s[a] = t[a]);
  var c = arguments.length - 2;
  if (c === 1) s.children = l;
  else if (1 < c) {
    for (var u = Array(c), r = 0; r < c; r++)
      u[r] = arguments[r + 2];
    s.children = u;
  }
  if (e && e.defaultProps)
    for (a in c = e.defaultProps, c)
      s[a] === void 0 && (s[a] = c[a]);
  return so(e, i, s);
};
Z.createRef = function() {
  return { current: null };
};
Z.forwardRef = function(e) {
  return { $$typeof: Hy, render: e };
};
Z.isValidElement = io;
Z.lazy = function(e) {
  return {
    $$typeof: Jh,
    _payload: { _status: -1, _result: e },
    _init: Zy
  };
};
Z.memo = function(e, t) {
  return {
    $$typeof: qy,
    type: e,
    compare: t === void 0 ? null : t
  };
};
Z.startTransition = tm;
Z.unstable_useCacheRefresh = function() {
  return je.H.useCacheRefresh();
};
Z.use = function(e) {
  return je.H.use(e);
};
Z.useActionState = function(e, t, l) {
  return je.H.useActionState(e, t, l);
};
Z.useCallback = function(e, t) {
  return je.H.useCallback(e, t);
};
Z.useContext = function(e) {
  return je.H.useContext(e);
};
Z.useDebugValue = function() {
};
Z.useDeferredValue = function(e, t) {
  return je.H.useDeferredValue(e, t);
};
Z.useEffect = function(e, t) {
  return je.H.useEffect(e, t);
};
Z.useEffectEvent = function(e) {
  return je.H.useEffectEvent(e);
};
Z.useId = function() {
  return je.H.useId();
};
Z.useImperativeHandle = function(e, t, l) {
  return je.H.useImperativeHandle(e, t, l);
};
Z.useInsertionEffect = function(e, t) {
  return je.H.useInsertionEffect(e, t);
};
Z.useLayoutEffect = function(e, t) {
  return je.H.useLayoutEffect(e, t);
};
Z.useMemo = function(e, t) {
  return je.H.useMemo(e, t);
};
Z.useOptimistic = function(e, t) {
  return je.H.useOptimistic(e, t);
};
Z.useReducer = function(e, t, l) {
  return je.H.useReducer(e, t, l);
};
Z.useRef = function(e) {
  return je.H.useRef(e);
};
Z.useState = function(e) {
  return je.H.useState(e);
};
Z.useSyncExternalStore = function(e, t, l) {
  return je.H.useSyncExternalStore(
    e,
    t,
    l
  );
};
Z.useTransition = function() {
  return je.H.useTransition();
};
Z.version = "19.3.1";
Zh.exports = Z;
var j = Zh.exports, am = { exports: {} }, mc = {}, nm = { exports: {} }, sm = {};
/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(e) {
  function t(k, R) {
    var M = k.length;
    k.push(R);
    e: for (; 0 < M; ) {
      var Y = M - 1 >>> 1, K = k[Y];
      if (0 < s(K, R))
        k[Y] = R, k[M] = K, M = Y;
      else break e;
    }
  }
  function l(k) {
    return k.length === 0 ? null : k[0];
  }
  function a(k) {
    if (k.length === 0) return null;
    var R = k[0], M = k.pop();
    if (M !== R) {
      k[0] = M;
      e: for (var Y = 0, K = k.length, he = K >>> 1; Y < he; ) {
        var ge = 2 * (Y + 1) - 1, I = k[ge], Ne = ge + 1, F = k[Ne];
        if (0 > s(I, M))
          Ne < K && 0 > s(F, I) ? (k[Y] = F, k[Ne] = M, Y = Ne) : (k[Y] = I, k[ge] = M, Y = ge);
        else if (Ne < K && 0 > s(F, M))
          k[Y] = F, k[Ne] = M, Y = Ne;
        else break e;
      }
    }
    return R;
  }
  function s(k, R) {
    var M = k.sortIndex - R.sortIndex;
    return M !== 0 ? M : k.id - R.id;
  }
  if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
    var i = performance;
    e.unstable_now = function() {
      return i.now();
    };
  } else {
    var c = Date, u = c.now();
    e.unstable_now = function() {
      return c.now() - u;
    };
  }
  var r = [], d = [], m = 1, f = null, o = 3, h = !1, v = !1, x = !1, C = !1, p = typeof setTimeout == "function" ? setTimeout : null, y = typeof clearTimeout == "function" ? clearTimeout : null, S = typeof setImmediate < "u" ? setImmediate : null;
  function w(k) {
    for (var R = l(d); R !== null; ) {
      if (R.callback === null) a(d);
      else if (R.startTime <= k)
        a(d), R.sortIndex = R.expirationTime, t(r, R);
      else break;
      R = l(d);
    }
  }
  function D(k) {
    if (x = !1, w(k), !v)
      if (l(r) !== null)
        v = !0, U || (U = !0, g());
      else {
        var R = l(d);
        R !== null && z(D, R.startTime - k);
      }
  }
  var U = !1, N = -1, _ = 5, E = -1;
  function T() {
    return C ? !0 : !(e.unstable_now() - E < _);
  }
  function b() {
    if (C = !1, U) {
      var k = e.unstable_now();
      E = k;
      var R = !0;
      try {
        e: {
          v = !1, x && (x = !1, y(N), N = -1), h = !0;
          var M = o;
          try {
            t: {
              for (w(k), f = l(r); f !== null && !(f.expirationTime > k && T()); ) {
                var Y = f.callback;
                if (typeof Y == "function") {
                  f.callback = null, o = f.priorityLevel;
                  var K = Y(
                    f.expirationTime <= k
                  );
                  if (k = e.unstable_now(), typeof K == "function") {
                    f.callback = K, w(k), R = !0;
                    break t;
                  }
                  f === l(r) && a(r), w(k);
                } else a(r);
                f = l(r);
              }
              if (f !== null) R = !0;
              else {
                var he = l(d);
                he !== null && z(
                  D,
                  he.startTime - k
                ), R = !1;
              }
            }
            break e;
          } finally {
            f = null, o = M, h = !1;
          }
          R = void 0;
        }
      } finally {
        R ? g() : U = !1;
      }
    }
  }
  var g;
  if (typeof S == "function")
    g = function() {
      S(b);
    };
  else if (typeof MessageChannel < "u") {
    var A = new MessageChannel(), O = A.port2;
    A.port1.onmessage = b, g = function() {
      O.postMessage(null);
    };
  } else
    g = function() {
      p(b, 0);
    };
  function z(k, R) {
    N = p(function() {
      k(e.unstable_now());
    }, R);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(k) {
    k.callback = null;
  }, e.unstable_forceFrameRate = function(k) {
    0 > k || 125 < k ? console.error(
      "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
    ) : _ = 0 < k ? Math.floor(1e3 / k) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return o;
  }, e.unstable_next = function(k) {
    switch (o) {
      case 1:
      case 2:
      case 3:
        var R = 3;
        break;
      default:
        R = o;
    }
    var M = o;
    o = R;
    try {
      return k();
    } finally {
      o = M;
    }
  }, e.unstable_requestPaint = function() {
    C = !0;
  }, e.unstable_runWithPriority = function(k, R) {
    switch (k) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        k = 3;
    }
    var M = o;
    o = k;
    try {
      return R();
    } finally {
      o = M;
    }
  }, e.unstable_scheduleCallback = function(k, R, M) {
    var Y = e.unstable_now();
    switch (typeof M == "object" && M !== null ? (M = M.delay, M = typeof M == "number" && 0 < M ? Y + M : Y) : M = Y, k) {
      case 1:
        var K = -1;
        break;
      case 2:
        K = 250;
        break;
      case 5:
        K = 1073741823;
        break;
      case 4:
        K = 1e4;
        break;
      default:
        K = 5e3;
    }
    return K = M + K, k = {
      id: m++,
      callback: R,
      priorityLevel: k,
      startTime: M,
      expirationTime: K,
      sortIndex: -1
    }, M > Y ? (k.sortIndex = M, t(d, k), l(r) === null && k === l(d) && (x ? (y(N), N = -1) : x = !0, z(D, M - Y))) : (k.sortIndex = K, t(r, k), v || h || (v = !0, U || (U = !0, g()))), k;
  }, e.unstable_shouldYield = T, e.unstable_wrapCallback = function(k) {
    var R = o;
    return function() {
      var M = o;
      o = R;
      try {
        return k.apply(this, arguments);
      } finally {
        o = M;
      }
    };
  };
})(sm);
nm.exports = sm;
var Fy = nm.exports, im = { exports: {} }, Fe = {};
/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Iy = j;
function cm(e) {
  var t = "https://react.dev/errors/" + e;
  if (1 < arguments.length) {
    t += "?args[]=" + encodeURIComponent(arguments[1]);
    for (var l = 2; l < arguments.length; l++)
      t += "&args[]=" + encodeURIComponent(arguments[l]);
  }
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
function xl() {
}
var et = {
  d: {
    f: xl,
    r: function() {
      throw Error(cm(522));
    },
    D: xl,
    C: xl,
    L: xl,
    m: xl,
    X: xl,
    S: xl,
    M: xl
  },
  p: 0,
  findDOMNode: null
}, Wy = Symbol.for("react.portal"), Py = Symbol.for("react.recoverable"), xd = Symbol.for("react.optimistic_key");
function ev(e, t, l) {
  var a = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return {
    $$typeof: Wy,
    key: a == null ? null : a === xd ? xd : "" + a,
    children: e,
    containerInfo: t,
    implementation: l
  };
}
var Xn = Iy.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
function gc(e, t) {
  if (e === "font") return "";
  if (typeof t == "string")
    return t === "use-credentials" ? t : "";
}
Fe.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = et;
Fe.browser = function(e) {
  return { $$typeof: Py, _reason: e };
};
Fe.createPortal = function(e, t) {
  var l = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11)
    throw Error(cm(299));
  return ev(e, t, null, l);
};
Fe.flushSync = function(e) {
  var t = Xn.T, l = et.p;
  try {
    if (Xn.T = null, et.p = 2, e) return e();
  } finally {
    Xn.T = t, et.p = l, et.d.f();
  }
};
Fe.preconnect = function(e, t) {
  typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, et.d.C(e, t));
};
Fe.prefetchDNS = function(e) {
  typeof e == "string" && et.d.D(e);
};
Fe.preinit = function(e, t) {
  if (typeof e == "string" && t && typeof t.as == "string") {
    var l = t.as, a = gc(l, t.crossOrigin), s = typeof t.integrity == "string" ? t.integrity : void 0, i = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
    l === "style" ? et.d.S(
      e,
      typeof t.precedence == "string" ? t.precedence : void 0,
      {
        crossOrigin: a,
        integrity: s,
        fetchPriority: i
      }
    ) : l === "script" && et.d.X(e, {
      crossOrigin: a,
      integrity: s,
      fetchPriority: i,
      nonce: typeof t.nonce == "string" ? t.nonce : void 0
    });
  }
};
Fe.preinitModule = function(e, t) {
  if (typeof e == "string")
    if (typeof t == "object" && t !== null) {
      if (t.as == null || t.as === "script") {
        var l = gc(
          t.as,
          t.crossOrigin
        );
        et.d.M(e, {
          crossOrigin: l,
          integrity: typeof t.integrity == "string" ? t.integrity : void 0,
          nonce: typeof t.nonce == "string" ? t.nonce : void 0,
          fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
        });
      }
    } else t == null && et.d.M(e);
};
Fe.preload = function(e, t) {
  if (typeof e == "string" && typeof t == "object" && t !== null && typeof t.as == "string") {
    var l = t.as, a = gc(l, t.crossOrigin);
    et.d.L(e, l, {
      crossOrigin: a,
      integrity: typeof t.integrity == "string" ? t.integrity : void 0,
      nonce: typeof t.nonce == "string" ? t.nonce : void 0,
      type: typeof t.type == "string" ? t.type : void 0,
      fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
      referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
      imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
      imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
      media: typeof t.media == "string" ? t.media : void 0
    });
  }
};
Fe.preloadModule = function(e, t) {
  if (typeof e == "string")
    if (t) {
      var l = gc(t.as, t.crossOrigin);
      et.d.m(e, {
        as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
        crossOrigin: l,
        integrity: typeof t.integrity == "string" ? t.integrity : void 0,
        nonce: typeof t.nonce == "string" ? t.nonce : void 0,
        fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0
      });
    } else et.d.m(e);
};
Fe.requestFormReset = function(e) {
  et.d.r(e);
};
Fe.unstable_batchedUpdates = function(e, t) {
  return e(t);
};
Fe.useFormState = function(e, t, l) {
  return Xn.H.useFormState(e, t, l);
};
Fe.useFormStatus = function() {
  return Xn.H.useHostTransitionStatus();
};
Fe.version = "19.3.1";
function um() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(um);
    } catch (e) {
      console.error(e);
    }
}
um(), im.exports = Fe;
var rm = im.exports;
/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Re = Fy, om = j, tv = rm;
function B(e) {
  var t = "https://react.dev/errors/" + e;
  if (1 < arguments.length) {
    t += "?args[]=" + encodeURIComponent(arguments[1]);
    for (var l = 2; l < arguments.length; l++)
      t += "&args[]=" + encodeURIComponent(arguments[l]);
  }
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
function dm(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function Ts(e) {
  for (var t = e, l = t; l && !l.alternate; )
    t = l, t.flags & 4098 && (e = t.return), l = t.return;
  for (; t.return; ) t = t.return;
  return t.tag === 3 ? e : null;
}
function fm(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function hm(e) {
  if (e.tag === 31) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function jd(e) {
  if (Ts(e) !== e)
    throw Error(B(188));
}
function lv(e) {
  var t = e.alternate;
  if (!t) {
    if (t = Ts(e), t === null) throw Error(B(188));
    return t !== e ? null : e;
  }
  for (var l = e, a = t; ; ) {
    var s = l.return;
    if (s === null) break;
    var i = s.alternate;
    if (i === null) {
      if (a = s.return, a !== null) {
        l = a;
        continue;
      }
      break;
    }
    if (s.child === i.child) {
      for (i = s.child; i; ) {
        if (i === l) return jd(s), e;
        if (i === a) return jd(s), t;
        i = i.sibling;
      }
      throw Error(B(188));
    }
    if (l.return !== a.return) l = s, a = i;
    else {
      for (var c = !1, u = s.child; u; ) {
        if (u === l) {
          c = !0, l = s, a = i;
          break;
        }
        if (u === a) {
          c = !0, a = s, l = i;
          break;
        }
        u = u.sibling;
      }
      if (!c) {
        for (u = i.child; u; ) {
          if (u === l) {
            c = !0, l = i, a = s;
            break;
          }
          if (u === a) {
            c = !0, a = i, l = s;
            break;
          }
          u = u.sibling;
        }
        if (!c) throw Error(B(189));
      }
    }
    if (l.alternate !== a) throw Error(B(190));
  }
  if (l.tag !== 3) throw Error(B(188));
  return l.stateNode.current === l ? e : t;
}
function mm(e) {
  var t = e.tag;
  if (t === 5 || t === 26 || t === 27 || t === 6) return e;
  for (e = e.child; e !== null; ) {
    if (t = mm(e), t !== null) return t;
    e = e.sibling;
  }
  return null;
}
function rt(e, t, l, a, s, i) {
  for (; e !== null; ) {
    if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && l(e, a, s, i) || (e.tag !== 22 || e.memoizedState === null) && (t || e.tag !== 5 && e.tag !== 27) && rt(
      e.child,
      t,
      l,
      a,
      s,
      i
    ))
      return !0;
    e = e.sibling;
  }
  return !1;
}
function ja(e) {
  for (e = e.return; e !== null; ) {
    if (e.tag === 3 || e.tag === 5 || e.tag === 27) return e;
    e = e.return;
  }
  return null;
}
function bd(e) {
  var t = !1;
  for (e = e.return; e !== null && (e.tag === 4 && (t = !0), !(e.tag === 3 || e.tag === 5 || e.tag === 27)); )
    e = e.return;
  return t;
}
function gm(e) {
  var t = [null, null], l = ja(e);
  return l === null || pm(
    t,
    e,
    l.child,
    { foundSelf: !1 }
  ), t;
}
function pm(e, t, l, a) {
  for (; l !== null; ) {
    if (l === t) a.foundSelf = !0;
    else if (l.tag === 5 || l.tag === 27 || l.tag === 6) {
      if (a.foundSelf) return e[1] = l, !0;
      e[0] = l;
    } else if ((l.tag !== 22 || l.memoizedState === null) && pm(
      e,
      t,
      l.child,
      a
    ))
      return !0;
    l = l.sibling;
  }
  return !1;
}
function _e(e) {
  switch (e.tag) {
    case 5:
    case 27:
    case 6:
      return e.stateNode;
    case 3:
      return e.stateNode.containerInfo;
    default:
      throw Error(B(559));
  }
}
var Ma = null, Ou = null;
function av(e, t, l) {
  return e === l ? !0 : e === t ? (Ma = e, !0) : !1;
}
function nv(e, t, l) {
  return e === l ? (Ou = e, !1) : e === t ? (Ou !== null && (Ma = e), !0) : !1;
}
function Nd(e) {
  if (e === null) return null;
  do
    e = e === null ? null : e.return;
  while (e && e.tag !== 5 && e.tag !== 27 && e.tag !== 3);
  return e || null;
}
function zu(e, t, l) {
  for (var a = 0, s = e; s; s = l(s)) a++;
  s = 0;
  for (var i = t; i; i = l(i)) s++;
  for (; 0 < a - s; ) e = l(e), a--;
  for (; 0 < s - a; ) t = l(t), s--;
  for (; a--; ) {
    if (e === t || t !== null && e === t.alternate)
      return e;
    e = l(e), t = l(t);
  }
  return null;
}
var ye = Object.assign, sv = Symbol.for("react.element"), Hs = Symbol.for("react.transitional.element"), Un = Symbol.for("react.portal"), _a = Symbol.for("react.fragment"), ym = Symbol.for("react.strict_mode"), Mu = Symbol.for("react.profiler"), vm = Symbol.for("react.consumer"), Qt = Symbol.for("react.context"), co = Symbol.for("react.forward_ref"), _u = Symbol.for("react.suspense"), Ru = Symbol.for("react.suspense_list"), uo = Symbol.for("react.memo"), wl = Symbol.for("react.lazy"), Uu = Symbol.for("react.activity"), iv = Symbol.for("react.legacy_hidden"), cv = Symbol.for("react.memo_cache_sentinel"), Lu = Symbol.for("react.view_transition"), uv = Symbol.for("react.recoverable"), Sd = Symbol.iterator;
function Tn(e) {
  return e === null || typeof e != "object" ? null : (e = Sd && e[Sd] || e["@@iterator"], typeof e == "function" ? e : null);
}
var rv = Symbol.for("react.client.reference");
function Bu(e) {
  if (e == null) return null;
  if (typeof e == "function")
    return e.$$typeof === rv ? null : e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case _a:
      return "Fragment";
    case Mu:
      return "Profiler";
    case ym:
      return "StrictMode";
    case _u:
      return "Suspense";
    case Ru:
      return "SuspenseList";
    case Uu:
      return "Activity";
    case Lu:
      return "ViewTransition";
  }
  if (typeof e == "object")
    switch (e.$$typeof) {
      case Un:
        return "Portal";
      case Qt:
        return e.displayName || "Context";
      case vm:
        return (e._context.displayName || "Context") + ".Consumer";
      case co:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case uo:
        return t = e.displayName || null, t !== null ? t : Bu(e.type) || "Memo";
      case wl:
        t = e._payload, e = e._init;
        try {
          return Bu(e(t));
        } catch {
        }
    }
  return null;
}
var Ln = Array.isArray, X = om.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ce = tv.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ca = {
  pending: !1,
  data: null,
  method: null,
  action: null
}, Hu = [], Ra = -1;
function tl(e) {
  return { current: e };
}
function Ve(e) {
  0 > Ra || (e.current = Hu[Ra], Hu[Ra] = null, Ra--);
}
function be(e, t) {
  Ra++, Hu[Ra] = e.current, e.current = t;
}
var It = tl(null), cs = tl(null), _l = tl(null), Mi = tl(null);
function _i(e, t) {
  switch (be(_l, t), be(cs, e), be(It, null), t.nodeType) {
    case 9:
    case 11:
      e = (e = t.documentElement) && (e = e.namespaceURI) ? Lf(e) : 0;
      break;
    default:
      if (e = t.tagName, t = t.namespaceURI)
        t = Lf(t), e = Yp(t, e);
      else
        switch (e) {
          case "svg":
            e = 1;
            break;
          case "math":
            e = 2;
            break;
          default:
            e = 0;
        }
  }
  Ve(It), be(It, e);
}
function tn() {
  Ve(It), Ve(cs), Ve(_l);
}
function Yu(e) {
  var t = e.memoizedState;
  t !== null && (fn._currentValue = t.memoizedState, be(Mi, e)), t = It.current;
  var l = Yp(t, e.type);
  t !== l && (be(cs, e), be(It, l));
}
function Ri(e) {
  cs.current === e && (Ve(It), Ve(cs)), Mi.current === e && (Ve(Mi), fn._currentValue = ca);
}
var Yc, wd;
function bl(e) {
  if (Yc === void 0)
    try {
      throw Error();
    } catch (l) {
      var t = l.stack.trim().match(/\n( *(at )?)/);
      Yc = t && t[1] || "", wd = -1 < l.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < l.stack.indexOf("@") ? "@unknown:0:0" : "";
    }
  return `
` + Yc + e + wd;
}
var qc = !1;
function Gc(e, t) {
  if (!e || qc) return "";
  qc = !0;
  var l = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    var a = {
      DetermineComponentFrameRoot: function() {
        try {
          if (t) {
            var f = function() {
              throw Error();
            };
            if (Object.defineProperty(f.prototype, "props", {
              set: function() {
                throw Error();
              }
            }), typeof Reflect == "object" && Reflect.construct) {
              try {
                Reflect.construct(f, []);
              } catch (v) {
                var o = v;
              }
              Reflect.construct(e, [], f);
            } else {
              try {
                f.call();
              } catch (v) {
                o = v;
              }
              f = !1;
              try {
                var h = Object.getOwnPropertyDescriptor(
                  e.prototype,
                  "props"
                );
                Object.defineProperty(e.prototype, "props", {
                  configurable: !0,
                  set: function() {
                    throw Error();
                  }
                }), f = !0, new e();
              } finally {
                f && (h !== void 0 ? Object.defineProperty(e.prototype, "props", h) : delete e.prototype.props);
              }
            }
          } else {
            try {
              throw Error();
            } catch (v) {
              o = v;
            }
            (f = e()) && typeof f.catch == "function" && f.catch(function() {
            });
          }
        } catch (v) {
          if (v && o && typeof v.stack == "string")
            return [v.stack, o.stack];
        }
        return [null, null];
      }
    };
    a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
    var s = Object.getOwnPropertyDescriptor(
      a.DetermineComponentFrameRoot,
      "name"
    );
    s && s.configurable && Object.defineProperty(
      a.DetermineComponentFrameRoot,
      "name",
      { value: "DetermineComponentFrameRoot" }
    );
    var i = a.DetermineComponentFrameRoot(), c = i[0], u = i[1];
    if (c && u) {
      var r = c.split(`
`), d = u.split(`
`);
      for (s = a = 0; a < r.length && !r[a].includes("DetermineComponentFrameRoot"); )
        a++;
      for (; s < d.length && !d[s].includes(
        "DetermineComponentFrameRoot"
      ); )
        s++;
      if (a === r.length || s === d.length)
        for (a = r.length - 1, s = d.length - 1; 1 <= a && 0 <= s && r[a] !== d[s]; )
          s--;
      for (; 1 <= a && 0 <= s; a--, s--)
        if (r[a] !== d[s]) {
          if (a !== 1 || s !== 1)
            do
              if (a--, s--, 0 > s || r[a] !== d[s]) {
                var m = `
` + r[a].replace(" at new ", " at ");
                return e.displayName && m.includes("<anonymous>") && (m = m.replace("<anonymous>", e.displayName)), m;
              }
            while (1 <= a && 0 <= s);
          break;
        }
    }
  } finally {
    qc = !1, Error.prepareStackTrace = l;
  }
  return (l = e ? e.displayName || e.name : "") ? bl(l) : "";
}
function ov(e, t) {
  switch (e.tag) {
    case 26:
    case 27:
    case 5:
      return bl(e.type);
    case 16:
      return bl("Lazy");
    case 13:
      return e.child !== t && t !== null ? bl("Suspense Fallback") : bl("Suspense");
    case 19:
      return bl("SuspenseList");
    case 0:
    case 15:
      return Gc(e.type, !1);
    case 11:
      return Gc(e.type.render, !1);
    case 1:
      return Gc(e.type, !0);
    case 31:
      return bl("Activity");
    case 30:
      return bl("ViewTransition");
    default:
      return "";
  }
}
function Cd(e) {
  try {
    var t = "", l = null;
    do
      t += ov(e, l), l = e, e = e.return;
    while (e);
    return t;
  } catch (a) {
    return `
Error generating stack: ` + a.message + `
` + a.stack;
  }
}
var qu = Object.prototype.hasOwnProperty, ro = Re.unstable_scheduleCallback, $c = Re.unstable_cancelCallback, dv = Re.unstable_shouldYield, fv = Re.unstable_requestPaint, pt = Re.unstable_now, hv = Re.unstable_getCurrentPriorityLevel, xm = Re.unstable_ImmediatePriority, jm = Re.unstable_UserBlockingPriority, Ui = Re.unstable_NormalPriority, mv = Re.unstable_LowPriority, bm = Re.unstable_IdlePriority, gv = Re.log, pv = Re.unstable_setDisableYieldValue, Es = null, yt = null;
function El(e) {
  if (typeof gv == "function" && pv(e), yt && typeof yt.setStrictMode == "function")
    try {
      yt.setStrictMode(Es, e);
    } catch {
    }
}
var vt = Math.clz32 ? Math.clz32 : xv, yv = Math.log, vv = Math.LN2;
function xv(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (yv(e) / vv | 0) | 0;
}
var Ys = 256, qs = 262144, Gs = 4194304;
function ta(e) {
  var t = e & 42;
  if (t !== 0) return t;
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
      return 64;
    case 128:
      return 128;
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
      return e & -e;
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 3932160;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      return e & 62914560;
    case 67108864:
      return 67108864;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 0;
    default:
      return e;
  }
}
function pc(e, t, l) {
  var a = e.pendingLanes;
  if (a === 0) return 0;
  var s = 0, i = e.suspendedLanes, c = e.pingedLanes;
  e = e.warmLanes;
  var u = a & 134217727;
  return u !== 0 ? (a = u & ~i, a !== 0 ? s = ta(a) : (c &= u, c !== 0 ? s = ta(c) : l || (l = u & ~e, l !== 0 && (s = ta(l))))) : (u = a & ~i, u !== 0 ? s = ta(u) : c !== 0 ? s = ta(c) : l || (l = a & ~e, l !== 0 && (s = ta(l)))), s === 0 ? 0 : t !== 0 && t !== s && !(t & i) && (i = s & -s, l = t & -t, i >= l || i === 32 && (l & 4194048) !== 0) ? t : s;
}
function Ds(e, t) {
  return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
}
function Nm(e, t) {
  t & 8 && (t |= t & 32);
  var l = e.entangledLanes;
  if (l !== 0)
    for (e = e.entanglements, l &= t; 0 < l; ) {
      var a = 31 - vt(l), s = 1 << a;
      t |= e[a], l &= ~s;
    }
  return t;
}
function jv(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
    case 8:
    case 64:
      return t + 250;
    case 16:
    case 32:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      return -1;
    case 67108864:
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function Sm() {
  var e = Gs;
  return Gs <<= 1, !(Gs & 62914560) && (Gs = 4194304), e;
}
function Kc(e) {
  for (var t = [], l = 0; 31 > l; l++) t.push(e);
  return t;
}
function ks(e, t) {
  e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
}
function bv(e, t, l, a, s, i) {
  var c = e.pendingLanes;
  e.pendingLanes = l, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= l, e.entangledLanes &= l, e.errorRecoveryDisabledLanes &= l, e.shellSuspendCounter = 0;
  var u = e.entanglements, r = e.expirationTimes, d = e.hiddenUpdates;
  for (l = c & ~l; 0 < l; ) {
    var m = 31 - vt(l), f = 1 << m;
    u[m] = 0, r[m] = -1;
    var o = d[m];
    if (o !== null)
      for (d[m] = null, m = 0; m < o.length; m++) {
        var h = o[m];
        h !== null && (h.lane &= -536870913);
      }
    l &= ~f;
  }
  a !== 0 && wm(e, a, 0), i !== 0 && s === 0 && e.tag !== 0 && (e.suspendedLanes |= i & ~(c & ~t));
}
function wm(e, t, l) {
  e.pendingLanes |= t, e.suspendedLanes &= ~t;
  var a = 31 - vt(t);
  e.entangledLanes |= t, e.entanglements[a] = e.entanglements[a] | 1073741824 | l & 261930;
}
function Cm(e, t) {
  var l = e.entangledLanes |= t;
  for (e = e.entanglements; l; ) {
    var a = 31 - vt(l), s = 1 << a;
    s & t | e[a] & t && (e[a] |= t), l &= ~s;
  }
}
function Tm(e, t) {
  var l = t & -t;
  return l = l & 42 ? 1 : oo(l), l & (e.suspendedLanes | t) ? 0 : l;
}
function oo(e) {
  switch (e) {
    case 2:
      e = 1;
      break;
    case 8:
      e = 4;
      break;
    case 32:
      e = 16;
      break;
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      e = 128;
      break;
    case 268435456:
      e = 134217728;
      break;
    default:
      e = 0;
  }
  return e;
}
function fo(e) {
  return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
}
function Em() {
  var e = ce.p;
  return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : cy(e.type));
}
function Td(e, t) {
  var l = ce.p;
  try {
    return ce.p = e, t();
  } finally {
    ce.p = l;
  }
}
var pl = Math.random().toString(36).slice(2), $e = "__reactFiber$" + pl, ot = "__reactProps$" + pl, yn = "__reactContainer$" + pl, Ed = "__reactEvents$" + pl, Nv = "__reactListeners$" + pl, Sv = "__reactHandles$" + pl, Dd = "__reactResources$" + pl, As = "__reactMarker$" + pl, Li = "__reactLoad$" + pl;
function yc(e) {
  delete e[$e], delete e[ot], delete e[Nv], delete e[Sv];
}
function sa(e) {
  var t;
  if (t = e[$e]) return t;
  for (var l = e.parentNode; l; ) {
    if (t = l[yn] || l[$e]) {
      if (l = t.alternate, t.child !== null || l !== null && l.child !== null)
        for (e = Vf(e); e !== null; ) {
          if (l = e[$e]) return l;
          e = Vf(e);
        }
      return t;
    }
    e = l, l = e.parentNode;
  }
  return null;
}
function vn(e) {
  if (e = e[$e] || e[yn]) {
    var t = e.tag;
    if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3)
      return e;
  }
  return null;
}
function Bn(e) {
  var t = e.tag;
  if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
  throw Error(B(33));
}
function Va(e) {
  var t = e[Dd];
  return t || (t = e[Dd] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), t;
}
function He(e) {
  e[As] = !0;
}
function Dm(e) {
  e[Li] = void 0;
}
var km = /* @__PURE__ */ new Set(), Am = {};
function ba(e, t) {
  ln(e, t), ln(e + "Capture", t);
}
function ln(e, t) {
  for (Am[e] = t, e = 0; e < t.length; e++)
    km.add(t[e]);
}
var wv = RegExp(
  "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
), kd = {}, Ad = {};
function Cv(e) {
  return qu.call(Ad, e) ? !0 : qu.call(kd, e) ? !1 : wv.test(e) ? Ad[e] = !0 : (kd[e] = !0, !1);
}
var ne = !1;
function Od() {
  var e = ne;
  return ne = !1, e;
}
function oi(e, t, l) {
  if (Cv(t))
    if (l === null) e.removeAttribute(t);
    else {
      switch (typeof l) {
        case "undefined":
        case "function":
        case "symbol":
          e.removeAttribute(t);
          return;
        case "boolean":
          var a = t.toLowerCase().slice(0, 5);
          if (a !== "data-" && a !== "aria-") {
            e.removeAttribute(t);
            return;
          }
      }
      e.setAttribute(t, l);
    }
}
function $s(e, t, l) {
  if (l === null) e.removeAttribute(t);
  else {
    switch (typeof l) {
      case "undefined":
      case "function":
      case "symbol":
      case "boolean":
        e.removeAttribute(t);
        return;
    }
    e.setAttribute(t, l);
  }
}
function nl(e, t, l, a) {
  if (a === null) e.removeAttribute(l);
  else {
    switch (typeof a) {
      case "undefined":
      case "function":
      case "symbol":
      case "boolean":
        e.removeAttribute(l);
        return;
    }
    e.setAttributeNS(t, l, a);
  }
}
function ft(e) {
  switch (typeof e) {
    case "bigint":
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function Om(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function Tv(e, t, l) {
  var a = Object.getOwnPropertyDescriptor(
    e.constructor.prototype,
    t
  );
  if (!e.hasOwnProperty(t) && typeof a < "u" && typeof a.get == "function" && typeof a.set == "function") {
    var s = a.get, i = a.set;
    return Object.defineProperty(e, t, {
      configurable: !0,
      get: function() {
        return s.call(this);
      },
      set: function(c) {
        l = "" + c, i.call(this, c);
      }
    }), Object.defineProperty(e, t, {
      enumerable: a.enumerable
    }), {
      getValue: function() {
        return l;
      },
      setValue: function(c) {
        l = "" + c;
      },
      stopTracking: function() {
        e._valueTracker = null, delete e[t];
      }
    };
  }
}
function Gu(e) {
  if (!e._valueTracker) {
    var t = Om(e) ? "checked" : "value";
    e._valueTracker = Tv(
      e,
      t,
      "" + e[t]
    );
  }
}
function zm(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var l = t.getValue(), a = "";
  return e && (a = Om(e) ? e.checked ? "true" : "false" : e.value), e = a, e !== l ? (t.setValue(e), !0) : !1;
}
var Ev = /[\n"\\]/g;
function Et(e) {
  return e.replace(
    Ev,
    function(t) {
      return "\\" + t.charCodeAt(0).toString(16) + " ";
    }
  );
}
function $u(e, t, l, a, s, i, c, u) {
  e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + ft(t)) : e.value !== "" + ft(t) && (e.value = "" + ft(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? c === "number" && e.value == t ? Vc(e, ft(e.value)) : Vc(e, ft(t)) : l != null ? Vc(e, ft(l)) : a != null && e.removeAttribute("value"), s == null && i != null && (e.defaultChecked = !!i), s != null && (e.checked = s && typeof s != "function" && typeof s != "symbol"), u != null && typeof u != "function" && typeof u != "symbol" && typeof u != "boolean" ? e.name = "" + ft(u) : e.removeAttribute("name");
}
function Mm(e, t, l, a, s, i, c, u) {
  if (i != null && typeof i != "function" && typeof i != "symbol" && typeof i != "boolean" && (e.type = i), t != null || l != null) {
    if (!(i !== "submit" && i !== "reset" || t != null)) {
      Gu(e);
      return;
    }
    l = l != null ? "" + ft(l) : "", t = t != null ? "" + ft(t) : l, u || t === e.value || (e.value = t), e.defaultValue = t;
  }
  a = a ?? s, a = typeof a != "function" && typeof a != "symbol" && !!a, e.checked = u ? e.checked : !!a, e.defaultChecked = !!a, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), Gu(e);
}
function Vc(e, t) {
  e.defaultValue !== "" + t && (e.defaultValue = "" + t);
}
function Xa(e, t, l, a) {
  if (e = e.options, t) {
    t = {};
    for (var s = 0; s < l.length; s++)
      t["$" + l[s]] = !0;
    for (l = 0; l < e.length; l++)
      s = t.hasOwnProperty("$" + e[l].value), e[l].selected !== s && (e[l].selected = s), s && a && (e[l].defaultSelected = !0);
  } else {
    for (l = "" + ft(l), t = null, s = 0; s < e.length; s++) {
      if (e[s].value === l) {
        e[s].selected = !0, a && (e[s].defaultSelected = !0);
        return;
      }
      t !== null || e[s].disabled || (t = e[s]);
    }
    t !== null && (t.selected = !0);
  }
}
function _m(e, t, l) {
  if (t != null && (t = "" + ft(t), t !== e.value && (e.value = t), l == null)) {
    e.defaultValue !== t && (e.defaultValue = t);
    return;
  }
  e.defaultValue = l != null ? "" + ft(l) : "";
}
function Rm(e, t, l, a) {
  if (t == null) {
    if (a != null) {
      if (l != null) throw Error(B(92));
      if (Ln(a)) {
        if (1 < a.length) throw Error(B(93));
        a = a[0];
      }
      l = a;
    }
    l == null && (l = ""), t = l;
  }
  l = ft(t), e.defaultValue = l, a = e.textContent, a === l && a !== "" && a !== null && (e.value = a), Gu(e);
}
function an(e, t) {
  if (t) {
    var l = e.firstChild;
    if (l && l === e.lastChild && l.nodeType === 3) {
      l.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Dv = new Set(
  "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
    " "
  )
);
function zd(e, t, l) {
  var a = t.indexOf("--") === 0;
  l == null || typeof l == "boolean" || l === "" ? a ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : a ? e.setProperty(t, l) : typeof l != "number" || l === 0 || Dv.has(t) ? t === "float" ? e.cssFloat = l : e[t] = ("" + l).trim() : e[t] = l + "px";
}
function Um(e, t, l) {
  if (t != null && typeof t != "object")
    throw Error(B(62));
  if (e = e.style, l != null) {
    for (var a in l)
      !l.hasOwnProperty(a) || t != null && t.hasOwnProperty(a) || (a.indexOf("--") === 0 ? e.setProperty(a, "") : a === "float" ? e.cssFloat = "" : e[a] = "", ne = !0);
    for (var s in t)
      a = t[s], t.hasOwnProperty(s) && l[s] !== a && (zd(e, s, a), ne = !0);
  } else
    for (var i in t)
      t.hasOwnProperty(i) && zd(e, i, t[i]);
}
function ho(e) {
  if (e.indexOf("-") === -1) return !1;
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var kv = /* @__PURE__ */ new Map([
  ["acceptCharset", "accept-charset"],
  ["htmlFor", "for"],
  ["httpEquiv", "http-equiv"],
  ["crossOrigin", "crossorigin"],
  ["accentHeight", "accent-height"],
  ["alignmentBaseline", "alignment-baseline"],
  ["arabicForm", "arabic-form"],
  ["baselineShift", "baseline-shift"],
  ["capHeight", "cap-height"],
  ["clipPath", "clip-path"],
  ["clipRule", "clip-rule"],
  ["colorInterpolation", "color-interpolation"],
  ["colorInterpolationFilters", "color-interpolation-filters"],
  ["colorProfile", "color-profile"],
  ["colorRendering", "color-rendering"],
  ["dominantBaseline", "dominant-baseline"],
  ["enableBackground", "enable-background"],
  ["fillOpacity", "fill-opacity"],
  ["fillRule", "fill-rule"],
  ["floodColor", "flood-color"],
  ["floodOpacity", "flood-opacity"],
  ["fontFamily", "font-family"],
  ["fontSize", "font-size"],
  ["fontSizeAdjust", "font-size-adjust"],
  ["fontStretch", "font-stretch"],
  ["fontStyle", "font-style"],
  ["fontVariant", "font-variant"],
  ["fontWeight", "font-weight"],
  ["glyphName", "glyph-name"],
  ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
  ["glyphOrientationVertical", "glyph-orientation-vertical"],
  ["horizAdvX", "horiz-adv-x"],
  ["horizOriginX", "horiz-origin-x"],
  ["imageRendering", "image-rendering"],
  ["letterSpacing", "letter-spacing"],
  ["lightingColor", "lighting-color"],
  ["markerEnd", "marker-end"],
  ["markerMid", "marker-mid"],
  ["markerStart", "marker-start"],
  ["maskType", "mask-type"],
  ["overlinePosition", "overline-position"],
  ["overlineThickness", "overline-thickness"],
  ["paintOrder", "paint-order"],
  ["panose-1", "panose-1"],
  ["pointerEvents", "pointer-events"],
  ["renderingIntent", "rendering-intent"],
  ["shapeRendering", "shape-rendering"],
  ["stopColor", "stop-color"],
  ["stopOpacity", "stop-opacity"],
  ["strikethroughPosition", "strikethrough-position"],
  ["strikethroughThickness", "strikethrough-thickness"],
  ["strokeDasharray", "stroke-dasharray"],
  ["strokeDashoffset", "stroke-dashoffset"],
  ["strokeLinecap", "stroke-linecap"],
  ["strokeLinejoin", "stroke-linejoin"],
  ["strokeMiterlimit", "stroke-miterlimit"],
  ["strokeOpacity", "stroke-opacity"],
  ["strokeWidth", "stroke-width"],
  ["textAnchor", "text-anchor"],
  ["textDecoration", "text-decoration"],
  ["textRendering", "text-rendering"],
  ["transformOrigin", "transform-origin"],
  ["underlinePosition", "underline-position"],
  ["underlineThickness", "underline-thickness"],
  ["unicodeBidi", "unicode-bidi"],
  ["unicodeRange", "unicode-range"],
  ["unitsPerEm", "units-per-em"],
  ["vAlphabetic", "v-alphabetic"],
  ["vHanging", "v-hanging"],
  ["vIdeographic", "v-ideographic"],
  ["vMathematical", "v-mathematical"],
  ["vectorEffect", "vector-effect"],
  ["vertAdvY", "vert-adv-y"],
  ["vertOriginX", "vert-origin-x"],
  ["vertOriginY", "vert-origin-y"],
  ["wordSpacing", "word-spacing"],
  ["writingMode", "writing-mode"],
  ["xmlnsXlink", "xmlns:xlink"],
  ["xHeight", "x-height"]
]), Av = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
function di(e) {
  return Av.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
}
function Zt() {
}
var Ku = null;
function mo(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var Ua = null, Qa = null;
function Md(e) {
  var t = vn(e);
  if (t && (e = t.stateNode)) {
    var l = e[ot] || null;
    e: switch (e = t.stateNode, t.type) {
      case "input":
        if ($u(
          e,
          l.value,
          l.defaultValue,
          l.defaultValue,
          l.checked,
          l.defaultChecked,
          l.type,
          l.name
        ), t = l.name, l.type === "radio" && t != null) {
          for (l = e; l.parentNode; ) l = l.parentNode;
          for (l = l.querySelectorAll(
            'input[name="' + Et(
              "" + t
            ) + '"][type="radio"]'
          ), t = 0; t < l.length; t++) {
            var a = l[t];
            if (a !== e && a.form === e.form) {
              var s = a[ot] || null;
              if (!s) throw Error(B(90));
              $u(
                a,
                s.value,
                s.defaultValue,
                s.defaultValue,
                s.checked,
                s.defaultChecked,
                s.type,
                s.name
              );
            }
          }
          for (t = 0; t < l.length; t++)
            a = l[t], a.form === e.form && zm(a);
        }
        break e;
      case "textarea":
        _m(e, l.value, l.defaultValue);
        break e;
      case "select":
        t = l.value, t != null && Xa(e, !!l.multiple, t, !1);
    }
  }
}
var Xc = !1;
function Lm(e, t, l) {
  if (Xc) return e(t, l);
  Xc = !0;
  try {
    var a = e(t);
    return a;
  } finally {
    if (Xc = !1, (Ua !== null || Qa !== null) && (Oc(), Ua && (t = Ua, e = Qa, Qa = Ua = null, Md(t), e)))
      for (t = 0; t < e.length; t++) Md(e[t]);
  }
}
function us(e, t) {
  var l = e.stateNode;
  if (l === null) return null;
  var a = l[ot] || null;
  if (a === null) return null;
  l = a[t];
  e: switch (t) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (a = !a.disabled) || (e = e.type, a = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !a;
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (l && typeof l != "function")
    throw Error(
      B(231, t, typeof l)
    );
  return l;
}
var ol = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Vu = !1;
if (ol)
  try {
    var En = {};
    Object.defineProperty(En, "passive", {
      get: function() {
        Vu = !0;
      }
    }), window.addEventListener("test", En, En), window.removeEventListener("test", En, En);
  } catch {
    Vu = !1;
  }
var Dl = null, go = null, fi = null;
function Bm() {
  if (fi) return fi;
  var e, t = go, l = t.length, a, s = "value" in Dl ? Dl.value : Dl.textContent, i = s.length;
  for (e = 0; e < l && t[e] === s[e]; e++) ;
  var c = l - e;
  for (a = 1; a <= c && t[l - a] === s[i - a]; a++) ;
  return fi = s.slice(e, 1 < a ? 1 - a : void 0);
}
function hi(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function Ks() {
  return !0;
}
function _d() {
  return !1;
}
function tt(e) {
  function t(l, a, s, i, c) {
    this._reactName = l, this._targetInst = s, this.type = a, this.nativeEvent = i, this.target = c, this.currentTarget = null;
    for (var u in e)
      e.hasOwnProperty(u) && (l = e[u], this[u] = l ? l(i) : i[u]);
    return this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1) ? Ks : _d, this.isPropagationStopped = _d, this;
  }
  return ye(t.prototype, {
    preventDefault: function() {
      this.defaultPrevented = !0;
      var l = this.nativeEvent;
      l && (l.preventDefault ? l.preventDefault() : typeof l.returnValue != "unknown" && (l.returnValue = !1), this.isDefaultPrevented = Ks);
    },
    stopPropagation: function() {
      var l = this.nativeEvent;
      l && (l.stopPropagation ? l.stopPropagation() : typeof l.cancelBubble != "unknown" && (l.cancelBubble = !0), this.isPropagationStopped = Ks);
    },
    persist: function() {
    },
    isPersistent: Ks
  }), t;
}
var Fl = {
  eventPhase: 0,
  bubbles: 0,
  cancelable: 0,
  timeStamp: function(e) {
    return e.timeStamp || Date.now();
  },
  defaultPrevented: 0,
  isTrusted: 0
}, vc = tt(Fl), Os = ye({}, Fl, { view: 0, detail: 0 }), Ov = tt(Os), Qc, Zc, Dn, xc = ye({}, Os, {
  screenX: 0,
  screenY: 0,
  clientX: 0,
  clientY: 0,
  pageX: 0,
  pageY: 0,
  ctrlKey: 0,
  shiftKey: 0,
  altKey: 0,
  metaKey: 0,
  getModifierState: po,
  button: 0,
  buttons: 0,
  relatedTarget: function(e) {
    return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
  },
  movementX: function(e) {
    return "movementX" in e ? e.movementX : (e !== Dn && (Dn && e.type === "mousemove" ? (Qc = e.screenX - Dn.screenX, Zc = e.screenY - Dn.screenY) : Zc = Qc = 0, Dn = e), Qc);
  },
  movementY: function(e) {
    return "movementY" in e ? e.movementY : Zc;
  }
}), Rd = tt(xc), zv = ye({}, xc, { dataTransfer: 0 }), Mv = tt(zv), _v = ye({}, Os, { relatedTarget: 0 }), Jc = tt(_v), Rv = ye({}, Fl, {
  animationName: 0,
  elapsedTime: 0,
  pseudoElement: 0
}), Uv = tt(Rv), Lv = ye({}, Fl, {
  clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  }
}), Bv = tt(Lv), Hv = ye({}, Fl, { data: 0 }), Ud = tt(Hv), Yv = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, qv = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Gv = {
  Alt: "altKey",
  Control: "ctrlKey",
  Meta: "metaKey",
  Shift: "shiftKey"
};
function $v(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Gv[e]) ? !!t[e] : !1;
}
function po() {
  return $v;
}
var Kv = ye({}, Os, {
  key: function(e) {
    if (e.key) {
      var t = Yv[e.key] || e.key;
      if (t !== "Unidentified") return t;
    }
    return e.type === "keypress" ? (e = hi(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? qv[e.keyCode] || "Unidentified" : "";
  },
  code: 0,
  location: 0,
  ctrlKey: 0,
  shiftKey: 0,
  altKey: 0,
  metaKey: 0,
  repeat: 0,
  locale: 0,
  getModifierState: po,
  charCode: function(e) {
    return e.type === "keypress" ? hi(e) : 0;
  },
  keyCode: function(e) {
    return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  },
  which: function(e) {
    return e.type === "keypress" ? hi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  }
}), Vv = tt(Kv), Xv = ye({}, xc, {
  pointerId: 0,
  width: 0,
  height: 0,
  pressure: 0,
  tangentialPressure: 0,
  tiltX: 0,
  tiltY: 0,
  twist: 0,
  pointerType: 0,
  isPrimary: 0
}), Ld = tt(Xv), Qv = ye({}, Fl, { submitter: 0 }), Zv = tt(Qv), Jv = ye({}, Os, {
  touches: 0,
  targetTouches: 0,
  changedTouches: 0,
  altKey: 0,
  metaKey: 0,
  ctrlKey: 0,
  shiftKey: 0,
  getModifierState: po
}), Fv = tt(Jv), Iv = ye({}, Fl, {
  propertyName: 0,
  elapsedTime: 0,
  pseudoElement: 0
}), Wv = tt(Iv), Pv = ye({}, xc, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), ex = tt(Pv), tx = ye({}, Fl, {
  newState: 0,
  oldState: 0,
  source: 0
}), lx = tt(tx), ax = [9, 13, 27, 32], yo = ol && "CompositionEvent" in window, Qn = null;
ol && "documentMode" in document && (Qn = document.documentMode);
var nx = ol && "TextEvent" in window && !Qn, Hm = ol && (!yo || Qn && 8 < Qn && 11 >= Qn), Bd = " ", Hd = !1;
function Ym(e, t) {
  switch (e) {
    case "keyup":
      return ax.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function qm(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var La = !1;
function sx(e, t) {
  switch (e) {
    case "compositionend":
      return qm(t);
    case "keypress":
      return t.which !== 32 ? null : (Hd = !0, Bd);
    case "textInput":
      return e = t.data, e === Bd && Hd ? null : e;
    default:
      return null;
  }
}
function ix(e, t) {
  if (La)
    return e === "compositionend" || !yo && Ym(e, t) ? (e = Bm(), fi = go = Dl = null, La = !1, e) : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
        if (t.char && 1 < t.char.length)
          return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return Hm && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var cx = {
  color: !0,
  date: !0,
  datetime: !0,
  "datetime-local": !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0
};
function Yd(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!cx[e.type] : t === "textarea";
}
function Gm(e, t, l, a) {
  Ua ? Qa ? Qa.push(a) : Qa = [a] : Ua = a, t = sc(t, "onChange"), 0 < t.length && (l = new vc(
    "onChange",
    "change",
    null,
    l,
    a
  ), e.push({ event: l, listeners: t }));
}
var Zn = null, rs = null;
function ux(e) {
  Lp(e, 0);
}
function jc(e) {
  var t = Bn(e);
  if (zm(t)) return e;
}
function qd(e, t) {
  if (e === "change") return t;
}
var $m = !1;
if (ol) {
  var Fc;
  if (ol) {
    var Ic = "oninput" in document;
    if (!Ic) {
      var Gd = document.createElement("div");
      Gd.setAttribute("oninput", "return;"), Ic = typeof Gd.oninput == "function";
    }
    Fc = Ic;
  } else Fc = !1;
  $m = Fc && (!document.documentMode || 9 < document.documentMode);
}
function $d() {
  Zn && (Zn.detachEvent("onpropertychange", Km), rs = Zn = null);
}
function Km(e) {
  if (e.propertyName === "value" && jc(rs)) {
    var t = [];
    Gm(
      t,
      rs,
      e,
      mo(e)
    ), Lm(ux, t);
  }
}
function rx(e, t, l) {
  e === "focusin" ? ($d(), Zn = t, rs = l, Zn.attachEvent("onpropertychange", Km)) : e === "focusout" && $d();
}
function ox(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown")
    return jc(rs);
}
function dx(e, t) {
  if (e === "click") return jc(t);
}
function fx(e, t) {
  if (e === "input" || e === "change")
    return jc(t);
}
function hx(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var jt = typeof Object.is == "function" ? Object.is : hx;
function os(e, t) {
  if (jt(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null)
    return !1;
  var l = Object.keys(e), a = Object.keys(t);
  if (l.length !== a.length) return !1;
  for (a = 0; a < l.length; a++) {
    var s = l[a];
    if (!qu.call(t, s) || !jt(e[s], t[s]))
      return !1;
  }
  return !0;
}
function Xu(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function Kd(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function Vd(e, t) {
  var l = Kd(e);
  e = 0;
  for (var a; l; ) {
    if (l.nodeType === 3) {
      if (a = e + l.textContent.length, e <= t && a >= t)
        return { node: l, offset: t - e };
      e = a;
    }
    e: {
      for (; l; ) {
        if (l.nextSibling) {
          l = l.nextSibling;
          break e;
        }
        l = l.parentNode;
      }
      l = void 0;
    }
    l = Kd(l);
  }
}
function Vm(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Vm(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function Xm(e) {
  e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
  for (var t = Xu(e.document); t instanceof e.HTMLIFrameElement; ) {
    try {
      var l = typeof t.contentWindow.location.href == "string";
    } catch {
      l = !1;
    }
    if (l) e = t.contentWindow;
    else break;
    t = Xu(e.document);
  }
  return t;
}
function vo(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
var mx = ol && "documentMode" in document && 11 >= document.documentMode, Ba = null, Qu = null, Jn = null, Zu = !1;
function Xd(e, t, l) {
  var a = l.window === l ? l.document : l.nodeType === 9 ? l : l.ownerDocument;
  Zu || Ba == null || Ba !== Xu(a) || (a = Ba, "selectionStart" in a && vo(a) ? a = { start: a.selectionStart, end: a.selectionEnd } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
    anchorNode: a.anchorNode,
    anchorOffset: a.anchorOffset,
    focusNode: a.focusNode,
    focusOffset: a.focusOffset
  }), Jn && os(Jn, a) || (Jn = a, a = sc(Qu, "onSelect"), 0 < a.length && (t = new vc(
    "onSelect",
    "select",
    null,
    t,
    l
  ), e.push({ event: t, listeners: a }), t.target = Ba)));
}
function Wl(e, t) {
  var l = {};
  return l[e.toLowerCase()] = t.toLowerCase(), l["Webkit" + e] = "webkit" + t, l["Moz" + e] = "moz" + t, l;
}
var Ha = {
  animationend: Wl("Animation", "AnimationEnd"),
  animationiteration: Wl("Animation", "AnimationIteration"),
  animationstart: Wl("Animation", "AnimationStart"),
  transitionrun: Wl("Transition", "TransitionRun"),
  transitionstart: Wl("Transition", "TransitionStart"),
  transitioncancel: Wl("Transition", "TransitionCancel"),
  transitionend: Wl("Transition", "TransitionEnd")
}, Wc = {}, Qm = {};
ol && (Qm = document.createElement("div").style, "AnimationEvent" in window || (delete Ha.animationend.animation, delete Ha.animationiteration.animation, delete Ha.animationstart.animation), "TransitionEvent" in window || delete Ha.transitionend.transition);
function Na(e) {
  if (Wc[e]) return Wc[e];
  if (!Ha[e]) return e;
  var t = Ha[e], l;
  for (l in t)
    if (t.hasOwnProperty(l) && l in Qm)
      return Wc[e] = t[l];
  return e;
}
var Zm = Na("animationend"), Jm = Na("animationiteration"), Fm = Na("animationstart"), gx = Na("transitionrun"), px = Na("transitionstart"), yx = Na("transitioncancel"), Im = Na("transitionend"), Wm = /* @__PURE__ */ new Map(), Ju = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
  " "
);
Ju.push("scrollEnd");
function Yt(e, t) {
  Wm.set(e, t), ba(t, [e]);
}
var vx = 0;
function dl(e, t) {
  if (e.name != null && e.name !== "auto") return e.name;
  if (t.autoName !== null) return t.autoName;
  e = Bt.identifierPrefix;
  var l = vx++;
  return e = "_" + e + "t_" + l.toString(32) + "_", t.autoName = e;
}
function Qd(e) {
  if (e == null || typeof e == "string")
    return e;
  var t = null, l = en;
  if (l !== null)
    for (var a = 0; a < l.length; a++) {
      var s = e[l[a]];
      if (s != null) {
        if (s === "none") return "none";
        t = t == null ? s : t + (" " + s);
      }
    }
  return t ?? e.default;
}
function yl(e, t) {
  return e = Qd(e), t = Qd(t), t == null ? e === "auto" ? null : e : t === "auto" ? null : t;
}
var Bi = typeof reportError == "function" ? reportError : function(e) {
  if (typeof window == "object" && typeof window.ErrorEvent == "function") {
    var t = new window.ErrorEvent("error", {
      bubbles: !0,
      cancelable: !0,
      message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
      error: e
    });
    if (!window.dispatchEvent(t)) return;
  } else if (typeof process == "object" && typeof process.emit == "function") {
    process.emit("uncaughtException", e);
    return;
  }
  console.error(e);
}, wt = [], Ya = 0, xo = 0;
function bc() {
  for (var e = Ya, t = xo = Ya = 0; t < e; ) {
    var l = wt[t];
    wt[t++] = null;
    var a = wt[t];
    wt[t++] = null;
    var s = wt[t];
    wt[t++] = null;
    var i = wt[t];
    if (wt[t++] = null, a !== null && s !== null) {
      var c = a.pending;
      c === null ? s.next = s : (s.next = c.next, c.next = s), a.pending = s;
    }
    i !== 0 && Pm(l, s, i);
  }
}
function Nc(e, t, l, a) {
  wt[Ya++] = e, wt[Ya++] = t, wt[Ya++] = l, wt[Ya++] = a, xo |= a, e.lanes |= a, e = e.alternate, e !== null && (e.lanes |= a);
}
function jo(e, t, l, a) {
  return Nc(e, t, l, a), Hi(e);
}
function Sa(e, t) {
  return Nc(e, null, null, t), Hi(e);
}
function Pm(e, t, l) {
  e.lanes |= l;
  var a = e.alternate;
  a !== null && (a.lanes |= l);
  for (var s = !1, i = e.return; i !== null; )
    i.childLanes |= l, a = i.alternate, a !== null && (a.childLanes |= l), i.tag === 22 && (e = i.stateNode, e === null || e._visibility & 1 || (s = !0)), e = i, i = i.return;
  return e.tag === 3 ? (i = e.stateNode, s && t !== null && (s = 31 - vt(l), e = i.hiddenUpdates, a = e[s], a === null ? e[s] = [t] : a.push(t), t.lane = l | 536870912), i) : null;
}
function Hi(e) {
  if (50 < ss)
    throw ss = 0, Si = null, Error(B(185));
  for (var t = e.return; t !== null; )
    e = t, t = e.return;
  return e.tag === 3 ? e.stateNode : null;
}
var qa = {};
function xx(e, t, l, a) {
  this.tag = e, this.key = l, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function ct(e, t, l, a) {
  return new xx(e, t, l, a);
}
function bo(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function ul(e, t) {
  var l = e.alternate;
  return l === null ? (l = ct(
    e.tag,
    t,
    e.key,
    e.mode
  ), l.elementType = e.elementType, l.type = e.type, l.stateNode = e.stateNode, l.alternate = e, e.alternate = l) : (l.pendingProps = t, l.type = e.type, l.flags = 0, l.subtreeFlags = 0, l.deletions = null), l.flags = e.flags & 1206910976, l.childLanes = e.childLanes, l.lanes = e.lanes, l.child = e.child, l.memoizedProps = e.memoizedProps, l.memoizedState = e.memoizedState, l.updateQueue = e.updateQueue, t = e.dependencies, l.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, l.sibling = e.sibling, l.index = e.index, l.ref = e.ref, l.refCleanup = e.refCleanup, l;
}
function eg(e, t) {
  e.flags &= 1206910978;
  var l = e.alternate;
  return l === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = l.childLanes, e.lanes = l.lanes, e.child = l.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = l.memoizedProps, e.memoizedState = l.memoizedState, e.updateQueue = l.updateQueue, e.type = l.type, t = l.dependencies, e.dependencies = t === null ? null : {
    lanes: t.lanes,
    firstContext: t.firstContext
  }), e;
}
function mi(e, t, l, a, s, i) {
  var c = 0;
  if (a = e, typeof a == "function") bo(a) && (c = 1);
  else if (typeof a == "string")
    c = Qj(
      e,
      l,
      It.current
    ) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
  else
    e: switch (a) {
      case Uu:
        return e = ct(31, l, t, s), e.elementType = Uu, e.lanes = i, e;
      case _a:
        return ua(l.children, s, i, t);
      case ym:
        c = 8, s |= 24;
        break;
      case Mu:
        return e = ct(12, l, t, s | 2), e.elementType = Mu, e.lanes = i, e;
      case _u:
        return e = ct(13, l, t, s), e.elementType = _u, e.lanes = i, e;
      case Ru:
        return e = ct(19, l, t, s), e.elementType = Ru, e.lanes = i, e;
      case iv:
      case Lu:
        return e = s | 32, e = ct(30, l, t, e), e.elementType = Lu, e.lanes = i, e.stateNode = {
          autoName: null,
          paired: null,
          clones: null,
          ref: null
        }, e;
      default:
        if (typeof a == "object" && a !== null)
          switch (a.$$typeof) {
            case Qt:
              c = 10;
              break e;
            case vm:
              c = 9;
              break e;
            case co:
              c = 11;
              break e;
            case uo:
              c = 14;
              break e;
            case wl:
              c = 16, a = null;
              break e;
          }
        c = 29, l = Error(
          B(130, e === null ? "null" : typeof e, "")
        ), a = null;
    }
  return t = ct(c, l, t, s), t.elementType = e, t.type = a, t.lanes = i, t;
}
function ua(e, t, l, a) {
  return e = ct(7, e, a, t), e.lanes = l, e;
}
function Pc(e, t, l) {
  return e = ct(6, e, null, t), e.lanes = l, e;
}
function tg(e) {
  var t = ct(18, null, null, 0);
  return t.stateNode = e, t;
}
function eu(e, t, l) {
  return t = ct(
    4,
    e.children !== null ? e.children : [],
    e.key,
    t
  ), t.lanes = l, t.stateNode = {
    containerInfo: e.containerInfo,
    pendingChildren: null,
    implementation: e.implementation
  }, t;
}
var Zd = /* @__PURE__ */ new WeakMap();
function Dt(e, t) {
  if (typeof e == "object" && e !== null) {
    var l = Zd.get(e);
    return l !== void 0 ? l : (t = {
      value: e,
      source: t,
      stack: Cd(t)
    }, Zd.set(e, t), t);
  }
  return {
    value: e,
    source: t,
    stack: Cd(t)
  };
}
var Ga = [], $a = 0, Yi = null, ds = 0, Ct = [], Tt = 0, Kl = null, Jt = 1, Ft = "";
function il(e, t) {
  Ga[$a++] = ds, Ga[$a++] = Yi, Yi = e, ds = t;
}
function lg(e, t, l) {
  Ct[Tt++] = Jt, Ct[Tt++] = Ft, Ct[Tt++] = Kl, Kl = e;
  var a = Jt;
  e = Ft;
  var s = 32 - vt(a) - 1;
  a &= ~(1 << s), l += 1;
  var i = 32 - vt(t) + s;
  if (30 < i) {
    var c = s - s % 5;
    i = (a & (1 << c) - 1).toString(32), a >>= c, s -= c, Jt = 1 << 32 - vt(t) + s | l << s | a, Ft = i + e;
  } else
    Jt = 1 << i | l << s | a, Ft = e;
}
function Sc(e) {
  e.return !== null && (il(e, 1), lg(e, 1, 0));
}
function No(e) {
  for (; e === Yi; )
    Yi = Ga[--$a], Ga[$a] = null, ds = Ga[--$a], Ga[$a] = null;
  for (; e === Kl; )
    Kl = Ct[--Tt], Ct[Tt] = null, Ft = Ct[--Tt], Ct[Tt] = null, Jt = Ct[--Tt], Ct[Tt] = null;
}
function ag(e, t) {
  Ct[Tt++] = Jt, Ct[Tt++] = Ft, Ct[Tt++] = Kl, Jt = t.id, Ft = t.overflow, Kl = e;
}
var Ye = null, xe = null, P = !1, Rl = null, kt = !1, Fu = Error(B(519));
function Vl(e) {
  var t = Error(
    B(
      418,
      1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
      ""
    )
  );
  throw fs(Dt(t, e)), Fu;
}
function Jd(e) {
  var t = e.stateNode, l = e.type, a = e.memoizedProps;
  switch (t[$e] = e, t[ot] = a, l) {
    case "dialog":
      ee("cancel", t), ee("close", t);
      break;
    case "iframe":
    case "object":
    case "embed":
      ee("load", t);
      break;
    case "video":
    case "audio":
      for (l = 0; l < ps.length; l++)
        ee(ps[l], t);
      break;
    case "source":
      ee("error", t);
      break;
    case "img":
    case "image":
    case "link":
      ee("error", t), ee("load", t);
      break;
    case "details":
      ee("toggle", t);
      break;
    case "input":
      ee("invalid", t), Mm(
        t,
        a.value,
        a.defaultValue,
        a.checked,
        a.defaultChecked,
        a.type,
        a.name,
        !0
      );
      break;
    case "select":
      ee("invalid", t);
      break;
    case "textarea":
      ee("invalid", t), Rm(t, a.value, a.defaultValue, a.children);
  }
  l = a.children, typeof l != "string" && typeof l != "number" && typeof l != "bigint" || t.textContent === "" + l || a.suppressHydrationWarning === !0 || Hp(t.textContent, l) ? (a.popover != null && (ee("beforetoggle", t), ee("toggle", t)), a.onScroll != null && ee("scroll", t), a.onScrollEnd != null && ee("scrollend", t), a.onClick != null && (t.onclick = Zt), t = !0) : t = !1, t || Vl(e, !0);
}
function qi(e) {
  for (Ye = e.return; Ye; )
    switch (Ye.tag) {
      case 5:
      case 31:
      case 13:
        kt = !1;
        return;
      case 27:
      case 3:
        kt = !0;
        return;
      default:
        Ye = Ye.return;
    }
}
function Ca(e) {
  if (e !== Ye) return !1;
  if (!P) return qi(e), P = !0, !1;
  var t = e.tag, l;
  if ((l = t !== 3 && t !== 27) && ((l = t === 5) && (l = e.type, l = !(l !== "form" && l !== "button") || _r(e.type, e.memoizedProps)), l = !l), l && xe && Vl(e), qi(e), t === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(B(317));
    xe = Kf(e);
  } else if (t === 31) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(B(317));
    xe = Kf(e);
  } else
    t === 27 ? (t = xe, Il(e.type) ? (e = Br, Br = null, xe = e) : xe = t) : xe = Ye ? At(e.stateNode.nextSibling) : null;
  return !0;
}
function fa() {
  xe = Ye = null, P = !1;
}
function tu() {
  var e = Rl;
  return e !== null && (st === null ? st = e : st.push.apply(
    st,
    e
  ), Rl = null), e;
}
function fs(e) {
  Rl === null ? Rl = [e] : Rl.push(e);
}
var Iu = tl(null), wa = null, cl = null;
function kl(e, t, l) {
  be(Iu, t._currentValue), t._currentValue = l;
}
function rl(e) {
  e._currentValue = Iu.current, Ve(Iu);
}
function gi(e, t, l) {
  for (; e !== null; ) {
    var a = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, a !== null && (a.childLanes |= t)) : a !== null && (a.childLanes & t) !== t && (a.childLanes |= t), e === l) break;
    e = e.return;
  }
}
function Wu(e, t, l, a) {
  var s = e.child;
  for (s !== null && (s.return = e); s !== null; ) {
    var i = s.dependencies;
    if (i !== null) {
      var c = s.child;
      i = i.firstContext;
      e: for (; i !== null; ) {
        var u = i;
        i = s;
        for (var r = 0; r < t.length; r++)
          if (u.context === t[r]) {
            i.lanes |= l, u = i.alternate, u !== null && (u.lanes |= l), gi(
              i.return,
              l,
              e
            ), a || (c = null);
            break e;
          }
        i = u.next;
      }
    } else if (s.tag === 18) {
      if (c = s.return, c === null) throw Error(B(341));
      c.lanes |= l, i = c.alternate, i !== null && (i.lanes |= l), gi(c, l, e), c = null;
    } else
      s.tag === 13 && s.memoizedState !== null && s.memoizedState.dehydrated === null ? (s.lanes |= l, c = s.alternate, c !== null && (c.lanes |= l), gi(
        s.return,
        l,
        e
      ), c = s.child, c = c !== null ? c.sibling : null) : c = s.child;
    if (c !== null) c.return = s;
    else
      for (c = s; c !== null; ) {
        if (c === e) {
          c = null;
          break;
        }
        if (s = c.sibling, s !== null) {
          s.return = c.return, c = s;
          break;
        }
        c = c.return;
      }
    s = c;
  }
}
function ha(e, t, l, a) {
  e = null;
  for (var s = t, i = !1; s !== null; ) {
    if (!i) {
      if (s.flags & 524288) i = !0;
      else if (s.flags & 262144) break;
    }
    if (s.tag === 10) {
      var c = s.alternate;
      if (c === null) throw Error(B(387));
      if (c = c.memoizedProps, c !== null) {
        var u = s.type;
        jt(s.pendingProps.value, c.value) || (e !== null ? e.push(u) : e = [u]);
      }
    } else if (s === Mi.current) {
      if (c = s.alternate, c === null) throw Error(B(387));
      c.memoizedState.memoizedState !== s.memoizedState.memoizedState && (e !== null ? e.push(fn) : e = [fn]);
    }
    s = s.return;
  }
  return e !== null && Wu(
    t,
    e,
    l,
    a
  ), t.flags |= 262144, e !== null;
}
function Gi(e) {
  for (e = e.firstContext; e !== null; ) {
    if (!jt(
      e.context._currentValue,
      e.memoizedValue
    ))
      return !0;
    e = e.next;
  }
  return !1;
}
function ma(e) {
  wa = e, cl = null, e = e.dependencies, e !== null && (e.firstContext = null);
}
function Ke(e) {
  return ng(wa, e);
}
function Vs(e, t) {
  return wa === null && ma(e), ng(e, t);
}
function ng(e, t) {
  var l = t._currentValue;
  if (t = { context: t, memoizedValue: l, next: null }, cl === null) {
    if (e === null) throw Error(B(308));
    cl = t, e.dependencies = { lanes: 0, firstContext: t }, e.flags |= 524288;
  } else cl = cl.next = t;
  return l;
}
var jx = typeof AbortController < "u" ? AbortController : function() {
  var e = [], t = this.signal = {
    aborted: !1,
    addEventListener: function(l, a) {
      e.push(a);
    }
  };
  this.abort = function() {
    t.aborted = !0, e.forEach(function(l) {
      return l();
    });
  };
}, bx = Re.unstable_scheduleCallback, Nx = Re.unstable_NormalPriority, Oe = {
  $$typeof: Qt,
  Consumer: null,
  Provider: null,
  _currentValue: null,
  _currentValue2: null,
  _threadCount: 0
};
function So() {
  return {
    controller: new jx(),
    data: /* @__PURE__ */ new Map(),
    refCount: 0
  };
}
function zs(e) {
  e.refCount--, e.refCount === 0 && bx(Nx, function() {
    e.controller.abort();
  });
}
function Fd(e, t) {
  if (e.pendingLanes & 4194048) {
    var l = e.transitionTypes;
    for (l === null && (l = e.transitionTypes = []), e = 0; e < t.length; e++) {
      var a = t[e];
      l.indexOf(a) === -1 && l.push(a);
    }
  }
}
var Hn = null;
function Sx(e) {
  var t = e.transitionTypes;
  return e.transitionTypes = null, t;
}
var Fn = null, Pu = 0, ga = 0, Za = null;
function wx(e, t) {
  if (Fn === null) {
    var l = Fn = [];
    Pu = 0, ga = Io(), Za = {
      status: "pending",
      value: void 0,
      then: function(a) {
        l.push(a);
      }
    };
  }
  return Pu++, t.then(Id, Id), t;
}
function Id() {
  if (--Pu === 0 && (Hn = null, Fn !== null)) {
    Za !== null && (Za.status = "fulfilled");
    var e = Fn;
    Fn = null, ga = 0, Za = null;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
}
function Cx(e, t) {
  var l = [], a = {
    status: "pending",
    value: null,
    reason: null,
    then: function(s) {
      l.push(s);
    }
  };
  return e.then(
    function() {
      a.status = "fulfilled", a.value = t;
      for (var s = 0; s < l.length; s++) (0, l[s])(t);
    },
    function(s) {
      for (a.status = "rejected", a.reason = s, s = 0; s < l.length; s++)
        (0, l[s])(void 0);
    }
  ), a;
}
var Wd = X.S;
X.S = function(e, t) {
  if (Np = pt(), typeof t == "object" && t !== null && typeof t.then == "function" && wx(e, t), Hn !== null)
    for (var l = rn; l !== null; )
      Fd(l, Hn), l = l.next;
  if (l = e.types, l !== null) {
    for (var a = rn; a !== null; )
      Fd(a, l), a = a.next;
    if (ga !== 0) {
      a = Hn, a === null && (a = Hn = []);
      for (var s = 0; s < l.length; s++) {
        var i = l[s];
        a.indexOf(i) === -1 && a.push(i);
      }
    }
  }
  Wd !== null && Wd(e, t);
};
var ra = tl(null);
function wo() {
  var e = ra.current;
  return e !== null ? e : pe.pooledCache;
}
function pi(e, t) {
  t === null ? be(ra, ra.current) : be(ra, t.pool);
}
function sg() {
  var e = wo();
  return e === null ? null : { parent: Oe._currentValue, pool: e };
}
var xn = Error(B(460)), Co = Error(B(474)), wc = Error(B(542)), $i = { then: function() {
} };
function Pd(e) {
  return e = e.status, e === "fulfilled" || e === "rejected";
}
function ig(e, t, l) {
  switch (l = e[l], l === void 0 ? e.push(t) : l !== t && (t.then(Zt, Zt), t = l), t.status) {
    case "fulfilled":
      return t.value;
    case "rejected":
      throw e = t.reason, tf(e), e === void 0 && !("reason" in t) ? Error(B(600)) : e;
    default:
      if (typeof t.status == "string") t.then(Zt, Zt);
      else {
        if (e = pe, e !== null && 100 < e.shellSuspendCounter)
          throw Error(B(482));
        e = t, e.status = "pending", e.then(
          function(a) {
            if (t.status === "pending") {
              var s = t;
              s.status = "fulfilled", s.value = a;
            }
          },
          function(a) {
            if (t.status === "pending") {
              var s = t;
              s.status = "rejected", s.reason = a;
            }
          }
        );
      }
      switch (t.status) {
        case "fulfilled":
          return t.value;
        case "rejected":
          throw e = t.reason, tf(e), e;
      }
      throw oa = t, xn;
  }
}
function la(e) {
  try {
    var t = e._init;
    return t(e._payload);
  } catch (l) {
    throw l !== null && typeof l == "object" && typeof l.then == "function" ? (oa = l, xn) : l;
  }
}
var oa = null;
function ef() {
  if (oa === null) throw Error(B(459));
  var e = oa;
  return oa = null, e;
}
function tf(e) {
  if (e === xn || e === wc)
    throw Error(B(483));
}
var Ja = null, hs = 0;
function Xs(e) {
  var t = hs;
  return hs += 1, Ja === null && (Ja = []), ig(Ja, e, t);
}
function jl(e, t) {
  t = t.props.ref, e.ref = t !== void 0 ? t : null;
}
function Qs(e, t) {
  throw t.$$typeof === sv ? Error(B(525)) : (e = Object.prototype.toString.call(t), Error(
    B(
      31,
      e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e
    )
  ));
}
function cg(e) {
  function t(p, y) {
    if (e) {
      var S = p.deletions;
      S === null ? (p.deletions = [y], p.flags |= 16) : S.push(y);
    }
  }
  function l(p, y) {
    if (!e) return null;
    for (; y !== null; )
      t(p, y), y = y.sibling;
    return null;
  }
  function a(p) {
    for (var y = /* @__PURE__ */ new Map(); p !== null; )
      p.key === null ? y.set(p.index, p) : y.set(p.key, p), p = p.sibling;
    return y;
  }
  function s(p, y) {
    return p = ul(p, y), p.index = 0, p.sibling = null, p;
  }
  function i(p, y, S) {
    return p.index = S, e ? (S = p.alternate, S !== null ? (S = S.index, S < y ? (p.flags |= 2, y) : S) : (p.flags |= 134217730, y)) : (p.flags |= 1048576, y);
  }
  function c(p) {
    return e && p.alternate === null && (p.flags |= 134217730), p;
  }
  function u(p, y, S, w) {
    return y === null || y.tag !== 6 ? (y = Pc(S, p.mode, w), y.return = p, y) : (y = s(y, S), y.return = p, y);
  }
  function r(p, y, S, w) {
    var D = S.type;
    return D === _a ? (p = m(
      p,
      y,
      S.props.children,
      w,
      S.key
    ), jl(p, S), p) : y !== null && (y.elementType === D || typeof D == "object" && D !== null && D.$$typeof === wl && la(D) === y.type) ? (y = s(y, S.props), jl(y, S), y.return = p, y) : (y = mi(
      S.type,
      S.key,
      S.props,
      null,
      p.mode,
      w
    ), jl(y, S), y.return = p, y);
  }
  function d(p, y, S, w) {
    return y === null || y.tag !== 4 || y.stateNode.containerInfo !== S.containerInfo || y.stateNode.implementation !== S.implementation ? (y = eu(S, p.mode, w), y.return = p, y) : (y = s(y, S.children || []), y.return = p, y);
  }
  function m(p, y, S, w, D) {
    return y === null || y.tag !== 7 ? (y = ua(
      S,
      p.mode,
      w,
      D
    ), y.return = p, y) : (y = s(y, S), y.return = p, y);
  }
  function f(p, y, S) {
    if (typeof y == "string" && y !== "" || typeof y == "number" || typeof y == "bigint")
      return y = Pc(
        "" + y,
        p.mode,
        S
      ), y.return = p, y;
    if (typeof y == "object" && y !== null) {
      switch (y.$$typeof) {
        case Hs:
          return S = mi(
            y.type,
            y.key,
            y.props,
            null,
            p.mode,
            S
          ), jl(S, y), S.return = p, S;
        case Un:
          return y = eu(
            y,
            p.mode,
            S
          ), y.return = p, y;
        case wl:
          return y = la(y), f(p, y, S);
      }
      if (Ln(y) || Tn(y))
        return y = ua(
          y,
          p.mode,
          S,
          null
        ), y.return = p, y;
      if (typeof y.then == "function")
        return f(p, Xs(y), S);
      if (y.$$typeof === Qt)
        return f(
          p,
          Vs(p, y),
          S
        );
      Qs(p, y);
    }
    return null;
  }
  function o(p, y, S, w) {
    var D = y !== null ? y.key : null;
    if (typeof S == "string" && S !== "" || typeof S == "number" || typeof S == "bigint")
      return D !== null ? null : u(p, y, "" + S, w);
    if (typeof S == "object" && S !== null) {
      switch (S.$$typeof) {
        case Hs:
          return S.key === D ? r(p, y, S, w) : null;
        case Un:
          return S.key === D ? d(p, y, S, w) : null;
        case wl:
          return S = la(S), o(p, y, S, w);
      }
      if (Ln(S) || Tn(S))
        return D !== null ? null : m(p, y, S, w, null);
      if (typeof S.then == "function")
        return o(
          p,
          y,
          Xs(S),
          w
        );
      if (S.$$typeof === Qt)
        return o(
          p,
          y,
          Vs(p, S),
          w
        );
      Qs(p, S);
    }
    return null;
  }
  function h(p, y, S, w, D) {
    if (typeof w == "string" && w !== "" || typeof w == "number" || typeof w == "bigint")
      return p = p.get(S) || null, u(y, p, "" + w, D);
    if (typeof w == "object" && w !== null) {
      switch (w.$$typeof) {
        case Hs:
          return p = p.get(
            w.key === null ? S : w.key
          ) || null, r(y, p, w, D);
        case Un:
          return p = p.get(
            w.key === null ? S : w.key
          ) || null, d(y, p, w, D);
        case wl:
          return w = la(w), h(
            p,
            y,
            S,
            w,
            D
          );
      }
      if (Ln(w) || Tn(w))
        return p = p.get(S) || null, m(y, p, w, D, null);
      if (typeof w.then == "function")
        return h(
          p,
          y,
          S,
          Xs(w),
          D
        );
      if (w.$$typeof === Qt)
        return h(
          p,
          y,
          S,
          Vs(y, w),
          D
        );
      Qs(y, w);
    }
    return null;
  }
  function v(p, y, S, w) {
    for (var D = null, U = null, N = y, _ = y = 0, E = null; N !== null && _ < S.length; _++) {
      N.index > _ ? (E = N, N = null) : E = N.sibling;
      var T = o(
        p,
        N,
        S[_],
        w
      );
      if (T === null) {
        N === null && (N = E);
        break;
      }
      e && N && T.alternate === null && t(p, N), y = i(T, y, _), U === null ? D = T : U.sibling = T, U = T, N = E;
    }
    if (_ === S.length)
      return l(p, N), P && il(p, _), D;
    if (N === null) {
      for (; _ < S.length; _++)
        N = f(p, S[_], w), N !== null && (y = i(
          N,
          y,
          _
        ), U === null ? D = N : U.sibling = N, U = N);
      return P && il(p, _), D;
    }
    for (N = a(N); _ < S.length; _++)
      E = h(
        N,
        p,
        _,
        S[_],
        w
      ), E !== null && (e && (T = E.alternate, T !== null && N.delete(T.key === null ? _ : T.key)), y = i(
        E,
        y,
        _
      ), U === null ? D = E : U.sibling = E, U = E);
    return e && N.forEach(function(b) {
      return t(p, b);
    }), P && il(p, _), D;
  }
  function x(p, y, S, w) {
    if (S == null) throw Error(B(151));
    for (var D = null, U = null, N = y, _ = y = 0, E = null, T = S.next(); N !== null && !T.done; _++, T = S.next()) {
      N.index > _ ? (E = N, N = null) : E = N.sibling;
      var b = o(p, N, T.value, w);
      if (b === null) {
        N === null && (N = E);
        break;
      }
      e && N && b.alternate === null && t(p, N), y = i(b, y, _), U === null ? D = b : U.sibling = b, U = b, N = E;
    }
    if (T.done)
      return l(p, N), P && il(p, _), D;
    if (N === null) {
      for (; !T.done; _++, T = S.next())
        T = f(p, T.value, w), T !== null && (y = i(T, y, _), U === null ? D = T : U.sibling = T, U = T);
      return P && il(p, _), D;
    }
    for (N = a(N); !T.done; _++, T = S.next())
      T = h(N, p, _, T.value, w), T !== null && (e && (E = T.alternate, E !== null && N.delete(
        E.key === null ? _ : E.key
      )), y = i(T, y, _), U === null ? D = T : U.sibling = T, U = T);
    return e && N.forEach(function(g) {
      return t(p, g);
    }), P && il(p, _), D;
  }
  function C(p, y, S, w) {
    if (typeof S == "object" && S !== null && S.type === _a && S.key === null && S.props.ref === void 0 && (S = S.props.children), typeof S == "object" && S !== null) {
      switch (S.$$typeof) {
        case Hs:
          e: {
            for (var D = S.key; y !== null; ) {
              if (y.key === D) {
                if (D = S.type, D === _a) {
                  if (y.tag === 7) {
                    l(
                      p,
                      y.sibling
                    ), w = s(
                      y,
                      S.props.children
                    ), jl(w, S), w.return = p, p = w;
                    break e;
                  }
                } else if (y.elementType === D || typeof D == "object" && D !== null && D.$$typeof === wl && la(D) === y.type) {
                  l(
                    p,
                    y.sibling
                  ), w = s(y, S.props), jl(w, S), w.return = p, p = w;
                  break e;
                }
                l(p, y);
                break;
              } else t(p, y);
              y = y.sibling;
            }
            S.type === _a ? (w = ua(
              S.props.children,
              p.mode,
              w,
              S.key
            ), jl(w, S), w.return = p, p = w) : (w = mi(
              S.type,
              S.key,
              S.props,
              null,
              p.mode,
              w
            ), jl(w, S), w.return = p, p = w);
          }
          return c(p);
        case Un:
          e: {
            for (D = S.key; y !== null; ) {
              if (y.key === D)
                if (y.tag === 4 && y.stateNode.containerInfo === S.containerInfo && y.stateNode.implementation === S.implementation) {
                  l(
                    p,
                    y.sibling
                  ), w = s(y, S.children || []), w.return = p, p = w;
                  break e;
                } else {
                  l(p, y);
                  break;
                }
              else t(p, y);
              y = y.sibling;
            }
            w = eu(S, p.mode, w), w.return = p, p = w;
          }
          return c(p);
        case wl:
          return S = la(S), C(
            p,
            y,
            S,
            w
          );
      }
      if (Ln(S))
        return v(
          p,
          y,
          S,
          w
        );
      if (Tn(S)) {
        if (D = Tn(S), typeof D != "function") throw Error(B(150));
        return S = D.call(S), x(
          p,
          y,
          S,
          w
        );
      }
      if (typeof S.then == "function")
        return C(
          p,
          y,
          Xs(S),
          w
        );
      if (S.$$typeof === Qt)
        return C(
          p,
          y,
          Vs(p, S),
          w
        );
      Qs(p, S);
    }
    return typeof S == "string" && S !== "" || typeof S == "number" || typeof S == "bigint" ? (S = "" + S, y !== null && y.tag === 6 ? (l(p, y.sibling), w = s(y, S), w.return = p, p = w) : (l(p, y), w = Pc(S, p.mode, w), w.return = p, p = w), c(p)) : l(p, y);
  }
  return function(p, y, S, w) {
    try {
      hs = 0;
      var D = C(
        p,
        y,
        S,
        w
      );
      return Ja = null, D;
    } catch (N) {
      if (N === xn || N === wc) throw N;
      var U = ct(29, N, null, p.mode);
      return U.lanes = w, U.return = p, U;
    } finally {
    }
  };
}
var pa = cg(!0), ug = cg(!1), Cl = !1;
function To(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, lanes: 0, hiddenCallbacks: null },
    callbacks: null
  };
}
function er(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
    baseState: e.baseState,
    firstBaseUpdate: e.firstBaseUpdate,
    lastBaseUpdate: e.lastBaseUpdate,
    shared: e.shared,
    callbacks: null
  });
}
function Ul(e) {
  return { lane: e, tag: 0, payload: null, callback: null, next: null };
}
function Ll(e, t, l) {
  var a = e.updateQueue;
  if (a === null) return null;
  if (a = a.shared, ie & 2) {
    var s = a.pending;
    return s === null ? t.next = t : (t.next = s.next, s.next = t), a.pending = t, t = Hi(e), Pm(e, null, l), t;
  }
  return Nc(e, a, t, l), Hi(e);
}
function In(e, t, l) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (l & 4194048) !== 0)) {
    var a = t.lanes;
    a &= e.pendingLanes, l |= a, t.lanes = l, Cm(e, l);
  }
}
function lu(e, t) {
  var l = e.updateQueue, a = e.alternate;
  if (a !== null && (a = a.updateQueue, l === a)) {
    var s = null, i = null;
    if (l = l.firstBaseUpdate, l !== null) {
      do {
        var c = {
          lane: l.lane,
          tag: l.tag,
          payload: l.payload,
          callback: null,
          next: null
        };
        i === null ? s = i = c : i = i.next = c, l = l.next;
      } while (l !== null);
      i === null ? s = i = t : i = i.next = t;
    } else s = i = t;
    l = {
      baseState: a.baseState,
      firstBaseUpdate: s,
      lastBaseUpdate: i,
      shared: a.shared,
      callbacks: a.callbacks
    }, e.updateQueue = l;
    return;
  }
  e = l.lastBaseUpdate, e === null ? l.firstBaseUpdate = t : e.next = t, l.lastBaseUpdate = t;
}
var tr = !1;
function Wn() {
  if (tr) {
    var e = Za;
    if (e !== null) throw e;
  }
}
function Pn(e, t, l, a) {
  tr = !1;
  var s = e.updateQueue;
  Cl = !1;
  var i = s.firstBaseUpdate, c = s.lastBaseUpdate, u = s.shared.pending;
  if (u !== null) {
    s.shared.pending = null;
    var r = u, d = r.next;
    r.next = null, c === null ? i = d : c.next = d, c = r;
    var m = e.alternate;
    m !== null && (m = m.updateQueue, u = m.lastBaseUpdate, u !== c && (u === null ? m.firstBaseUpdate = d : u.next = d, m.lastBaseUpdate = r));
  }
  if (i !== null) {
    var f = s.baseState;
    c = 0, m = d = r = null, u = i;
    do {
      var o = u.lane & -536870913, h = o !== u.lane;
      if (h ? (le & o) === o : (a & o) === o) {
        o !== 0 && o === ga && (tr = !0), m !== null && (m = m.next = {
          lane: 0,
          tag: u.tag,
          payload: u.payload,
          callback: null,
          next: null
        });
        e: {
          var v = e, x = u;
          o = t;
          var C = l;
          switch (x.tag) {
            case 1:
              if (v = x.payload, typeof v == "function") {
                f = v.call(C, f, o);
                break e;
              }
              f = v;
              break e;
            case 3:
              v.flags = v.flags & -65537 | 128;
            case 0:
              if (v = x.payload, o = typeof v == "function" ? v.call(C, f, o) : v, o == null) break e;
              f = ye({}, f, o);
              break e;
            case 2:
              Cl = !0;
          }
        }
        o = u.callback, o !== null && (e.flags |= 64, h && (e.flags |= 8192), h = s.callbacks, h === null ? s.callbacks = [o] : h.push(o));
      } else
        h = {
          lane: o,
          tag: u.tag,
          payload: u.payload,
          callback: u.callback,
          next: null
        }, m === null ? (d = m = h, r = f) : m = m.next = h, c |= o;
      if (u = u.next, u === null) {
        if (u = s.shared.pending, u === null)
          break;
        h = u, u = h.next, h.next = null, s.lastBaseUpdate = h, s.shared.pending = null;
      }
    } while (!0);
    m === null && (r = f), s.baseState = r, s.firstBaseUpdate = d, s.lastBaseUpdate = m, i === null && (s.shared.lanes = 0), Zl |= c, e.lanes = c, e.memoizedState = f;
  }
}
function rg(e, t) {
  if (typeof e != "function")
    throw Error(B(191, e));
  e.call(t);
}
function og(e, t) {
  var l = e.callbacks;
  if (l !== null)
    for (e.callbacks = null, e = 0; e < l.length; e++)
      rg(l[e], t);
}
var Xl = tl(null), Ki = tl(0);
function lf(e, t) {
  e = gl, be(Ki, e), be(Xl, t), gl = e | t.baseLanes;
}
function lr() {
  be(Ki, gl), be(Xl, Xl.current);
}
function Eo() {
  gl = Ki.current, Ve(Xl), Ve(Ki);
}
var Ze = tl(null), Je = null;
function Bl(e) {
  var t = e.alternate;
  be(Xe, Xe.current & 1), be(Ze, e), Je === null && (t === null || Xl.current !== null || t.memoizedState !== null) && (Je = e);
}
function ar(e) {
  be(Xe, Xe.current), be(Ze, e), Je === null && (Je = e);
}
function dg(e) {
  e.tag === 22 ? (be(Xe, Xe.current), be(Ze, e), Je === null && (Je = e)) : Hl();
}
function Hl() {
  be(Xe, Xe.current), be(Ze, Ze.current);
}
function ht(e) {
  Ve(Ze), Je === e && (Je = null), Ve(Xe);
}
var Xe = tl(0);
function ms(e, t) {
  be(Ze, Ze.current), be(Xe, t);
}
function Do(e) {
  Ve(Xe), Ve(Ze), Je === e && (Je = null);
}
function Vi(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var l = t.memoizedState;
      if (l !== null && (l = l.dehydrated, l === null || Lr(l) || td(l)))
        return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== "independent") {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      t.child.return = t, t = t.child;
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    t.sibling.return = t.return, t = t.sibling;
  }
  return null;
}
var fl = 0, J = null, me = null, Ae = null, Xi = !1, Fa = !1, ya = !1, Qi = 0, gs = 0, Ia = null, Tx = 0;
function Ee() {
  throw Error(B(321));
}
function ko(e, t) {
  if (t === null) return !1;
  for (var l = 0; l < t.length && l < e.length; l++)
    if (!jt(e[l], t[l])) return !1;
  return !0;
}
function Ao(e, t, l, a, s, i) {
  return fl = i, J = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, X.H = e === null || e.memoizedState === null ? Gg : $g, ya = !1, i = l(a, s), ya = !1, Fa && (i = hg(
    t,
    l,
    a,
    s
  )), fg(e), i;
}
function fg(e) {
  X.H = Zi;
  var t = me !== null && me.next !== null;
  if (fl = 0, Ae = me = J = null, Xi = !1, gs = 0, Ia = null, t) throw Error(B(300));
  e === null || ze || (e = e.dependencies, e !== null && Gi(e) && (ze = !0));
}
function hg(e, t, l, a) {
  J = e;
  var s = 0;
  do {
    if (Fa && (Ia = null), gs = 0, Fa = !1, 25 <= s) throw Error(B(301));
    if (s += 1, Ae = me = null, e.updateQueue != null) {
      var i = e.updateQueue;
      i.lastEffect = null, i.events = null, i.stores = null, i.memoCache != null && (i.memoCache.index = 0);
    }
    X.H = _x, i = t(l, a);
  } while (Fa);
  return i;
}
function Ex() {
  var e = X.H, t = e.useState()[0];
  return t = typeof t.then == "function" ? Ms(t) : t, e = e.useState()[0], (me !== null ? me.memoizedState : null) !== e && (J.flags |= 1024), t;
}
function Oo() {
  var e = Qi !== 0;
  return Qi = 0, e;
}
function zo(e, t, l) {
  t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l;
}
function Mo(e) {
  if (Xi) {
    for (e = e.memoizedState; e !== null; ) {
      var t = e.queue;
      t !== null && (t.pending = null), e = e.next;
    }
    Xi = !1;
  }
  fl = 0, Ae = me = J = null, Fa = !1, gs = Qi = 0, Ia = null;
}
function Pe() {
  var e = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null
  };
  return Ae === null ? J.memoizedState = Ae = e : Ae = Ae.next = e, Ae;
}
function ke() {
  if (me === null) {
    var e = J.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = me.next;
  var t = Ae === null ? J.memoizedState : Ae.next;
  if (t !== null)
    Ae = t, me = e;
  else {
    if (e === null)
      throw J.alternate === null ? Error(B(467)) : Error(B(310));
    me = e, e = {
      memoizedState: me.memoizedState,
      baseState: me.baseState,
      baseQueue: me.baseQueue,
      queue: me.queue,
      next: null
    }, Ae === null ? J.memoizedState = Ae = e : Ae = Ae.next = e;
  }
  return Ae;
}
function Cc() {
  return { lastEffect: null, events: null, stores: null, memoCache: null };
}
function Ms(e) {
  var t = gs;
  return gs += 1, Ia === null && (Ia = []), e = ig(Ia, e, t), t = J, (Ae === null ? t.memoizedState : Ae.next) === null && (t = t.alternate, X.H = t === null || t.memoizedState === null ? Gg : $g), e;
}
function Tc(e) {
  if (e !== null && typeof e == "object") {
    if (typeof e.then == "function") return Ms(e);
    if (e.$$typeof === uv) return;
    if (e.$$typeof === Qt) return Ke(e);
  }
  throw Error(B(438, String(e)));
}
function _o(e) {
  var t = null, l = J.updateQueue;
  if (l !== null && (t = l.memoCache), t == null) {
    var a = J.alternate;
    a !== null && (a = a.updateQueue, a !== null && (a = a.memoCache, a != null && (t = {
      data: a.data.map(function(s) {
        return s.slice();
      }),
      index: 0
    })));
  }
  if (t == null && (t = { data: [], index: 0 }), l === null && (l = Cc(), J.updateQueue = l), l.memoCache = t, l = t.data[t.index], l === void 0)
    for (l = t.data[t.index] = Array(e), a = 0; a < e; a++)
      l[a] = cv;
  return t.index++, l;
}
function hl(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function yi(e) {
  var t = ke();
  return Ro(t, me, e);
}
function Ro(e, t, l) {
  var a = e.queue;
  if (a === null) throw Error(B(311));
  a.lastRenderedReducer = l;
  var s = e.baseQueue, i = a.pending;
  if (i !== null) {
    if (s !== null) {
      var c = s.next;
      s.next = i.next, i.next = c;
    }
    t.baseQueue = s = i, a.pending = null;
  }
  if (i = e.baseState, s === null) e.memoizedState = i;
  else {
    t = s.next;
    var u = c = null, r = null, d = t, m = !1;
    do {
      var f = d.lane & -536870913;
      if (f !== d.lane ? (le & f) === f : (fl & f) === f) {
        var o = d.revertLane;
        if (o === 0)
          r !== null && (r = r.next = {
            lane: 0,
            revertLane: 0,
            gesture: null,
            action: d.action,
            hasEagerState: d.hasEagerState,
            eagerState: d.eagerState,
            next: null
          }), f === ga && (m = !0);
        else if ((fl & o) === o) {
          d = d.next, o === ga && (m = !0);
          continue;
        } else
          f = {
            lane: 0,
            revertLane: d.revertLane,
            gesture: null,
            action: d.action,
            hasEagerState: d.hasEagerState,
            eagerState: d.eagerState,
            next: null
          }, r === null ? (u = r = f, c = i) : r = r.next = f, J.lanes |= o, Zl |= o;
        f = d.action, ya && l(i, f), i = d.hasEagerState ? d.eagerState : l(i, f);
      } else
        o = {
          lane: f,
          revertLane: d.revertLane,
          gesture: d.gesture,
          action: d.action,
          hasEagerState: d.hasEagerState,
          eagerState: d.eagerState,
          next: null
        }, r === null ? (u = r = o, c = i) : r = r.next = o, J.lanes |= f, Zl |= f;
      d = d.next;
    } while (d !== null && d !== t);
    if (r === null ? c = i : r.next = u, !jt(i, e.memoizedState) && (ze = !0, m && (l = Za, l !== null)))
      throw l;
    e.memoizedState = i, e.baseState = c, e.baseQueue = r, a.lastRenderedState = i;
  }
  return s === null && (a.lanes = 0), [e.memoizedState, a.dispatch];
}
function au(e) {
  var t = ke(), l = t.queue;
  if (l === null) throw Error(B(311));
  l.lastRenderedReducer = e;
  var a = l.dispatch, s = l.pending, i = t.memoizedState;
  if (s !== null) {
    l.pending = null;
    var c = s = s.next;
    do
      i = e(i, c.action), c = c.next;
    while (c !== s);
    jt(i, t.memoizedState) || (ze = !0), t.memoizedState = i, t.baseQueue === null && (t.baseState = i), l.lastRenderedState = i;
  }
  return [i, a];
}
function mg(e, t, l) {
  var a = J, s = ke(), i = P;
  if (i) {
    if (l === void 0) throw Error(B(407));
    l = l();
  } else l = t();
  var c = !jt(
    (me || s).memoizedState,
    l
  );
  if (c && (s.memoizedState = l, ze = !0), s = s.queue, Uo(yg.bind(null, a, s, e), [
    e
  ]), e = s.getSnapshot !== t || c || Ae !== null && (Ae.memoizedState.tag & 1) !== 0, nn(
    e ? 9 : 8,
    { destroy: void 0 },
    pg.bind(null, a, s, l, t),
    null
  ), e) {
    if (a.flags |= 2048, pe === null) throw Error(B(349));
    i || fl & 127 || gg(a, t, l);
  }
  return l;
}
function gg(e, t, l) {
  e.flags |= 16384, e = { getSnapshot: t, value: l }, t = J.updateQueue, t === null ? (t = Cc(), J.updateQueue = t, t.stores = [e]) : (l = t.stores, l === null ? t.stores = [e] : l.push(e));
}
function pg(e, t, l, a) {
  t.value = l, t.getSnapshot = a, vg(t) && xg(e);
}
function yg(e, t, l) {
  return l(function() {
    vg(t) && xg(e);
  });
}
function vg(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var l = t();
    return !jt(e, l);
  } catch {
    return !0;
  }
}
function xg(e) {
  var t = Sa(e, 2);
  t !== null && ut(t, e, 2);
}
function nr(e) {
  var t = Pe();
  if (typeof e == "function") {
    var l = e;
    if (e = l(), ya) {
      El(!0);
      try {
        l();
      } finally {
        El(!1);
      }
    }
  }
  return t.memoizedState = t.baseState = e, t.queue = {
    pending: null,
    lanes: 0,
    dispatch: null,
    lastRenderedReducer: hl,
    lastRenderedState: e
  }, t;
}
function jg(e, t, l, a) {
  return e.baseState = l, Ro(
    e,
    me,
    typeof a == "function" ? a : hl
  );
}
function Dx(e, t, l, a, s) {
  if (Dc(e)) throw Error(B(485));
  if (e = t.action, e !== null) {
    var i = {
      payload: s,
      action: e,
      next: null,
      isTransition: !0,
      status: "pending",
      value: null,
      reason: null,
      listeners: [],
      then: function(c) {
        i.listeners.push(c);
      }
    };
    X.T !== null ? l(!0) : i.isTransition = !1, a(i), l = t.pending, l === null ? (i.next = t.pending = i, bg(t, i)) : (i.next = l.next, t.pending = l.next = i);
  }
}
function bg(e, t) {
  var l = t.action, a = t.payload, s = e.state;
  if (t.isTransition) {
    var i = X.T, c = {};
    c.types = i !== null ? i.types : null, X.T = c;
    try {
      var u = l(s, a), r = X.S;
      r !== null && r(c, u), af(e, t, u);
    } catch (d) {
      sr(e, t, d);
    } finally {
      i !== null && c.types !== null && (i.types = c.types), X.T = i;
    }
  } else
    try {
      i = l(s, a), af(e, t, i);
    } catch (d) {
      sr(e, t, d);
    }
}
function af(e, t, l) {
  l !== null && typeof l == "object" && typeof l.then == "function" ? l.then(
    function(a) {
      nf(e, t, a);
    },
    function(a) {
      return sr(e, t, a);
    }
  ) : nf(e, t, l);
}
function nf(e, t, l) {
  t.status = "fulfilled", t.value = l, Ng(t), e.state = l, t = e.pending, t !== null && (l = t.next, l === t ? e.pending = null : (l = l.next, t.next = l, bg(e, l)));
}
function sr(e, t, l) {
  var a = e.pending;
  if (e.pending = null, a !== null) {
    a = a.next;
    do
      t.status = "rejected", t.reason = l, Ng(t), t = t.next;
    while (t !== a);
  }
  e.action = null;
}
function Ng(e) {
  e = e.listeners;
  for (var t = 0; t < e.length; t++) (0, e[t])();
}
function Sg(e, t) {
  return t;
}
function sf(e, t) {
  if (P) {
    var l = pe.formState;
    if (l !== null) {
      e: {
        var a = J;
        if (P) {
          if (xe) {
            t: {
              for (var s = xe, i = kt; s.nodeType !== 8; ) {
                if (!i) {
                  s = null;
                  break t;
                }
                if (s = At(
                  s.nextSibling
                ), s === null) {
                  s = null;
                  break t;
                }
              }
              i = s.data, s = i === "F!" || i === "F" ? s : null;
            }
            if (s) {
              xe = At(
                s.nextSibling
              ), a = s.data === "F!";
              break e;
            }
          }
          Vl(a);
        }
        a = !1;
      }
      a && (t = l[0]);
    }
  }
  return l = Pe(), l.memoizedState = l.baseState = t, a = {
    pending: null,
    lanes: 0,
    dispatch: null,
    lastRenderedReducer: Sg,
    lastRenderedState: t
  }, l.queue = a, l = Hg.bind(
    null,
    J,
    a
  ), a.dispatch = l, a = nr(!1), i = Yo.bind(
    null,
    J,
    !1,
    a.queue
  ), a = Pe(), s = {
    state: t,
    dispatch: null,
    action: e,
    pending: null
  }, a.queue = s, l = Dx.bind(
    null,
    J,
    s,
    i,
    l
  ), s.dispatch = l, a.memoizedState = e, [t, l, !1];
}
function cf(e) {
  var t = ke();
  return wg(t, me, e);
}
function wg(e, t, l) {
  if (t = Ro(
    e,
    t,
    Sg
  )[0], e = yi(hl)[0], typeof t == "object" && t !== null && typeof t.then == "function")
    try {
      var a = Ms(t);
    } catch (c) {
      throw c === xn ? wc : c;
    }
  else a = t;
  t = ke();
  var s = t.queue, i = s.dispatch;
  return l !== t.memoizedState && (J.flags |= 2048, nn(
    9,
    { destroy: void 0 },
    kx.bind(null, s, l),
    null
  )), [a, i, e];
}
function kx(e, t) {
  e.action = t;
}
function uf(e) {
  var t = ke(), l = me;
  if (l !== null)
    return wg(t, l, e);
  ke(), t = t.memoizedState, l = ke();
  var a = l.queue.dispatch;
  return l.memoizedState = e, [t, a, !1];
}
function nn(e, t, l, a) {
  return e = { tag: e, create: l, deps: a, inst: t, next: null }, t = J.updateQueue, t === null && (t = Cc(), J.updateQueue = t), l = t.lastEffect, l === null ? t.lastEffect = e.next = e : (a = l.next, l.next = e, e.next = a, t.lastEffect = e), e;
}
function Cg() {
  return ke().memoizedState;
}
function vi(e, t, l, a) {
  var s = Pe();
  J.flags |= e, s.memoizedState = nn(
    1 | t,
    { destroy: void 0 },
    l,
    a === void 0 ? null : a
  );
}
function Ec(e, t, l, a) {
  var s = ke();
  a = a === void 0 ? null : a;
  var i = s.memoizedState.inst;
  me !== null && a !== null && ko(a, me.memoizedState.deps) ? s.memoizedState = nn(t, i, l, a) : (J.flags |= e, s.memoizedState = nn(
    1 | t,
    i,
    l,
    a
  ));
}
function rf(e, t) {
  vi(8390656, 8, e, t);
}
function Uo(e, t) {
  Ec(2048, 8, e, t);
}
function Ax(e) {
  J.flags |= 4;
  var t = J.updateQueue;
  if (t === null)
    t = Cc(), J.updateQueue = t, t.events = [e];
  else {
    var l = t.events;
    l === null ? t.events = [e] : l.push(e);
  }
}
function Tg(e) {
  var t = ke().memoizedState;
  return Ax({ ref: t, nextImpl: e }), function() {
    if (ie & 2) throw Error(B(440));
    return t.impl.apply(void 0, arguments);
  };
}
function Eg(e, t) {
  return Ec(4, 2, e, t);
}
function Dg(e, t) {
  return Ec(4, 4, e, t);
}
function kg(e, t) {
  if (typeof t == "function") {
    e = e();
    var l = t(e);
    return function() {
      typeof l == "function" ? l() : t(null);
    };
  }
  if (t != null)
    return e = e(), t.current = e, function() {
      t.current = null;
    };
}
function Ag(e, t, l) {
  l = l != null ? l.concat([e]) : null, Ec(4, 4, kg.bind(null, t, e), l);
}
function Lo() {
}
function Og(e, t) {
  var l = ke();
  t = t === void 0 ? null : t;
  var a = l.memoizedState;
  return t !== null && ko(t, a[1]) ? a[0] : (l.memoizedState = [e, t], e);
}
function zg(e, t) {
  var l = ke();
  t = t === void 0 ? null : t;
  var a = l.memoizedState;
  if (t !== null && ko(t, a[1]))
    return a[0];
  if (a = e(), ya) {
    El(!0);
    try {
      e();
    } finally {
      El(!1);
    }
  }
  return l.memoizedState = [a, t], a;
}
function Bo(e, t, l) {
  return l === void 0 || fl & 1073741824 && !(le & 261930) ? e.memoizedState = t : (e.memoizedState = l, e = wp(), J.lanes |= e, Zl |= e, l);
}
function Mg(e, t, l, a) {
  return jt(l, t) ? l : Xl.current !== null ? (e = Bo(e, l, a), jt(e, t) || (ze = !0), e) : !(fl & 106) || fl & 1073741824 && !(le & 261930) ? (ze = !0, e.memoizedState = l) : (e = wp(), J.lanes |= e, Zl |= e, t);
}
function _g(e, t, l, a, s) {
  var i = ce.p;
  ce.p = i !== 0 && 8 > i ? i : 8;
  var c = X.T, u = {};
  u.types = c !== null ? c.types : null, X.T = u, Yo(e, !1, t, l);
  try {
    var r = s(), d = X.S;
    if (d !== null && d(u, r), r !== null && typeof r == "object" && typeof r.then == "function") {
      var m = Cx(
        r,
        a
      );
      es(
        e,
        t,
        m,
        xt(e)
      );
    } else
      es(
        e,
        t,
        a,
        xt(e)
      );
  } catch (f) {
    es(
      e,
      t,
      { then: function() {
      }, status: "rejected", reason: f },
      xt()
    );
  } finally {
    ce.p = i, c !== null && u.types !== null && (c.types = u.types), X.T = c;
  }
}
function Ox() {
}
function ir(e, t, l, a) {
  if (e.tag !== 5) throw Error(B(476));
  var s = Rg(e).queue;
  _g(
    e,
    s,
    t,
    ca,
    l === null ? Ox : function() {
      return Ug(e), l(a);
    }
  );
}
function Rg(e) {
  var t = e.memoizedState;
  if (t !== null) return t;
  t = {
    memoizedState: ca,
    baseState: ca,
    baseQueue: null,
    queue: {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: hl,
      lastRenderedState: ca
    },
    next: null
  };
  var l = {};
  return t.next = {
    memoizedState: l,
    baseState: l,
    baseQueue: null,
    queue: {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: hl,
      lastRenderedState: l
    },
    next: null
  }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
}
function Ug(e) {
  var t = Rg(e);
  t.next === null && (t = e.alternate.memoizedState), es(
    e,
    t.next.queue,
    {},
    xt()
  );
}
function Ho() {
  return Ke(fn);
}
function Lg() {
  return ke().memoizedState;
}
function Bg() {
  return ke().memoizedState;
}
function zx(e) {
  for (var t = e.return; t !== null; ) {
    switch (t.tag) {
      case 24:
      case 3:
        var l = xt();
        e = Ul(l);
        var a = Ll(t, e, l);
        a !== null && (ut(a, t, l), In(a, t, l)), t = { cache: So() }, e.payload = t;
        return;
    }
    t = t.return;
  }
}
function Mx(e, t, l) {
  var a = xt();
  l = {
    lane: a,
    revertLane: 0,
    gesture: null,
    action: l,
    hasEagerState: !1,
    eagerState: null,
    next: null
  }, Dc(e) ? Yg(t, l) : (l = jo(e, t, l, a), l !== null && (ut(l, e, a), qg(l, t, a)));
}
function Hg(e, t, l) {
  var a = xt();
  es(e, t, l, a);
}
function es(e, t, l, a) {
  var s = {
    lane: a,
    revertLane: 0,
    gesture: null,
    action: l,
    hasEagerState: !1,
    eagerState: null,
    next: null
  };
  if (Dc(e)) Yg(t, s);
  else {
    var i = e.alternate;
    if (e.lanes === 0 && (i === null || i.lanes === 0) && (i = t.lastRenderedReducer, i !== null))
      try {
        var c = t.lastRenderedState, u = i(c, l);
        if (s.hasEagerState = !0, s.eagerState = u, jt(u, c))
          return Nc(e, t, s, 0), pe === null && bc(), !1;
      } catch {
      } finally {
      }
    if (l = jo(e, t, s, a), l !== null)
      return ut(l, e, a), qg(l, t, a), !0;
  }
  return !1;
}
function Yo(e, t, l, a) {
  if (a = {
    lane: 2,
    revertLane: Io(),
    gesture: null,
    action: a,
    hasEagerState: !1,
    eagerState: null,
    next: null
  }, Dc(e)) {
    if (t) throw Error(B(479));
  } else
    t = jo(
      e,
      l,
      a,
      2
    ), t !== null && ut(t, e, 2);
}
function Dc(e) {
  var t = e.alternate;
  return e === J || t !== null && t === J;
}
function Yg(e, t) {
  Fa = Xi = !0;
  var l = e.pending;
  l === null ? t.next = t : (t.next = l.next, l.next = t), e.pending = t;
}
function qg(e, t, l) {
  if (l & 4194048) {
    var a = t.lanes;
    a &= e.pendingLanes, l |= a, t.lanes = l, Cm(e, l);
  }
}
var Zi = {
  readContext: Ke,
  use: Tc,
  useCallback: Ee,
  useContext: Ee,
  useEffect: Ee,
  useImperativeHandle: Ee,
  useLayoutEffect: Ee,
  useInsertionEffect: Ee,
  useMemo: Ee,
  useReducer: Ee,
  useRef: Ee,
  useState: Ee,
  useDebugValue: Ee,
  useDeferredValue: Ee,
  useTransition: Ee,
  useSyncExternalStore: Ee,
  useId: Ee,
  useHostTransitionStatus: Ee,
  useFormState: Ee,
  useActionState: Ee,
  useOptimistic: Ee,
  useMemoCache: Ee,
  useCacheRefresh: Ee,
  useEffectEvent: Ee
}, Gg = {
  readContext: Ke,
  use: Tc,
  useCallback: function(e, t) {
    return Pe().memoizedState = [
      e,
      t === void 0 ? null : t
    ], e;
  },
  useContext: Ke,
  useEffect: rf,
  useImperativeHandle: function(e, t, l) {
    l = l != null ? l.concat([e]) : null, vi(
      4194308,
      4,
      kg.bind(null, t, e),
      l
    );
  },
  useLayoutEffect: function(e, t) {
    return vi(4194308, 4, e, t);
  },
  useInsertionEffect: function(e, t) {
    vi(4, 2, e, t);
  },
  useMemo: function(e, t) {
    var l = Pe();
    t = t === void 0 ? null : t;
    var a = e();
    if (ya) {
      El(!0);
      try {
        e();
      } finally {
        El(!1);
      }
    }
    return l.memoizedState = [a, t], a;
  },
  useReducer: function(e, t, l) {
    var a = Pe();
    if (l !== void 0) {
      var s = l(t);
      if (ya) {
        El(!0);
        try {
          l(t);
        } finally {
          El(!1);
        }
      }
    } else s = t;
    return a.memoizedState = a.baseState = s, e = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: e,
      lastRenderedState: s
    }, a.queue = e, e = e.dispatch = Mx.bind(
      null,
      J,
      e
    ), [a.memoizedState, e];
  },
  useRef: function(e) {
    var t = Pe();
    return e = { current: e }, t.memoizedState = e;
  },
  useState: function(e) {
    e = nr(e);
    var t = e.queue, l = Hg.bind(null, J, t);
    return t.dispatch = l, [e.memoizedState, l];
  },
  useDebugValue: Lo,
  useDeferredValue: function(e, t) {
    var l = Pe();
    return Bo(l, e, t);
  },
  useTransition: function() {
    var e = nr(!1);
    return e = _g.bind(
      null,
      J,
      e.queue,
      !0,
      !1
    ), Pe().memoizedState = e, [!1, e];
  },
  useSyncExternalStore: function(e, t, l) {
    var a = J, s = Pe();
    if (P) {
      if (l === void 0)
        throw Error(B(407));
      l = l();
    } else {
      if (l = t(), pe === null)
        throw Error(B(349));
      le & 127 || gg(a, t, l);
    }
    s.memoizedState = l;
    var i = { value: l, getSnapshot: t };
    return s.queue = i, rf(yg.bind(null, a, i, e), [
      e
    ]), a.flags |= 2048, nn(
      9,
      { destroy: void 0 },
      pg.bind(
        null,
        a,
        i,
        l,
        t
      ),
      null
    ), l;
  },
  useId: function() {
    var e = Pe(), t = pe.identifierPrefix;
    if (P) {
      var l = Ft, a = Jt;
      l = (a & ~(1 << 32 - vt(a) - 1)).toString(32) + l, t = "_" + t + "R_" + l, l = Qi++, 0 < l && (t += "H" + l.toString(32)), t += "_";
    } else
      l = Tx++, t = "_" + t + "r_" + l.toString(32) + "_";
    return e.memoizedState = t;
  },
  useHostTransitionStatus: Ho,
  useFormState: sf,
  useActionState: sf,
  useOptimistic: function(e) {
    var t = Pe();
    t.memoizedState = t.baseState = e;
    var l = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: null,
      lastRenderedState: null
    };
    return t.queue = l, t = Yo.bind(
      null,
      J,
      !0,
      l
    ), l.dispatch = t, [e, t];
  },
  useMemoCache: _o,
  useCacheRefresh: function() {
    return Pe().memoizedState = zx.bind(
      null,
      J
    );
  },
  useEffectEvent: function(e) {
    var t = Pe(), l = { impl: e };
    return t.memoizedState = l, function() {
      if (ie & 2)
        throw Error(B(440));
      return l.impl.apply(void 0, arguments);
    };
  }
}, $g = {
  readContext: Ke,
  use: Tc,
  useCallback: Og,
  useContext: Ke,
  useEffect: Uo,
  useImperativeHandle: Ag,
  useInsertionEffect: Eg,
  useLayoutEffect: Dg,
  useMemo: zg,
  useReducer: yi,
  useRef: Cg,
  useState: function() {
    return yi(hl);
  },
  useDebugValue: Lo,
  useDeferredValue: function(e, t) {
    var l = ke();
    return Mg(
      l,
      me.memoizedState,
      e,
      t
    );
  },
  useTransition: function() {
    var e = yi(hl)[0], t = ke().memoizedState;
    return [
      typeof e == "boolean" ? e : Ms(e),
      t
    ];
  },
  useSyncExternalStore: mg,
  useId: Lg,
  useHostTransitionStatus: Ho,
  useFormState: cf,
  useActionState: cf,
  useOptimistic: function(e, t) {
    var l = ke();
    return jg(l, me, e, t);
  },
  useMemoCache: _o,
  useCacheRefresh: Bg,
  useEffectEvent: Tg
}, _x = {
  readContext: Ke,
  use: Tc,
  useCallback: Og,
  useContext: Ke,
  useEffect: Uo,
  useImperativeHandle: Ag,
  useInsertionEffect: Eg,
  useLayoutEffect: Dg,
  useMemo: zg,
  useReducer: au,
  useRef: Cg,
  useState: function() {
    return au(hl);
  },
  useDebugValue: Lo,
  useDeferredValue: function(e, t) {
    var l = ke();
    return me === null ? Bo(l, e, t) : Mg(
      l,
      me.memoizedState,
      e,
      t
    );
  },
  useTransition: function() {
    var e = au(hl)[0], t = ke().memoizedState;
    return [
      typeof e == "boolean" ? e : Ms(e),
      t
    ];
  },
  useSyncExternalStore: mg,
  useId: Lg,
  useHostTransitionStatus: Ho,
  useFormState: uf,
  useActionState: uf,
  useOptimistic: function(e, t) {
    var l = ke();
    return me !== null ? jg(l, me, e, t) : (l.baseState = e, [e, l.queue.dispatch]);
  },
  useMemoCache: _o,
  useCacheRefresh: Bg,
  useEffectEvent: Tg
};
function nu(e, t, l, a) {
  t = e.memoizedState, l = l(a, t), l = l == null ? t : ye({}, t, l), e.memoizedState = l, e.lanes === 0 && (e.updateQueue.baseState = l);
}
var cr = {
  enqueueSetState: function(e, t, l) {
    e = e._reactInternals;
    var a = xt(), s = Ul(a);
    s.payload = t, l != null && (s.callback = l), t = Ll(e, s, a), t !== null && (ut(t, e, a), In(t, e, a));
  },
  enqueueReplaceState: function(e, t, l) {
    e = e._reactInternals;
    var a = xt(), s = Ul(a);
    s.tag = 1, s.payload = t, l != null && (s.callback = l), t = Ll(e, s, a), t !== null && (ut(t, e, a), In(t, e, a));
  },
  enqueueForceUpdate: function(e, t) {
    e = e._reactInternals;
    var l = xt(), a = Ul(l);
    a.tag = 2, t != null && (a.callback = t), t = Ll(e, a, l), t !== null && (ut(t, e, l), In(t, e, l));
  }
};
function of(e, t, l, a, s, i, c) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(a, i, c) : t.prototype && t.prototype.isPureReactComponent ? !os(l, a) || !os(s, i) : !0;
}
function df(e, t, l, a) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(l, a), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(l, a), t.state !== e && cr.enqueueReplaceState(t, t.state, null);
}
function va(e, t) {
  var l = t;
  if ("ref" in t) {
    l = {};
    for (var a in t)
      a !== "ref" && (l[a] = t[a]);
  }
  if (e = e.defaultProps) {
    l === t && (l = ye({}, l));
    for (var s in e)
      l[s] === void 0 && (l[s] = e[s]);
  }
  return l;
}
function Kg(e) {
  Bi(e);
}
function Vg(e) {
  console.error(e);
}
function Xg(e) {
  Bi(e);
}
function Ji(e, t) {
  try {
    var l = e.onUncaughtError;
    l(t.value, { componentStack: t.stack });
  } catch (a) {
    setTimeout(function() {
      throw a;
    });
  }
}
function ff(e, t, l) {
  try {
    var a = e.onCaughtError;
    a(l.value, {
      componentStack: l.stack,
      errorBoundary: t.tag === 1 ? t.stateNode : null
    });
  } catch (s) {
    setTimeout(function() {
      throw s;
    });
  }
}
function ur(e, t, l) {
  return l = Ul(l), l.tag = 3, l.payload = { element: null }, l.callback = function() {
    Ji(e, t);
  }, l;
}
function Qg(e) {
  return e = Ul(e), e.tag = 3, e;
}
function Zg(e, t, l, a) {
  var s = l.type.getDerivedStateFromError;
  if (typeof s == "function") {
    var i = a.value;
    e.payload = function() {
      return s(i);
    }, e.callback = function() {
      ff(t, l, a);
    };
  }
  var c = l.stateNode;
  c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
    ff(t, l, a), typeof s != "function" && (Yl === null ? Yl = /* @__PURE__ */ new Set([this]) : Yl.add(this));
    var u = a.stack;
    this.componentDidCatch(a.value, {
      componentStack: u !== null ? u : ""
    });
  });
}
function Rx(e, t, l, a, s) {
  if (l.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
    if (t = l.alternate, t !== null && ha(
      t,
      l,
      s,
      !0
    ), l = Ze.current, l !== null) {
      switch (l.tag) {
        case 31:
        case 13:
        case 19:
          return Je === null ? ac() : l.alternate === null && De === 0 && (De = 3), l.flags &= -257, l.flags |= 65536, l.lanes = s, a === $i ? l.flags |= 16384 : (t = l.updateQueue, t === null ? l.updateQueue = /* @__PURE__ */ new Set([a]) : t.add(a), du(e, a, s)), !1;
        case 22:
          return l.flags |= 65536, a === $i ? l.flags |= 16384 : (t = l.updateQueue, t === null ? (t = {
            transitions: null,
            markerInstances: null,
            retryQueue: /* @__PURE__ */ new Set([a])
          }, l.updateQueue = t) : (l = t.retryQueue, l === null ? t.retryQueue = /* @__PURE__ */ new Set([a]) : l.add(a)), du(e, a, s)), !1;
      }
      throw Error(B(435, l.tag));
    }
    return du(e, a, s), ac(), !1;
  }
  if (P)
    return t = Ze.current, t !== null ? (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = s, a !== Fu && (e = Error(B(422), { cause: a }), fs(Dt(e, l)))) : (a !== Fu && (t = Error(B(423), {
      cause: a
    }), fs(
      Dt(t, l)
    )), e = e.current.alternate, e.flags |= 65536, s &= -s, e.lanes |= s, a = Dt(a, l), s = ur(
      e.stateNode,
      a,
      s
    ), lu(e, s), De !== 4 && (De = 2)), !1;
  var i = Error(B(520), { cause: a });
  if (i = Dt(i, l), ns === null ? ns = [i] : ns.push(i), De !== 4 && (De = 2), t === null) return !0;
  a = Dt(a, l), l = t;
  do {
    switch (l.tag) {
      case 3:
        return l.flags |= 65536, e = s & -s, l.lanes |= e, e = ur(l.stateNode, a, e), lu(l, e), !1;
      case 1:
        if (t = l.type, i = l.stateNode, !(l.flags & 128) && (typeof t.getDerivedStateFromError == "function" || i !== null && typeof i.componentDidCatch == "function" && (Yl === null || !Yl.has(i))))
          return l.flags |= 65536, s &= -s, l.lanes |= s, s = Qg(s), Zg(
            s,
            e,
            l,
            a
          ), lu(l, s), !1;
        break;
      case 22:
        if (l.memoizedState !== null)
          return l.flags |= 65536, !1;
    }
    l = l.return;
  } while (l !== null);
  return !1;
}
var qo = Error(B(461)), ze = !1;
function Me(e, t, l, a) {
  t.child = e === null ? ug(t, null, l, a) : pa(
    t,
    e.child,
    l,
    a
  );
}
function hf(e, t, l, a, s) {
  l = l.render;
  var i = t.ref;
  if ("ref" in a) {
    var c = {};
    for (var u in a)
      u !== "ref" && (c[u] = a[u]);
  } else c = a;
  return ma(t), a = Ao(
    e,
    t,
    l,
    c,
    i,
    s
  ), u = Oo(), e !== null && !ze ? (zo(e, t, s), ml(e, t, s)) : (P && u && Sc(t), t.flags |= 1, Me(e, t, a, s), t.child);
}
function mf(e, t, l, a, s) {
  if (e === null) {
    var i = l.type;
    return typeof i == "function" && !bo(i) && i.defaultProps === void 0 && l.compare === null ? (t.tag = 15, t.type = i, Jg(
      e,
      t,
      i,
      a,
      s
    )) : (e = mi(
      l.type,
      null,
      a,
      t,
      t.mode,
      s
    ), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (i = e.child, !$o(e, s)) {
    var c = i.memoizedProps;
    if (l = l.compare, l = l !== null ? l : os, l(c, a) && e.ref === t.ref)
      return ml(e, t, s);
  }
  return t.flags |= 1, e = ul(i, a), e.ref = t.ref, e.return = t, t.child = e;
}
function Jg(e, t, l, a, s) {
  if (e !== null) {
    var i = e.memoizedProps;
    if (os(i, a) && e.ref === t.ref)
      if (ze = !1, t.pendingProps = a = i, $o(e, s))
        e.flags & 131072 && (ze = !0);
      else
        return t.lanes = e.lanes, ml(e, t, s);
  }
  return rr(
    e,
    t,
    l,
    a,
    s
  );
}
function Fg(e, t, l, a) {
  var s = a.children, i = e !== null ? e.memoizedState : null;
  if (e === null && t.stateNode === null && (t.stateNode = {
    _visibility: 1,
    _pendingMarkers: null,
    _retryCache: null,
    _transitions: null
  }), a.mode === "hidden") {
    if (t.flags & 128) {
      if (i = i !== null ? i.baseLanes | l : l, e !== null) {
        for (a = t.child = e.child, s = 0; a !== null; )
          s = s | a.lanes | a.childLanes, a = a.sibling;
        a = s & ~i;
      } else a = 0, t.child = null;
      return gf(
        e,
        t,
        i,
        l,
        a
      );
    }
    if (l & 536870912)
      t.memoizedState = { baseLanes: 0, cachePool: null }, e !== null && pi(
        t,
        i !== null ? i.cachePool : null
      ), i !== null ? lf(t, i) : lr(), dg(t);
    else
      return a = t.lanes = 536870912, gf(
        e,
        t,
        i !== null ? i.baseLanes | l : l,
        l,
        a
      );
  } else
    i !== null ? (pi(t, i.cachePool), lf(t, i), Hl(), t.memoizedState = null) : (e !== null && pi(t, null), lr(), Hl());
  return Me(e, t, s, l), t.child;
}
function ts(e, t) {
  return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
    _visibility: 1,
    _pendingMarkers: null,
    _retryCache: null,
    _transitions: null
  }), t.sibling;
}
function gf(e, t, l, a, s) {
  var i = wo();
  return i = i === null ? null : { parent: Oe._currentValue, pool: i }, t.memoizedState = {
    baseLanes: l,
    cachePool: i
  }, e !== null && pi(t, null), lr(), dg(t), e !== null && ha(e, t, a, !0), t.childLanes = s, null;
}
function xi(e, t) {
  return t = kc(
    { mode: t.mode, children: t.children },
    e.mode
  ), t.ref = e.ref, e.child = t, t.return = e, t;
}
function pf(e, t, l) {
  return pa(t, e.child, null, l), e = xi(t, t.pendingProps), e.flags |= 2, ht(t), t.memoizedState = null, e;
}
function Ux(e, t, l) {
  var a = t.pendingProps, s = (t.flags & 128) !== 0;
  if (t.flags &= -129, e === null) {
    if (P) {
      if (a.mode === "hidden")
        return e = xi(t, a), t.lanes = 536870912, e.memoizedState = { baseLanes: 0, cachePool: null }, ts(null, e);
      if (ar(t), (e = xe) ? (e = Jp(
        e,
        kt
      ), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
        dehydrated: e,
        treeContext: Kl !== null ? { id: Jt, overflow: Ft } : null,
        retryLane: 536870912,
        hydrationErrors: null
      }, l = tg(e), l.return = t, t.child = l, Ye = t, xe = null)) : e = null, e === null) throw Vl(t);
      return t.lanes = 536870912, null;
    }
    return xi(t, a);
  }
  var i = e.memoizedState;
  if (i !== null) {
    var c = i.dehydrated;
    if (ar(t), s)
      if (t.flags & 256)
        t.flags &= -257, t = pf(
          e,
          t,
          l
        );
      else if (t.memoizedState !== null)
        t.child = e.child, t.flags |= 128, t = null;
      else throw Error(B(558));
    else if (ze || ha(e, t, l, !1), s = (l & e.childLanes) !== 0, ze || s) {
      if (Xl.current === null) {
        if (a = pe, a !== null && (c = Tm(a, l), c !== 0 && c !== i.retryLane))
          throw i.retryLane = c, Sa(e, c), ut(a, e, c), qo;
        ac();
      }
      t = pf(
        e,
        t,
        l
      );
    } else
      e = i.treeContext, xe = At(c.nextSibling), Ye = t, P = !0, Rl = null, kt = !1, e !== null && ag(t, e), t = xi(t, a), t.flags |= 134221824;
    return t;
  }
  return e = ul(e.child, {
    mode: a.mode,
    children: a.children
  }), e.ref = t.ref, t.child = e, e.return = t, e;
}
function Aa(e, t) {
  var l = t.ref;
  if (l === null)
    e !== null && e.ref !== null && (t.flags |= 4194816);
  else {
    if (typeof l != "function" && typeof l != "object")
      throw Error(B(284));
    (e === null || e.ref !== l) && (t.flags |= 4194816);
  }
}
function rr(e, t, l, a, s) {
  return ma(t), l = Ao(
    e,
    t,
    l,
    a,
    void 0,
    s
  ), a = Oo(), e !== null && !ze ? (zo(e, t, s), ml(e, t, s)) : (P && a && Sc(t), t.flags |= 1, Me(e, t, l, s), t.child);
}
function yf(e, t, l, a, s, i) {
  return ma(t), t.updateQueue = null, l = hg(
    t,
    a,
    l,
    s
  ), fg(e), a = Oo(), e !== null && !ze ? (zo(e, t, i), ml(e, t, i)) : (P && a && Sc(t), t.flags |= 1, Me(e, t, l, i), t.child);
}
function vf(e, t, l, a, s) {
  if (ma(t), t.stateNode === null) {
    var i = qa, c = l.contextType;
    typeof c == "object" && c !== null && (i = Ke(c)), i = new l(a, i), t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, i.updater = cr, t.stateNode = i, i._reactInternals = t, i = t.stateNode, i.props = a, i.state = t.memoizedState, i.refs = {}, To(t), c = l.contextType, i.context = typeof c == "object" && c !== null ? Ke(c) : qa, i.state = t.memoizedState, c = l.getDerivedStateFromProps, typeof c == "function" && (nu(
      t,
      l,
      c,
      a
    ), i.state = t.memoizedState), typeof l.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (c = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), c !== i.state && cr.enqueueReplaceState(i, i.state, null), Pn(t, a, i, s), Wn(), i.state = t.memoizedState), typeof i.componentDidMount == "function" && (t.flags |= 4194308), a = !0;
  } else if (e === null) {
    i = t.stateNode;
    var u = t.memoizedProps, r = va(l, u);
    i.props = r;
    var d = i.context, m = l.contextType;
    c = qa, typeof m == "object" && m !== null && (c = Ke(m));
    var f = l.getDerivedStateFromProps;
    m = typeof f == "function" || typeof i.getSnapshotBeforeUpdate == "function", u = t.pendingProps !== u, m || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (u || d !== c) && df(
      t,
      i,
      a,
      c
    ), Cl = !1;
    var o = t.memoizedState;
    i.state = o, Pn(t, a, i, s), Wn(), d = t.memoizedState, u || o !== d || Cl ? (typeof f == "function" && (nu(
      t,
      l,
      f,
      a
    ), d = t.memoizedState), (r = Cl || of(
      t,
      l,
      r,
      a,
      o,
      d,
      c
    )) ? (m || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = a, t.memoizedState = d), i.props = a, i.state = d, i.context = c, a = r) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), a = !1);
  } else {
    i = t.stateNode, er(e, t), c = t.memoizedProps, m = va(l, c), i.props = m, f = t.pendingProps, o = i.context, d = l.contextType, r = qa, typeof d == "object" && d !== null && (r = Ke(d)), u = l.getDerivedStateFromProps, (d = typeof u == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (c !== f || o !== r) && df(
      t,
      i,
      a,
      r
    ), Cl = !1, o = t.memoizedState, i.state = o, Pn(t, a, i, s), Wn();
    var h = t.memoizedState;
    c !== f || o !== h || Cl || e !== null && e.dependencies !== null && Gi(e.dependencies) ? (typeof u == "function" && (nu(
      t,
      l,
      u,
      a
    ), h = t.memoizedState), (m = Cl || of(
      t,
      l,
      m,
      a,
      o,
      h,
      r
    ) || e !== null && e.dependencies !== null && Gi(e.dependencies)) ? (d || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(a, h, r), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(
      a,
      h,
      r
    )), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || c === e.memoizedProps && o === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && o === e.memoizedState || (t.flags |= 1024), t.memoizedProps = a, t.memoizedState = h), i.props = a, i.state = h, i.context = r, a = m) : (typeof i.componentDidUpdate != "function" || c === e.memoizedProps && o === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && o === e.memoizedState || (t.flags |= 1024), a = !1);
  }
  return i = a, Aa(e, t), a = (t.flags & 128) !== 0, i || a ? (i = t.stateNode, l = a && typeof l.getDerivedStateFromError != "function" ? null : i.render(), t.flags |= 1, e !== null && a ? (t.child = pa(
    t,
    e.child,
    null,
    s
  ), t.child = pa(
    t,
    null,
    l,
    s
  )) : Me(e, t, l, s), t.memoizedState = i.state, e = t.child) : e = ml(
    e,
    t,
    s
  ), e;
}
function xf(e, t, l, a) {
  return fa(), t.flags |= 256, Me(e, t, l, a), t.child;
}
var or = {
  dehydrated: null,
  treeContext: null,
  retryLane: 0,
  hydrationErrors: null
};
function dr(e) {
  return { baseLanes: e, cachePool: sg() };
}
function fr(e, t, l) {
  return e = e !== null ? e.childLanes & ~l : 0, t && (e |= gt), e;
}
function Ig(e, t, l) {
  var a = t.pendingProps, s = !1, i = (t.flags & 128) !== 0, c;
  if ((c = i) || (c = e !== null && e.memoizedState === null ? !1 : (Xe.current & 2) !== 0), c && (s = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
    if (P) {
      if (s ? Bl(t) : Hl(), (e = xe) ? (e = Jp(
        e,
        kt
      ), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
        dehydrated: e,
        treeContext: Kl !== null ? { id: Jt, overflow: Ft } : null,
        retryLane: 536870912,
        hydrationErrors: null
      }, l = tg(e), l.return = t, t.child = l, Ye = t, xe = null)) : e = null, e === null) throw Vl(t);
      return td(e) ? t.lanes = 32 : t.lanes = 536870912, null;
    }
    return i = a.children, a = a.fallback, s ? (Hl(), s = t.mode, i = kc(
      { mode: "hidden", children: i },
      s
    ), a = ua(
      a,
      s,
      l,
      null
    ), i.return = t, a.return = t, i.sibling = a, t.child = i, a = t.child, a.memoizedState = dr(l), a.childLanes = fr(
      e,
      c,
      l
    ), t.memoizedState = or, ts(null, a)) : (Bl(t), Go(t, i));
  }
  var u = e.memoizedState;
  if (u !== null) {
    var r = u.dehydrated;
    if (r !== null)
      return Lx(
        e,
        t,
        i,
        c,
        a,
        r,
        u,
        l
      );
  }
  return s ? (Hl(), s = a.fallback, i = t.mode, u = e.child, r = u.sibling, a = ul(u, {
    mode: "hidden",
    children: a.children
  }), a.subtreeFlags = u.subtreeFlags & 1206910976, r !== null ? s = ul(r, s) : (s = ua(
    s,
    i,
    l,
    null
  ), s.flags |= 2), s.return = t, a.return = t, a.sibling = s, t.child = a, ts(null, a), a = t.child, s = e.child.memoizedState, s === null ? s = dr(l) : (i = s.cachePool, i !== null ? (u = Oe._currentValue, i = i.parent !== u ? { parent: u, pool: u } : i) : i = sg(), s = {
    baseLanes: s.baseLanes | l,
    cachePool: i
  }), a.memoizedState = s, a.childLanes = fr(
    e,
    c,
    l
  ), t.memoizedState = or, ts(e.child, a)) : (Bl(t), l = e.child, e = l.sibling, l = ul(l, {
    mode: "visible",
    children: a.children
  }), l.return = t, l.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = l, t.memoizedState = null, l);
}
function Go(e, t) {
  return t = kc(
    { mode: "visible", children: t },
    e.mode
  ), t.return = e, e.child = t;
}
function kc(e, t) {
  return e = ct(22, e, null, t), e.lanes = 0, e;
}
function Zs(e, t, l) {
  return pa(t, e.child, null, l), e = Go(
    t,
    t.pendingProps.children
  ), e.flags |= 2, t.memoizedState = null, e;
}
function Lx(e, t, l, a, s, i, c, u) {
  if (l)
    return t.flags & 256 ? (Bl(t), t.flags &= -257, Zs(
      e,
      t,
      u
    )) : t.memoizedState !== null ? (Hl(), t.child = e.child, t.flags |= 128, null) : (Hl(), i = s.fallback, c = t.mode, s = kc(
      { mode: "visible", children: s.children },
      c
    ), i = ua(
      i,
      c,
      u,
      null
    ), i.flags |= 2, s.return = t, i.return = t, s.sibling = i, t.child = s, pa(t, e.child, null, u), s = t.child, s.memoizedState = dr(u), s.childLanes = fr(
      e,
      a,
      u
    ), t.memoizedState = or, ts(null, s));
  if (Bl(t), td(i)) {
    if (a = i.nextSibling && i.nextSibling.dataset, a) var r = a.dgst;
    return a = r, a !== "" && (s = Error(B(419)), s.stack = "", s.digest = a, fs({ value: s, source: null, stack: null })), Zs(
      e,
      t,
      u
    );
  }
  if (ze || ha(e, t, u, !1), a = (u & e.childLanes) !== 0, ze || a) {
    if (Xl.current !== null)
      return Zs(
        e,
        t,
        u
      );
    if (a = pe, a !== null && (s = Tm(
      a,
      u
    ), s !== 0 && s !== c.retryLane))
      throw c.retryLane = s, Sa(e, s), ut(a, e, s), qo;
    return Lr(i) || ac(), Zs(
      e,
      t,
      u
    );
  }
  return Lr(i) ? (t.flags |= 192, t.child = e.child, null) : (e = c.treeContext, xe = At(i.nextSibling), Ye = t, P = !0, Rl = null, kt = !1, e !== null && ag(t, e), t = Go(
    t,
    s.children
  ), t.flags |= 134221824, t);
}
function jf(e, t, l) {
  e.lanes |= t;
  var a = e.alternate;
  a !== null && (a.lanes |= t), gi(e.return, t, l);
}
function bf(e) {
  for (var t = null; e !== null; ) {
    var l = e.alternate;
    l !== null && Vi(l) === null && (t = e), e = e.sibling;
  }
  return t;
}
function Js(e, t, l, a, s, i) {
  var c = e.memoizedState;
  c === null ? e.memoizedState = {
    isBackwards: t,
    rendering: null,
    renderingStartTime: 0,
    last: a,
    tail: l,
    tailMode: s,
    treeForkCount: i
  } : (c.isBackwards = t, c.rendering = null, c.renderingStartTime = 0, c.last = a, c.tail = l, c.tailMode = s, c.treeForkCount = i);
}
function su(e) {
  var t = e.child;
  for (e.child = null; t !== null; ) {
    var l = t.sibling;
    t.sibling = e.child, e.child = t, t = l;
  }
}
function hr(e, t, l) {
  var a = t.pendingProps, s = a.revealOrder, i = a.tail;
  a = a.children;
  var c = Xe.current;
  if (t.flags & 128)
    return ms(t, c), null;
  var u = (c & 2) !== 0;
  if (u ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, ms(t, c), s === "backwards" && e !== null ? (su(e), Me(e, t, a, l), su(e)) : Me(e, t, a, l), a = P ? ds : 0, !u && e !== null && e.flags & 128)
    e: for (e = t.child; e !== null; ) {
      if (e.tag === 13)
        e.memoizedState !== null && jf(e, l, t);
      else if (e.tag === 19)
        jf(e, l, t);
      else if (e.child !== null) {
        e.child.return = e, e = e.child;
        continue;
      }
      if (e === t) break e;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t)
          break e;
        e = e.return;
      }
      e.sibling.return = e.return, e = e.sibling;
    }
  switch (s) {
    case "backwards":
      l = bf(t.child), l === null ? (s = t.child, t.child = null) : (s = l.sibling, l.sibling = null, su(t)), Js(
        t,
        !0,
        s,
        null,
        i,
        a
      );
      break;
    case "unstable_legacy-backwards":
      for (l = null, s = t.child, t.child = null; s !== null; ) {
        if (e = s.alternate, e !== null && Vi(e) === null) {
          t.child = s;
          break;
        }
        e = s.sibling, s.sibling = l, l = s, s = e;
      }
      Js(
        t,
        !0,
        l,
        null,
        i,
        a
      );
      break;
    case "together":
      Js(
        t,
        !1,
        null,
        null,
        void 0,
        a
      );
      break;
    case "independent":
      t.memoizedState = null;
      break;
    default:
      l = bf(t.child), l === null ? (s = t.child, t.child = null) : (s = l.sibling, l.sibling = null), Js(
        t,
        !1,
        s,
        l,
        i,
        a
      );
  }
  return t.child;
}
function Nf(e, t, l) {
  var a = t.pendingProps;
  return kl(t, t.type, a.value), Me(e, t, a.children, l), t.child;
}
function ml(e, t, l) {
  if (e !== null && (t.dependencies = e.dependencies), Zl |= t.lanes, !(l & t.childLanes))
    if (e !== null) {
      if (ha(
        e,
        t,
        l,
        !1
      ), (l & t.childLanes) === 0)
        return null;
    } else return null;
  if (e !== null && t.child !== e.child)
    throw Error(B(153));
  if (t.child !== null) {
    for (e = t.child, l = ul(e, e.pendingProps), t.child = l, l.return = t; e.sibling !== null; )
      e = e.sibling, l = l.sibling = ul(e, e.pendingProps), l.return = t;
    l.sibling = null;
  }
  return t.child;
}
function $o(e, t) {
  return e.lanes & t ? !0 : (e = e.dependencies, !!(e !== null && Gi(e)));
}
function Bx(e, t, l) {
  switch (t.tag) {
    case 3:
      _i(t, t.stateNode.containerInfo), kl(t, Oe, e.memoizedState.cache), fa();
      break;
    case 27:
    case 5:
      Yu(t);
      break;
    case 4:
      _i(t, t.stateNode.containerInfo);
      break;
    case 10:
      kl(
        t,
        t.type,
        t.memoizedProps.value
      );
      break;
    case 31:
      if (t.memoizedState !== null)
        return t.flags |= 128, ar(t), null;
      break;
    case 13:
      var a = t.memoizedState;
      if (a !== null) {
        if (a.dehydrated !== null)
          return Bl(t), t.flags |= 128, null;
        a = ha(
          e,
          t,
          l,
          !1
        );
        var s = t.child.childLanes;
        return a || l & s ? Ig(e, t, l) : (Bl(t), e = ml(
          e,
          t,
          l
        ), e !== null ? e.sibling : null);
      }
      Bl(t);
      break;
    case 19:
      if (t.flags & 128)
        return hr(
          e,
          t,
          l
        );
      if (s = (e.flags & 128) !== 0, a = (l & t.childLanes) !== 0, a || (ha(
        e,
        t,
        l,
        !1
      ), a = (l & t.childLanes) !== 0), s) {
        if (a)
          return hr(
            e,
            t,
            l
          );
        t.flags |= 128;
      }
      if (s = t.memoizedState, s !== null && (s.rendering = null, s.tail = null, s.lastEffect = null), ms(t, Xe.current), a) break;
      return null;
    case 22:
      return t.lanes = 0, Fg(
        e,
        t,
        l,
        t.pendingProps
      );
    case 24:
      kl(t, Oe, e.memoizedState.cache);
  }
  return ml(e, t, l);
}
function Wg(e, t, l) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps)
      ze = !0;
    else {
      if (!$o(e, l) && !(t.flags & 128))
        return ze = !1, Bx(
          e,
          t,
          l
        );
      ze = !!(e.flags & 131072);
    }
  else
    ze = !1, P && t.flags & 1048576 && lg(t, ds, t.index);
  switch (t.lanes = 0, t.tag) {
    case 16:
      e: {
        var a = t.pendingProps;
        if (e = la(t.elementType), t.type = e, typeof e == "function")
          bo(e) ? (a = va(e, a), t.tag = 1, t = vf(
            null,
            t,
            e,
            a,
            l
          )) : (t.tag = 0, t = rr(
            null,
            t,
            e,
            a,
            l
          ));
        else {
          if (e != null) {
            var s = e.$$typeof;
            if (s === co) {
              t.tag = 11, t = hf(
                null,
                t,
                e,
                a,
                l
              );
              break e;
            } else if (s === uo) {
              t.tag = 14, t = mf(
                null,
                t,
                e,
                a,
                l
              );
              break e;
            } else if (s === Qt) {
              t.tag = 10, t.type = e, t = Nf(
                null,
                t,
                l
              );
              break e;
            }
          }
          throw t = Bu(e) || e, Error(B(306, t, ""));
        }
      }
      return t;
    case 0:
      return rr(
        e,
        t,
        t.type,
        t.pendingProps,
        l
      );
    case 1:
      return a = t.type, s = va(
        a,
        t.pendingProps
      ), vf(
        e,
        t,
        a,
        s,
        l
      );
    case 3:
      e: {
        if (_i(
          t,
          t.stateNode.containerInfo
        ), e === null) throw Error(B(387));
        a = t.pendingProps;
        var i = t.memoizedState;
        s = i.element, er(e, t), Pn(t, a, null, l);
        var c = t.memoizedState;
        if (a = c.cache, kl(t, Oe, a), a !== i.cache && Wu(
          t,
          [Oe],
          l,
          !0
        ), Wn(), a = c.element, i.isDehydrated)
          if (i = {
            element: a,
            isDehydrated: !1,
            cache: c.cache
          }, t.updateQueue.baseState = i, t.memoizedState = i, t.flags & 256) {
            t = xf(
              e,
              t,
              a,
              l
            );
            break e;
          } else if (a !== s) {
            s = Dt(
              Error(B(424)),
              t
            ), fs(s), t = xf(
              e,
              t,
              a,
              l
            );
            break e;
          } else {
            switch (e = t.stateNode.containerInfo, e.nodeType) {
              case 9:
                e = e.body;
                break;
              default:
                e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
            }
            for (xe = At(e.firstChild), Ye = t, P = !0, Rl = null, kt = !0, l = ug(
              t,
              null,
              a,
              l
            ), t.child = l; l; )
              l.flags = l.flags & -3 | 134221824, l = l.sibling;
          }
        else {
          if (fa(), a === s) {
            t = ml(
              e,
              t,
              l
            );
            break e;
          }
          Me(e, t, a, l);
        }
        t = t.child;
      }
      return t;
    case 26:
      return Aa(e, t), e === null ? (l = Qf(
        t.type,
        null,
        t.pendingProps,
        null
      )) ? t.memoizedState = l : P || (t.stateNode = qp(
        t.type,
        t.pendingProps,
        _l.current,
        t
      )) : t.memoizedState = Qf(
        t.type,
        e.memoizedProps,
        t.pendingProps,
        e.memoizedState
      ), null;
    case 27:
      return Yu(t), e === null && P && (a = t.stateNode = Fp(
        t.type,
        t.pendingProps,
        _l.current
      ), Ye = t, kt = !0, s = xe, Il(t.type) ? (Br = s, xe = At(a.firstChild)) : xe = s), Me(
        e,
        t,
        t.pendingProps.children,
        l
      ), Aa(e, t), e === null && (t.flags |= 4194304), t.child;
    case 5:
      return e === null && P && ((s = a = xe) && (a = zj(
        a,
        t.type,
        t.pendingProps,
        kt
      ), a !== null ? (t.stateNode = a, Ye = t, xe = At(a.firstChild), kt = !1, s = !0) : s = !1), s || Vl(t)), Yu(t), s = t.type, i = t.pendingProps, c = e !== null ? e.memoizedProps : null, a = i.children, _r(s, i) ? a = null : c !== null && _r(s, c) && (t.flags |= 32), t.memoizedState !== null && (s = Ao(
        e,
        t,
        Ex,
        null,
        null,
        l
      ), fn._currentValue = s), Aa(e, t), Me(e, t, a, l), t.child;
    case 6:
      return e === null && P && ((e = l = xe) && (l = Mj(
        l,
        t.pendingProps,
        kt
      ), l !== null ? (t.stateNode = l, Ye = t, xe = null, e = !0) : e = !1), e || Vl(t)), null;
    case 13:
      return Ig(e, t, l);
    case 4:
      return _i(
        t,
        t.stateNode.containerInfo
      ), a = t.pendingProps, e === null ? t.child = pa(
        t,
        null,
        a,
        l
      ) : Me(e, t, a, l), t.child;
    case 11:
      return hf(
        e,
        t,
        t.type,
        t.pendingProps,
        l
      );
    case 7:
      return a = t.pendingProps, Aa(e, t), Me(e, t, a, l), t.child;
    case 8:
      return Me(
        e,
        t,
        t.pendingProps.children,
        l
      ), t.child;
    case 12:
      return Me(
        e,
        t,
        t.pendingProps.children,
        l
      ), t.child;
    case 10:
      return Nf(e, t, l);
    case 9:
      return s = t.type._context, a = t.pendingProps.children, ma(t), s = Ke(s), a = a(s), t.flags |= 1, Me(e, t, a, l), t.child;
    case 14:
      return mf(
        e,
        t,
        t.type,
        t.pendingProps,
        l
      );
    case 15:
      return Jg(
        e,
        t,
        t.type,
        t.pendingProps,
        l
      );
    case 19:
      return hr(e, t, l);
    case 31:
      return Ux(e, t, l);
    case 22:
      return Fg(
        e,
        t,
        l,
        t.pendingProps
      );
    case 24:
      return ma(t), a = Ke(Oe), e === null ? (s = wo(), s === null && (s = pe, i = So(), s.pooledCache = i, i.refCount++, i !== null && (s.pooledCacheLanes |= l), s = i), t.memoizedState = { parent: a, cache: s }, To(t), kl(t, Oe, s)) : (e.lanes & l && (er(e, t), Pn(t, null, null, l), Wn()), s = e.memoizedState, i = t.memoizedState, s.parent !== a ? (s = { parent: a, cache: a }, t.memoizedState = s, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = s), kl(t, Oe, a)) : (a = i.cache, kl(t, Oe, a), a !== s.cache && Wu(
        t,
        [Oe],
        l,
        !0
      ))), Me(
        e,
        t,
        t.pendingProps.children,
        l
      ), t.child;
    case 30:
      return t.stateNode === null && (t.stateNode = {
        autoName: null,
        paired: null,
        clones: null,
        ref: null
      }), a = t.pendingProps, a.name != null && a.name !== "auto" ? t.flags |= e === null ? 18882560 : 18874368 : P && Sc(t), e !== null && e.memoizedProps.name !== a.name ? t.flags |= 4194816 : Aa(e, t), Me(e, t, a.children, l), t.child;
    case 29:
      throw t.pendingProps;
  }
  throw Error(B(156, t.tag));
}
function sl(e) {
  e.flags |= 4;
}
function iu(e, t, l, a, s) {
  var i;
  if ((i = (e.mode & 32) !== 0) && (i = l === null ? Ff(t, a) : Ff(t, a) && (a.src !== l.src || a.srcSet !== l.srcSet)), i) {
    if (e.flags |= 16777216, (s & 335544128) === s)
      if (e.stateNode.complete) e.flags |= 8192;
      else if (Ep()) e.flags |= 8192;
      else
        throw oa = $i, Co;
  } else e.flags &= -16777217;
}
function Sf(e, t) {
  if (t.type !== "stylesheet" || t.state.loading & 4)
    e.flags &= -16777217;
  else if (e.flags |= 16777216, !ey(t))
    if (Ep()) e.flags |= 8192;
    else
      throw oa = $i, Co;
}
function Fs(e, t) {
  t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? Sm() : 536870912, e.lanes |= t, sn |= t);
}
function kn(e, t) {
  if (!P)
    switch (e.tailMode) {
      case "visible":
        break;
      case "collapsed":
        for (var l = e.tail, a = null; l !== null; )
          l.alternate !== null && (a = l), l = l.sibling;
        a === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : a.sibling = null;
        break;
      default:
        for (t = e.tail, l = null; t !== null; )
          t.alternate !== null && (l = t), t = t.sibling;
        l === null ? e.tail = null : l.sibling = null;
    }
}
function ve(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, l = 0, a = 0;
  if (t)
    for (var s = e.child; s !== null; )
      l |= s.lanes | s.childLanes, a |= s.subtreeFlags & 1206910976, a |= s.flags & 1206910976, s.return = e, s = s.sibling;
  else
    for (s = e.child; s !== null; )
      l |= s.lanes | s.childLanes, a |= s.subtreeFlags, a |= s.flags, s.return = e, s = s.sibling;
  return e.subtreeFlags |= a, e.childLanes = l, t;
}
function Hx(e, t, l) {
  var a = t.pendingProps;
  switch (No(t), t.tag) {
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return ve(t), null;
    case 1:
      return ve(t), null;
    case 3:
      return l = t.stateNode, a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), rl(Oe), tn(), l.pendingContext && (l.context = l.pendingContext, l.pendingContext = null), (e === null || e.child === null) && (Ca(t) ? sl(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, tu())), ve(t), null;
    case 26:
      var s = t.type, i = t.memoizedState;
      return e === null ? (sl(t), i !== null ? (ve(t), Sf(t, i)) : (ve(t), iu(
        t,
        s,
        null,
        a,
        l
      ))) : i ? i !== e.memoizedState ? (sl(t), ve(t), Sf(t, i)) : (ve(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== a && sl(t), ve(t), iu(
        t,
        s,
        e,
        a,
        l
      )), null;
    case 27:
      if (Ri(t), l = _l.current, s = t.type, e !== null && t.stateNode != null)
        e.memoizedProps !== a && sl(t);
      else {
        if (!a) {
          if (t.stateNode === null)
            throw Error(B(166));
          return ve(t), t.subtreeFlags &= -33554433, null;
        }
        e = It.current, Ca(t) ? Jd(t) : (e = Fp(s, a, l), t.stateNode = e, sl(t));
      }
      return ve(t), t.subtreeFlags &= -33554433, null;
    case 5:
      if (Ri(t), s = t.type, e !== null && t.stateNode != null)
        e.memoizedProps !== a && sl(t);
      else {
        if (!a) {
          if (t.stateNode === null)
            throw Error(B(166));
          return ve(t), t.subtreeFlags &= -33554433, null;
        }
        if (i = It.current, Ca(t))
          Jd(t);
        else {
          var c = vs(
            _l.current
          );
          switch (i) {
            case 1:
              i = c.createElementNS(
                "http://www.w3.org/2000/svg",
                s
              );
              break;
            case 2:
              i = c.createElementNS(
                "http://www.w3.org/1998/Math/MathML",
                s
              );
              break;
            default:
              switch (s) {
                case "svg":
                  i = c.createElementNS(
                    "http://www.w3.org/2000/svg",
                    s
                  );
                  break;
                case "math":
                  i = c.createElementNS(
                    "http://www.w3.org/1998/Math/MathML",
                    s
                  );
                  break;
                case "script":
                  i = c.createElement("div"), i.innerHTML = "<script><\/script>", i = i.removeChild(
                    i.firstChild
                  );
                  break;
                case "select":
                  i = typeof a.is == "string" ? c.createElement("select", {
                    is: a.is
                  }) : c.createElement("select"), a.multiple ? i.multiple = !0 : a.size && (i.size = a.size);
                  break;
                default:
                  i = typeof a.is == "string" ? c.createElement(s, { is: a.is }) : c.createElement(s);
              }
          }
          i[$e] = t, i[ot] = a;
          e: for (c = t.child; c !== null; ) {
            if (c.tag === 5 || c.tag === 6)
              i.appendChild(c.stateNode);
            else if (c.tag !== 4 && c.tag !== 27 && c.child !== null) {
              c.child.return = c, c = c.child;
              continue;
            }
            if (c === t) break e;
            for (; c.sibling === null; ) {
              if (c.return === null || c.return === t)
                break e;
              c = c.return;
            }
            c.sibling.return = c.return, c = c.sibling;
          }
          t.stateNode = i;
          e: switch (Qe(i, s, a), s) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              a = !!a.autoFocus;
              break e;
            case "img":
              a = !0;
              break e;
            default:
              a = !1;
          }
          a && sl(t);
        }
      }
      return ve(t), t.subtreeFlags &= -33554433, iu(
        t,
        t.type,
        e === null ? null : e.memoizedProps,
        t.pendingProps,
        l
      ), null;
    case 6:
      if (e && t.stateNode != null)
        e.memoizedProps !== a && sl(t);
      else {
        if (typeof a != "string" && t.stateNode === null)
          throw Error(B(166));
        if (e = _l.current, Ca(t)) {
          if (e = t.stateNode, l = t.memoizedProps, a = null, s = Ye, s !== null)
            switch (s.tag) {
              case 27:
              case 5:
                a = s.memoizedProps;
            }
          e[$e] = t, e = !!(e.nodeValue === l || a !== null && a.suppressHydrationWarning === !0 || Hp(e.nodeValue, l)), e || Vl(t, !0);
        } else
          e = vs(e).createTextNode(
            a
          ), e[$e] = t, t.stateNode = e;
      }
      return ve(t), null;
    case 31:
      if (l = t.memoizedState, e === null || e.memoizedState !== null) {
        if (a = Ca(t), l !== null) {
          if (e === null) {
            if (!a) throw Error(B(318));
            if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(B(557));
            e[$e] = t;
          } else
            fa(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ve(t), e = !1;
        } else
          l = tu(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = l), e = !0;
        if (!e)
          return t.flags & 256 ? (ht(t), t) : (ht(t), null);
        if (t.flags & 128)
          throw Error(B(558));
      }
      return ve(t), null;
    case 13:
      if (a = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (s = Ca(t), a !== null && a.dehydrated !== null) {
          if (e === null) {
            if (!s) throw Error(B(318));
            if (s = t.memoizedState, s = s !== null ? s.dehydrated : null, !s) throw Error(B(317));
            s[$e] = t;
          } else
            fa(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ve(t), s = !1;
        } else
          s = tu(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = s), s = !0;
        if (!s)
          return t.flags & 256 ? (ht(t), t) : (ht(t), null);
      }
      return ht(t), t.flags & 128 ? (t.lanes = l, t) : (l = a !== null, e = e !== null && e.memoizedState !== null, l && (a = t.child, s = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (s = a.alternate.memoizedState.cachePool.pool), i = null, a.memoizedState !== null && a.memoizedState.cachePool !== null && (i = a.memoizedState.cachePool.pool), i !== s && (a.flags |= 2048)), l !== e && l && (t.child.flags |= 8192), Fs(t, t.updateQueue), ve(t), null);
    case 4:
      return tn(), e === null && Wo(t.stateNode.containerInfo), t.flags |= 67108864, ve(t), null;
    case 10:
      return rl(t.type), ve(t), null;
    case 19:
      if (Do(t), a = t.memoizedState, a === null) return ve(t), null;
      if (s = (t.flags & 128) !== 0, i = a.rendering, i === null)
        if (s) kn(a, !1);
        else {
          if (De !== 0 || e !== null && e.flags & 128)
            for (e = t.child; e !== null; ) {
              if (i = Vi(e), i !== null) {
                for (t.flags |= 128, kn(a, !1), e = i.updateQueue, t.updateQueue = e, Fs(t, e), t.subtreeFlags = 0, e = l, l = t.child; l !== null; )
                  eg(l, e), l = l.sibling;
                return ms(
                  t,
                  Xe.current & 1 | 2
                ), P && il(t, a.treeForkCount), t.child;
              }
              e = e.sibling;
            }
          a.tail !== null && pt() > tc && (t.flags |= 128, s = !0, kn(a, !1), t.lanes = 4194304);
        }
      else {
        if (!s)
          if (e = Vi(i), e !== null) {
            if (t.flags |= 128, s = !0, e = e.updateQueue, t.updateQueue = e, Fs(t, e), kn(a, !0), a.tail === null && a.tailMode !== "collapsed" && a.tailMode !== "visible" && !i.alternate && !P)
              return ve(t), null;
          } else
            2 * pt() - a.renderingStartTime > tc && l !== 536870912 && (t.flags |= 128, s = !0, kn(a, !1), t.lanes = 4194304);
        a.isBackwards ? (i.sibling = t.child, t.child = i) : (e = a.last, e !== null ? e.sibling = i : t.child = i, a.last = i);
      }
      if (a.tail !== null) {
        e = a.tail;
        e: {
          for (l = e; l !== null; ) {
            if (l.alternate !== null) {
              l = !1;
              break e;
            }
            l = l.sibling;
          }
          l = !0;
        }
        return a.rendering = e, a.tail = e.sibling, a.renderingStartTime = pt(), e.sibling = null, i = Xe.current, i = s ? i & 1 | 2 : i & 1, a.tailMode === "visible" || a.tailMode === "collapsed" || !l || P ? ms(t, i) : (l = i, be(Ze, t), be(Xe, l), Je === null && (Je = t)), P && il(t, a.treeForkCount), e;
      }
      return ve(t), null;
    case 22:
    case 23:
      return ht(t), Eo(), a = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== a && (t.flags |= 8192) : a && (t.flags |= 8192), a ? l & 536870912 && !(t.flags & 128) && (ve(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ve(t), l = t.updateQueue, l !== null && Fs(t, l.retryQueue), l = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (l = e.memoizedState.cachePool.pool), a = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool), a !== l && (t.flags |= 2048), e !== null && Ve(ra), null;
    case 24:
      return l = null, e !== null && (l = e.memoizedState.cache), t.memoizedState.cache !== l && (t.flags |= 2048), rl(Oe), ve(t), null;
    case 25:
      return null;
    case 30:
      return t.flags |= 33554432, ve(t), null;
  }
  throw Error(B(156, t.tag));
}
function Yx(e, t) {
  switch (No(t), t.tag) {
    case 1:
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return rl(Oe), tn(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 26:
    case 27:
    case 5:
      return Ri(t), null;
    case 31:
      if (t.memoizedState !== null) {
        if (ht(t), t.alternate === null)
          throw Error(B(340));
        fa();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 13:
      if (ht(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null)
          throw Error(B(340));
        fa();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return Do(t), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, e = t.memoizedState, e !== null && (e.rendering = null, e.tail = null), t.flags |= 4, t) : null;
    case 4:
      return tn(), null;
    case 10:
      return rl(t.type), null;
    case 22:
    case 23:
      return ht(t), Eo(), e !== null && Ve(ra), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 24:
      return rl(Oe), null;
    case 25:
      return null;
    default:
      return null;
  }
}
function Pg(e, t) {
  switch (No(t), t.tag) {
    case 3:
      rl(Oe), tn();
      break;
    case 26:
    case 27:
    case 5:
      Ri(t);
      break;
    case 4:
      tn();
      break;
    case 31:
      t.memoizedState !== null && ht(t);
      break;
    case 13:
      ht(t);
      break;
    case 19:
      Do(t);
      break;
    case 10:
      rl(t.type);
      break;
    case 22:
    case 23:
      ht(t), Eo(), e !== null && Ve(ra);
      break;
    case 24:
      rl(Oe);
  }
}
function _s(e, t) {
  try {
    var l = t.updateQueue, a = l !== null ? l.lastEffect : null;
    if (a !== null) {
      var s = a.next;
      l = s;
      do {
        if ((l.tag & e) === e) {
          a = void 0;
          var i = l.create, c = l.inst;
          a = i(), c.destroy = a;
        }
        l = l.next;
      } while (l !== s);
    }
  } catch (u) {
    fe(t, t.return, u);
  }
}
function Ql(e, t, l) {
  try {
    var a = t.updateQueue, s = a !== null ? a.lastEffect : null;
    if (s !== null) {
      var i = s.next;
      a = i;
      do {
        if ((a.tag & e) === e) {
          var c = a.inst, u = c.destroy;
          if (u !== void 0) {
            c.destroy = void 0, s = t;
            var r = l, d = u;
            try {
              d();
            } catch (m) {
              fe(
                s,
                r,
                m
              );
            }
          }
        }
        a = a.next;
      } while (a !== i);
    }
  } catch (m) {
    fe(t, t.return, m);
  }
}
function ep(e) {
  var t = e.updateQueue;
  if (t !== null) {
    var l = e.stateNode;
    try {
      og(t, l);
    } catch (a) {
      fe(e, e.return, a);
    }
  }
}
function tp(e, t, l) {
  l.props = va(
    e.type,
    e.memoizedProps
  ), l.state = e.memoizedState;
  try {
    l.componentWillUnmount();
  } catch (a) {
    fe(e, t, a);
  }
}
function Kt(e, t) {
  try {
    var l = e.ref;
    if (l !== null) {
      switch (e.tag) {
        case 26:
        case 27:
        case 5:
          var a = e.stateNode;
          break;
        case 30:
          var s = e.stateNode, i = dl(e.memoizedProps, s);
          (s.ref === null || s.ref.name !== i) && (s.ref = Kp(i)), a = s.ref;
          break;
        case 7:
          if (e.stateNode === null) {
            var c = new bt(e);
            rt(
              e.child,
              !1,
              Aj,
              c,
              void 0,
              void 0
            ), e.stateNode = c;
          }
          a = e.stateNode;
          break;
        default:
          a = e.stateNode;
      }
      typeof l == "function" ? e.refCleanup = l(a) : l.current = a;
    }
  } catch (u) {
    fe(e, t, u);
  }
}
function Ge(e, t) {
  var l = e.ref, a = e.refCleanup;
  if (l !== null)
    if (typeof a == "function")
      try {
        a();
      } catch (s) {
        fe(e, t, s);
      } finally {
        e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
      }
    else if (typeof l == "function")
      try {
        l(null);
      } catch (s) {
        fe(e, t, s);
      }
    else l.current = null;
}
function Fi(e, t) {
  if ((e.tag === 5 || e.tag === 27 || e.tag === 6) && e.alternate === null && t !== null)
    for (var l = 0; l < t.length; l++)
      Zp(
        e.stateNode,
        t[l]
      );
}
function wf(e) {
  for (var t = e.return; t !== null && (Vo(t) && Zp(e.stateNode, t.stateNode), !Ko(t)); )
    t = t.return;
}
function ls(e) {
  for (var t = e.return; t !== null && (Vo(t) && Oj(e.stateNode, t.stateNode), !Ko(t)); )
    t = t.return;
}
function Ko(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 27;
}
function Vo(e) {
  return e && e.tag === 7 && e.stateNode !== null;
}
function mr(e) {
  var t = e.type, l = e.memoizedProps, a = e.stateNode;
  try {
    e: switch (t) {
      case "button":
      case "input":
      case "select":
      case "textarea":
        l.autoFocus && a.focus();
        break e;
      case "img":
        l.src ? a.src = l.src : l.srcSet && (a.srcset = l.srcSet);
    }
  } catch (s) {
    fe(e, e.return, s);
  }
}
function cu(e, t, l) {
  try {
    var a = e.stateNode;
    fj(a, e.type, l, t), a[ot] = t;
  } catch (s) {
    fe(e, e.return, s);
  }
}
function lp(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Il(e.type) || e.tag === 4;
}
function uu(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || lp(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.tag === 27 && Il(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function gr(e, t, l, a) {
  var s = e.tag;
  if (s === 5 || s === 6)
    s = e.stateNode, t ? (l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l).insertBefore(s, t) : (t = l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l, t.appendChild(s), l = l._reactRootContainer, l != null || t.onclick !== null || (t.onclick = Zt)), Fi(e, a), ne = !0;
  else if (s !== 4 && (s === 27 && (Fi(e, a), a = null, Il(e.type) && (l = e.stateNode, t = null)), e = e.child, e !== null))
    for (gr(
      e,
      t,
      l,
      a
    ), e = e.sibling; e !== null; )
      gr(
        e,
        t,
        l,
        a
      ), e = e.sibling;
}
function Ii(e, t, l, a) {
  var s = e.tag;
  if (s === 5 || s === 6)
    s = e.stateNode, t ? l.insertBefore(s, t) : l.appendChild(s), Fi(e, a), ne = !0;
  else if (s !== 4 && (s === 27 && (Fi(e, a), a = null, Il(e.type) && (l = e.stateNode)), e = e.child, e !== null))
    for (Ii(
      e,
      t,
      l,
      a
    ), e = e.sibling; e !== null; )
      Ii(
        e,
        t,
        l,
        a
      ), e = e.sibling;
}
function ap(e) {
  var t = e.stateNode, l = e.memoizedProps;
  try {
    for (var a = e.type, s = t.attributes; s.length; )
      t.removeAttributeNode(s[0]);
    Qe(t, a, l), t[$e] = e, t[ot] = l;
  } catch (i) {
    fe(e, e.return, i);
  }
}
var Wi = !1, mt = null;
function Cf(e) {
  (e.tag === 30 || e.subtreeFlags & 33554432) && (Wi = !0);
}
var Vt = null;
function Tf() {
  var e = Vt;
  return Vt = null, e;
}
var it = 0;
function jn(e, t, l, a, s) {
  return it = 0, np(
    e.child,
    t,
    l,
    a,
    s
  );
}
function np(e, t, l, a, s) {
  for (var i = !1; e !== null; ) {
    if (e.tag === 5) {
      var c = e.stateNode;
      if (a !== null) {
        var u = Rr(c);
        a.push(u), u.view && (i = !0);
      } else
        i || Rr(c).view && (i = !0);
      Wi = !0, Gp(
        c,
        it === 0 ? t : t + "_" + it,
        l
      ), it++;
    } else (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && s || np(
      e.child,
      t,
      l,
      a,
      s
    ) && (i = !0));
    e = e.sibling;
  }
  return i;
}
function el(e, t) {
  for (; e !== null; )
    e.tag === 5 ? $p(e.stateNode, e.memoizedProps) : (e.tag !== 22 || e.memoizedState === null) && (e.tag === 30 && t || el(
      e.child,
      t
    )), e = e.sibling;
}
function ji(e) {
  if (e.subtreeFlags & 18874368)
    for (e = e.child; e !== null; ) {
      if ((e.tag !== 22 || e.memoizedState === null) && (ji(e), e.tag === 30 && (e.flags & 18874368) !== 0 && e.stateNode.paired)) {
        var t = e.memoizedProps;
        if (t.name == null || t.name === "auto")
          throw Error(B(544));
        var l = t.name;
        t = yl(t.default, t.share), t !== "none" && (jn(
          e,
          l,
          t,
          null,
          !1
        ) || el(e.child, !1));
      }
      e = e.sibling;
    }
}
function pr(e, t) {
  if (e.tag === 30) {
    var l = e.stateNode, a = e.memoizedProps, s = dl(a, l), i = yl(
      a.default,
      l.paired ? a.share : a.enter
    );
    i !== "none" ? jn(e, s, i, null, !1) ? (ji(e), l.paired || t || cn(e, a.onEnter)) : el(e.child, !1) : ji(e);
  } else if (e.subtreeFlags & 33554432)
    for (e = e.child; e !== null; )
      pr(e, t), e = e.sibling;
  else ji(e);
}
function yr(e) {
  if (mt !== null && mt.size !== 0) {
    var t = mt;
    if (e.subtreeFlags & 18874368)
      for (e = e.child; e !== null; ) {
        if (e.tag !== 22 || e.memoizedState === null) {
          if (e.tag === 30 && e.flags & 18874368) {
            var l = e.memoizedProps, a = l.name;
            if (a != null && a !== "auto") {
              var s = t.get(a);
              if (s !== void 0) {
                var i = yl(
                  l.default,
                  l.share
                );
                if (i !== "none" && (jn(
                  e,
                  a,
                  i,
                  null,
                  !1
                ) ? (i = e.stateNode, s.paired = i, i.paired = s, cn(e, l.onShare)) : el(e.child, !1)), t.delete(a), t.size === 0) break;
              }
            }
          }
          yr(e);
        }
        e = e.sibling;
      }
  }
}
function vr(e) {
  if (e.tag === 30) {
    var t = e.memoizedProps, l = dl(t, e.stateNode), a = mt !== null ? mt.get(l) : void 0, s = yl(
      t.default,
      a !== void 0 ? t.share : t.exit
    );
    s !== "none" && (jn(e, l, s, null, !1) ? a !== void 0 ? (s = e.stateNode, a.paired = s, s.paired = a, mt.delete(l), cn(e, t.onShare)) : cn(e, t.onExit) : el(e.child, !1)), mt !== null && yr(e);
  } else if (e.subtreeFlags & 33554432)
    for (e = e.child; e !== null; )
      vr(e), e = e.sibling;
  else
    mt !== null && yr(e);
}
function sp(e) {
  for (e = e.child; e !== null; ) {
    if (e.tag === 30) {
      var t = e.memoizedProps, l = dl(t, e.stateNode);
      t = yl(t.default, t.update), e.flags &= -5, t !== "none" && jn(
        e,
        l,
        t,
        e.memoizedState = [],
        !1
      );
    } else
      e.subtreeFlags & 33554432 && sp(e);
    e = e.sibling;
  }
}
function xr(e) {
  if (e.subtreeFlags & 18874368)
    for (e = e.child; e !== null; ) {
      if (e.tag !== 22 || e.memoizedState === null) {
        if (e.tag === 30 && e.flags & 18874368) {
          var t = e.stateNode;
          t.paired !== null && (t.paired = null, el(e.child, !1));
        }
        xr(e);
      }
      e = e.sibling;
    }
}
function bi(e) {
  if (e.tag === 30)
    e.stateNode.paired = null, el(e.child, !1), xr(e);
  else if (e.subtreeFlags & 33554432)
    for (e = e.child; e !== null; )
      bi(e), e = e.sibling;
  else xr(e);
}
function ip(e) {
  for (e = e.child; e !== null; )
    e.tag === 30 ? el(e.child, !1) : e.subtreeFlags & 33554432 && ip(e), e = e.sibling;
}
function Xo(e, t, l, a, s, i, c) {
  for (var u = !1; t !== null; ) {
    if (t.tag === 5) {
      var r = t.stateNode;
      if (i !== null && it < i.length) {
        var d = i[it], m = Rr(r);
        (d.view || m.view) && (u = !0);
        var f;
        if (f = (e.flags & 4) === 0)
          if (m.clip) f = !0;
          else {
            f = d.rect;
            var o = m.rect;
            f = f.y !== o.y || f.x !== o.x || f.height !== o.height || f.width !== o.width;
          }
        f && (e.flags |= 4), m.abs ? m = !d.abs : (d = d.rect, m = m.rect, m = d.height !== m.height || d.width !== m.width), m && (e.flags |= 32);
      } else e.flags |= 32;
      e.flags & 4 && Gp(
        r,
        it === 0 ? l : l + "_" + it,
        s
      ), u && e.flags & 4 || (Vt === null && (Vt = []), Vt.push(
        r,
        it === 0 ? a : a + "_" + it,
        t.memoizedProps
      )), it++;
    } else (t.tag !== 22 || t.memoizedState === null) && (t.tag === 30 && c ? e.flags |= t.flags & 32 : Xo(
      e,
      t.child,
      l,
      a,
      s,
      i,
      c
    ) && (u = !0));
    t = t.sibling;
  }
  return u;
}
function cp(e, t) {
  for (e = e.child; e !== null; ) {
    if (e.tag === 30) {
      var l = e.memoizedProps, a = e.stateNode, s = dl(l, a), i = yl(l.default, l.update), c;
      c = e.memoizedState, e.memoizedState = null, a = e;
      var u = e.child;
      it = 0, s = Xo(
        a,
        u,
        s,
        s,
        i,
        c,
        !1
      ), e.flags & 4 && s && cn(e, l.onUpdate);
    } else
      e.subtreeFlags & 33554432 && cp(e);
    e = e.sibling;
  }
}
var Ue = !1, ue = !1, qt = !1, ru = !1, Ef = typeof WeakSet == "function" ? WeakSet : Set, Be = null, Gt = !1, Yn = !1, Pi = !1, jr = !1;
function qx(e, t, l) {
  if (e = e.containerInfo, zr = hn, e = Xm(e), vo(e)) {
    if ("selectionStart" in e)
      var a = {
        start: e.selectionStart,
        end: e.selectionEnd
      };
    else
      e: {
        a = (a = e.ownerDocument) && a.defaultView || window;
        var s = a.getSelection && a.getSelection();
        if (s && s.rangeCount !== 0) {
          a = s.anchorNode;
          var i = s.anchorOffset, c = s.focusNode;
          s = s.focusOffset;
          try {
            a.nodeType, c.nodeType;
          } catch {
            a = null;
            break e;
          }
          var u = 0, r = -1, d = -1, m = 0, f = 0, o = e, h = null;
          t: for (; ; ) {
            for (var v; o !== a || i !== 0 && o.nodeType !== 3 || (r = u + i), o !== c || s !== 0 && o.nodeType !== 3 || (d = u + s), o.nodeType === 3 && (u += o.nodeValue.length), (v = o.firstChild) !== null; )
              h = o, o = v;
            for (; ; ) {
              if (o === e) break t;
              if (h === a && ++m === i && (r = u), h === c && ++f === s && (d = u), (v = o.nextSibling) !== null) break;
              o = h, h = o.parentNode;
            }
            o = v;
          }
          a = r === -1 || d === -1 ? null : { start: r, end: d };
        } else a = null;
      }
    a = a || { start: 0, end: 0 };
  } else a = null;
  for (Mr = { focusedElem: e, selectionRange: a }, hn = !1, l = (l & 335544064) === l, Be = t, t = l ? 9270 : 1024; Be !== null; ) {
    if (e = Be, l && (a = e.deletions, a !== null))
      for (i = 0; i < a.length; i++)
        l && vr(a[i]);
    if (e.alternate === null && e.flags & 2)
      l && Cf(e), Is(l);
    else {
      if (e.tag === 22) {
        if (a = e.alternate, e.memoizedState !== null) {
          a !== null && a.memoizedState === null && l && vr(a), Is(l);
          continue;
        } else if (a !== null && a.memoizedState !== null) {
          l && Cf(e), Is(l);
          continue;
        }
      }
      a = e.child, e.subtreeFlags & t && a !== null ? (a.return = e, Be = a) : (l && sp(e), Is(l));
    }
  }
  mt = null;
}
function Is(e) {
  for (; Be !== null; ) {
    var t = Be, l = e, a = t.alternate, s = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        break;
      case 1:
        if (s & 1024 && a !== null) {
          l = void 0, s = a.memoizedProps, a = a.memoizedState;
          var i = t.stateNode;
          try {
            var c = va(
              t.type,
              s
            );
            l = i.getSnapshotBeforeUpdate(
              c,
              a
            ), i.__reactInternalSnapshotBeforeUpdate = l;
          } catch (u) {
            fe(t, t.return, u);
          }
        }
        break;
      case 3:
        if (s & 1024) {
          if (a = t.stateNode.containerInfo, l = a.nodeType, l === 9)
            Ur(a);
          else if (l === 1)
            switch (a.nodeName) {
              case "HEAD":
              case "HTML":
              case "BODY":
                Ur(a);
                break;
              default:
                a.textContent = "";
            }
        }
        break;
      case 5:
      case 26:
      case 27:
      case 6:
      case 4:
      case 17:
        break;
      case 30:
        l && a !== null && (l = dl(
          a.memoizedProps,
          a.stateNode
        ), s = t.memoizedProps, s = yl(s.default, s.update), s !== "none" && jn(
          a,
          l,
          s,
          a.memoizedState = [],
          !0
        ));
        break;
      default:
        if (s & 1024) throw Error(B(163));
    }
    if (a = t.sibling, a !== null) {
      a.return = t.return, Be = a;
      break;
    }
    Be = t.return;
  }
}
function up(e, t, l) {
  var a = l.flags;
  switch (l.tag) {
    case 0:
    case 11:
    case 15:
      $t(e, l), a & 4 && _s(5, l);
      break;
    case 1:
      if ($t(e, l), a & 4)
        if (e = l.stateNode, t === null)
          try {
            e.componentDidMount();
          } catch (c) {
            fe(l, l.return, c);
          }
        else {
          var s = va(
            l.type,
            t.memoizedProps
          );
          t = t.memoizedState;
          try {
            e.componentDidUpdate(
              s,
              t,
              e.__reactInternalSnapshotBeforeUpdate
            );
          } catch (c) {
            fe(
              l,
              l.return,
              c
            );
          }
        }
      a & 64 && ep(l), a & 512 && Kt(l, l.return);
      break;
    case 3:
      if ($t(e, l), a & 64 && (e = l.updateQueue, e !== null)) {
        if (t = null, l.child !== null)
          switch (l.child.tag) {
            case 27:
            case 5:
              t = l.child.stateNode;
              break;
            case 1:
              t = l.child.stateNode;
          }
        try {
          og(e, t);
        } catch (c) {
          fe(l, l.return, c);
        }
      }
      break;
    case 27:
      t === null && a & 4 && ap(l);
    case 26:
    case 5:
      $t(e, l), t === null && a & 4 && mr(l), a & 512 && Kt(l, l.return);
      break;
    case 12:
      $t(e, l);
      break;
    case 31:
      $t(e, l), a & 4 && fp(e, l);
      break;
    case 13:
      $t(e, l), a & 4 && hp(e, l), a & 64 && (e = l.memoizedState, e !== null && (e = e.dehydrated, e !== null && (l = Px.bind(
        null,
        l
      ), _j(e, l))));
      break;
    case 22:
      if (a = l.memoizedState !== null || Ue, !a) {
        var i = t !== null && t.memoizedState !== null || ue;
        t = Ue, s = ue, Ue = a, (ue = i) && !s ? (a = 2, l.subtreeFlags & 8772 && (a |= 1), _t(
          e,
          l,
          a
        )) : $t(e, l), Ue = t, ue = s;
      }
      break;
    case 30:
      $t(e, l), a & 512 && Kt(l, l.return);
      break;
    case 7:
      a & 512 && Kt(l, l.return);
    default:
      $t(e, l);
  }
}
function br(e, t) {
  for (e = e.child; e !== null; )
    rp(e, t), e = e.sibling;
}
function rp(e, t) {
  switch (e.tag) {
    case 5:
    case 26:
      try {
        var l = e.stateNode;
        if (t) {
          var a = l.style;
          typeof a.setProperty == "function" ? a.setProperty("display", "none", "important") : a.display = "none";
        } else {
          var s = e.stateNode, i = e.memoizedProps.style, c = i != null && i.hasOwnProperty("display") ? i.display : null;
          s.style.display = c == null || typeof c == "boolean" ? "" : ("" + c).trim();
        }
      } catch (r) {
        fe(e, e.return, r);
      }
      Nr(e, t);
      break;
    case 6:
      try {
        e.stateNode.nodeValue = t ? "" : e.memoizedProps, ne = !0;
      } catch (r) {
        fe(e, e.return, r);
      }
      break;
    case 18:
      try {
        var u = e.stateNode;
        t ? qf(u, !0) : qf(e.stateNode, !1);
      } catch (r) {
        fe(e, e.return, r);
      }
      break;
    case 22:
    case 23:
      e.memoizedState === null && br(e, t);
      break;
    default:
      br(e, t);
  }
}
function Nr(e, t) {
  if (e.subtreeFlags & 67108864)
    for (e = e.child; e !== null; ) {
      e: {
        var l = e, a = t;
        switch (l.tag) {
          case 4:
            rp(l, a);
            break e;
          case 22:
            l.memoizedState === null && Nr(l, a);
            break e;
          default:
            Nr(l, a);
        }
      }
      e = e.sibling;
    }
}
function op(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, op(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && yc(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
var Se = null, nt = !1;
function zt(e, t, l) {
  for (l = l.child; l !== null; )
    dp(e, t, l), l = l.sibling;
}
function dp(e, t, l) {
  if (yt && typeof yt.onCommitFiberUnmount == "function")
    try {
      yt.onCommitFiberUnmount(Es, l);
    } catch {
    }
  switch (l.tag) {
    case 26:
      ue || Ge(l, t), zt(
        e,
        t,
        l
      ), l.memoizedState ? l.memoizedState.count-- : l.stateNode && !ue && (l = l.stateNode, l.parentNode.removeChild(l));
      break;
    case 27:
      ue || Ge(l, t), ls(l);
      var a = Se, s = nt;
      Il(l.type) && (Se = l.stateNode, nt = !1), zt(
        e,
        t,
        l
      ), Ip(
        l.stateNode,
        l.type,
        l.memoizedProps
      ), Se = a, nt = s;
      break;
    case 5:
      ue || Ge(l, t), ls(l);
    case 6:
      if (l.tag === 6 && ls(l), a = Se, s = nt, Se = null, zt(
        e,
        t,
        l
      ), Se = a, nt = s, Se !== null)
        if (nt)
          try {
            (Se.nodeType === 9 ? Se.body : Se.nodeName === "HTML" ? Se.ownerDocument.body : Se).removeChild(l.stateNode), ne = !0;
          } catch (i) {
            fe(
              l,
              t,
              i
            );
          }
        else
          try {
            Se.removeChild(l.stateNode), ne = !0;
          } catch (i) {
            fe(
              l,
              t,
              i
            );
          }
      break;
    case 18:
      Se !== null && (nt ? (e = Se, Yf(
        e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e,
        l.stateNode
      ), mn(e)) : Yf(Se, l.stateNode));
      break;
    case 4:
      a = Se, s = nt, Se = l.stateNode.containerInfo, nt = !0, zt(
        e,
        t,
        l
      ), Se = a, nt = s;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      Ql(2, l, t), ue || Ql(4, l, t), zt(
        e,
        t,
        l
      );
      break;
    case 1:
      ue || (Ge(l, t), a = l.stateNode, typeof a.componentWillUnmount == "function" && tp(
        l,
        t,
        a
      )), zt(
        e,
        t,
        l
      );
      break;
    case 21:
      zt(
        e,
        t,
        l
      );
      break;
    case 22:
      ue = (a = ue) || l.memoizedState !== null, zt(
        e,
        t,
        l
      ), ue = a;
      break;
    case 30:
      Ge(l, t), zt(
        e,
        t,
        l
      );
      break;
    case 7:
      ue || Ge(l, t), zt(
        e,
        t,
        l
      );
      break;
    default:
      zt(
        e,
        t,
        l
      );
  }
}
function fp(e, t) {
  if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
    e = e.dehydrated;
    try {
      mn(e);
    } catch (l) {
      fe(t, t.return, l);
    }
  }
}
function hp(e, t) {
  if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null))))
    try {
      mn(e);
    } catch (l) {
      fe(t, t.return, l);
    }
}
function Gx(e) {
  switch (e.tag) {
    case 31:
    case 13:
    case 19:
      var t = e.stateNode;
      return t === null && (t = e.stateNode = new Ef()), t;
    case 22:
      return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new Ef()), t;
    default:
      throw Error(B(435, e.tag));
  }
}
function Ws(e, t) {
  var l = Gx(e);
  t.forEach(function(a) {
    if (!l.has(a)) {
      l.add(a);
      var s = ej.bind(null, e, a);
      a.then(s, s);
    }
  });
}
function Ie(e, t, l) {
  var a = t.deletions;
  if (a !== null)
    for (var s = 0; s < a.length; s++) {
      var i = a[s], c = e, u = t, r = u;
      e: for (; r !== null; ) {
        switch (r.tag) {
          case 27:
            if (Il(r.type)) {
              Se = r.stateNode, nt = !1;
              break e;
            }
            break;
          case 5:
            Se = r.stateNode, nt = !1;
            break e;
          case 3:
          case 4:
            Se = r.stateNode.containerInfo, nt = !0;
            break e;
        }
        r = r.return;
      }
      if (Se === null) throw Error(B(160));
      dp(c, u, i), Se = null, nt = !1, c = i.alternate, c !== null && (c.return = null), i.return = null;
    }
  if (t.subtreeFlags & 13886)
    for (t = t.child; t !== null; )
      mp(t, e, l), t = t.sibling;
}
var Ut = null;
function mp(e, t, l) {
  var a = e.alternate, s = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (s & 4 && (a = e.updateQueue, a = a !== null ? a.events : null, a !== null))
        for (var i = 0; i < a.length; i++) {
          var c = a[i];
          c.ref.impl = c.nextImpl;
        }
      Ie(t, e, l), We(e), s & 4 && (Ql(3, e, e.return), _s(3, e), Ql(5, e, e.return));
      break;
    case 1:
      Ie(t, e, l), We(e), s & 512 && (ue || a === null || Ge(a, a.return)), s & 64 && Ue && (e = e.updateQueue, e !== null && (t = e.callbacks, t !== null && (l = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = l === null ? t : l.concat(t))));
      break;
    case 26:
      if (i = Ut, Ie(t, e, l), We(e), s & 512 && (ue || a === null || Ge(a, a.return)), s & 4)
        if (s = a !== null ? a.memoizedState : null, l = e.memoizedState, a === null)
          if (l === null)
            if (e.stateNode === null)
              if (Ue)
                e.stateNode = qp(
                  e.type,
                  e.memoizedProps,
                  t.containerInfo,
                  e
                );
              else {
                e: {
                  t = e.type, l = e.memoizedProps, s = i.ownerDocument || i;
                  t: switch (t) {
                    case "title":
                      a = s.getElementsByTagName("title")[0], (!a || a[As] || a[$e] || a.namespaceURI === "http://www.w3.org/2000/svg" || a.hasAttribute("itemprop")) && (a = s.createElement(t), s.head.insertBefore(
                        a,
                        s.querySelector("head > title")
                      )), Qe(a, t, l), a[$e] = e, He(a), t = a;
                      break e;
                    case "link":
                      if (i = Jf(
                        "link",
                        "href",
                        s
                      ).get(t + (l.href || ""))) {
                        for (c = 0; c < i.length; c++)
                          if (a = i[c], a.getAttribute("href") === (l.href == null || l.href === "" ? null : l.href) && a.getAttribute("rel") === (l.rel == null ? null : l.rel) && a.getAttribute("title") === (l.title == null ? null : l.title) && a.getAttribute("crossorigin") === (l.crossOrigin == null ? null : l.crossOrigin)) {
                            i.splice(c, 1);
                            break t;
                          }
                      }
                      a = s.createElement(t), Qe(a, t, l), s.head.appendChild(a);
                      break;
                    case "meta":
                      if (i = Jf(
                        "meta",
                        "content",
                        s
                      ).get(t + (l.content || ""))) {
                        for (c = 0; c < i.length; c++)
                          if (a = i[c], a.getAttribute("content") === (l.content == null ? null : "" + l.content) && a.getAttribute("name") === (l.name == null ? null : l.name) && a.getAttribute("property") === (l.property == null ? null : l.property) && a.getAttribute("http-equiv") === (l.httpEquiv == null ? null : l.httpEquiv) && a.getAttribute("charset") === (l.charSet == null ? null : l.charSet)) {
                            i.splice(c, 1);
                            break t;
                          }
                      }
                      a = s.createElement(t), Qe(a, t, l), s.head.appendChild(a);
                      break;
                    default:
                      throw Error(B(468, t));
                  }
                  a[$e] = e, He(a), t = a;
                }
                e.stateNode = t;
              }
            else
              Ue || Hr(i, e.type, e.stateNode);
          else
            e.stateNode = Zf(
              i,
              l,
              e.memoizedProps
            );
        else
          s !== l ? (s === null ? (t = a.stateNode, t === null || ue || t.parentNode.removeChild(t)) : s.count--, l === null ? Ue || Hr(i, e.type, e.stateNode) : Zf(i, l, e.memoizedProps)) : l === null && e.stateNode !== null && cu(
            e,
            e.memoizedProps,
            a.memoizedProps
          );
      break;
    case 27:
      Ie(t, e, l), We(e), s & 512 && (ue || a === null || Ge(a, a.return)), a !== null && s & 4 && cu(
        e,
        e.memoizedProps,
        a.memoizedProps
      );
      break;
    case 5:
      if (i = qt, qt = !1, Ie(t, e, l), qt = i, We(e), s & 512 && (ue || a === null || Ge(a, a.return)), e.flags & 32) {
        t = e.stateNode;
        try {
          an(t, ""), ne = !0;
        } catch (m) {
          fe(e, e.return, m);
        }
      }
      s & 4 && e.stateNode != null && (t = e.memoizedProps, cu(
        e,
        t,
        a !== null ? a.memoizedProps : t
      )), s & 1024 && (ru = !0);
      break;
    case 6:
      if (Ie(t, e, l), We(e), s & 4) {
        if (e.stateNode === null)
          throw Error(B(162));
        t = e.memoizedProps, l = e.stateNode;
        try {
          l.nodeValue = t, ne = !0;
        } catch (m) {
          fe(e, e.return, m);
        }
      }
      break;
    case 3:
      if (ne = !1, Ci = null, i = Ut, Ut = xs(t.containerInfo), Ie(t, e, l), Ut = i, We(e), s & 4 && a !== null && a.memoizedState.isDehydrated)
        try {
          mn(t.containerInfo);
        } catch (m) {
          fe(e, e.return, m);
        }
      ru && (ru = !1, gp(e)), ne = !1;
      break;
    case 4:
      s = qt, qt = Ue, a = Od(), i = Ut, Ut = xs(
        e.stateNode.containerInfo
      ), Ie(t, e, l), We(e), Ut = i, ne && Yn && (Pi = !0), ne = a, qt = s;
      break;
    case 12:
      Ie(t, e, l), We(e);
      break;
    case 31:
      Ie(t, e, l), We(e), s & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Ws(e, t)));
      break;
    case 13:
      Ie(t, e, l), We(e), e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && (Ac = pt()), s & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Ws(e, t)));
      break;
    case 22:
      i = e.memoizedState !== null, c = a !== null && a.memoizedState !== null;
      var u = Ue, r = ue, d = qt;
      Ue = u || i, qt = d || i, ue = r || c, Ie(t, e, l), ue = r, qt = d, Ue = u, We(e), s & 8192 && (t = e.stateNode, t._visibility = i ? t._visibility & -2 : t._visibility | 1, !i || a === null || c || Ue || ue || (t = c || ue, l = Ue, a = ue, Ue = i || Ue, ue = t, Nl(e, 2), Ue = l, ue = a), !i && qt || br(e, i)), s & 4 && (t = e.updateQueue, t !== null && (l = t.retryQueue, l !== null && (t.retryQueue = null, Ws(e, l))));
      break;
    case 19:
      Ie(t, e, l), We(e), s & 4 && (t = e.updateQueue, t !== null && (e.updateQueue = null, Ws(e, t)));
      break;
    case 30:
      s & 512 && (ue || a === null || Ge(a, a.return)), s = Od(), i = Yn, c = (l & 335544064) === l, u = e.memoizedProps, Yn = c && yl(
        u.default,
        u.update
      ) !== "none", Ie(t, e, l), We(e), c && a !== null && ne && (e.flags |= 4), Yn = i, ne = s;
      break;
    case 21:
      break;
    case 7:
      s & 512 && (ue || a === null || Ge(a, a.return)), a && a.stateNode !== null && (a.stateNode._fragmentFiber = e);
    default:
      Ie(t, e, l), We(e);
  }
}
function We(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      for (var l, a = e.return; a !== null; ) {
        if (lp(a)) {
          l = a;
          break;
        }
        a = a.return;
      }
      a = null;
      for (var s = e.return; s !== null; ) {
        if (Vo(s)) {
          var i = s.stateNode;
          a === null ? a = [i] : a.push(i);
        }
        if (Ko(s)) break;
        s = s.return;
      }
      var c = a;
      if (l == null) throw Error(B(160));
      switch (l.tag) {
        case 27:
          var u = l.stateNode, r = uu(e);
          Ii(
            e,
            r,
            u,
            c
          );
          break;
        case 5:
          var d = l.stateNode;
          l.flags & 32 && (an(d, ""), l.flags &= -33);
          var m = uu(e);
          Ii(
            e,
            m,
            d,
            c
          );
          break;
        case 3:
        case 4:
          var f = l.stateNode.containerInfo, o = uu(e);
          gr(
            e,
            o,
            f,
            c
          );
          break;
        default:
          throw Error(B(161));
      }
    } catch (h) {
      fe(e, e.return, h);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function gp(e) {
  if (e.subtreeFlags & 1024)
    for (e = e.child; e !== null; ) {
      var t = e;
      gp(t), t.tag === 5 && t.flags & 1024 && (t = t.stateNode, hn = !0, t.reset(), hn = !1), e = e.sibling;
    }
}
function Ta(e, t) {
  if (t.subtreeFlags & 9270)
    for (t = t.child; t !== null; )
      pp(t, e), t = t.sibling;
  else cp(t);
}
function pp(e, t) {
  var l = e.alternate;
  if (l === null) pr(e, !1);
  else
    switch (e.tag) {
      case 3:
        if (jr = Gt = !1, Tf(), Ta(t, e), !Gt && !Pi) {
          if (e = Vt, e !== null)
            for (var a = 0; a < e.length; a += 3) {
              l = e[a];
              var s = e[a + 1];
              $p(l, e[a + 2]), l = l.ownerDocument.documentElement, l !== null && l.animate(
                { opacity: [0, 0], pointerEvents: ["none", "none"] },
                {
                  duration: 0,
                  fill: "forwards",
                  pseudoElement: "::view-transition-group(" + s + ")"
                }
              );
            }
          e = t.containerInfo, e = e.nodeType === 9 ? e.documentElement : e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "" && (e.style.viewTransitionName = "none", e.animate(
            { opacity: [0, 0], pointerEvents: ["none", "none"] },
            {
              duration: 0,
              fill: "forwards",
              pseudoElement: "::view-transition-group(root)"
            }
          ), e.animate(
            { width: [0, 0], height: [0, 0] },
            {
              duration: 0,
              fill: "forwards",
              pseudoElement: "::view-transition"
            }
          )), jr = !0;
        }
        Vt = null;
        break;
      case 5:
        Ta(t, e);
        break;
      case 4:
        a = Gt, Gt = !1, Ta(t, e), Gt && (Pi = !0), Gt = a;
        break;
      case 22:
        e.memoizedState === null && (l.memoizedState !== null ? pr(e, !1) : Ta(t, e));
        break;
      case 30:
        a = Gt, s = Tf(), Gt = !1, Ta(t, e), Gt && (e.flags |= 4);
        var i = e.memoizedProps, c = e.stateNode;
        t = dl(i, c), c = dl(l.memoizedProps, c);
        var u = yl(i.default, i.update);
        u === "none" ? t = !1 : (i = l.memoizedState, l.memoizedState = null, l = e.child, it = 0, t = Xo(
          e,
          l,
          t,
          c,
          u,
          i,
          !0
        ), it !== (i === null ? 0 : i.length) && (e.flags |= 32)), e.flags & 4 && t ? (cn(
          e,
          e.memoizedProps.onUpdate
        ), Vt = s) : s !== null && (s.push.apply(s, Vt), Vt = s), Gt = e.flags & 32 ? !0 : a;
        break;
      default:
        Ta(t, e);
    }
}
function $t(e, t) {
  if (t.subtreeFlags & 8772)
    for (t = t.child; t !== null; )
      up(e, t.alternate, t), t = t.sibling;
}
function Nl(e, t) {
  for (e = e.child; e !== null; ) {
    var l = e, a = t;
    switch (l.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        Ql(4, l, l.return), Nl(
          l,
          a
        );
        break;
      case 1:
        Ge(l, l.return);
        var s = l.stateNode;
        typeof s.componentWillUnmount == "function" && tp(
          l,
          l.return,
          s
        ), Nl(
          l,
          a
        );
        break;
      case 27:
        a & 2 && Ip(
          l.stateNode,
          l.type,
          l.memoizedProps
        );
      case 5:
        Ge(l, l.return), l.tag !== 5 && l.tag !== 27 || ls(l), Nl(
          l,
          a
        );
        break;
      case 6:
        ls(l);
        break;
      case 26:
        Ge(l, l.return), s = l.stateNode, l.memoizedState !== null || s === null || ue || s.parentNode.removeChild(s), Nl(
          l,
          a
        );
        break;
      case 22:
        l.memoizedState === null && Nl(
          l,
          a
        );
        break;
      case 30:
        Ge(l, l.return), Nl(
          l,
          a
        );
        break;
      case 7:
        Ge(l, l.return);
      default:
        Nl(
          l,
          a
        );
    }
    e = e.sibling;
  }
}
function _t(e, t, l) {
  for (l = t.subtreeFlags & 8772 ? l : l & -2, t = t.child; t !== null; ) {
    var a = t.alternate, s = e, i = t, c = i.flags, u = (l & 1) !== 0;
    switch (i.tag) {
      case 0:
      case 11:
      case 15:
        _t(
          s,
          i,
          l
        ), _s(4, i);
        break;
      case 1:
        if (_t(
          s,
          i,
          l
        ), a = i, s = a.stateNode, typeof s.componentDidMount == "function")
          try {
            s.componentDidMount();
          } catch (m) {
            fe(a, a.return, m);
          }
        if (a = i, s = a.updateQueue, s !== null) {
          var r = a.stateNode;
          try {
            var d = s.shared.hiddenCallbacks;
            if (d !== null)
              for (s.shared.hiddenCallbacks = null, s = 0; s < d.length; s++)
                rg(d[s], r);
          } catch (m) {
            fe(a, a.return, m);
          }
        }
        u && c & 64 && ep(i), Kt(i, i.return);
        break;
      case 27:
        l & 2 && ap(i);
      case 5:
        i.tag !== 5 && i.tag !== 27 || wf(i), _t(
          s,
          i,
          l
        ), u && a === null && c & 4 && mr(i), Kt(i, i.return);
        break;
      case 6:
        wf(i);
        break;
      case 26:
        r = i.stateNode, i.memoizedState !== null || r === null || Ue || Hr(
          xs(r.ownerDocument),
          i.type,
          r
        ), _t(
          s,
          i,
          l
        ), u && a === null && c & 4 && mr(i), Kt(i, i.return);
        break;
      case 12:
        _t(
          s,
          i,
          l
        );
        break;
      case 31:
        _t(
          s,
          i,
          l
        ), u && c & 4 && fp(s, i);
        break;
      case 13:
        _t(
          s,
          i,
          l
        ), u && c & 4 && hp(s, i);
        break;
      case 22:
        i.memoizedState === null && _t(
          s,
          i,
          l
        ), Kt(i, i.return);
        break;
      case 30:
        _t(
          s,
          i,
          l
        ), Kt(i, i.return);
        break;
      case 7:
        Kt(i, i.return);
      default:
        _t(
          s,
          i,
          l
        );
    }
    t = t.sibling;
  }
}
function Qo(e, t) {
  var l = null;
  e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (l = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== l && (e != null && e.refCount++, l != null && zs(l));
}
function Zo(e, t) {
  e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && zs(e));
}
function St(e, t, l, a) {
  var s = (l & 335544064) === l;
  if (t.subtreeFlags & (s ? 10262 : 10256))
    for (t = t.child; t !== null; )
      yp(
        e,
        t,
        l,
        a
      ), t = t.sibling;
  else s && ip(t);
}
function yp(e, t, l, a) {
  var s = (l & 335544064) === l;
  s && t.alternate === null && t.return !== null && t.return.alternate !== null && bi(t);
  var i = t.flags;
  switch (t.tag) {
    case 0:
    case 11:
    case 15:
      St(
        e,
        t,
        l,
        a
      ), i & 2048 && _s(9, t);
      break;
    case 1:
      St(
        e,
        t,
        l,
        a
      );
      break;
    case 3:
      St(
        e,
        t,
        l,
        a
      ), s && jr && (e = e.containerInfo, e = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, e.style.viewTransitionName === "root" && (e.style.viewTransitionName = ""), e = e.ownerDocument.documentElement, e !== null && e.style.viewTransitionName === "none" && (e.style.viewTransitionName = "")), i & 2048 && (i = null, t.alternate !== null && (i = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== i && (t.refCount++, i != null && zs(i)));
      break;
    case 12:
      if (i & 2048) {
        St(
          e,
          t,
          l,
          a
        ), i = t.stateNode;
        try {
          var c = t.memoizedProps, u = c.id, r = c.onPostCommit;
          typeof r == "function" && r(
            u,
            t.alternate === null ? "mount" : "update",
            i.passiveEffectDuration,
            -0
          );
        } catch (d) {
          fe(t, t.return, d);
        }
      } else
        St(
          e,
          t,
          l,
          a
        );
      break;
    case 31:
      St(
        e,
        t,
        l,
        a
      );
      break;
    case 13:
      St(
        e,
        t,
        l,
        a
      );
      break;
    case 23:
      break;
    case 22:
      c = t.stateNode, u = t.alternate, t.memoizedState !== null ? (s && u !== null && u.memoizedState === null && bi(u), c._visibility & 2 ? St(
        e,
        t,
        l,
        a
      ) : as(
        e,
        t
      )) : (s && u !== null && u.memoizedState !== null && bi(t), c._visibility & 2 ? St(
        e,
        t,
        l,
        a
      ) : (c._visibility |= 2, Oa(
        e,
        t,
        l,
        a,
        (t.subtreeFlags & 10256) !== 0 || !1
      ))), i & 2048 && Qo(u, t);
      break;
    case 24:
      St(
        e,
        t,
        l,
        a
      ), i & 2048 && Zo(t.alternate, t);
      break;
    case 30:
      s && (i = t.alternate, i !== null && (el(i.child, !0), el(t.child, !0))), St(
        e,
        t,
        l,
        a
      );
      break;
    default:
      St(
        e,
        t,
        l,
        a
      );
  }
}
function Oa(e, t, l, a, s) {
  for (s = s && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
    var i = e, c = t, u = l, r = a, d = c.flags;
    switch (c.tag) {
      case 0:
      case 11:
      case 15:
        Oa(
          i,
          c,
          u,
          r,
          s
        ), _s(8, c);
        break;
      case 23:
        break;
      case 22:
        var m = c.stateNode;
        c.memoizedState !== null ? m._visibility & 2 ? Oa(
          i,
          c,
          u,
          r,
          s
        ) : as(
          i,
          c
        ) : (m._visibility |= 2, Oa(
          i,
          c,
          u,
          r,
          s
        )), s && d & 2048 && Qo(
          c.alternate,
          c
        );
        break;
      case 24:
        Oa(
          i,
          c,
          u,
          r,
          s
        ), s && d & 2048 && Zo(c.alternate, c);
        break;
      default:
        Oa(
          i,
          c,
          u,
          r,
          s
        );
    }
    t = t.sibling;
  }
}
function as(e, t) {
  if (t.subtreeFlags & 10256)
    for (t = t.child; t !== null; ) {
      var l = e, a = t, s = a.flags;
      switch (a.tag) {
        case 22:
          as(l, a), s & 2048 && Qo(
            a.alternate,
            a
          );
          break;
        case 24:
          as(l, a), s & 2048 && Zo(a.alternate, a);
          break;
        default:
          as(l, a);
      }
      t = t.sibling;
    }
}
var aa = 8192;
function Pl(e, t, l) {
  if (e.subtreeFlags & aa)
    for (e = e.child; e !== null; )
      vp(
        e,
        t,
        l
      ), e = e.sibling;
}
function vp(e, t, l) {
  switch (e.tag) {
    case 26:
      Pl(
        e,
        t,
        l
      ), e.flags & aa && (e.memoizedState !== null ? Zj(
        l,
        Ut,
        e.memoizedState,
        e.memoizedProps
      ) : (e = e.stateNode, (t & 335544128) === t && If(l, e)));
      break;
    case 5:
      Pl(
        e,
        t,
        l
      ), e.flags & aa && (e = e.stateNode, (t & 335544128) === t && If(l, e));
      break;
    case 3:
    case 4:
      var a = Ut;
      Ut = xs(e.stateNode.containerInfo), Pl(
        e,
        t,
        l
      ), Ut = a;
      break;
    case 22:
      e.memoizedState === null && (a = e.alternate, a !== null && a.memoizedState !== null ? (a = aa, aa = 16777216, Pl(
        e,
        t,
        l
      ), aa = a) : Pl(
        e,
        t,
        l
      ));
      break;
    case 30:
      if (e.flags & aa && (a = e.memoizedProps.name, a != null && a !== "auto")) {
        var s = e.stateNode;
        s.paired = null, mt === null && (mt = /* @__PURE__ */ new Map()), mt.set(a, s);
      }
      Pl(
        e,
        t,
        l
      );
      break;
    default:
      Pl(
        e,
        t,
        l
      );
  }
}
function xp(e) {
  var t = e.alternate;
  if (t !== null && (e = t.child, e !== null)) {
    t.child = null;
    do
      t = e.sibling, e.sibling = null, e = t;
    while (e !== null);
  }
}
function An(e) {
  var t = e.deletions;
  if (e.flags & 16) {
    if (t !== null)
      for (var l = 0; l < t.length; l++) {
        var a = t[l];
        Be = a, bp(
          a,
          e
        );
      }
    xp(e);
  }
  if (e.subtreeFlags & 10256)
    for (e = e.child; e !== null; )
      jp(e), e = e.sibling;
}
function jp(e) {
  switch (e.tag) {
    case 0:
    case 11:
    case 15:
      An(e), e.flags & 2048 && Ql(9, e, e.return);
      break;
    case 3:
      An(e);
      break;
    case 12:
      An(e);
      break;
    case 22:
      var t = e.stateNode;
      e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Ni(e)) : An(e);
      break;
    default:
      An(e);
  }
}
function Ni(e) {
  var t = e.deletions;
  if (e.flags & 16) {
    if (t !== null)
      for (var l = 0; l < t.length; l++) {
        var a = t[l];
        Be = a, bp(
          a,
          e
        );
      }
    xp(e);
  }
  for (e = e.child; e !== null; ) {
    switch (t = e, t.tag) {
      case 0:
      case 11:
      case 15:
        Ql(8, t, t.return), Ni(t);
        break;
      case 22:
        l = t.stateNode, l._visibility & 2 && (l._visibility &= -3, Ni(t));
        break;
      default:
        Ni(t);
    }
    e = e.sibling;
  }
}
function bp(e, t) {
  for (; Be !== null; ) {
    var l = Be;
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        Ql(8, l, t);
        break;
      case 23:
      case 22:
        if (l.memoizedState !== null && l.memoizedState.cachePool !== null) {
          var a = l.memoizedState.cachePool.pool;
          a != null && a.refCount++;
        }
        break;
      case 24:
        zs(l.memoizedState.cache);
    }
    if (a = l.child, a !== null) a.return = l, Be = a;
    else
      e: for (l = e; Be !== null; ) {
        a = Be;
        var s = a.sibling, i = a.return;
        if (op(a), a === l) {
          Be = null;
          break e;
        }
        if (s !== null) {
          s.return = i, Be = s;
          break e;
        }
        Be = i;
      }
  }
}
var $x = {
  getCacheForType: function(e) {
    var t = Ke(Oe), l = t.data.get(e);
    return l === void 0 && (l = e(), t.data.set(e, l)), l;
  },
  cacheSignal: function() {
    return Ke(Oe).controller.signal;
  }
}, Kx = typeof WeakMap == "function" ? WeakMap : Map, ie = 0, pe = null, te = null, le = 0, oe = 0, dt = null, Al = !1, bn = !1, Jo = !1, gl = 0, De = 0, Zl = 0, da = 0, ec = 0, gt = 0, sn = 0, ns = null, st = null, Sr = !1, Ac = 0, Np = 0, tc = 1 / 0, lc = null, Yl = null, Te = 0, Bt = null, xa = null, Wt = 0, wr = 0, Cr = null, Sp = null, Wa = null, Pa = null, en = null, ss = 0, Si = null;
function xt() {
  return ie & 2 && le !== 0 ? le & -le : X.T !== null ? Io() : Em();
}
function wp() {
  if (gt === 0)
    if (!(le & 536870912) || P) {
      var e = qs;
      qs <<= 1, !(qs & 3932160) && (qs = 262144), gt = e;
    } else gt = 536870912;
  return e = Ze.current, e !== null && (e.flags |= 32), gt;
}
function cn(e, t) {
  if (t != null) {
    var l = e.stateNode, a = l.ref;
    a === null && (a = l.ref = Kp(
      dl(e.memoizedProps, l)
    )), Pa === null && (Pa = []), Pa.push(t.bind(null, a));
  }
}
function ut(e, t, l) {
  (e === pe && (oe === 2 || oe === 9) || e.cancelPendingCommit !== null) && (un(e, 0), Ol(
    e,
    le,
    gt,
    !1
  )), ks(e, l), (!(ie & 2) || e !== pe) && (e === pe && (!(ie & 2) && (da |= l), De === 4 && Ol(
    e,
    le,
    gt,
    !1
  )), ll(e));
}
function Cp(e, t, l) {
  if (ie & 6) throw Error(B(327));
  var a = !l && (t & 127) === 0 && (t & e.expiredLanes) === 0 || Ds(e, t), s = a ? Qx(e, t) : ou(e, t, !0), i = a;
  do {
    if (s === 0) {
      bn && !a && Ol(e, t, 0, !1);
      break;
    } else {
      if (l = e.current.alternate, i && !Vx(l)) {
        s = ou(e, t, !1), i = !1;
        continue;
      }
      if (s === 2) {
        if (i = t, e.errorRecoveryDisabledLanes & i)
          var c = 0;
        else
          c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
        if (c !== 0) {
          t = c;
          e: {
            var u = e;
            s = ns;
            var r = u.current.memoizedState.isDehydrated;
            if (r && (un(u, c).flags |= 256), c = ou(
              u,
              c,
              !1
            ), c !== 2 && c !== 6) {
              if (Jo && !r) {
                u.errorRecoveryDisabledLanes |= i, da |= i, s = 4;
                break e;
              }
              i = st, st = s, i !== null && (st === null ? st = i : st.push.apply(
                st,
                i
              ));
            }
            s = c;
          }
          if (i = !1, s !== 2) continue;
        }
      }
      if (s === 1) {
        un(e, 0), Ol(e, t, 0, !0);
        break;
      }
      e: {
        switch (a = e, i = s, i) {
          case 0:
          case 1:
            throw Error(B(345));
          case 4:
            if ((t & 4194048) !== t && (t & 62914560) !== t)
              break;
          case 6:
            Ol(
              a,
              t,
              gt,
              !Al
            );
            break e;
          case 2:
            st = null;
            break;
          case 3:
          case 5:
            break;
          default:
            throw Error(B(329));
        }
        if ((t & 62914560) === t && (s = Ac + 300 - pt(), 10 < s)) {
          if (Ol(
            a,
            t,
            gt,
            !Al
          ), pc(a, 0, !0) !== 0) break e;
          Wt = t, a.timeoutHandle = Po(
            Df.bind(
              null,
              a,
              l,
              st,
              lc,
              Sr,
              t,
              gt,
              da,
              sn,
              Al,
              i,
              "Throttled",
              -0,
              0
            ),
            s
          );
          break e;
        }
        Df(
          a,
          l,
          st,
          lc,
          Sr,
          t,
          gt,
          da,
          sn,
          Al,
          i,
          null,
          -0,
          0
        );
      }
    }
    break;
  } while (!0);
  ll(e);
}
function Df(e, t, l, a, s, i, c, u, r, d, m, f, o, h) {
  e.timeoutHandle = -1;
  var v = t.subtreeFlags, x = (i & 335544064) === i;
  if (f = null, (x || v & 8192 || (v & 16785408) === 16785408) && (f = {
    stylesheets: null,
    count: 0,
    imgCount: 0,
    imgBytes: 0,
    suspenseyImages: [],
    waitingForImages: !0,
    waitingForViewTransition: !1,
    unsuspend: Zt
  }, mt = null, vp(
    t,
    i,
    f
  ), x && (v = f, x = e.containerInfo, x = (x.nodeType === 9 ? x : x.ownerDocument).__reactViewTransition, x != null && (v.count++, v.waitingForViewTransition = !0, v = js.bind(v), x.finished.then(v, v))), v = (i & 62914560) === i ? Ac - pt() : (i & 4194048) === i ? Np - pt() : 0, v = Jj(
    f,
    v
  ), v !== null)) {
    Wt = i, e.cancelPendingCommit = v(
      Af.bind(
        null,
        e,
        t,
        i,
        l,
        a,
        s,
        c,
        u,
        r,
        d,
        m,
        f,
        null,
        o,
        h
      )
    ), Ol(e, i, c, !d);
    return;
  }
  Af(
    e,
    t,
    i,
    l,
    a,
    s,
    c,
    u,
    r,
    d,
    m,
    f
  );
}
function Vx(e) {
  for (var t = e; ; ) {
    var l = t.tag;
    if ((l === 0 || l === 11 || l === 15) && t.flags & 16384 && (l = t.updateQueue, l !== null && (l = l.stores, l !== null)))
      for (var a = 0; a < l.length; a++) {
        var s = l[a], i = s.getSnapshot;
        s = s.value;
        try {
          if (!jt(i(), s)) return !1;
        } catch {
          return !1;
        }
      }
    if (l = t.child, t.subtreeFlags & 16384 && l !== null)
      l.return = t, t = l;
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
  }
  return !0;
}
function Ol(e, t, l, a) {
  t = Nm(e, t), t &= ~ec, t &= ~da, e.suspendedLanes |= t, e.pingedLanes &= ~t, a && (e.warmLanes |= t), a = e.expirationTimes;
  for (var s = t; 0 < s; ) {
    var i = 31 - vt(s), c = 1 << i;
    a[i] = -1, s &= ~c;
  }
  l !== 0 && wm(e, l, t);
}
function Oc() {
  return ie & 6 ? !0 : (Rs(0), !1);
}
function Fo() {
  if (te !== null) {
    if (oe === 0)
      var e = te.return;
    else
      e = te, cl = wa = null, Mo(e), Ja = null, hs = 0, e = te;
    for (; e !== null; )
      Pg(e.alternate, e), e = e.return;
    te = null;
  }
}
function un(e, t) {
  var l = e.timeoutHandle;
  return l !== -1 && (e.timeoutHandle = -1, gj(l)), l = e.cancelPendingCommit, l !== null && (e.cancelPendingCommit = null, l()), Wt = 0, Fo(), pe = e, te = l = ul(e.current, null), le = t, oe = 0, dt = null, Al = !1, bn = Ds(e, t), Jo = !1, sn = gt = ec = da = Zl = De = 0, st = ns = null, Sr = !1, gl = Nm(e, t), bc(), l;
}
function Tp(e, t) {
  J = null, X.H = Zi, t === xn || t === wc ? (t = ef(), oe = 3) : t === Co ? (t = ef(), oe = 4) : oe = t === qo ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, dt = t, te === null && (De = 1, Ji(
    e,
    Dt(t, e.current)
  ));
}
function Ep() {
  var e = Ze.current;
  return e === null ? !0 : (le & 4194048) === le ? Je === null : (le & 62914560) === le || le & 536870912 ? e === Je : !1;
}
function Dp() {
  var e = X.H;
  return X.H = Zi, e === null ? Zi : e;
}
function kp() {
  var e = X.A;
  return X.A = $x, e;
}
function ac() {
  De = 4, Al || (le & 4194048) !== le && Ze.current !== null || (bn = !0), !(Zl & 134217727) && !(da & 134217727) || pe === null || Ol(
    pe,
    le,
    gt,
    !1
  );
}
function ou(e, t, l) {
  var a = ie;
  ie |= 2;
  var s = Dp(), i = kp();
  (pe !== e || le !== t) && (lc = null, un(e, t)), t = !1;
  var c = De;
  e: do
    try {
      if (oe !== 0 && te !== null) {
        var u = te, r = dt;
        switch (oe) {
          case 8:
            Fo(), c = 6;
            break e;
          case 3:
          case 2:
          case 9:
          case 6:
            Ze.current === null && (t = !0);
            var d = oe;
            if (oe = 0, dt = null, Ka(e, u, r, d), l && bn) {
              c = 0;
              break e;
            }
            break;
          default:
            d = oe, oe = 0, dt = null, Ka(e, u, r, d);
        }
      }
      Xx(), c = De;
      break;
    } catch (m) {
      Tp(e, m);
    }
  while (!0);
  return t && e.shellSuspendCounter++, cl = wa = null, ie = a, X.H = s, X.A = i, te === null && (pe = null, le = 0, bc()), c;
}
function Xx() {
  for (; te !== null; ) Ap(te);
}
function Qx(e, t) {
  var l = ie;
  ie |= 2;
  var a = Dp(), s = kp();
  pe !== e || le !== t ? (lc = null, tc = pt() + 500, un(e, t)) : bn = Ds(
    e,
    t
  );
  e: do
    try {
      if (oe !== 0 && te !== null) {
        t = te;
        var i = dt;
        t: switch (oe) {
          case 1:
            oe = 0, dt = null, Ka(e, t, i, 1);
            break;
          case 2:
          case 9:
            if (Pd(i)) {
              oe = 0, dt = null, kf(t);
              break;
            }
            t = function() {
              oe !== 2 && oe !== 9 || pe !== e || (oe = 7), ll(e);
            }, i.then(t, t);
            break e;
          case 3:
            oe = 7;
            break e;
          case 4:
            oe = 5;
            break e;
          case 7:
            Pd(i) ? (oe = 0, dt = null, kf(t)) : (oe = 0, dt = null, Ka(e, t, i, 7));
            break;
          case 5:
            var c = null;
            switch (te.tag) {
              case 26:
                c = te.memoizedState;
              case 5:
              case 27:
                var u = te;
                if (c ? ey(c) : u.stateNode.complete) {
                  oe = 0, dt = null;
                  var r = u.sibling;
                  if (r !== null) te = r;
                  else {
                    var d = u.return;
                    d !== null ? (te = d, zc(d)) : te = null;
                  }
                  break t;
                }
            }
            oe = 0, dt = null, Ka(e, t, i, 5);
            break;
          case 6:
            oe = 0, dt = null, Ka(e, t, i, 6);
            break;
          case 8:
            Fo(), De = 6;
            break e;
          default:
            throw Error(B(462));
        }
      }
      Zx();
      break;
    } catch (m) {
      Tp(e, m);
    }
  while (!0);
  return cl = wa = null, X.H = a, X.A = s, ie = l, te !== null ? 0 : (pe = null, le = 0, bc(), De);
}
function Zx() {
  for (; te !== null && !dv(); )
    Ap(te);
}
function Ap(e) {
  var t = Wg(e.alternate, e, gl);
  e.memoizedProps = e.pendingProps, t === null ? zc(e) : te = t;
}
function kf(e) {
  var t = e, l = t.alternate;
  switch (t.tag) {
    case 15:
    case 0:
      t = yf(
        l,
        t,
        t.pendingProps,
        t.type,
        void 0,
        le
      );
      break;
    case 11:
      t = yf(
        l,
        t,
        t.pendingProps,
        t.type.render,
        t.ref,
        le
      );
      break;
    case 5:
      Mo(t);
      var a = t;
      a === Ye && (P ? (qi(a), a.tag === 5 && a.stateNode != null && (xe = a.stateNode)) : (qi(a), P = !0));
    default:
      Pg(l, t), t = te = eg(t, gl), t = Wg(l, t, gl);
  }
  e.memoizedProps = e.pendingProps, t === null ? zc(e) : te = t;
}
function Ka(e, t, l, a) {
  cl = wa = null, Mo(t), Ja = null, hs = 0;
  var s = t.return;
  try {
    if (Rx(
      e,
      s,
      t,
      l,
      le
    )) {
      De = 1, Ji(
        e,
        Dt(l, e.current)
      ), te = null;
      return;
    }
  } catch (i) {
    if (s !== null) throw te = s, i;
    De = 1, Ji(
      e,
      Dt(l, e.current)
    ), te = null;
    return;
  }
  t.flags & 32768 ? (P || a === 1 ? e = !0 : bn || le & 536870912 ? e = !1 : (Al = e = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = Ze.current, a !== null && a.tag === 13 && (a.flags |= 16384))), Op(t, e)) : zc(t);
}
function zc(e) {
  var t = e;
  do {
    if (t.flags & 32768) {
      Op(
        t,
        Al
      );
      return;
    }
    e = t.return;
    var l = Hx(
      t.alternate,
      t,
      gl
    );
    if (l !== null) {
      te = l;
      return;
    }
    if (t = t.sibling, t !== null) {
      te = t;
      return;
    }
    te = t = e;
  } while (t !== null);
  De === 0 && (De = 5);
}
function Op(e, t) {
  do {
    var l = Yx(e.alternate, e);
    if (l !== null) {
      l.flags &= 32767, te = l;
      return;
    }
    if (l = e.return, l !== null && (l.flags |= 32768, l.subtreeFlags = 0, l.deletions = null), !t && (e = e.sibling, e !== null)) {
      te = e;
      return;
    }
    te = e = l;
  } while (e !== null);
  De = 6, te = null;
}
function Af(e, t, l, a, s, i, c, u, r, d, m, f) {
  e.cancelPendingCommit = null;
  do
    Mc();
  while (Te !== 0);
  if (ie & 6) throw Error(B(327));
  if (t !== null) {
    if (t === e.current) throw Error(B(177));
    e === pe && (te = pe = null, le = 0), xa = t, Bt = e, Wt = l, Cr = s, Sp = a, Jx(
      e,
      t,
      l,
      c,
      u,
      r,
      f
    );
  }
}
function Jx(e, t, l, a, s, i, c) {
  var u = t.lanes | t.childLanes;
  if (wr = u, u |= xo, bv(
    e,
    l,
    u,
    a,
    s,
    i
  ), Pa = null, (l & 335544064) === l ? (en = Sx(e), a = 10262) : (en = null, a = 10256), t.subtreeFlags & a || t.flags & a ? (e.callbackNode = null, e.callbackPriority = 0, tj(Ui, function() {
    return kr(), null;
  })) : (e.callbackNode = null, e.callbackPriority = 0), Wi = !1, a = (t.flags & 13878) !== 0, t.subtreeFlags & 13878 || a) {
    a = X.T, X.T = null, s = ce.p, ce.p = 2, i = ie, ie |= 4;
    try {
      qx(e, t, l);
    } finally {
      ie = i, ce.p = s, X.T = a;
    }
  }
  Te = 1, Wi ? Wa = bj(
    c,
    e.containerInfo,
    en,
    Tr,
    Er,
    Ix,
    Dr,
    kr,
    Fx
  ) : (Tr(), Er(), Dr());
}
function Fx(e) {
  if (Te !== 0) {
    var t = Bt.onRecoverableError;
    t(e, { componentStack: null });
  }
}
function Ix() {
  Te === 3 && (Te = 0, pp(xa, Bt), Te = 4);
}
function Tr() {
  if (Te === 1) {
    Te = 0;
    var e = Bt, t = xa, l = Wt, a = (t.flags & 13878) !== 0;
    if (t.subtreeFlags & 13878 || a) {
      a = X.T, X.T = null;
      var s = ce.p;
      ce.p = 2;
      var i = ie;
      ie |= 4;
      try {
        Yn = Pi = !1, mp(t, e, l), l = Mr;
        var c = Xm(e.containerInfo), u = l.focusedElem, r = l.selectionRange;
        if (c !== u && u && u.ownerDocument && Vm(
          u.ownerDocument.documentElement,
          u
        )) {
          if (r !== null && vo(u)) {
            var d = r.start, m = r.end;
            if (m === void 0 && (m = d), "selectionStart" in u)
              u.selectionStart = d, u.selectionEnd = Math.min(
                m,
                u.value.length
              );
            else {
              var f = u.ownerDocument || document, o = f && f.defaultView || window;
              if (o.getSelection) {
                var h = o.getSelection(), v = u.textContent.length, x = Math.min(r.start, v), C = r.end === void 0 ? x : Math.min(r.end, v);
                !h.extend && x > C && (c = C, C = x, x = c);
                var p = Vd(
                  u,
                  x
                ), y = Vd(
                  u,
                  C
                );
                if (p && y && (h.rangeCount !== 1 || h.anchorNode !== p.node || h.anchorOffset !== p.offset || h.focusNode !== y.node || h.focusOffset !== y.offset)) {
                  var S = f.createRange();
                  S.setStart(p.node, p.offset), h.removeAllRanges(), x > C ? (h.addRange(S), h.extend(y.node, y.offset)) : (S.setEnd(y.node, y.offset), h.addRange(S));
                }
              }
            }
          }
          for (f = [], h = u; h = h.parentNode; )
            h.nodeType === 1 && f.push({
              element: h,
              left: h.scrollLeft,
              top: h.scrollTop
            });
          for (typeof u.focus == "function" && u.focus(), u = 0; u < f.length; u++) {
            var w = f[u];
            w.element.scrollLeft = w.left, w.element.scrollTop = w.top;
          }
        }
        hn = !!zr, Mr = zr = null;
      } finally {
        ie = i, ce.p = s, X.T = a;
      }
    }
    e.current = t, Te = 2;
  }
}
function Er() {
  if (Te === 2) {
    Te = 0;
    var e = Bt, t = xa, l = (t.flags & 8772) !== 0;
    if (t.subtreeFlags & 8772 || l) {
      l = X.T, X.T = null;
      var a = ce.p;
      ce.p = 2;
      var s = ie;
      ie |= 4;
      try {
        up(e, t.alternate, t);
      } finally {
        ie = s, ce.p = a, X.T = l;
      }
    }
    Te = 3;
  }
}
function Dr() {
  if (Te === 4 || Te === 3) {
    Te = 0;
    var e = Wa;
    Wa = null, fv();
    var t = Bt, l = xa, a = Wt, s = Sp, i = (a & 335544064) === a ? 10262 : 10256;
    if (l.subtreeFlags & i || l.flags & i ? Te = 5 : (Te = 0, xa = Bt = null, zp(t, t.pendingLanes)), i = t.pendingLanes, i === 0 && (Yl = null), fo(a), l = l.stateNode, yt && typeof yt.onCommitFiberRoot == "function")
      try {
        yt.onCommitFiberRoot(
          Es,
          l,
          void 0,
          (l.current.flags & 128) === 128
        );
      } catch {
      }
    if (s !== null) {
      l = X.T, i = ce.p, ce.p = 2, X.T = null;
      try {
        for (var c = t.onRecoverableError, u = 0; u < s.length; u++) {
          var r = s[u];
          c(r.value, {
            componentStack: r.stack
          });
        }
      } finally {
        X.T = l, ce.p = i;
      }
    }
    if (s = Pa, c = en, en = null, s !== null && (Pa = null, c === null && (c = []), e !== null))
      for (r = 0; r < s.length; r++)
        l = (0, s[r])(
          c
        ), l !== void 0 && e.finished.finally(l);
    Wt & 3 && Mc(), ll(t), i = t.pendingLanes, a & 261930 && i & 42 ? t === Si ? ss++ : (ss = 0, Si = t) : (ss = 0, Si = null), Rs(0);
  }
}
function zp(e, t) {
  (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, zs(t)));
}
function Mc() {
  return Wa !== null && (Wa.skipTransition(), Wa = null), Tr(), Er(), Dr(), kr();
}
function kr() {
  if (Te !== 5) return !1;
  var e = Bt, t = wr;
  wr = 0;
  var l = fo(Wt), a = X.T, s = ce.p;
  try {
    ce.p = 32 > l ? 32 : l, X.T = null, l = Cr, Cr = null;
    var i = Bt, c = Wt;
    if (Te = 0, xa = Bt = null, Wt = 0, ie & 6) throw Error(B(331));
    var u = ie;
    if (ie |= 4, jp(i.current), yp(
      i,
      i.current,
      c,
      l
    ), ie = u, Rs(0, !1), yt && typeof yt.onPostCommitFiberRoot == "function")
      try {
        yt.onPostCommitFiberRoot(Es, i);
      } catch {
      }
    return !0;
  } finally {
    ce.p = s, X.T = a, zp(e, t);
  }
}
function Of(e, t, l) {
  t = Dt(l, t), t = ur(e.stateNode, t, 2), e = Ll(e, t, 2), e !== null && (ks(e, 2), ll(e));
}
function fe(e, t, l) {
  if (e.tag === 3)
    Of(e, e, l);
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Of(
          t,
          e,
          l
        );
        break;
      } else if (t.tag === 1) {
        var a = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (Yl === null || !Yl.has(a))) {
          e = Dt(l, e), l = Qg(2), a = Ll(t, l, 2), a !== null && (Zg(
            l,
            a,
            t,
            e
          ), ks(a, 2), ll(a));
          break;
        }
      }
      t = t.return;
    }
}
function du(e, t, l) {
  var a = e.pingCache;
  if (a === null) {
    a = e.pingCache = new Kx();
    var s = /* @__PURE__ */ new Set();
    a.set(t, s);
  } else
    s = a.get(t), s === void 0 && (s = /* @__PURE__ */ new Set(), a.set(t, s));
  s.has(l) || (Jo = !0, s.add(l), e = Wx.bind(null, e, t, l), t.then(e, e));
}
function Wx(e, t, l) {
  var a = e.pingCache;
  a !== null && a.delete(t), e.pingedLanes |= e.suspendedLanes & l, e.warmLanes &= ~l, pe === e && (le & l) === l && (De === 4 || De === 3 && (le & 62914560) === le && 300 > pt() - Ac ? ie & 2 ? ec |= l : un(e, 0) : ec |= l, sn === le && (sn = 0)), ll(e);
}
function Mp(e, t) {
  t === 0 && (t = Sm()), e = Sa(e, t), e !== null && (ks(e, t), ll(e));
}
function Px(e) {
  var t = e.memoizedState, l = 0;
  t !== null && (l = t.retryLane), Mp(e, l);
}
function ej(e, t) {
  var l = 0;
  switch (e.tag) {
    case 31:
    case 13:
      var a = e.stateNode, s = e.memoizedState;
      s !== null && (l = s.retryLane);
      break;
    case 19:
      a = e.stateNode;
      break;
    case 22:
      a = e.stateNode._retryCache;
      break;
    default:
      throw Error(B(314));
  }
  a !== null && a.delete(t), Mp(e, l);
}
function tj(e, t) {
  return ro(e, t);
}
var rn = null, za = null, Ar = !1, nc = !1, fu = !1, zl = 0;
function ll(e) {
  e !== za && e.next === null && (za === null ? rn = za = e : za = za.next = e), nc = !0, Ar || (Ar = !0, aj());
}
function Rs(e, t) {
  if (!fu && nc) {
    fu = !0;
    do
      for (var l = !1, a = rn; a !== null; ) {
        if (e !== 0) {
          var s = a.pendingLanes;
          if (s === 0) var i = 0;
          else {
            var c = a.suspendedLanes, u = a.pingedLanes;
            i = (1 << 31 - vt(42 | e) + 1) - 1, i &= s & ~(c & ~u), i = i & 201326741 ? i & 201326741 | 1 : i ? i | 2 : 0;
          }
          i !== 0 && (l = !0, zf(a, i));
        } else
          i = le, i = pc(
            a,
            a === pe ? i : 0,
            a.cancelPendingCommit !== null || a.timeoutHandle !== -1
          ), !(i & 3) || Ds(a, i) || (l = !0, zf(a, i));
        a = a.next;
      }
    while (l);
    fu = !1;
  }
}
function lj() {
  _p();
}
function _p() {
  nc = Ar = !1;
  var e = 0;
  zl !== 0 && mj() && (e = zl);
  for (var t = pt(), l = null, a = rn; a !== null; ) {
    var s = a.next, i = Rp(a, t);
    i === 0 ? (a.next = null, l === null ? rn = s : l.next = s, s === null && (za = l)) : (l = a, (e !== 0 || i & 3) && (nc = !0)), a = s;
  }
  Te !== 0 && Te !== 5 || Rs(e), zl !== 0 && (zl = 0);
}
function Rp(e, t) {
  for (var l = e.suspendedLanes, a = e.pingedLanes, s = e.expirationTimes, i = e.pendingLanes & -62914561; 0 < i; ) {
    var c = 31 - vt(i), u = 1 << c, r = s[c];
    r === -1 ? (!(u & l) || u & a) && (s[c] = jv(u, t)) : r <= t && (e.expiredLanes |= u), i &= ~u;
  }
  if (t = pe, l = le, l = pc(
    e,
    e === t ? l : 0,
    e.cancelPendingCommit !== null || e.timeoutHandle !== -1
  ), a = e.callbackNode, l === 0 || e === t && (oe === 2 || oe === 9) || e.cancelPendingCommit !== null)
    return a !== null && a !== null && $c(a), e.callbackNode = null, e.callbackPriority = 0;
  if (!(l & 3) || Ds(e, l)) {
    if (t = l & -l, t === e.callbackPriority) return t;
    switch (a !== null && $c(a), fo(l)) {
      case 2:
      case 8:
        l = jm;
        break;
      case 32:
        l = Ui;
        break;
      case 268435456:
        l = bm;
        break;
      default:
        l = Ui;
    }
    return a = Up.bind(null, e), l = ro(l, a), e.callbackPriority = t, e.callbackNode = l, t;
  }
  return a !== null && a !== null && $c(a), e.callbackPriority = 2, e.callbackNode = null, 2;
}
function Up(e, t) {
  if (Te !== 0 && Te !== 5)
    return e.callbackNode = null, e.callbackPriority = 0, null;
  var l = e.callbackNode;
  if (Mc() && e.callbackNode !== l)
    return null;
  var a = le;
  return a = pc(
    e,
    e === pe ? a : 0,
    e.cancelPendingCommit !== null || e.timeoutHandle !== -1
  ), a === 0 ? null : (Cp(e, a, t), Rp(e, pt()), e.callbackNode != null && e.callbackNode === l ? Up.bind(null, e) : null);
}
function zf(e, t) {
  if (Mc()) return null;
  Cp(e, t, !0);
}
function aj() {
  pj(function() {
    ie & 6 ? ro(
      xm,
      lj
    ) : _p();
  });
}
function Io() {
  if (zl === 0) {
    var e = ga;
    e === 0 && (e = Ys, Ys <<= 1, !(Ys & 261888) && (Ys = 256)), zl = e;
  }
  return zl;
}
function Mf(e) {
  return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : di(e);
}
function nj(e, t, l, a, s) {
  if (t === "submit" && l && l.stateNode === s) {
    var i = Mf(
      (s[ot] || null).action
    ), c = a.submitter;
    c && (t = (t = c[ot] || null) ? Mf(t.formAction) : c.getAttribute("formAction"), t !== null && (i = t, c = null));
    var u = new vc(
      "action",
      "action",
      null,
      a,
      s
    );
    e.push({
      event: u,
      listeners: [
        {
          instance: null,
          listener: function() {
            if (a.defaultPrevented) {
              if (zl !== 0) {
                var r = new FormData(s, c);
                ir(
                  l,
                  {
                    pending: !0,
                    data: r,
                    method: s.method,
                    action: i
                  },
                  null,
                  r
                );
              }
            } else
              typeof i == "function" && (u.preventDefault(), r = new FormData(s, c), ir(
                l,
                {
                  pending: !0,
                  data: r,
                  method: s.method,
                  action: i
                },
                i,
                r
              ));
          },
          currentTarget: s
        }
      ]
    });
  }
}
for (var hu = 0; hu < Ju.length; hu++) {
  var mu = Ju[hu], sj = mu.toLowerCase(), ij = mu[0].toUpperCase() + mu.slice(1);
  Yt(
    sj,
    "on" + ij
  );
}
Yt(Zm, "onAnimationEnd");
Yt(Jm, "onAnimationIteration");
Yt(Fm, "onAnimationStart");
Yt("dblclick", "onDoubleClick");
Yt("focusin", "onFocus");
Yt("focusout", "onBlur");
Yt(gx, "onTransitionRun");
Yt(px, "onTransitionStart");
Yt(yx, "onTransitionCancel");
Yt(Im, "onTransitionEnd");
ln("onMouseEnter", ["mouseout", "mouseover"]);
ln("onMouseLeave", ["mouseout", "mouseover"]);
ln("onPointerEnter", ["pointerout", "pointerover"]);
ln("onPointerLeave", ["pointerout", "pointerover"]);
ba(
  "onChange",
  "change click focusin focusout input keydown keyup selectionchange".split(" ")
);
ba(
  "onSelect",
  "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
    " "
  )
);
ba("onBeforeInput", [
  "compositionend",
  "keypress",
  "textInput",
  "paste"
]);
ba(
  "onCompositionEnd",
  "compositionend focusout keydown keypress keyup mousedown".split(" ")
);
ba(
  "onCompositionStart",
  "compositionstart focusout keydown keypress keyup mousedown".split(" ")
);
ba(
  "onCompositionUpdate",
  "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
);
var ps = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
  " "
), cj = new Set(
  "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(ps)
);
function Lp(e, t) {
  t = (t & 4) !== 0;
  for (var l = 0; l < e.length; l++) {
    var a = e[l], s = a.event;
    a = a.listeners;
    e: {
      var i = void 0;
      if (t)
        for (var c = a.length - 1; 0 <= c; c--) {
          var u = a[c], r = u.instance, d = u.currentTarget;
          if (u = u.listener, r !== i && s.isPropagationStopped())
            break e;
          i = u, s.currentTarget = d;
          try {
            i(s);
          } catch (m) {
            Bi(m);
          }
          s.currentTarget = null, i = r;
        }
      else
        for (c = 0; c < a.length; c++) {
          if (u = a[c], r = u.instance, d = u.currentTarget, u = u.listener, r !== i && s.isPropagationStopped())
            break e;
          i = u, s.currentTarget = d;
          try {
            i(s);
          } catch (m) {
            Bi(m);
          }
          s.currentTarget = null, i = r;
        }
    }
  }
}
function ee(e, t) {
  var l = t[Ed];
  l === void 0 && (l = t[Ed] = /* @__PURE__ */ new Set());
  var a = e + "__bubble";
  l.has(a) || (Bp(t, e, 2, !1), l.add(a));
}
function gu(e, t, l) {
  var a = 0;
  t && (a |= 4), Bp(
    l,
    e,
    a,
    t
  );
}
var Ps = "_reactListening" + Math.random().toString(36).slice(2);
function Wo(e) {
  if (!e[Ps]) {
    e[Ps] = !0, km.forEach(function(l) {
      l !== "selectionchange" && (cj.has(l) || gu(l, !1, e), gu(l, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Ps] || (t[Ps] = !0, gu("selectionchange", !1, t));
  }
}
function Bp(e, t, l, a) {
  switch (cy(t)) {
    case 2:
      var s = Pj;
      break;
    case 8:
      s = eb;
      break;
    default:
      s = sd;
  }
  l = s.bind(
    null,
    t,
    l,
    e
  ), s = void 0, !Vu || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (s = !0), a ? s !== void 0 ? e.addEventListener(t, l, {
    capture: !0,
    passive: s
  }) : e.addEventListener(t, l, !0) : s !== void 0 ? e.addEventListener(t, l, {
    passive: s
  }) : e.addEventListener(t, l, !1);
}
function pu(e, t, l, a, s) {
  var i = a;
  if (!(t & 1) && !(t & 2) && a !== null)
    e: for (; ; ) {
      if (a === null) return;
      var c = a.tag;
      if (c === 3 || c === 4) {
        var u = a.stateNode.containerInfo;
        if (u === s) break;
        if (c === 4)
          for (c = a.return; c !== null; ) {
            var r = c.tag;
            if ((r === 3 || r === 4) && c.stateNode.containerInfo === s)
              return;
            c = c.return;
          }
        for (; u !== null; ) {
          if (c = sa(u), c === null) return;
          if (r = c.tag, r === 5 || r === 6 || r === 26 || r === 27) {
            a = i = c;
            continue e;
          }
          u = u.parentNode;
        }
      }
      a = a.return;
    }
  Lm(function() {
    var d = i, m = mo(l), f = [];
    e: {
      var o = Wm.get(e);
      if (o !== void 0) {
        var h = vc, v = e;
        switch (e) {
          case "keypress":
            if (hi(l) === 0) break e;
          case "keydown":
          case "keyup":
            h = Vv;
            break;
          case "focusin":
            v = "focus", h = Jc;
            break;
          case "focusout":
            v = "blur", h = Jc;
            break;
          case "beforeblur":
          case "afterblur":
            h = Jc;
            break;
          case "click":
            if (l.button === 2) break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            h = Rd;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            h = Mv;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            h = Fv;
            break;
          case Zm:
          case Jm:
          case Fm:
            h = Uv;
            break;
          case Im:
            h = Wv;
            break;
          case "scroll":
          case "scrollend":
            h = Ov;
            break;
          case "wheel":
            h = ex;
            break;
          case "copy":
          case "cut":
          case "paste":
            h = Bv;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            h = Ld;
            break;
          case "submit":
            h = Zv;
            break;
          case "toggle":
          case "beforetoggle":
            h = lx;
        }
        var x = (t & 4) !== 0, C = !x && (e === "scroll" || e === "scrollend"), p = x ? o !== null ? o + "Capture" : null : o;
        x = [];
        for (var y = d, S; y !== null; ) {
          var w = y;
          if (S = w.stateNode, w = w.tag, w !== 5 && w !== 26 && w !== 27 || S === null || p === null || (w = us(y, p), w != null && x.push(
            ys(y, w, S)
          )), C) break;
          y = y.return;
        }
        0 < x.length && (o = new h(
          o,
          v,
          null,
          l,
          m
        ), f.push({ event: o, listeners: x }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (h = e === "mouseover" || e === "pointerover", o = e === "mouseout" || e === "pointerout", h && l !== Ku && (v = l.relatedTarget || l.fromElement) && (sa(v) || v[yn]))
          break e;
        (o || h) && (v = m.window === m ? m : (h = m.ownerDocument) ? h.defaultView || h.parentWindow : window, o ? (h = l.relatedTarget || l.toElement, o = d, h = h ? sa(h) : null, h !== null && (C = Ts(h), x = h.tag, h !== C || x !== 5 && x !== 27 && x !== 6) && (h = null)) : (o = null, h = d), o !== h && (x = Rd, w = "onMouseLeave", p = "onMouseEnter", y = "mouse", (e === "pointerout" || e === "pointerover") && (x = Ld, w = "onPointerLeave", p = "onPointerEnter", y = "pointer"), C = o == null ? v : Bn(o), S = h == null ? v : Bn(h), v = new x(
          w,
          y + "leave",
          o,
          l,
          m
        ), v.target = C, v.relatedTarget = S, w = null, sa(m) === d && (x = new x(
          p,
          y + "enter",
          h,
          l,
          m
        ), x.target = S, x.relatedTarget = C, w = x), C = w, x = o && h ? zu(
          o,
          h,
          uj
        ) : null, o !== null && _f(
          f,
          v,
          o,
          x,
          !1
        ), h !== null && C !== null && _f(
          f,
          C,
          h,
          x,
          !0
        )));
      }
      e: {
        if (o = d ? Bn(d) : window, h = o.nodeName && o.nodeName.toLowerCase(), h === "select" || h === "input" && o.type === "file")
          var D = qd;
        else if (Yd(o))
          if ($m)
            D = fx;
          else {
            D = ox;
            var U = rx;
          }
        else
          h = o.nodeName, !h || h.toLowerCase() !== "input" || o.type !== "checkbox" && o.type !== "radio" ? d && ho(d.elementType) && (D = qd) : D = dx;
        if (D && (D = D(e, d))) {
          Gm(
            f,
            D,
            l,
            m
          );
          break e;
        }
        U && U(e, o, d);
      }
      switch (U = d ? Bn(d) : window, e) {
        case "focusin":
          (Yd(U) || U.contentEditable === "true") && (Ba = U, Qu = d, Jn = null);
          break;
        case "focusout":
          Jn = Qu = Ba = null;
          break;
        case "mousedown":
          Zu = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Zu = !1, Xd(f, l, m);
          break;
        case "selectionchange":
          if (mx) break;
        case "keydown":
        case "keyup":
          Xd(f, l, m);
      }
      var N;
      if (yo)
        e: {
          switch (e) {
            case "compositionstart":
              var _ = "onCompositionStart";
              break e;
            case "compositionend":
              _ = "onCompositionEnd";
              break e;
            case "compositionupdate":
              _ = "onCompositionUpdate";
              break e;
          }
          _ = void 0;
        }
      else
        La ? Ym(e, l) && (_ = "onCompositionEnd") : e === "keydown" && l.keyCode === 229 && (_ = "onCompositionStart");
      _ && (Hm && l.locale !== "ko" && (La || _ !== "onCompositionStart" ? _ === "onCompositionEnd" && La && (N = Bm()) : (Dl = m, go = "value" in Dl ? Dl.value : Dl.textContent, La = !0)), U = sc(d, _), 0 < U.length && (_ = new Ud(
        _,
        e,
        null,
        l,
        m
      ), f.push({ event: _, listeners: U }), N ? _.data = N : (N = qm(l), N !== null && (_.data = N)))), (N = nx ? sx(e, l) : ix(e, l)) && (_ = sc(d, "onBeforeInput"), 0 < _.length && (U = new Ud(
        "onBeforeInput",
        "beforeinput",
        null,
        l,
        m
      ), f.push({
        event: U,
        listeners: _
      }), U.data = N)), nj(
        f,
        e,
        d,
        l,
        m
      );
    }
    Lp(f, t);
  });
}
function ys(e, t, l) {
  return {
    instance: e,
    listener: t,
    currentTarget: l
  };
}
function sc(e, t) {
  for (var l = t + "Capture", a = []; e !== null; ) {
    var s = e, i = s.stateNode;
    if (s = s.tag, s !== 5 && s !== 26 && s !== 27 || i === null || (s = us(e, l), s != null && a.unshift(
      ys(e, s, i)
    ), s = us(e, t), s != null && a.push(
      ys(e, s, i)
    )), e.tag === 3) return a;
    e = e.return;
  }
  return [];
}
function uj(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5 && e.tag !== 27);
  return e || null;
}
function _f(e, t, l, a, s) {
  for (var i = t._reactName, c = []; l !== null && l !== a; ) {
    var u = l, r = u.alternate, d = u.stateNode;
    if (u = u.tag, r !== null && r === a) break;
    u !== 5 && u !== 26 && u !== 27 || d === null || (r = d, s ? (d = us(l, i), d != null && c.unshift(
      ys(l, d, r)
    )) : s || (d = us(l, i), d != null && c.push(
      ys(l, d, r)
    ))), l = l.return;
  }
  c.length !== 0 && e.push({ event: t, listeners: c });
}
var rj = /\r\n?/g, oj = /\u0000|\uFFFD/g;
function Rf(e) {
  return (typeof e == "string" ? e : "" + e).replace(rj, `
`).replace(oj, "");
}
function Hp(e, t) {
  return t = Rf(t), Rf(e) === t;
}
function de(e, t, l, a, s, i) {
  switch (l) {
    case "children":
      if (typeof a == "string")
        t === "body" || t === "textarea" && a === "" || an(e, a);
      else if (typeof a == "number" || typeof a == "bigint")
        t !== "body" && an(e, "" + a);
      else return;
      break;
    case "className":
      $s(e, "class", a);
      break;
    case "tabIndex":
      $s(e, "tabindex", a);
      break;
    case "dir":
    case "role":
    case "viewBox":
    case "width":
    case "height":
      $s(e, l, a);
      break;
    case "style":
      Um(e, a, i);
      return;
    case "data":
      if (t !== "object") {
        $s(e, "data", a);
        break;
      }
    case "src":
    case "href":
      if (a === "" && (t !== "a" || l !== "href")) {
        e.removeAttribute(l);
        break;
      }
      if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
        e.removeAttribute(l);
        break;
      }
      a = di(a), e.setAttribute(l, a);
      break;
    case "action":
    case "formAction":
      if (typeof a == "function") {
        e.setAttribute(
          l,
          "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
        );
        break;
      } else
        typeof i == "function" && (l === "formAction" ? (t !== "input" && de(e, t, "name", s.name, s, null), de(
          e,
          t,
          "formEncType",
          s.formEncType,
          s,
          null
        ), de(
          e,
          t,
          "formMethod",
          s.formMethod,
          s,
          null
        ), de(
          e,
          t,
          "formTarget",
          s.formTarget,
          s,
          null
        )) : (de(e, t, "encType", s.encType, s, null), de(e, t, "method", s.method, s, null), de(e, t, "target", s.target, s, null)));
      if (a == null || typeof a == "symbol" || typeof a == "boolean") {
        e.removeAttribute(l);
        break;
      }
      a = di(a), e.setAttribute(l, a);
      break;
    case "onClick":
      a != null && (e.onclick = Zt);
      return;
    case "onScroll":
      a != null && ee("scroll", e);
      return;
    case "onScrollEnd":
      a != null && ee("scrollend", e);
      return;
    case "dangerouslySetInnerHTML":
      if (a != null) {
        if (typeof a != "object" || !("__html" in a))
          throw Error(B(61));
        if (l = a.__html, l != null) {
          if (s.children != null) throw Error(B(60));
          (i != null ? i.__html : void 0) !== l && (e.innerHTML = l);
        }
      }
      break;
    case "multiple":
      e.multiple = a && typeof a != "function" && typeof a != "symbol";
      break;
    case "muted":
      e.muted = a && typeof a != "function" && typeof a != "symbol";
      break;
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "defaultValue":
    case "defaultChecked":
    case "innerHTML":
    case "ref":
      break;
    case "autoFocus":
      break;
    case "xlinkHref":
      if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
        e.removeAttribute("xlink:href");
        break;
      }
      l = di(a), e.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        l
      );
      break;
    case "contentEditable":
    case "spellCheck":
    case "draggable":
    case "value":
    case "autoReverse":
    case "externalResourcesRequired":
    case "focusable":
    case "preserveAlpha":
      a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, a) : e.removeAttribute(l);
      break;
    case "inert":
    case "allowFullScreen":
    case "async":
    case "autoPlay":
    case "controls":
    case "credentialless":
    case "default":
    case "defer":
    case "disabled":
    case "disablePictureInPicture":
    case "disableRemotePlayback":
    case "formNoValidate":
    case "hidden":
    case "loop":
    case "noModule":
    case "noValidate":
    case "open":
    case "playsInline":
    case "readOnly":
    case "required":
    case "reversed":
    case "scoped":
    case "seamless":
    case "itemScope":
      a && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, "") : e.removeAttribute(l);
      break;
    case "capture":
    case "download":
      a === !0 ? e.setAttribute(l, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, a) : e.removeAttribute(l);
      break;
    case "cols":
    case "rows":
    case "size":
    case "span":
      a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? e.setAttribute(l, a) : e.removeAttribute(l);
      break;
    case "rowSpan":
    case "start":
      a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? e.removeAttribute(l) : e.setAttribute(l, a);
      break;
    case "popover":
      ee("beforetoggle", e), ee("toggle", e), oi(e, "popover", a);
      break;
    case "xlinkActuate":
      nl(
        e,
        "http://www.w3.org/1999/xlink",
        "xlink:actuate",
        a
      );
      break;
    case "xlinkArcrole":
      nl(
        e,
        "http://www.w3.org/1999/xlink",
        "xlink:arcrole",
        a
      );
      break;
    case "xlinkRole":
      nl(
        e,
        "http://www.w3.org/1999/xlink",
        "xlink:role",
        a
      );
      break;
    case "xlinkShow":
      nl(
        e,
        "http://www.w3.org/1999/xlink",
        "xlink:show",
        a
      );
      break;
    case "xlinkTitle":
      nl(
        e,
        "http://www.w3.org/1999/xlink",
        "xlink:title",
        a
      );
      break;
    case "xlinkType":
      nl(
        e,
        "http://www.w3.org/1999/xlink",
        "xlink:type",
        a
      );
      break;
    case "xmlBase":
      nl(
        e,
        "http://www.w3.org/XML/1998/namespace",
        "xml:base",
        a
      );
      break;
    case "xmlLang":
      nl(
        e,
        "http://www.w3.org/XML/1998/namespace",
        "xml:lang",
        a
      );
      break;
    case "xmlSpace":
      nl(
        e,
        "http://www.w3.org/XML/1998/namespace",
        "xml:space",
        a
      );
      break;
    case "is":
      oi(e, "is", a);
      break;
    case "innerText":
    case "textContent":
      return;
    default:
      if (!(2 < l.length) || l[0] !== "o" && l[0] !== "O" || l[1] !== "n" && l[1] !== "N")
        l = kv.get(l) || l, oi(e, l, a);
      else return;
  }
  ne = !0;
}
function Or(e, t, l, a, s, i) {
  switch (l) {
    case "style":
      Um(e, a, i);
      return;
    case "dangerouslySetInnerHTML":
      if (a != null) {
        if (typeof a != "object" || !("__html" in a))
          throw Error(B(61));
        if (l = a.__html, l != null) {
          if (s.children != null) throw Error(B(60));
          (i != null ? i.__html : void 0) !== l && (e.innerHTML = l);
        }
      }
      break;
    case "children":
      if (typeof a == "string") an(e, a);
      else if (typeof a == "number" || typeof a == "bigint")
        an(e, "" + a);
      else return;
      break;
    case "onScroll":
      a != null && ee("scroll", e);
      return;
    case "onScrollEnd":
      a != null && ee("scrollend", e);
      return;
    case "onClick":
      a != null && (e.onclick = Zt);
      return;
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "innerHTML":
    case "ref":
      return;
    case "innerText":
    case "textContent":
      return;
    default:
      if (!Am.hasOwnProperty(l))
        e: {
          if (l[0] === "o" && l[1] === "n" && (s = l.endsWith("Capture"), i = l.slice(2, s ? l.length - 7 : void 0), t = e[ot] || null, t = t != null ? t[l] : null, typeof t == "function" && e.removeEventListener(i, t, s), typeof a == "function")) {
            typeof t != "function" && t !== null && (l in e ? e[l] = null : e.hasAttribute(l) && e.removeAttribute(l)), e.addEventListener(i, a, s);
            break e;
          }
          ne = !0, l in e ? e[l] = a : a === !0 ? e.setAttribute(l, "") : oi(e, l, a);
        }
      return;
  }
  ne = !0;
}
function Qe(e, t, l) {
  switch (t) {
    case "div":
    case "span":
    case "svg":
    case "path":
    case "a":
    case "g":
    case "p":
    case "li":
      break;
    case "img":
      ee("error", e), ee("load", e);
      var a = !1, s = !1, i;
      for (i in l)
        if (l.hasOwnProperty(i)) {
          var c = l[i];
          if (c != null)
            switch (i) {
              case "src":
                a = !0;
                break;
              case "srcSet":
                s = !0;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(B(137, t));
              default:
                de(e, t, i, c, l, null);
            }
        }
      s && de(e, t, "srcSet", l.srcSet, l, null), a && de(e, t, "src", l.src, l, null);
      return;
    case "input":
      ee("invalid", e);
      var u = i = c = s = null, r = null, d = null;
      for (a in l)
        if (l.hasOwnProperty(a)) {
          var m = l[a];
          if (m != null)
            switch (a) {
              case "name":
                s = m;
                break;
              case "type":
                c = m;
                break;
              case "checked":
                r = m;
                break;
              case "defaultChecked":
                d = m;
                break;
              case "value":
                i = m;
                break;
              case "defaultValue":
                u = m;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (m != null)
                  throw Error(B(137, t));
                break;
              default:
                de(e, t, a, m, l, null);
            }
        }
      Mm(
        e,
        i,
        u,
        r,
        d,
        c,
        s,
        !1
      );
      return;
    case "select":
      ee("invalid", e), a = c = i = null;
      for (s in l)
        if (l.hasOwnProperty(s) && (u = l[s], u != null))
          switch (s) {
            case "value":
              i = u;
              break;
            case "defaultValue":
              c = u;
              break;
            case "multiple":
              a = u;
            default:
              de(e, t, s, u, l, null);
          }
      t = i, l = c, e.multiple = !!a, t != null ? Xa(e, !!a, t, !1) : l != null && Xa(e, !!a, l, !0);
      return;
    case "textarea":
      ee("invalid", e), i = s = a = null;
      for (c in l)
        if (l.hasOwnProperty(c) && (u = l[c], u != null))
          switch (c) {
            case "value":
              a = u;
              break;
            case "defaultValue":
              s = u;
              break;
            case "children":
              i = u;
              break;
            case "dangerouslySetInnerHTML":
              if (u != null) throw Error(B(91));
              break;
            default:
              de(e, t, c, u, l, null);
          }
      Rm(e, a, s, i);
      return;
    case "option":
      for (r in l)
        if (l.hasOwnProperty(r) && (a = l[r], a != null))
          switch (r) {
            case "selected":
              e.selected = a && typeof a != "function" && typeof a != "symbol";
              break;
            default:
              de(e, t, r, a, l, null);
          }
      return;
    case "dialog":
      ee("beforetoggle", e), ee("toggle", e), ee("cancel", e), ee("close", e);
      break;
    case "iframe":
    case "object":
      ee("load", e);
      break;
    case "video":
    case "audio":
      for (a = 0; a < ps.length; a++)
        ee(ps[a], e);
      break;
    case "image":
      ee("error", e), ee("load", e);
      break;
    case "details":
      ee("toggle", e);
      break;
    case "embed":
    case "source":
    case "link":
      ee("error", e), ee("load", e);
    case "area":
    case "base":
    case "br":
    case "col":
    case "hr":
    case "keygen":
    case "meta":
    case "param":
    case "track":
    case "wbr":
    case "menuitem":
      for (d in l)
        if (l.hasOwnProperty(d) && (a = l[d], a != null))
          switch (d) {
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(B(137, t));
            default:
              de(e, t, d, a, l, null);
          }
      return;
    default:
      if (ho(t)) {
        for (m in l)
          l.hasOwnProperty(m) && (a = l[m], a !== void 0 && Or(
            e,
            t,
            m,
            a,
            l,
            void 0
          ));
        return;
      }
  }
  for (u in l)
    l.hasOwnProperty(u) && (a = l[u], a != null && de(e, t, u, a, l, null));
}
var dj = {};
function fj(e, t, l, a) {
  switch (t) {
    case "div":
    case "span":
    case "svg":
    case "path":
    case "a":
    case "g":
    case "p":
    case "li":
      break;
    case "input":
      var s = null, i = null, c = null, u = null, r = null, d = null, m = null;
      for (h in l) {
        var f = l[h];
        if (l.hasOwnProperty(h) && f != null)
          switch (h) {
            case "checked":
              break;
            case "value":
              break;
            case "defaultValue":
              r = f;
            default:
              a.hasOwnProperty(h) || de(e, t, h, null, a, f);
          }
      }
      for (var o in a) {
        var h = a[o];
        if (f = l[o], a.hasOwnProperty(o) && (h != null || f != null))
          switch (o) {
            case "type":
              h !== f && (ne = !0), i = h;
              break;
            case "name":
              h !== f && (ne = !0), s = h;
              break;
            case "checked":
              h !== f && (ne = !0), d = h;
              break;
            case "defaultChecked":
              h !== f && (ne = !0), m = h;
              break;
            case "value":
              h !== f && (ne = !0), c = h;
              break;
            case "defaultValue":
              h !== f && (ne = !0), u = h;
              break;
            case "children":
            case "dangerouslySetInnerHTML":
              if (h != null)
                throw Error(B(137, t));
              break;
            default:
              h !== f && de(
                e,
                t,
                o,
                h,
                a,
                f
              );
          }
      }
      $u(
        e,
        c,
        u,
        r,
        d,
        m,
        i,
        s
      );
      return;
    case "select":
      h = c = u = o = null;
      for (i in l)
        if (r = l[i], l.hasOwnProperty(i) && r != null)
          switch (i) {
            case "value":
              break;
            case "multiple":
              h = r;
            default:
              a.hasOwnProperty(i) || de(
                e,
                t,
                i,
                null,
                a,
                r
              );
          }
      for (s in a)
        if (i = a[s], r = l[s], a.hasOwnProperty(s) && (i != null || r != null))
          switch (s) {
            case "value":
              i !== r && (ne = !0), o = i;
              break;
            case "defaultValue":
              i !== r && (ne = !0), u = i;
              break;
            case "multiple":
              i !== r && (ne = !0), c = i;
            default:
              i !== r && de(
                e,
                t,
                s,
                i,
                a,
                r
              );
          }
      t = u, l = c, a = h, o != null ? Xa(e, !!l, o, !1) : !!a != !!l && (t != null ? Xa(e, !!l, t, !0) : Xa(e, !!l, l ? [] : "", !1));
      return;
    case "textarea":
      h = o = null;
      for (u in l)
        if (s = l[u], l.hasOwnProperty(u) && s != null && !a.hasOwnProperty(u))
          switch (u) {
            case "value":
              break;
            case "children":
              break;
            default:
              de(e, t, u, null, a, s);
          }
      for (c in a)
        if (s = a[c], i = l[c], a.hasOwnProperty(c) && (s != null || i != null))
          switch (c) {
            case "value":
              s !== i && (ne = !0), o = s;
              break;
            case "defaultValue":
              s !== i && (ne = !0), h = s;
              break;
            case "children":
              break;
            case "dangerouslySetInnerHTML":
              if (s != null) throw Error(B(91));
              break;
            default:
              s !== i && de(e, t, c, s, a, i);
          }
      _m(e, o, h);
      return;
    case "option":
      for (var v in l)
        if (o = l[v], l.hasOwnProperty(v) && o != null && !a.hasOwnProperty(v))
          switch (v) {
            case "selected":
              e.selected = !1;
              break;
            default:
              de(
                e,
                t,
                v,
                null,
                a,
                o
              );
          }
      for (r in a)
        if (o = a[r], h = l[r], a.hasOwnProperty(r) && o !== h && (o != null || h != null))
          switch (r) {
            case "selected":
              o !== h && (ne = !0), e.selected = o && typeof o != "function" && typeof o != "symbol";
              break;
            default:
              de(
                e,
                t,
                r,
                o,
                a,
                h
              );
          }
      return;
    case "img":
    case "link":
    case "area":
    case "base":
    case "br":
    case "col":
    case "embed":
    case "hr":
    case "keygen":
    case "meta":
    case "param":
    case "source":
    case "track":
    case "wbr":
    case "menuitem":
      for (var x in l)
        o = l[x], l.hasOwnProperty(x) && o != null && !a.hasOwnProperty(x) && de(e, t, x, null, a, o);
      for (d in a)
        if (o = a[d], h = l[d], a.hasOwnProperty(d) && o !== h && (o != null || h != null))
          switch (d) {
            case "children":
            case "dangerouslySetInnerHTML":
              if (o != null)
                throw Error(B(137, t));
              break;
            default:
              de(
                e,
                t,
                d,
                o,
                a,
                h
              );
          }
      return;
    default:
      if (ho(t)) {
        for (var C in l)
          o = l[C], l.hasOwnProperty(C) && o !== void 0 && !a.hasOwnProperty(C) && Or(
            e,
            t,
            C,
            void 0,
            a,
            o
          );
        for (m in a)
          o = a[m], h = l[m], !a.hasOwnProperty(m) || o === h || o === void 0 && h === void 0 || Or(
            e,
            t,
            m,
            o,
            a,
            h
          );
        return;
      }
  }
  for (var p in l)
    o = l[p], l.hasOwnProperty(p) && o != null && !a.hasOwnProperty(p) && de(e, t, p, null, a, o);
  for (f in a)
    o = a[f], h = l[f], !a.hasOwnProperty(f) || o === h || o == null && h == null || de(e, t, f, o, a, h);
}
function Uf(e) {
  switch (e) {
    case "css":
    case "script":
    case "font":
    case "img":
    case "image":
    case "input":
    case "link":
      return !0;
    default:
      return !1;
  }
}
function hj() {
  if (typeof performance.getEntriesByType == "function") {
    for (var e = 0, t = 0, l = performance.getEntriesByType("resource"), a = 0; a < l.length; a++) {
      var s = l[a], i = s.transferSize, c = s.initiatorType, u = s.duration;
      if (i && u && Uf(c)) {
        for (c = 0, u = s.responseEnd, a += 1; a < l.length; a++) {
          var r = l[a], d = r.startTime;
          if (d > u) break;
          var m = r.transferSize, f = r.initiatorType;
          m && Uf(f) && (r = r.responseEnd, c += m * (r < u ? 1 : (u - d) / (r - d)));
        }
        if (--a, t += 8 * (i + c) / (s.duration / 1e3), e++, 10 < e) break;
      }
    }
    if (0 < e) return t / e / 1e6;
  }
  return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
}
var zr = null, Mr = null;
function vs(e) {
  return e.nodeType === 9 ? e : e.ownerDocument;
}
function Lf(e) {
  switch (e) {
    case "http://www.w3.org/2000/svg":
      return 1;
    case "http://www.w3.org/1998/Math/MathML":
      return 2;
    default:
      return 0;
  }
}
function Yp(e, t) {
  if (e === 0)
    switch (t) {
      case "svg":
        return 1;
      case "math":
        return 2;
      default:
        return 0;
    }
  return e === 1 && t === "foreignObject" ? 0 : e;
}
function qp(e, t, l, a) {
  return l = vs(
    l
  ).createElement(e), l[$e] = a, l[ot] = t, Qe(l, e, t), He(l), l;
}
function _r(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var yu = null;
function mj() {
  var e = window.event;
  return e && e.type === "popstate" ? e === yu ? !1 : (yu = e, !0) : (yu = null, !1);
}
var Po = typeof setTimeout == "function" ? setTimeout : void 0, gj = typeof clearTimeout == "function" ? clearTimeout : void 0, Bf = typeof Promise == "function" ? Promise : void 0, Hf = typeof requestAnimationFrame == "function" ? requestAnimationFrame : Po, pj = typeof queueMicrotask == "function" ? queueMicrotask : typeof Bf < "u" ? function(e) {
  return Bf.resolve(null).then(e).catch(yj);
} : Po;
function yj(e) {
  setTimeout(function() {
    throw e;
  });
}
function Il(e) {
  return e === "head";
}
function Yf(e, t) {
  var l = t, a = 0;
  do {
    var s = l.nextSibling;
    if (e.removeChild(l), s && s.nodeType === 8)
      if (l = s.data, l === "/$" || l === "/&") {
        if (a === 0) {
          e.removeChild(s), mn(t);
          return;
        }
        a--;
      } else if (l === "$" || l === "$?" || l === "$~" || l === "$!" || l === "&")
        a++;
      else if (l === "html")
        xu(
          e.ownerDocument.documentElement
        );
      else if (l === "head") {
        l = e.ownerDocument.head, xu(l);
        for (var i = l.firstChild; i; ) {
          var c = i.nextSibling, u = i.nodeName;
          i[As] || u === "SCRIPT" || u === "STYLE" || u === "LINK" && i.rel.toLowerCase() === "stylesheet" || l.removeChild(i), i = c;
        }
      } else
        l === "body" && xu(e.ownerDocument.body);
    l = s;
  } while (l);
  mn(t);
}
function qf(e, t) {
  var l = e;
  e = 0;
  do {
    var a = l.nextSibling;
    if (l.nodeType === 1 ? t ? (l._stashedDisplay = l.style.display, l.style.display = "none") : (l.style.display = l._stashedDisplay || "", l.getAttribute("style") === "" && l.removeAttribute("style")) : l.nodeType === 3 && (t ? (l._stashedText = l.nodeValue, l.nodeValue = "") : l.nodeValue = l._stashedText || ""), a && a.nodeType === 8)
      if (l = a.data, l === "/$") {
        if (e === 0) break;
        e--;
      } else
        l !== "$" && l !== "$?" && l !== "$~" && l !== "$!" || e++;
    l = a;
  } while (l);
}
function Gp(e, t, l) {
  if (t = CSS.escape(t) !== t ? "r-" + btoa(t).replace(/=/g, "") : t, e.style.viewTransitionName = t, l != null && (e.style.viewTransitionClass = l), l = getComputedStyle(e), l.display === "inline") {
    if (t = e.getClientRects(), t.length === 1) var a = 1;
    else
      for (var s = a = 0; s < t.length; s++) {
        var i = t[s];
        0 < i.width && 0 < i.height && a++;
      }
    a === 1 && (e = e.style, e.display = t.length === 1 ? "inline-block" : "block", e.marginTop = "-" + l.paddingTop, e.marginBottom = "-" + l.paddingBottom);
  }
}
function $p(e, t) {
  e = e.style, t = t.style;
  var l = t != null ? t.hasOwnProperty("viewTransitionName") ? t.viewTransitionName : t.hasOwnProperty("view-transition-name") ? t["view-transition-name"] : null : null;
  e.viewTransitionName = l == null || typeof l == "boolean" ? "" : ("" + l).trim(), l = t != null ? t.hasOwnProperty("viewTransitionClass") ? t.viewTransitionClass : t.hasOwnProperty("view-transition-class") ? t["view-transition-class"] : null : null, e.viewTransitionClass = l == null || typeof l == "boolean" ? "" : ("" + l).trim(), e.display === "inline-block" && (t == null ? e.display = e.margin = "" : (l = t.display, e.display = l == null || typeof l == "boolean" ? "" : l, l = t.margin, l != null ? e.margin = l : (l = t.hasOwnProperty("marginTop") ? t.marginTop : t["margin-top"], e.marginTop = l == null || typeof l == "boolean" ? "" : l, t = t.hasOwnProperty("marginBottom") ? t.marginBottom : t["margin-bottom"], e.marginBottom = t == null || typeof t == "boolean" ? "" : t)));
}
function vj(e, t, l) {
  return l = l.ownerDocument.defaultView, {
    rect: e,
    abs: t.position === "absolute" || t.position === "fixed",
    clip: t.clipPath !== "none" || t.overflow !== "visible" || t.filter !== "none" || t.mask !== "none" || t.mask !== "none" || t.borderRadius !== "0px",
    view: 0 <= e.bottom && 0 <= e.right && e.top <= l.innerHeight && e.left <= l.innerWidth
  };
}
function Rr(e) {
  var t = e.getBoundingClientRect(), l = getComputedStyle(e);
  return vj(t, l, e);
}
function xj(e) {
  return e.documentElement.clientHeight;
}
function jj(e) {
  this.addEventListener("load", e), this.addEventListener("error", e);
}
function bj(e, t, l, a, s, i, c, u, r) {
  var d = t.nodeType === 9 ? t : t.ownerDocument;
  try {
    var m = d.startViewTransition({
      update: function() {
        var o = d.defaultView, h = o.navigation && o.navigation.transition, v = d.fonts.status;
        a();
        var x = [];
        if (v === "loaded" && (xj(d), d.fonts.status === "loading" && x.push(d.fonts.ready)), v = x.length, e !== null)
          for (var C = e.suspenseyImages, p = 0, y = 0; y < C.length; y++) {
            var S = C[y];
            if (!S.complete) {
              var w = S.getBoundingClientRect();
              if (0 < w.bottom && 0 < w.right && w.top < o.innerHeight && w.left < o.innerWidth) {
                if (p += ty(S), p > Ti) {
                  x.length = v;
                  break;
                }
                S = new Promise(
                  jj.bind(S)
                ), x.push(S);
              }
            }
          }
        if (0 < x.length)
          return o = Promise.race([
            Promise.all(x),
            new Promise(function(D) {
              return setTimeout(D, 500);
            })
          ]).then(s, s), (h ? Promise.allSettled([h.finished, o]) : o).then(i, i);
        if (s(), h)
          return h.finished.then(
            i,
            i
          );
        i();
      },
      types: l
    });
    d.__reactViewTransition = m;
    var f = [];
    return m.ready.then(
      function() {
        for (var o = d.documentElement.getAnimations({
          subtree: !0
        }), h = 0; h < o.length; h++) {
          var v = o[h], x = v.effect, C = x.pseudoElement;
          if (C != null && C.startsWith("::view-transition")) {
            f.push(v), v = x.getKeyframes();
            for (var p = C = void 0, y = !0, S = 0; S < v.length; S++) {
              var w = v[S], D = w.width;
              if (C === void 0) C = D;
              else if (C !== D) {
                y = !1;
                break;
              }
              if (D = w.height, p === void 0) p = D;
              else if (p !== D) {
                y = !1;
                break;
              }
              delete w.width, delete w.height, w.transform === "none" && delete w.transform;
            }
            y && C !== void 0 && p !== void 0 && (x.setKeyframes(v), y = getComputedStyle(
              x.target,
              x.pseudoElement
            ), y.width !== C || y.height !== p) && (y = v[0], y.width = C, y.height = p, y = v[v.length - 1], y.width = C, y.height = p, x.setKeyframes(v));
          }
        }
        c();
      },
      function(o) {
        d.__reactViewTransition === m && (d.__reactViewTransition = null);
        try {
          if (typeof o == "object" && o !== null)
            switch (o.name) {
              case "InvalidStateError":
                (o.message === "View transition was skipped because document visibility state is hidden." || o.message === "Skipping view transition because document visibility state has become hidden." || o.message === "Skipping view transition because viewport size changed." || o.message === "Transition was aborted because of invalid state") && (o = null);
            }
          o !== null && r(o);
        } finally {
          a(), s(), c();
        }
      }
    ), m.finished.finally(function() {
      for (var o = 0; o < f.length; o++)
        f[o].cancel();
      d.__reactViewTransition === m && (d.__reactViewTransition = null), u();
    }), m;
  } catch {
    return a(), s(), c(), null;
  }
}
function ia(e, t) {
  this._scope = document.documentElement, this._selector = "::view-transition-" + e + "(" + t + ")";
}
ia.prototype.animate = function(e, t) {
  return t = typeof t == "number" ? { duration: t } : ye({}, t), t.pseudoElement = this._selector, this._scope.animate(e, t);
};
ia.prototype.getAnimations = function() {
  for (var e = this._scope, t = this._selector, l = e.getAnimations({ subtree: !0 }), a = [], s = 0; s < l.length; s++) {
    var i = l[s].effect;
    i !== null && i.target === e && i.pseudoElement === t && a.push(l[s]);
  }
  return a;
};
ia.prototype.getComputedStyle = function() {
  return getComputedStyle(this._scope, this._selector);
};
function Kp(e) {
  return {
    name: e,
    group: new ia("group", e),
    imagePair: new ia("image-pair", e),
    old: new ia("old", e),
    new: new ia("new", e)
  };
}
function bt(e) {
  this._fragmentFiber = e, this._observers = this._eventListeners = null;
}
bt.prototype.addEventListener = function(e, t, l) {
  var a = null, s = null;
  if (!(l != null && typeof l != "boolean" && (a = l.signal || null, a !== null && a.aborted))) {
    this._eventListeners === null && (this._eventListeners = []);
    var i = this._eventListeners;
    if (Vp(i, e, t, l) === -1) {
      var c = this, u = t;
      l != null && typeof l != "boolean" && l.once === !0 && (u = function(r) {
        c.removeEventListener(
          e,
          t,
          l
        ), typeof t == "function" ? t.call(this, r) : t.handleEvent(r);
      }), a !== null && (s = c.removeEventListener.bind(
        c,
        e,
        t,
        l
      ), a.addEventListener("abort", s, { once: !0 }), s = a.removeEventListener.bind(a, "abort", s)), a = on(l), i.push({
        type: e,
        listener: t,
        optionsOrUseCapture: l,
        attachedListener: u,
        cleanup: s
      }), rt(
        this._fragmentFiber.child,
        !1,
        Nj,
        e,
        u,
        a
      );
    }
    this._eventListeners = i;
  }
};
function Nj(e, t, l, a) {
  return _e(e).addEventListener(
    t,
    l,
    a
  ), !1;
}
bt.prototype.removeEventListener = function(e, t, l) {
  var a = this._eventListeners;
  if (a !== null && (t = Vp(
    a,
    e,
    t,
    l
  ), t !== -1)) {
    var s = a[t];
    l = s.attachedListener;
    var i = s.cleanup;
    s = on(s.optionsOrUseCapture), rt(
      this._fragmentFiber.child,
      !1,
      Sj,
      e,
      l,
      s
    ), a.splice(t, 1), i !== null && i();
  }
};
function Sj(e, t, l, a) {
  return _e(e).removeEventListener(
    t,
    l,
    a
  ), !1;
}
function on(e) {
  return e != null && typeof e != "boolean" && (e.once === !0 || e.signal instanceof AbortSignal) ? { capture: e.capture, passive: e.passive } : e;
}
function Gf(e) {
  return e == null ? "c=0" : typeof e == "boolean" ? "c=" + (e ? "1" : "0") : "c=" + (e.capture ? "1" : "0");
}
function Vp(e, t, l, a) {
  if (e.length === 0) return -1;
  a = Gf(a);
  for (var s = 0; s < e.length; s++) {
    var i = e[s];
    if (i.type === t && i.listener === l && Gf(i.optionsOrUseCapture) === a)
      return s;
  }
  return -1;
}
bt.prototype.dispatchEvent = function(e) {
  var t = ja(
    this._fragmentFiber
  );
  if (t === null) return !0;
  t = _e(t);
  var l = this._eventListeners;
  if (l !== null && 0 < l.length || !e.bubbles) {
    var a = t.nodeType === 9 ? t.createComment("") : document.createTextNode("");
    if (l)
      for (var s = 0; s < l.length; s++) {
        var i = l[s];
        a.addEventListener(
          i.type,
          i.attachedListener,
          on(i.optionsOrUseCapture)
        );
      }
    if (t.appendChild(a), e = a.dispatchEvent(e), l)
      for (s = 0; s < l.length; s++)
        i = l[s], a.removeEventListener(
          i.type,
          i.attachedListener,
          on(i.optionsOrUseCapture)
        );
    return t.removeChild(a), e;
  }
  return t.dispatchEvent(e);
};
bt.prototype.focus = function(e) {
  rt(
    this._fragmentFiber.child,
    !0,
    Xp,
    e,
    void 0,
    void 0
  );
};
function Xp(e, t) {
  return e.tag === 6 ? !1 : (e = _e(e), Rj(e, t));
}
bt.prototype.focusLast = function(e) {
  var t = [];
  rt(
    this._fragmentFiber.child,
    !0,
    ed,
    t,
    void 0,
    void 0
  );
  for (var l = t.length - 1; 0 <= l && !Xp(t[l], e); l--) ;
};
function ed(e, t) {
  return t.push(e), !1;
}
bt.prototype.blur = function() {
  var e = ja(
    this._fragmentFiber
  );
  e !== null && (e = _e(e), e = vs(e).activeElement, e !== null && rt(
    this._fragmentFiber.child,
    !1,
    wj,
    e,
    void 0,
    void 0
  ));
};
function wj(e, t) {
  return e.tag === 6 ? !1 : (e = _e(e), e === t || e.contains(t) ? (t.blur(), !0) : !1);
}
bt.prototype.observeUsing = function(e) {
  this._observers === null && (this._observers = /* @__PURE__ */ new Set()), this._observers.add(e), rt(
    this._fragmentFiber.child,
    !1,
    Cj,
    e,
    void 0,
    void 0
  );
};
function Cj(e, t) {
  return e.tag === 6 || (e = _e(e), t.observe(e)), !1;
}
bt.prototype.unobserveUsing = function(e) {
  var t = this._observers;
  if (t !== null && t.has(e)) {
    t.delete(e), rt(
      this._fragmentFiber.child,
      !1,
      Tj,
      e,
      void 0,
      void 0
    );
    for (var l = t = 0; l < Lt.length; l++) {
      var a = Lt[l];
      a.fragmentInstance === this && a.observer === e ? e.unobserve(a.instance) : Lt[t++] = a;
    }
    Lt.length = t;
  }
};
function Tj(e, t) {
  return e.tag === 6 || (e = _e(e), t.unobserve(e)), !1;
}
var Lt = [], vu = !1;
function Ej(e, t, l) {
  Lt.push({
    fragmentInstance: e,
    observer: t,
    instance: l
  }), vu || (vu = !0, Uj(function() {
    vu = !1;
    var a = Lt;
    Lt = [];
    for (var s = 0; s < a.length; s++) {
      var i = a[s];
      i.observer.unobserve(i.instance);
    }
  }));
}
bt.prototype.getClientRects = function() {
  var e = [];
  return rt(
    this._fragmentFiber.child,
    !1,
    Dj,
    e,
    void 0,
    void 0
  ), e;
};
function Dj(e, t) {
  if (e.tag === 6) {
    e = e.stateNode;
    var l = e.ownerDocument.createRange();
    l.selectNodeContents(e), t.push.apply(t, l.getClientRects());
  } else
    e = _e(e), t.push.apply(t, e.getClientRects());
  return !1;
}
bt.prototype.getRootNode = function(e) {
  var t = ja(
    this._fragmentFiber
  );
  return t === null ? this : _e(t).getRootNode(e);
};
bt.prototype.compareDocumentPosition = function(e) {
  var t = ja(
    this._fragmentFiber
  );
  if (t === null) return Node.DOCUMENT_POSITION_DISCONNECTED;
  var l = [];
  rt(
    this._fragmentFiber.child,
    !1,
    ed,
    l,
    void 0,
    void 0
  );
  var a = _e(t);
  if (l.length === 0) {
    if (l = a, bd(this._fragmentFiber)) {
      e: {
        for (t = this._fragmentFiber.return; t !== null; ) {
          if (t.tag === 4) {
            t = t.stateNode.containerInfo;
            break e;
          }
          if (t.tag === 3 || t.tag === 5 || t.tag === 27)
            break;
          t = t.return;
        }
        t = null;
      }
      t != null && (l = t);
    }
    t = this._fragmentFiber;
    var s = a = l.compareDocumentPosition(e);
    return l === e ? s = Node.DOCUMENT_POSITION_CONTAINS : a & Node.DOCUMENT_POSITION_CONTAINED_BY && (l = gm(t)[1], l === null ? s = Node.DOCUMENT_POSITION_PRECEDING : (e = _e(l).compareDocumentPosition(
      e
    ), s = e === 0 || e & Node.DOCUMENT_POSITION_FOLLOWING ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)), s |= Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
  }
  t = _e(l[0]), s = _e(l[l.length - 1]);
  var i = bd(this._fragmentFiber) ? t.parentElement : a;
  if (i == null)
    return Node.DOCUMENT_POSITION_DISCONNECTED;
  a = i.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_CONTAINED_BY, i = i.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_CONTAINED_BY;
  var c = t.compareDocumentPosition(e), u = s.compareDocumentPosition(e), r = c & Node.DOCUMENT_POSITION_CONTAINED_BY || u & Node.DOCUMENT_POSITION_CONTAINED_BY;
  return u = a && i && c & Node.DOCUMENT_POSITION_FOLLOWING && u & Node.DOCUMENT_POSITION_PRECEDING, t = a && t === e || i && s === e || r || u ? Node.DOCUMENT_POSITION_CONTAINED_BY : !a && t === e || !i && s === e ? Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : c, t & Node.DOCUMENT_POSITION_DISCONNECTED || t & Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC || kj(
    t,
    this._fragmentFiber,
    l[0],
    l[l.length - 1],
    e
  ) ? t : Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
};
function kj(e, t, l, a, s) {
  var i = sa(s);
  if (e & Node.DOCUMENT_POSITION_CONTAINED_BY) {
    if (l = !!i)
      e: {
        for (; i !== null; ) {
          if (i.tag === 7 && (i === t || i.alternate === t)) {
            l = !0;
            break e;
          }
          i = i.return;
        }
        l = !1;
      }
    return l;
  }
  if (e & Node.DOCUMENT_POSITION_CONTAINS) {
    if (i === null)
      return i = s.ownerDocument, s === i || s === i.documentElement || s === i.body;
    e: {
      for (i = t, t = ja(t); i !== null; ) {
        if (!(i.tag !== 5 && i.tag !== 3 && i.tag !== 27 || i !== t && i.alternate !== t)) {
          i = !0;
          break e;
        }
        i = i.return;
      }
      i = !1;
    }
    return i;
  }
  return e & Node.DOCUMENT_POSITION_PRECEDING ? ((t = !!i) && !(t = i === l) && (t = zu(
    l,
    i,
    Nd
  ), t === null ? t = !1 : (rt(
    t,
    !0,
    av,
    i,
    l
  ), i = Ma, Ma = null, t = i !== null)), t) : e & Node.DOCUMENT_POSITION_FOLLOWING ? ((t = !!i) && !(t = i === a) && (t = zu(
    a,
    i,
    Nd
  ), t === null ? t = !1 : (rt(
    t,
    !0,
    nv,
    i,
    a
  ), i = Ma, Ou = Ma = null, t = i !== null)), t) : !1;
}
function $f(e, t) {
  var l = e.ownerDocument.createRange();
  l.selectNodeContents(e), e = l.getBoundingClientRect(), window.scrollTo(
    window.scrollX + e.left,
    t ? window.scrollY + e.top : window.scrollY + e.bottom - window.innerHeight
  );
}
bt.prototype.scrollIntoView = function(e) {
  if (typeof e == "object") throw Error(B(566));
  var t = [];
  rt(
    this._fragmentFiber.child,
    !1,
    ed,
    t,
    void 0,
    void 0
  );
  var l = e !== !1;
  if (t.length === 0) {
    var a = gm(
      this._fragmentFiber
    );
    if (a = l ? a[1] || a[0] || ja(this._fragmentFiber) : a[0] || a[1], a === null) return;
    if (a.tag === 6) {
      e = _e(a), $f(e, l);
      return;
    }
    if (a = _e(a), a.nodeType !== 9) {
      if (a.nodeType === 11) {
        l = "host" in a ? a.host : null, l !== null && l.scrollIntoView(e);
        return;
      }
      a.scrollIntoView(e);
    }
  }
  for (a = l ? t.length - 1 : 0; a !== (l ? -1 : t.length); ) {
    var s = t[a];
    s.tag === 6 ? (s = _e(s), $f(s, l)) : _e(s).scrollIntoView(e), a += l ? -1 : 1;
  }
};
function Aj(e, t) {
  return e = _e(e), Qp(e, t), !1;
}
function Qp(e, t) {
  e.reactFragments == null && (e.reactFragments = /* @__PURE__ */ new Set()), e.reactFragments.add(t);
}
function Zp(e, t) {
  var l = t._eventListeners;
  if (l !== null)
    for (var a = 0; a < l.length; a++) {
      var s = l[a];
      e.addEventListener(
        s.type,
        s.attachedListener,
        on(s.optionsOrUseCapture)
      );
    }
  e.nodeType !== 3 && (l = t._observers, l !== null && l.forEach(function(i) {
    for (var c = 0, u = 0; u < Lt.length; u++) {
      var r = Lt[u];
      (r.fragmentInstance !== t || r.observer !== i || r.instance !== e) && (Lt[c++] = r);
    }
    Lt.length = c, i.observe(e);
  }), Qp(e, t));
}
function Oj(e, t) {
  var l = t._eventListeners;
  if (l !== null)
    for (var a = 0; a < l.length; a++) {
      var s = l[a];
      e.removeEventListener(
        s.type,
        s.attachedListener,
        on(s.optionsOrUseCapture)
      );
    }
  e.nodeType !== 3 && (l = t._observers, l !== null && l.forEach(function(i) {
    typeof i.rootMargin == "string" ? Ej(
      t,
      i,
      e
    ) : i.unobserve(e);
  }), e.reactFragments != null && e.reactFragments.delete(t));
}
function Ur(e) {
  var t = e.firstChild;
  for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
    var l = t;
    switch (t = t.nextSibling, l.nodeName) {
      case "HTML":
      case "HEAD":
      case "BODY":
        Ur(l), yc(l);
        continue;
      case "SCRIPT":
      case "STYLE":
        continue;
      case "LINK":
        if (l.rel.toLowerCase() === "stylesheet") continue;
    }
    e.removeChild(l);
  }
}
function zj(e, t, l, a) {
  for (; e.nodeType === 1; ) {
    var s = l;
    if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
      if (!a && (e.nodeName !== "INPUT" || e.type !== "hidden"))
        break;
    } else if (a) {
      if (!e[As])
        switch (t) {
          case "meta":
            if (!e.hasAttribute("itemprop")) break;
            return e;
          case "link":
            if (i = e.getAttribute("rel"), i === "stylesheet" && e.hasAttribute("data-precedence"))
              break;
            if (i !== s.rel || e.getAttribute("href") !== (s.href == null || s.href === "" ? null : s.href) || e.getAttribute("crossorigin") !== (s.crossOrigin == null ? null : s.crossOrigin) || e.getAttribute("title") !== (s.title == null ? null : s.title))
              break;
            return e;
          case "style":
            if (e.hasAttribute("data-precedence")) break;
            return e;
          case "script":
            if (i = e.getAttribute("src"), (i !== (s.src == null ? null : s.src) || e.getAttribute("type") !== (s.type == null ? null : s.type) || e.getAttribute("crossorigin") !== (s.crossOrigin == null ? null : s.crossOrigin)) && i && e.hasAttribute("async") && !e.hasAttribute("itemprop"))
              break;
            return e;
          default:
            return e;
        }
    } else if (t === "input" && e.type === "hidden") {
      var i = s.name == null ? null : "" + s.name;
      if (s.type === "hidden" && e.getAttribute("name") === i)
        return e;
    } else return e;
    if (e = At(e.nextSibling), e === null) break;
  }
  return null;
}
function Mj(e, t, l) {
  if (t === "") return null;
  for (; e.nodeType !== 3; )
    if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !l || (e = At(e.nextSibling), e === null)) return null;
  return e;
}
function Jp(e, t) {
  for (; e.nodeType !== 8; )
    if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = At(e.nextSibling), e === null)) return null;
  return e;
}
function Lr(e) {
  return e.data === "$?" || e.data === "$~";
}
function td(e) {
  return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
}
function _j(e, t) {
  var l = e.ownerDocument;
  if (e.data === "$~") e._reactRetry = t;
  else if (e.data !== "$?" || l.readyState !== "loading")
    t();
  else {
    var a = function() {
      t(), l.removeEventListener("DOMContentLoaded", a);
    };
    l.addEventListener("DOMContentLoaded", a), e._reactRetry = a;
  }
}
function At(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F")
        break;
      if (t === "/$" || t === "/&") return null;
    }
  }
  return e;
}
var Br = null;
function Kf(e) {
  e = e.nextSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var l = e.data;
      if (l === "/$" || l === "/&") {
        if (t === 0)
          return At(e.nextSibling);
        t--;
      } else
        l !== "$" && l !== "$!" && l !== "$?" && l !== "$~" && l !== "&" || t++;
    }
    e = e.nextSibling;
  }
  return null;
}
function Vf(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var l = e.data;
      if (l === "$" || l === "$!" || l === "$?" || l === "$~" || l === "&") {
        if (t === 0) return e;
        t--;
      } else l !== "/$" && l !== "/&" || t++;
    }
    e = e.previousSibling;
  }
  return null;
}
function Rj(e, t) {
  function l() {
    a = !0;
  }
  if (e.ownerDocument.activeElement === e) return !0;
  var a = !1;
  try {
    e.ownerDocument.addEventListener("focus", l, !0), (e.focus || HTMLElement.prototype.focus).call(e, t);
  } finally {
    e.ownerDocument.removeEventListener("focus", l, !0);
  }
  return a;
}
function Uj(e) {
  Hf(function() {
    Hf(function(t) {
      return e(t);
    });
  });
}
function Fp(e, t, l) {
  switch (t = vs(l), e) {
    case "html":
      if (e = t.documentElement, !e) throw Error(B(452));
      return e;
    case "head":
      if (e = t.head, !e) throw Error(B(453));
      return e;
    case "body":
      if (e = t.body, !e) throw Error(B(454));
      return e;
    default:
      throw Error(B(451));
  }
}
function Ip(e, t, l) {
  for (var a in l) {
    var s = l[a];
    l.hasOwnProperty(a) && s != null && de(e, t, a, null, dj, s);
  }
  l.dangerouslySetInnerHTML != null && (e.textContent = ""), e.onclick === Zt && (e.onclick = null), yc(e);
}
function xu(e) {
  for (var t = e.attributes; t.length; )
    e.removeAttributeNode(t[0]);
  yc(e);
}
var Ot = /* @__PURE__ */ new Map(), Xf = /* @__PURE__ */ new Set();
function xs(e) {
  if (typeof e.getRootNode == "function") {
    var t = e.getRootNode();
    if (t.nodeType === 9 || t.nodeType === 11) return t;
  }
  return e.nodeType === 9 ? e : e.ownerDocument;
}
var vl = ce.d;
ce.d = {
  f: Lj,
  r: Bj,
  D: Hj,
  C: Yj,
  L: qj,
  m: Gj,
  X: Kj,
  S: $j,
  M: Vj
};
function Lj() {
  var e = vl.f(), t = Oc();
  return e || t;
}
function Bj(e) {
  var t = vn(e);
  t !== null && t.tag === 5 && t.type === "form" ? Ug(t) : vl.r(e);
}
var Nn = typeof document > "u" ? null : document;
function Wp(e, t, l) {
  var a = Nn;
  if (a && typeof t == "string" && t) {
    var s = Et(t);
    s = 'link[rel="' + e + '"][href="' + s + '"]', typeof l == "string" && (s += '[crossorigin="' + l + '"]'), Xf.has(s) || (Xf.add(s), e = { rel: e, crossOrigin: l, href: t }, a.querySelector(s) === null && (t = a.createElement("link"), Qe(t, "link", e), He(t), a.head.appendChild(t)));
  }
}
function Hj(e) {
  vl.D(e), Wp("dns-prefetch", e, null);
}
function Yj(e, t) {
  vl.C(e, t), Wp("preconnect", e, t);
}
function qj(e, t, l) {
  vl.L(e, t, l);
  var a = Nn;
  if (a && e && t) {
    var s = 'link[rel="preload"][as="' + Et(t) + '"]';
    t === "image" && l && l.imageSrcSet ? (s += '[imagesrcset="' + Et(
      l.imageSrcSet
    ) + '"]', typeof l.imageSizes == "string" && (s += '[imagesizes="' + Et(
      l.imageSizes
    ) + '"]')) : s += '[href="' + Et(e) + '"]';
    var i = s;
    switch (t) {
      case "style":
        i = dn(e);
        break;
      case "script":
        i = Sn(e);
    }
    if (!(Ot.has(i) || (e = ye(
      {
        rel: "preload",
        href: t === "image" && l && l.imageSrcSet ? void 0 : e,
        as: t
      },
      l
    ), Ot.set(i, e), a.querySelector(s) !== null || t === "style" && a.querySelector(Us(i)) || t === "script" && a.querySelector(Ls(i))))) {
      var c = a.createElement("link");
      Qe(c, "link", e), t === "style" && (c[Li] = !0, c.onload = c.onerror = function() {
        Dm(c);
      }), He(c), a.head.appendChild(c);
    }
  }
}
function Gj(e, t) {
  vl.m(e, t);
  var l = Nn;
  if (l && e) {
    var a = t && typeof t.as == "string" ? t.as : "script", s = 'link[rel="modulepreload"][as="' + Et(a) + '"][href="' + Et(e) + '"]', i = s;
    switch (a) {
      case "audioworklet":
      case "paintworklet":
      case "serviceworker":
      case "sharedworker":
      case "worker":
      case "script":
        i = Sn(e);
    }
    if (!Ot.has(i) && (e = ye({ rel: "modulepreload", href: e }, t), Ot.set(i, e), l.querySelector(s) === null)) {
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          if (l.querySelector(Ls(i)))
            return;
      }
      a = l.createElement("link"), Qe(a, "link", e), He(a), l.head.appendChild(a);
    }
  }
}
function $j(e, t, l) {
  vl.S(e, t, l);
  var a = Nn;
  if (a && e) {
    var s = Va(a).hoistableStyles, i = dn(e);
    t = t || "default";
    var c = s.get(i);
    if (!c) {
      var u = { loading: 0, preload: null };
      if (c = a.querySelector(
        Us(i)
      ))
        u.loading = 5;
      else {
        e = ye(
          { rel: "stylesheet", href: e, "data-precedence": t },
          l
        ), (l = Ot.get(i)) && ld(e, l);
        var r = c = a.createElement("link");
        He(r), Qe(r, "link", e), r._p = new Promise(function(d, m) {
          r.onload = d, r.onerror = m;
        }), r.addEventListener("load", function() {
          u.loading |= 1;
        }), r.addEventListener("error", function() {
          u.loading |= 2;
        }), u.loading |= 4, wi(c, t, a);
      }
      c = {
        type: "stylesheet",
        instance: c,
        count: 1,
        state: u
      }, s.set(i, c);
    }
  }
}
function Kj(e, t) {
  vl.X(e, t);
  var l = Nn;
  if (l && e) {
    var a = Va(l).hoistableScripts, s = Sn(e), i = a.get(s);
    i || (i = l.querySelector(Ls(s)), i || (e = ye({ src: e, async: !0 }, t), (t = Ot.get(s)) && ad(e, t), i = l.createElement("script"), He(i), Qe(i, "link", e), l.head.appendChild(i)), i = {
      type: "script",
      instance: i,
      count: 1,
      state: null
    }, a.set(s, i));
  }
}
function Vj(e, t) {
  vl.M(e, t);
  var l = Nn;
  if (l && e) {
    var a = Va(l).hoistableScripts, s = Sn(e), i = a.get(s);
    i || (i = l.querySelector(Ls(s)), i || (e = ye({ src: e, async: !0, type: "module" }, t), (t = Ot.get(s)) && ad(e, t), i = l.createElement("script"), He(i), Qe(i, "link", e), l.head.appendChild(i)), i = {
      type: "script",
      instance: i,
      count: 1,
      state: null
    }, a.set(s, i));
  }
}
function Qf(e, t, l, a) {
  var s = (s = _l.current) ? xs(s) : null;
  if (!s) throw Error(B(446));
  switch (e) {
    case "meta":
    case "title":
      return null;
    case "style":
      return typeof l.precedence == "string" && typeof l.href == "string" ? (l = dn(l.href), t = Va(
        s
      ).hoistableStyles, a = t.get(l), a || (a = {
        type: "style",
        instance: null,
        count: 0,
        state: null
      }, t.set(l, a)), a) : { type: "void", instance: null, count: 0, state: null };
    case "link":
      if (l.rel === "stylesheet" && typeof l.href == "string" && typeof l.precedence == "string") {
        e = dn(l.href);
        var i = Va(
          s
        ).hoistableStyles, c = i.get(e);
        if (c || (s = s.ownerDocument || s, c = {
          type: "stylesheet",
          instance: null,
          count: 0,
          state: { loading: 0, preload: null }
        }, i.set(e, c), (i = s.querySelector(
          Us(e)
        )) ? i._p || (c.instance = i, c.state.loading = 5) : (i = Ot.get(e), i || (i = {
          rel: "preload",
          as: "style",
          href: l.href,
          crossOrigin: l.crossOrigin,
          integrity: l.integrity,
          media: l.media,
          hrefLang: l.hrefLang,
          referrerPolicy: l.referrerPolicy
        }, Ot.set(e, i)), Xj(
          s,
          e,
          i,
          c.state
        ))), t && a === null)
          throw Error(B(528, ""));
        return c;
      }
      if (t && a !== null)
        throw Error(B(529, ""));
      return null;
    case "script":
      return t = l.async, l = l.src, typeof l == "string" && t && typeof t != "function" && typeof t != "symbol" ? (l = Sn(l), t = Va(
        s
      ).hoistableScripts, a = t.get(l), a || (a = {
        type: "script",
        instance: null,
        count: 0,
        state: null
      }, t.set(l, a)), a) : { type: "void", instance: null, count: 0, state: null };
    default:
      throw Error(B(444, e));
  }
}
function dn(e) {
  return 'href="' + Et(e) + '"';
}
function Us(e) {
  return 'link[rel="stylesheet"][' + e + "]";
}
function Pp(e) {
  return ye({}, e, {
    "data-precedence": e.precedence,
    precedence: null
  });
}
function Xj(e, t, l, a) {
  if (t = e.querySelector(
    'link[rel="preload"][as="style"][' + t + "]"
  )) {
    if (t[Li] !== !0) {
      a.loading = 1;
      return;
    }
  } else
    t = e.createElement("link"), t[Li] = !0, t.onload = t.onerror = Dm.bind(null, t), Qe(t, "link", l), He(t), e.head.appendChild(t);
  a.preload = t, t.addEventListener("load", function() {
    return a.loading |= 1;
  }), t.addEventListener("error", function() {
    return a.loading |= 2;
  });
}
function Sn(e) {
  return '[src="' + Et(e) + '"]';
}
function Ls(e) {
  return "script[async]" + e;
}
function Zf(e, t, l) {
  if (t.count++, t.instance === null)
    switch (t.type) {
      case "style":
        var a = e.querySelector(
          'style[data-href~="' + Et(l.href) + '"]'
        );
        if (a)
          return t.instance = a, He(a), a;
        var s = ye({}, l, {
          "data-href": l.href,
          "data-precedence": l.precedence,
          href: null,
          precedence: null
        });
        return a = (e.ownerDocument || e).createElement(
          "style"
        ), He(a), Qe(a, "style", s), wi(a, l.precedence, e), t.instance = a;
      case "stylesheet":
        s = dn(l.href);
        var i = e.querySelector(
          Us(s)
        );
        if (i)
          return t.state.loading |= 4, t.instance = i, He(i), i;
        a = Pp(l), (s = Ot.get(s)) && ld(a, s), i = (e.ownerDocument || e).createElement("link"), He(i);
        var c = i;
        return c._p = new Promise(function(u, r) {
          c.onload = u, c.onerror = r;
        }), Qe(i, "link", a), t.state.loading |= 4, wi(i, l.precedence, e), t.instance = i;
      case "script":
        return i = Sn(l.src), (s = e.querySelector(
          Ls(i)
        )) ? (t.instance = s, He(s), s) : (a = l, (s = Ot.get(i)) && (a = ye({}, l), ad(a, s)), e = e.ownerDocument || e, s = e.createElement("script"), He(s), Qe(s, "link", a), e.head.appendChild(s), t.instance = s);
      case "void":
        return null;
      default:
        throw Error(B(443, t.type));
    }
  else
    t.type === "stylesheet" && !(t.state.loading & 4) && (a = t.instance, t.state.loading |= 4, wi(a, l.precedence, e));
  return t.instance;
}
function wi(e, t, l) {
  for (var a = l.querySelectorAll(
    'link[rel="stylesheet"][data-precedence],style[data-precedence]'
  ), s = a.length ? a[a.length - 1] : null, i = s, c = 0; c < a.length; c++) {
    var u = a[c];
    if (u.dataset.precedence === t) i = u;
    else if (i !== s) break;
  }
  i ? i.parentNode.insertBefore(e, i.nextSibling) : (t = l.nodeType === 9 ? l.head : l, t.insertBefore(e, t.firstChild));
}
function ld(e, t) {
  e.crossOrigin == null && (e.crossOrigin = t.crossOrigin), e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy), e.title == null && (e.title = t.title);
}
function ad(e, t) {
  e.crossOrigin == null && (e.crossOrigin = t.crossOrigin), e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy), e.integrity == null && (e.integrity = t.integrity);
}
var Ci = null;
function Jf(e, t, l) {
  if (Ci === null) {
    var a = /* @__PURE__ */ new Map(), s = Ci = /* @__PURE__ */ new Map();
    s.set(l, a);
  } else
    s = Ci, a = s.get(l), a || (a = /* @__PURE__ */ new Map(), s.set(l, a));
  if (a.has(e)) return a;
  for (a.set(e, null), l = l.getElementsByTagName(e), s = 0; s < l.length; s++) {
    var i = l[s];
    if (!(i[As] || i[$e] || e === "link" && i.getAttribute("rel") === "stylesheet") && i.namespaceURI !== "http://www.w3.org/2000/svg") {
      var c = i.getAttribute(t) || "";
      c = e + c;
      var u = a.get(c);
      u ? u.push(i) : a.set(c, [i]);
    }
  }
  return a;
}
function Hr(e, t, l) {
  e = e.ownerDocument || e, e.head.insertBefore(
    l,
    t === "title" ? e.querySelector("head > title") : null
  );
}
function Qj(e, t, l) {
  if (l === 1 || t.itemProp != null) return !1;
  switch (e) {
    case "meta":
    case "title":
      return !0;
    case "style":
      if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
        break;
      return !0;
    case "link":
      if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
        break;
      switch (t.rel) {
        case "stylesheet":
          return e = t.disabled, typeof t.precedence == "string" && e == null;
        default:
          return !0;
      }
    case "script":
      if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
        return !0;
  }
  return !1;
}
function Ff(e, t) {
  return e === "img" && t.src != null && t.src !== "" && t.onLoad == null && t.loading !== "lazy";
}
function ey(e) {
  return !(e.type === "stylesheet" && !(e.state.loading & 3));
}
function ty(e) {
  return (e.width || 100) * (e.height || 100) * (typeof devicePixelRatio == "number" ? devicePixelRatio : 1) * 0.25;
}
function If(e, t) {
  typeof t.decode == "function" && (e.imgCount++, t.complete || (e.imgBytes += ty(t), e.suspenseyImages.push(t)), e = Fj.bind(e), t.decode().then(e, e));
}
function Zj(e, t, l, a) {
  if (l.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && !(l.state.loading & 4)) {
    if (l.instance === null) {
      var s = dn(a.href), i = t.querySelector(
        Us(s)
      );
      if (i) {
        t = i._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = js.bind(e), t.then(e, e)), l.state.loading |= 4, l.instance = i, He(i);
        return;
      }
      i = t.ownerDocument || t, a = Pp(a), (s = Ot.get(s)) && ld(a, s), i = i.createElement("link"), He(i);
      var c = i;
      c._p = new Promise(function(u, r) {
        c.onload = u, c.onerror = r;
      }), Qe(i, "link", a), l.instance = i;
    }
    e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(l, t), (t = l.state.preload) && !(l.state.loading & 3) && (e.count++, l = js.bind(e), t.addEventListener("load", l), t.addEventListener("error", l));
  }
}
var Ti = 0;
function Jj(e, t) {
  return e.stylesheets && e.count === 0 && Ei(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(l) {
    var a = setTimeout(function() {
      if (e.stylesheets && Ei(e, e.stylesheets), e.unsuspend) {
        var i = e.unsuspend;
        e.unsuspend = null, i();
      }
    }, 6e4 + t);
    0 < e.imgBytes && Ti === 0 && (Ti = 62500 * hj());
    var s = setTimeout(
      function() {
        if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Ei(e, e.stylesheets), e.unsuspend)) {
          var i = e.unsuspend;
          e.unsuspend = null, i();
        }
      },
      (e.imgBytes > Ti ? 50 : 800) + t
    );
    return e.unsuspend = l, function() {
      e.unsuspend = null, clearTimeout(a), clearTimeout(s);
    };
  } : null;
}
function ly(e) {
  if (e.count === 0 && (e.imgCount === 0 || !e.waitingForImages)) {
    if (e.stylesheets) Ei(e, e.stylesheets);
    else if (e.unsuspend) {
      var t = e.unsuspend;
      e.unsuspend = null, t();
    }
  }
}
function js() {
  this.count--, ly(this);
}
function Fj() {
  this.imgCount--, ly(this);
}
var ic = null;
function Ei(e, t) {
  e.stylesheets = null, e.unsuspend !== null && (e.count++, ic = /* @__PURE__ */ new Map(), t.forEach(Ij, e), ic = null, js.call(e));
}
function Ij(e, t) {
  if (!(t.state.loading & 4)) {
    var l = ic.get(e);
    if (l) var a = l.get(null);
    else {
      l = /* @__PURE__ */ new Map(), ic.set(e, l);
      for (var s = e.querySelectorAll(
        "link[data-precedence],style[data-precedence]"
      ), i = 0; i < s.length; i++) {
        var c = s[i];
        (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (l.set(c.dataset.precedence, c), a = c);
      }
      a && l.set(null, a);
    }
    s = t.instance, c = s.getAttribute("data-precedence"), i = l.get(c) || a, i === a && l.set(null, s), l.set(c, s), this.count++, a = js.bind(this), s.addEventListener("load", a), s.addEventListener("error", a), i ? i.parentNode.insertBefore(s, i.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(s, e.firstChild)), t.state.loading |= 4;
  }
}
var fn = {
  $$typeof: Qt,
  Provider: null,
  Consumer: null,
  _currentValue: ca,
  _currentValue2: ca,
  _threadCount: 0
};
function Wj(e, t, l, a, s, i, c, u, r) {
  this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Kc(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Kc(0), this.hiddenUpdates = Kc(null), this.identifierPrefix = a, this.onUncaughtError = s, this.onCaughtError = i, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = r, this.transitionTypes = null, this.incompleteTransitions = /* @__PURE__ */ new Map();
}
function ay(e, t, l, a, s, i, c, u, r, d, m, f) {
  return e = new Wj(
    e,
    t,
    l,
    c,
    r,
    d,
    m,
    f,
    u
  ), t = 1, i === !0 && (t |= 24), i = ct(3, null, null, t), e.current = i, i.stateNode = e, t = So(), t.refCount++, e.pooledCache = t, t.refCount++, i.memoizedState = {
    element: a,
    isDehydrated: l,
    cache: t
  }, To(i), e;
}
function ny(e) {
  return e ? (e = qa, e) : qa;
}
function sy(e, t, l, a, s, i) {
  s = ny(s), a.context === null ? a.context = s : a.pendingContext = s, a = Ul(t), a.payload = { element: l }, i = i === void 0 ? null : i, i !== null && (a.callback = i), l = Ll(e, a, t), l !== null && (ut(l, e, t), In(l, e, t));
}
function Wf(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var l = e.retryLane;
    e.retryLane = l !== 0 && l < t ? l : t;
  }
}
function nd(e, t) {
  Wf(e, t), (e = e.alternate) && Wf(e, t);
}
function iy(e) {
  if (e.tag === 13 || e.tag === 31) {
    var t = Sa(e, 67108864);
    t !== null && ut(t, e, 67108864), nd(e, 67108864);
  }
}
function Pf(e) {
  if (e.tag === 13 || e.tag === 31) {
    var t = xt();
    t = oo(t);
    var l = Sa(e, t);
    l !== null && ut(l, e, t), nd(e, t);
  }
}
var hn = !0;
function Pj(e, t, l, a) {
  var s = X.T;
  X.T = null;
  var i = ce.p;
  try {
    ce.p = 2, sd(e, t, l, a);
  } finally {
    ce.p = i, X.T = s;
  }
}
function eb(e, t, l, a) {
  var s = X.T;
  X.T = null;
  var i = ce.p;
  try {
    ce.p = 8, sd(e, t, l, a);
  } finally {
    ce.p = i, X.T = s;
  }
}
function sd(e, t, l, a) {
  if (hn) {
    var s = Yr(a);
    if (s === null)
      pu(
        e,
        t,
        a,
        cc,
        l
      ), eh(e, a);
    else if (lb(
      s,
      e,
      t,
      l,
      a
    ))
      a.stopPropagation();
    else if (eh(e, a), t & 4 && -1 < tb.indexOf(e)) {
      for (; s !== null; ) {
        var i = vn(s);
        if (i !== null)
          switch (i.tag) {
            case 3:
              if (i = i.stateNode, i.current.memoizedState.isDehydrated) {
                var c = ta(i.pendingLanes);
                if (c !== 0) {
                  var u = i;
                  for (u.pendingLanes |= 2, u.entangledLanes |= 2; c; ) {
                    var r = 1 << 31 - vt(c);
                    u.entanglements[1] |= r, c &= ~r;
                  }
                  ll(i), !(ie & 6) && (tc = pt() + 500, Rs(0));
                }
              }
              break;
            case 31:
            case 13:
              u = Sa(i, 2), u !== null && ut(u, i, 2), Oc(), nd(i, 2);
          }
        if (i = Yr(a), i === null && pu(
          e,
          t,
          a,
          cc,
          l
        ), i === s) break;
        s = i;
      }
      s !== null && a.stopPropagation();
    } else
      pu(
        e,
        t,
        a,
        null,
        l
      );
  }
}
function Yr(e) {
  return e = mo(e), id(e);
}
var cc = null;
function id(e) {
  if (cc = null, e = sa(e), e !== null) {
    var t = Ts(e);
    if (t === null) e = null;
    else {
      var l = t.tag;
      if (l === 13) {
        if (e = fm(t), e !== null) return e;
        e = null;
      } else if (l === 31) {
        if (e = hm(t), e !== null) return e;
        e = null;
      } else if (l === 3) {
        if (t.stateNode.current.memoizedState.isDehydrated)
          return t.tag === 3 ? t.stateNode.containerInfo : null;
        e = null;
      } else t !== e && (e = null);
    }
  }
  return cc = e, null;
}
function cy(e) {
  switch (e) {
    case "beforetoggle":
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "seeked":
    case "submit":
    case "toggle":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "fullscreenerror":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 2;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "resize":
    case "scroll":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 8;
    case "message":
      switch (hv()) {
        case xm:
          return 2;
        case jm:
          return 8;
        case Ui:
        case mv:
          return 32;
        case bm:
          return 268435456;
        default:
          return 32;
      }
    default:
      return 32;
  }
}
var qr = !1, ql = null, Gl = null, $l = null, bs = /* @__PURE__ */ new Map(), Ns = /* @__PURE__ */ new Map(), Tl = [], tb = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
  " "
);
function eh(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      ql = null;
      break;
    case "dragenter":
    case "dragleave":
      Gl = null;
      break;
    case "mouseover":
    case "mouseout":
      $l = null;
      break;
    case "pointerover":
    case "pointerout":
      bs.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Ns.delete(t.pointerId);
  }
}
function On(e, t, l, a, s, i) {
  return e === null || e.nativeEvent !== i ? (e = {
    blockedOn: t,
    domEventName: l,
    eventSystemFlags: a,
    nativeEvent: i,
    targetContainers: [s]
  }, t !== null && (t = vn(t), t !== null && iy(t)), e) : (e.eventSystemFlags |= a, t = e.targetContainers, s !== null && t.indexOf(s) === -1 && t.push(s), e);
}
function lb(e, t, l, a, s) {
  switch (t) {
    case "focusin":
      return ql = On(
        ql,
        e,
        t,
        l,
        a,
        s
      ), !0;
    case "dragenter":
      return Gl = On(
        Gl,
        e,
        t,
        l,
        a,
        s
      ), !0;
    case "mouseover":
      return $l = On(
        $l,
        e,
        t,
        l,
        a,
        s
      ), !0;
    case "pointerover":
      var i = s.pointerId;
      return bs.set(
        i,
        On(
          bs.get(i) || null,
          e,
          t,
          l,
          a,
          s
        )
      ), !0;
    case "gotpointercapture":
      return i = s.pointerId, Ns.set(
        i,
        On(
          Ns.get(i) || null,
          e,
          t,
          l,
          a,
          s
        )
      ), !0;
  }
  return !1;
}
function uy(e) {
  var t = sa(e.target);
  if (t !== null) {
    var l = Ts(t);
    if (l !== null) {
      if (t = l.tag, t === 13) {
        if (t = fm(l), t !== null) {
          e.blockedOn = t, Td(e.priority, function() {
            Pf(l);
          });
          return;
        }
      } else if (t === 31) {
        if (t = hm(l), t !== null) {
          e.blockedOn = t, Td(e.priority, function() {
            Pf(l);
          });
          return;
        }
      } else if (t === 3 && l.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = l.tag === 3 ? l.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function Di(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var l = Yr(e.nativeEvent);
    if (l === null) {
      l = e.nativeEvent;
      var a = new l.constructor(
        l.type,
        l
      );
      Ku = a, l.target.dispatchEvent(a), Ku = null;
    } else
      return t = vn(l), t !== null && iy(t), e.blockedOn = l, !1;
    t.shift();
  }
  return !0;
}
function th(e, t, l) {
  Di(e) && l.delete(t);
}
function ab() {
  qr = !1, ql !== null && Di(ql) && (ql = null), Gl !== null && Di(Gl) && (Gl = null), $l !== null && Di($l) && ($l = null), bs.forEach(th), Ns.forEach(th);
}
function ei(e, t) {
  e.blockedOn === t && (e.blockedOn = null, qr || (qr = !0, Re.unstable_scheduleCallback(
    Re.unstable_NormalPriority,
    ab
  )));
}
var ti = null;
function lh(e) {
  ti !== e && (ti = e, Re.unstable_scheduleCallback(
    Re.unstable_NormalPriority,
    function() {
      ti === e && (ti = null);
      for (var t = 0; t < e.length; t += 3) {
        var l = e[t], a = e[t + 1], s = e[t + 2];
        if (typeof a != "function") {
          if (id(a || l) === null)
            continue;
          break;
        }
        var i = vn(l);
        i !== null && (e.splice(t, 3), t -= 3, ir(
          i,
          {
            pending: !0,
            data: s,
            method: l.method,
            action: a
          },
          a,
          s
        ));
      }
    }
  ));
}
function mn(e) {
  function t(r) {
    return ei(r, e);
  }
  ql !== null && ei(ql, e), Gl !== null && ei(Gl, e), $l !== null && ei($l, e), bs.forEach(t), Ns.forEach(t);
  for (var l = 0; l < Tl.length; l++) {
    var a = Tl[l];
    a.blockedOn === e && (a.blockedOn = null);
  }
  for (; 0 < Tl.length && (l = Tl[0], l.blockedOn === null); )
    uy(l), l.blockedOn === null && Tl.shift();
  if (l = (e.ownerDocument || e).$$reactFormReplay, l != null)
    for (a = 0; a < l.length; a += 3) {
      var s = l[a], i = l[a + 1], c = s[ot] || null;
      if (typeof i == "function")
        c || lh(l);
      else if (c) {
        var u = null;
        if (i && i.hasAttribute("formAction")) {
          if (s = i, c = i[ot] || null)
            u = c.formAction;
          else if (id(s) !== null) continue;
        } else u = c.action;
        typeof u == "function" ? l[a + 1] = u : (l.splice(a, 3), a -= 3), lh(l);
      }
    }
}
function ry() {
  function e(i) {
    i.canIntercept && i.info === "react-transition" && i.intercept({
      handler: function() {
        return new Promise(function(c) {
          return s = c;
        });
      },
      focusReset: "manual",
      scroll: "manual"
    });
  }
  function t() {
    s !== null && (s(), s = null), a || setTimeout(l, 20);
  }
  function l() {
    if (!a && !navigation.transition) {
      var i = navigation.currentEntry;
      i && i.url != null && navigation.navigate(i.url, {
        state: i.getState(),
        info: "react-transition",
        history: "replace"
      });
    }
  }
  if (typeof navigation == "object") {
    var a = !1, s = null;
    return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(l, 100), function() {
      a = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), s !== null && (s(), s = null);
    };
  }
}
function cd(e) {
  this._internalRoot = e;
}
_c.prototype.render = cd.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(B(409));
  var l = t.current, a = xt();
  sy(l, a, e, t, null, null);
};
_c.prototype.unmount = cd.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    sy(e.current, 2, null, e, null, null), Oc(), t[yn] = null;
  }
};
function _c(e) {
  this._internalRoot = e;
}
_c.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = Em();
    e = { blockedOn: null, target: e, priority: t };
    for (var l = 0; l < Tl.length && t !== 0 && t < Tl[l].priority; l++) ;
    Tl.splice(l, 0, e), l === 0 && uy(e);
  }
};
var ah = om.version;
if (ah !== "19.3.1")
  throw Error(
    B(
      527,
      ah,
      "19.3.1"
    )
  );
ce.findDOMNode = function(e) {
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(B(188)) : (e = Object.keys(e).join(","), Error(B(268, e)));
  return e = lv(t), e = e !== null ? mm(e) : null, e = e === null ? null : e.stateNode, e;
};
var nb = {
  bundleType: 0,
  version: "19.3.1",
  rendererPackageName: "react-dom",
  currentDispatcherRef: X,
  reconcilerVersion: "19.3.1"
};
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var li = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!li.isDisabled && li.supportsFiber)
    try {
      Es = li.inject(
        nb
      ), yt = li;
    } catch {
    }
}
mc.createRoot = function(e, t) {
  if (!dm(e)) throw Error(B(299));
  var l = !1, a = "", s = Kg, i = Vg, c = Xg;
  return t != null && (t.unstable_strictMode === !0 && (l = !0), t.identifierPrefix !== void 0 && (a = t.identifierPrefix), t.onUncaughtError !== void 0 && (s = t.onUncaughtError), t.onCaughtError !== void 0 && (i = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ay(
    e,
    1,
    !1,
    null,
    null,
    l,
    a,
    null,
    s,
    i,
    c,
    ry
  ), e[yn] = t.current, Wo(e), new cd(t);
};
mc.hydrateRoot = function(e, t, l) {
  if (!dm(e)) throw Error(B(299));
  var a = !1, s = "", i = Kg, c = Vg, u = Xg, r = null;
  return l != null && (l.unstable_strictMode === !0 && (a = !0), l.identifierPrefix !== void 0 && (s = l.identifierPrefix), l.onUncaughtError !== void 0 && (i = l.onUncaughtError), l.onCaughtError !== void 0 && (c = l.onCaughtError), l.onRecoverableError !== void 0 && (u = l.onRecoverableError), l.formState !== void 0 && (r = l.formState)), t = ay(
    e,
    1,
    !0,
    t,
    l ?? null,
    a,
    s,
    r,
    i,
    c,
    u,
    ry
  ), t.context = ny(null), l = t.current, a = xt(), a = oo(a), s = Ul(a), s.callback = null, Ll(l, s, a), l = a, t.current.lanes = l, ks(t, l), ll(t), e[yn] = t.current, Wo(e), new _c(t);
};
mc.version = "19.3.1";
function oy() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(oy);
    } catch (e) {
      console.error(e);
    }
}
oy(), am.exports = mc;
var sb = am.exports;
const dy = window.CS_TABS || [];
function ib() {
  const e = [];
  return dy.forEach((t) => {
    let l = e.find((a) => a[0] === t.group);
    l || e.push(l = [t.group, []]), l[1].push(t);
  }), e;
}
const ki = [
  { key: "sightreading", icon: "🎼", label: "SightReading", url: "https://sightreadingfactory.com/" },
  { key: "stripe", icon: "💳", label: "Stripe", url: "https://dashboard.stripe.com/" },
  { key: "calendar", icon: "📅", label: "Calendar", url: "https://calendar.google.com/" },
  { key: "chanty", icon: "💬", label: "Chanty", url: "https://www.chanty.com/" }
];
function nh() {
  try {
    const e = localStorage.getItem("externalLinksV1");
    if (e === null) return ki;
    const t = JSON.parse(e);
    return Array.isArray(t) ? t.filter((l) => !!(l && typeof l == "object" && "key" in l && "label" in l && "url" in l && /^https?:\/\//i.test(String(l.url)))) : ki;
  } catch {
    return ki;
  }
}
const cb = /* @__PURE__ */ new Set(["home", ...dy.filter((e) => e.kind === "react").map((e) => e.key)]);
function sh() {
  const e = location.hash.replace(/^#\/?/, "").split("/")[0];
  return e || (location.pathname.length > 1 || new URLSearchParams(location.search).has("person") ? "studio" : localStorage.getItem("appTab") || "home");
}
function ub(e) {
  const t = document.getElementById(`tab-${e}`);
  t && t.click();
}
function ih(e) {
  localStorage.setItem("modernRoute", e), localStorage.setItem("appTab", e);
  const t = `/#${e}`;
  location.pathname + location.search + location.hash !== t && history.pushState(null, "", t);
}
function ch() {
  const e = (t) => {
    try {
      return JSON.parse(localStorage.getItem(t) || "{}");
    } catch {
      return {};
    }
  };
  return { names: e("tabNames"), hidden: e("tabHidden"), colors: e("tabButtonColors"), pageColors: e("tabColors"), hotkeys: e("tabHotkeys"), hotkeysEnabled: localStorage.getItem("tabHotkeysEnabled") !== "0" };
}
const fy = ib().map(([e, t]) => [e, t.map((l) => ({ key: l.key, label: l.label, icon: l.icon }))]), hy = fy.filter(([e]) => e !== "System"), my = fy.find(([e]) => e === "System") || ["System", [{ key: "settings", label: "Settings", icon: "⚙" }]], Gr = [...hy, ["Links", ki], my].flatMap(([, e]) => e.map((t) => `tab-${t.key}`)), uh = () => {
  try {
    const e = JSON.parse(localStorage.getItem("tabOrder") || "null");
    return Array.isArray(e) ? e : Gr;
  } catch {
    return Gr;
  }
}, rh = () => {
  try {
    const e = JSON.parse(localStorage.getItem("tabStarred") || "[]");
    return Array.isArray(e) ? e.filter((t) => typeof t == "string") : [];
  } catch {
    return [];
  }
}, rb = (e) => e ? e.replace("Meta+", "⌘").replace("Ctrl+", "⌃").replace("Alt+", "⌥").replace("Shift+", "⇧") : "";
function ob({ active: e, onNavigate: t, onAdd: l }) {
  const [a, s] = j.useState(ch), [i, c] = j.useState(nh), [u, r] = j.useState(uh), [d, m] = j.useState(rh), [f, o] = j.useState(0), [h, v] = j.useState(null), [x, C] = j.useState(null), [p, y] = j.useState(null), S = j.useRef(null), w = () => localStorage.getItem("tabCmdHover") !== "0";
  j.useEffect(() => {
    const k = () => v(null), R = () => {
      s(ch()), c(nh()), r(uh()), m(rh()), o((Y) => Y + 1);
    }, M = (Y) => {
      Y.key === "Meta" && !Y.repeat && S.current && S.current !== e && w() && t(S.current);
    };
    return window.addEventListener("click", k), window.addEventListener("blur", k), window.addEventListener("resize", k), window.addEventListener("app:tab-visibility", R), window.addEventListener("app:preferences-changed", R), document.addEventListener("keydown", M), () => {
      window.removeEventListener("click", k), window.removeEventListener("blur", k), window.removeEventListener("resize", k), window.removeEventListener("app:tab-visibility", R), window.removeEventListener("app:preferences-changed", R), document.removeEventListener("keydown", M);
    };
  }, [e, t]), j.useEffect(() => {
    const k = localStorage.getItem("tabBarMode") === "top" ? "top" : "side", R = localStorage.getItem("tabBarSide") || "auto", M = k === "side" && (R === "right" || R === "auto" && e === "studio");
    document.body.classList.toggle("modern-nav-top", k === "top"), document.body.classList.toggle("modern-nav-right", M), document.body.classList.toggle("modern-studio-active", e === "studio"), document.documentElement.style.setProperty("--modern-page-color", a.pageColors[e] || "");
  }, [e, f, a.pageColors]);
  const D = (k, R, M, Y) => {
    R !== "settings" && (k.preventDefault(), k.stopPropagation(), v({ key: R, label: M, starable: Y, x: Math.min(k.clientX, window.innerWidth - 190), y: Math.min(k.clientY, window.innerHeight - (Y ? 104 : 58)) }));
  }, U = () => {
    if (!h || !h.starable) return;
    const k = d.includes(h.key) ? d.filter((R) => R !== h.key) : [...d, h.key];
    localStorage.setItem("tabStarred", JSON.stringify(k)), m(k), v(null), window.dispatchEvent(new CustomEvent("app:preferences-changed"));
  }, N = () => {
    if (!h) return;
    const k = { ...a.hidden, [h.key]: !0 };
    localStorage.setItem("tabHidden", JSON.stringify(k));
    const R = document.getElementById(`tab-${h.key}`);
    R && (R.style.display = "none"), s({ ...a, hidden: k }), v(null), window.dispatchEvent(new CustomEvent("app:tab-visibility", { detail: { key: h.key, hidden: !0 } })), e === h.key && t("home");
  }, _ = (k) => [...k].sort((R, M) => {
    const Y = u.indexOf(`tab-${R.key}`), K = u.indexOf(`tab-${M.key}`);
    return (Y < 0 ? 1e4 + k.indexOf(R) : Y) - (K < 0 ? 1e4 + k.indexOf(M) : K);
  }), E = () => {
    C(null), y(null);
  }, T = (k, R, M) => {
    if (!x || x.group !== M || x.key === k) {
      E();
      return;
    }
    const Y = `tab-${x.key}`, K = `tab-${k}`, he = [...u];
    Gr.forEach((Ne) => {
      he.includes(Ne) || he.push(Ne);
    });
    const ge = he.filter((Ne) => Ne !== Y), I = ge.indexOf(K);
    ge.splice(I < 0 ? ge.length : I + (R ? 1 : 0), 0, Y), localStorage.setItem("tabOrder", JSON.stringify(ge)), r(ge), E(), window.dispatchEvent(new CustomEvent("app:preferences-changed"));
  }, b = [...hy, ["Links", i], my], g = b.flatMap(([, k]) => k), A = d.map((k) => g.find((R) => R.key === k)).filter((k) => !!k), O = new Set(A.map((k) => k.key)), z = b.map(([k, R]) => [k, k === "Workspace" ? [...R, ...A] : R.filter((M) => !O.has(M.key))]);
  return /* @__PURE__ */ n.jsxs("aside", { className: "modern-sidebar", children: [
    /* @__PURE__ */ n.jsxs("div", { className: "modern-brand", children: [
      /* @__PURE__ */ n.jsx("span", { children: "CS" }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("b", { children: "Call Studio" }),
        /* @__PURE__ */ n.jsx("small", { children: "Your operating system" })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("button", { className: "modern-add", onClick: l, children: [
      /* @__PURE__ */ n.jsx("span", { children: "＋" }),
      " Add something ",
      /* @__PURE__ */ n.jsx("kbd", { children: "⌘K" })
    ] }),
    /* @__PURE__ */ n.jsx("nav", { children: z.map(([k, R]) => /* @__PURE__ */ n.jsxs("section", { "data-group": k.toLowerCase(), children: [
      /* @__PURE__ */ n.jsx("h2", { children: k }),
      _(R).map((M) => {
        const Y = a.colors[M.key], K = rb(a.hotkeys[M.key]), he = Y ? { "--custom-tab": Y, background: Y, color: parseInt(Y.slice(1, 3), 16) * 0.299 + parseInt(Y.slice(3, 5), 16) * 0.587 + parseInt(Y.slice(5, 7), 16) * 0.114 > 155 ? "#172033" : "#fff" } : void 0, ge = `${(x == null ? void 0 : x.key) === M.key ? "dragging" : ""} ${(p == null ? void 0 : p.key) === M.key ? p.after ? "drop-after" : "drop-before" : ""}`.trim(), I = {
          draggable: !0,
          onDragStart: (F) => {
            C({ key: M.key, group: k }), F.dataTransfer.effectAllowed = "move", F.dataTransfer.setData("text/plain", M.key);
          },
          onDragEnd: E,
          onDragOver: (F) => {
            if (!x || x.group !== k || x.key === M.key) return;
            F.preventDefault();
            const qe = F.currentTarget.getBoundingClientRect(), al = document.body.classList.contains("modern-nav-top") ? F.clientX > qe.left + qe.width / 2 : F.clientY > qe.top + qe.height / 2;
            y({ key: M.key, after: al });
          },
          onDrop: (F) => {
            F.preventDefault();
            const qe = F.currentTarget.getBoundingClientRect(), al = document.body.classList.contains("modern-nav-top") ? F.clientX > qe.left + qe.width / 2 : F.clientY > qe.top + qe.height / 2;
            T(M.key, al, k);
          }
        };
        if ("url" in M)
          return a.hidden[M.key] ? null : /* @__PURE__ */ n.jsxs("a", { href: M.url, target: "_blank", rel: "noreferrer", className: ge, style: he, onContextMenu: (F) => D(F, M.key, M.label, !1), ...I, children: [
            /* @__PURE__ */ n.jsx("i", { children: M.icon }),
            M.label,
            /* @__PURE__ */ n.jsx("em", { children: "↗" })
          ] }, M.key);
        if (a.hidden[M.key] && M.key !== "settings") return null;
        const Ne = a.names[M.key] || M.label;
        return /* @__PURE__ */ n.jsxs("button", { "data-route": M.key, className: `${e === M.key ? "active " : ""}${ge}`.trim(), style: he, onClick: () => t(M.key), onContextMenu: (F) => D(F, M.key, Ne, M.key !== "home"), onMouseEnter: (F) => {
          S.current = M.key, F.metaKey && !F.buttons && w() && e !== M.key && t(M.key);
        }, onMouseLeave: () => {
          S.current === M.key && (S.current = null);
        }, ...I, children: [
          /* @__PURE__ */ n.jsx("i", { children: M.icon }),
          Ne,
          O.has(M.key) && /* @__PURE__ */ n.jsx("span", { className: "modern-tab-star", "aria-label": "Starred", title: "Starred", children: "★" }),
          K && /* @__PURE__ */ n.jsx("kbd", { className: a.hotkeysEnabled ? "" : "disabled", children: K })
        ] }, M.key);
      })
    ] }, k)) }),
    /* @__PURE__ */ n.jsx("div", { className: "modern-version", children: "React foundation · Phase 1" }),
    h && /* @__PURE__ */ n.jsxs("div", { className: "modern-context-menu", style: { left: h.x, top: h.y }, onClick: (k) => k.stopPropagation(), role: "menu", children: [
      h.starable && /* @__PURE__ */ n.jsx("button", { type: "button", onClick: U, role: "menuitem", children: d.includes(h.key) ? "★ Unstar tab" : "☆ Star tab" }),
      /* @__PURE__ */ n.jsxs("button", { type: "button", onClick: N, role: "menuitem", children: [
        "🙈 Hide ",
        h.label
      ] }),
      /* @__PURE__ */ n.jsx("small", { children: g.some((k) => k.key === h.key && "url" in k) ? "Show it again in Settings → Links" : "Unhide it in Settings" })
    ] })
  ] });
}
async function Q(e, t) {
  let l;
  try {
    l = await fetch(e, t);
  } catch {
    if (t != null && t.method && t.method !== "GET") throw new Error("Call Studio did not respond (it may have just restarted). Nothing was changed by this request that I know of; try again in a few seconds.");
    await new Promise((i) => setTimeout(i, 1500)), l = await fetch(e, t);
  }
  let a = null;
  try {
    a = await l.json();
  } catch {
  }
  if (!l.ok) {
    const s = typeof a == "object" && a && "error" in a ? String(a.error) : `Request failed (${l.status})`;
    throw new Error(s);
  }
  return a;
}
const db = () => Q("/api/swipe"), $r = (e) => Q("/api/swipe-download", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(e)
}), fb = (e, t) => Q("/api/swipe-update", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: e.id, ...t })
}), hb = (e) => Q(`/api/swipe-delete?id=${encodeURIComponent(e)}`, { method: "POST" }), mb = (e) => Q("/api/swipe-add", {
  method: "POST",
  body: e,
  headers: { "Content-Type": e.type || "application/octet-stream", "X-Title": encodeURIComponent(e.name.replace(/\.[^.]+$/, "")) }
}), Kr = (e) => `/swipe-img/${encodeURIComponent(e)}`, gy = (e) => `/swipe-video/${encodeURIComponent(e)}`, oh = (e) => Q(`/api/swipe-path?id=${encodeURIComponent(e)}`), gb = (e) => Q(`/api/swipe-reveal?id=${encodeURIComponent(e)}`, { method: "POST" });
function pb({ open: e, initial: t, onClose: l, onNavigate: a, onSwipeAdded: s }) {
  const [i, c] = j.useState(t || null), [u, r] = j.useState(""), [d, m] = j.useState(""), f = j.useRef(null);
  if (j.useEffect(() => {
    e && (c(t || null), m(""), setTimeout(() => {
      var v;
      return (v = f.current) == null ? void 0 : v.focus();
    }, 0));
  }, [e, t]), j.useEffect(() => {
    if (!e) return;
    const v = (x) => x.key === "Escape" && l();
    return document.addEventListener("keydown", v), () => document.removeEventListener("keydown", v);
  }, [e, l]), !e) return null;
  const o = () => {
    var v;
    l(), (v = document.getElementById("file-input")) == null || v.click();
  }, h = async () => {
    var v, x, C;
    if (!i || !u.trim()) return (v = f.current) == null ? void 0 : v.focus();
    m("Saving…");
    try {
      if (i === "swipe") {
        const p = await $r({ link: u.trim() });
        m(p.duplicate ? "Already saved ✓" : "Download started ✓"), s();
      }
      if (i === "tracker") {
        const p = await Q("/api/tracker-quick", { method: "POST", body: JSON.stringify({ text: u.trim() }) });
        if (!((x = p.entries) != null && x.length)) throw new Error(((C = p.problems) == null ? void 0 : C.join(", ")) || "Nothing was recognised");
        m(`Logged ${p.entries.length} tracker ${p.entries.length === 1 ? "entry" : "entries"} ✓`);
      }
      if (i === "idea") {
        const p = window.ciAppendIdea;
        if (!p) throw new Error("Content workspace is still loading");
        await p(u.trim()), m("Content idea saved ✓");
      }
      r("");
    } catch (p) {
      m(`⚠ ${p instanceof Error ? p.message : "Could not save"}`);
    }
  };
  return /* @__PURE__ */ n.jsx("div", { className: "modern-modal-backdrop", onMouseDown: (v) => v.target === v.currentTarget && l(), children: /* @__PURE__ */ n.jsxs("div", { className: "quick-modal", role: "dialog", "aria-modal": "true", "aria-label": "Add something", children: [
    /* @__PURE__ */ n.jsxs("header", { children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("small", { children: "QUICK CAPTURE" }),
        /* @__PURE__ */ n.jsx("h2", { children: "Add something" })
      ] }),
      /* @__PURE__ */ n.jsx("button", { onClick: l, children: "×" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "quick-kinds", children: [
      /* @__PURE__ */ n.jsxs("button", { onClick: o, children: [
        /* @__PURE__ */ n.jsx("b", { children: "🎙" }),
        /* @__PURE__ */ n.jsx("span", { children: "Call recording" })
      ] }),
      /* @__PURE__ */ n.jsxs("button", { className: i === "swipe" ? "on" : "", onClick: () => c("swipe"), children: [
        /* @__PURE__ */ n.jsx("b", { children: "📲" }),
        /* @__PURE__ */ n.jsx("span", { children: "Swipe link" })
      ] }),
      /* @__PURE__ */ n.jsxs("button", { className: i === "idea" ? "on" : "", onClick: () => c("idea"), children: [
        /* @__PURE__ */ n.jsx("b", { children: "💡" }),
        /* @__PURE__ */ n.jsx("span", { children: "Content idea" })
      ] }),
      /* @__PURE__ */ n.jsxs("button", { className: i === "tracker" ? "on" : "", onClick: () => c("tracker"), children: [
        /* @__PURE__ */ n.jsx("b", { children: "📈" }),
        /* @__PURE__ */ n.jsx("span", { children: "Tracker entry" })
      ] })
    ] }),
    i && /* @__PURE__ */ n.jsxs("div", { className: "quick-entry", children: [
      /* @__PURE__ */ n.jsx("label", { children: i === "swipe" ? "Instagram, TikTok, YouTube or Facebook link" : i === "idea" ? "What do you want to make?" : "Quick tracker shorthand" }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("input", { ref: f, value: u, onChange: (v) => r(v.target.value), onKeyDown: (v) => v.key === "Enter" && h(), placeholder: i === "swipe" ? "Paste a social link…" : i === "idea" ? "Capture the idea…" : "taken 3 closed 1 guitar 30…" }),
        /* @__PURE__ */ n.jsx("button", { onClick: h, children: i === "swipe" ? "Download" : "Save" })
      ] })
    ] }),
    /* @__PURE__ */ n.jsx("p", { className: "quick-status", children: d }),
    /* @__PURE__ */ n.jsxs("footer", { children: [
      /* @__PURE__ */ n.jsx("span", { children: "Open another area" }),
      ["clients", "accounting", "delegation", "journal"].map((v) => /* @__PURE__ */ n.jsx("button", { onClick: () => {
        l(), a(v);
      }, children: v[0].toUpperCase() + v.slice(1) }, v))
    ] })
  ] }) });
}
const yb = () => ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((e) => MediaRecorder.isTypeSupported(e)) || "", dh = /\[([^\]]+)\]\(((?:#|\/|https?:\/\/)[^)\s]+)\)/g;
function fh(e, t) {
  return e.split(/(\*\*[^*]+\*\*)/g).map((l, a) => /^\*\*[^*]+\*\*$/.test(l) ? /* @__PURE__ */ n.jsx("b", { children: l.slice(2, -2) }, t + a) : l);
}
function hh(e, t) {
  return e.replace(/\r/g, "").split(`
`).map((l, a) => {
    const s = /^\s*(?:[-•*]|\d+[.)])\s+/.exec(l), i = s ? l.slice(s[0].length) : l;
    return /* @__PURE__ */ n.jsx("div", { className: s ? "voice-li" : "voice-line", children: vb(i, t, String(a)) }, a);
  });
}
function vb(e, t, l) {
  const a = [];
  let s = 0, i, c = 0;
  for (dh.lastIndex = 0; i = dh.exec(e); ) {
    i.index > s && a.push(...fh(e.slice(s, i.index), l + "b" + c));
    const [, u, r] = i, d = /^https?:/.test(r);
    a.push(/* @__PURE__ */ n.jsx(
      "a",
      {
        className: "voice-link",
        href: r,
        target: d ? "_blank" : void 0,
        rel: d ? "noopener" : void 0,
        onClick: (m) => {
          m.stopPropagation(), r.startsWith("#") && (m.preventDefault(), t(r));
        },
        children: u
      },
      l + "a" + c++
    )), s = i.index + i[0].length;
  }
  return s < e.length && a.push(...fh(e.slice(s), l + "end")), a.length ? a : [" "];
}
function xb({ onNavigate: e }) {
  const [t, l] = j.useState(() => localStorage.getItem("voiceProvider") === "claude" ? "claude" : "chatgpt"), [a, s] = j.useState(!1), [i, c] = j.useState(!1), [u, r] = j.useState(!1), [d, m] = j.useState(""), [f, o] = j.useState(""), [h, v] = j.useState("Hover to speak"), [x, C] = j.useState([]), [p, y] = j.useState(null), [S, w] = j.useState([]), [D, U] = j.useState(""), N = j.useRef(null), _ = j.useRef(null), E = j.useRef([]), T = j.useRef(null), b = j.useRef(null), g = j.useRef(!1), A = j.useRef(null), O = j.useRef("");
  O.current = d;
  const [z, k] = j.useState(null), [R, M] = j.useState(() => localStorage.getItem("voiceDockPosition") === "center" ? "center" : "left");
  j.useEffect(() => {
    const H = (G) => {
      const W = G === "center" ? "center" : "left";
      M(W);
      try {
        localStorage.setItem("voiceDockPosition", W);
      } catch {
      }
    };
    Q("/api/settings").then((G) => H(G.voiceDockPosition || "left")).catch(() => {
    });
    const $ = (G) => H(String(G.detail));
    return window.addEventListener("callstudio:voice-position", $), () => window.removeEventListener("callstudio:voice-position", $);
  }, []);
  const Y = j.useRef([]), K = async () => {
    try {
      return await Q("/api/settings");
    } catch {
      return {};
    }
  }, he = j.useRef(!1), ge = j.useRef(!1), I = j.useRef({ recording: !1, busy: !1 });
  I.current = { recording: i, busy: u }, j.useEffect(() => {
    localStorage.setItem("voiceProvider", t);
  }, [t]), j.useEffect(() => {
    const H = ($) => {
      const G = $.key || $.code;
      if (G === "F19" || $.code === "F19") {
        $.preventDefault(), !I.current.recording && !I.current.busy && !he.current && Uc.current();
        return;
      }
      if (G === "F18" || $.code === "F18") {
        $.preventDefault(), he.current ? ge.current = !0 : I.current.recording && Lc.current();
        return;
      }
      ($.metaKey || $.ctrlKey) && $.shiftKey && $.code === "Space" && ($.preventDefault(), I.current.recording ? Lc.current() : !I.current.busy && !he.current && Uc.current());
    };
    return document.addEventListener("keydown", H), () => document.removeEventListener("keydown", H);
  }, []), j.useEffect(() => () => {
    var H;
    return (H = T.current) == null ? void 0 : H.getTracks().forEach(($) => $.stop());
  }, []);
  const Ne = j.useRef("");
  Ne.current = f;
  const F = (H) => {
    A.current !== null && (window.clearInterval(A.current), A.current = null, H && v(H));
  }, qe = async () => {
    if (g.current = !1, (await K()).voiceAutoSend === !1) return;
    F();
    const H = Date.now();
    let $ = O.current, G = Date.now();
    A.current = window.setInterval(() => {
      const W = O.current;
      if (W !== $ && ($ = W, G = Date.now()), W.trim() && Date.now() - G >= 1e3) {
        F(), dd.current();
        return;
      }
      W.trim() && v("Sending in a moment… (type or Esc to stop)"), !W.trim() && Date.now() - H > 1e4 && F("Hover to speak");
    }, 150);
  }, al = (H, $) => {
    Y.current.forEach((G) => window.clearTimeout(G)), Y.current = [], Y.current.push(window.setTimeout(() => k((G) => G && G.key === H ? { ...G, fading: !0 } : G), $)), Y.current.push(window.setTimeout(() => k((G) => G && G.key === H ? null : G), $ + 700));
  }, wn = async (H) => {
    const $ = (await K()).voiceToastSeconds ?? 5;
    if (Y.current.forEach((W) => window.clearTimeout(W)), Y.current = [], !H || $ <= 0) {
      k(null);
      return;
    }
    const G = Date.now();
    k({ text: H, key: G, fading: !1 }), al(G, $ * 1e3);
  }, Cn = (H) => {
    window.location.hash = H, k(null);
  };
  j.useEffect(() => {
    let H = !0, $ = -1;
    const G = () => {
      const se = document.activeElement;
      return !!se && se !== b.current && (se.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(se.tagName));
    };
    return (async () => {
      for (; H; )
        try {
          const se = await Q(`/api/voice-wait?after=${$}`), hd = $ >= 0 && se.seq > $ && Date.now() / 1e3 - se.at < 3;
          if ($ = se.seq, hd && se.kind === "release") {
            g.current && qe();
            continue;
          }
          hd && document.visibilityState === "visible" && document.hasFocus() && !G() && !I.current.recording && !I.current.busy && (F(), Ne.current && (m(""), o("")), g.current = !0, s(!0), v("Speak — Wispr Flow types here"), window.setTimeout(() => {
            var md;
            return (md = b.current) == null ? void 0 : md.focus();
          }, 0));
        } catch {
          await new Promise((se) => window.setTimeout(se, 3e3));
        }
    })(), () => {
      H = !1;
    };
  }, []), j.useEffect(() => {
    const H = ($) => {
      const G = $.detail;
      G != null && G.path && (C((W) => W.some((se) => se.path === G.path) ? W : [...W, G]), s(!0), v("File attached"));
    };
    return window.addEventListener("callstudio:voice-attach", H), () => window.removeEventListener("callstudio:voice-attach", H);
  }, []);
  const L = async () => {
    const H = await Q("/api/voice-history");
    w(H.items), y("history");
  }, q = async () => {
    const H = await Q("/api/voice-instructions");
    U(H.instructions), y("instructions");
  }, V = async (H) => {
    for (const $ of H)
      try {
        const G = await Q("/api/voice-attachment", { method: "POST", body: $, headers: { "Content-Type": $.type || "application/octet-stream", "X-Filename": encodeURIComponent($.name) } });
        C((W) => [...W, G]);
      } catch (G) {
        v(G instanceof Error ? G.message : "Attachment failed");
      }
  }, re = async (H) => {
    r(!0), v("Transcribing locally…"), o("");
    try {
      const $ = await Q("/api/voice-transcribe", { method: "POST", headers: { "Content-Type": H.type || "audio/webm" }, body: H });
      m($.text), v("Ready to send"), window.setTimeout(() => {
        const G = b.current;
        G && (G.focus(), G.setSelectionRange(G.value.length, G.value.length));
      }, 0);
    } catch ($) {
      v($ instanceof Error ? $.message : "Could not transcribe");
    } finally {
      r(!1);
    }
  }, lt = () => {
    var H;
    ((H = _.current) == null ? void 0 : H.state) === "recording" && _.current.stop();
  }, at = async () => {
    s(!0), o(""), he.current = !0, ge.current = !1;
    try {
      const H = await navigator.mediaDevices.getUserMedia({ audio: !0 });
      T.current = H, E.current = [];
      const $ = yb(), G = new MediaRecorder(H, $ ? { mimeType: $ } : void 0);
      _.current = G, G.ondataavailable = (W) => {
        W.data.size && E.current.push(W.data);
      }, G.onstop = () => {
        const W = new Blob(E.current, { type: G.mimeType || "audio/webm" });
        H.getTracks().forEach((se) => se.stop()), T.current = null, c(!1), W.size && re(W);
      }, G.start(), c(!0), v("Listening… let go of Fn (or click ■) to stop"), he.current = !1, ge.current && (ge.current = !1, G.stop());
    } catch (H) {
      he.current = !1, v(H instanceof Error ? H.message : "Microphone access failed");
    }
  }, dd = j.useRef(() => {
  }), Uc = j.useRef(at), Lc = j.useRef(lt);
  Uc.current = at, Lc.current = lt;
  const fd = (H, $, G) => {
    if ($)
      try {
        localStorage.setItem("tk-view", $);
      } catch {
      }
    e(H), $ && !G && window.setTimeout(() => window.dispatchEvent(new CustomEvent("callstudio:tracker-view", { detail: $ })), 50), G && window.setTimeout(() => window.dispatchEvent(new CustomEvent("callstudio:tracker-focus", { detail: G })), 150);
  }, Bc = async () => {
    var H, $;
    if (!(!d.trim() || u)) {
      r(!0), o(""), v(`Asking ${t === "chatgpt" ? "ChatGPT" : "Claude"}…`);
      try {
        let G = d;
        if (!x.length) {
          const se = await Q("/api/voice-split", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: d }) }).catch(() => null);
          if (se != null && se.nav) {
            if (fd(se.nav.route, se.nav.view, se.nav.metric), !se.rest.trim()) {
              m(""), o(""), y(null), s(!1), v("Hover to speak"), (H = b.current) == null || H.blur(), wn(se.nav.answer);
              return;
            }
            G = se.rest, v(`${se.nav.answer} Asking ${t === "chatgpt" ? "ChatGPT" : "Claude"}…`);
          }
        }
        const W = await Q("/api/voice-command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: t, prompt: G, attachments: x }) });
        if (o(W.answer), v(W.action ? "Done" : "Answered"), W.action === "navigate" && W.route && fd(W.route, W.view), W.action === "tracker" && window.dispatchEvent(new CustomEvent("callstudio:tracker-updated")), W.action === "calendar" && window.dispatchEvent(new CustomEvent("callstudio:calendar-updated")), W.action === "todo" && window.dispatchEvent(new CustomEvent("callstudio:todos-updated")), W.action === "call_search" && (e("studio"), window.setTimeout(() => window.dispatchEvent(new CustomEvent("callstudio:call-search", { detail: W })), 100)), W.action === "download" && W.url) {
          const se = document.createElement("a");
          se.href = W.url, se.click();
        }
        Q("/api/voice-history").then((se) => w(se.items)).catch(() => {
        }), W.action && (m(""), o(""), C([]), y(null), s(!1), v("Hover to speak"), ($ = b.current) == null || $.blur(), wn(W.answer));
      } catch (G) {
        v(G instanceof Error ? G.message : "Command failed");
      } finally {
        r(!1);
      }
    }
  };
  return dd.current = Bc, /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    z && /* @__PURE__ */ n.jsxs(
      "div",
      {
        className: `voice-toast pos-${R} ${z.fading ? "fading" : ""}`,
        onClick: () => k(null),
        title: "Click to hide · stays while the mouse is on it",
        onMouseEnter: () => {
          Y.current.forEach((H) => window.clearTimeout(H)), Y.current = [], k((H) => H && { ...H, fading: !1 });
        },
        onMouseLeave: () => al(z.key, 2e3),
        children: [
          /* @__PURE__ */ n.jsx("span", { className: "voice-tick", children: "✓" }),
          /* @__PURE__ */ n.jsx("div", { className: "voice-toast-body", children: hh(z.text, Cn) })
        ]
      },
      z.key
    ),
    /* @__PURE__ */ n.jsx("div", { className: `voice-dock pos-${R} ${a || i || u || d || f ? "open" : ""}`, onMouseEnter: () => s(!0), onMouseLeave: () => {
      !i && !u && !d && !f && s(!1);
    }, children: /* @__PURE__ */ n.jsxs("div", { className: "voice-panel", children: [
      /* @__PURE__ */ n.jsxs("button", { className: "voice-handle", type: "button", onClick: () => s((H) => !H), "aria-label": "Open voice commands", children: [
        /* @__PURE__ */ n.jsx("span", { className: i ? "pulse" : "", children: "●" }),
        " Voice command ",
        /* @__PURE__ */ n.jsx("small", { children: "hold Fn · ⌘⇧Space" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "voice-body", children: [
        /* @__PURE__ */ n.jsxs("div", { className: "voice-topline", children: [
          /* @__PURE__ */ n.jsxs("div", { className: "voice-provider", "aria-label": "AI provider", children: [
            /* @__PURE__ */ n.jsx("button", { className: t === "chatgpt" ? "on" : "", onClick: () => l("chatgpt"), children: "ChatGPT" }),
            /* @__PURE__ */ n.jsx("button", { className: t === "claude" ? "on" : "", onClick: () => l("claude"), children: "Claude" })
          ] }),
          /* @__PURE__ */ n.jsxs("div", { className: "voice-tools", children: [
            /* @__PURE__ */ n.jsx("button", { onClick: L, children: "History" }),
            /* @__PURE__ */ n.jsx("button", { onClick: q, children: "Instructions" }),
            /* @__PURE__ */ n.jsx("button", { onClick: () => {
              var H;
              return (H = N.current) == null ? void 0 : H.click();
            }, children: "＋ File" }),
            /* @__PURE__ */ n.jsx("input", { ref: N, type: "file", multiple: !0, hidden: !0, onChange: (H) => {
              V([...H.target.files || []]), H.target.value = "";
            } })
          ] }),
          /* @__PURE__ */ n.jsx("button", { className: "voice-close", onClick: () => {
            s(!1), m(""), o(""), v("Hover to speak"), y(null);
          }, children: "×" })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "voice-compose", onDragOver: (H) => H.preventDefault(), onDrop: (H) => {
          H.preventDefault(), V([...H.dataTransfer.files]);
        }, children: [
          /* @__PURE__ */ n.jsx("button", { className: `voice-mic ${i ? "recording" : ""}`, onClick: i ? lt : at, disabled: u, title: i ? "Stop recording" : "Start recording", children: i ? "■" : "🎙" }),
          /* @__PURE__ */ n.jsx("textarea", { ref: b, value: d, onChange: (H) => m(H.target.value), onKeyDown: (H) => {
            if ((H.metaKey || H.ctrlKey) && H.key === "Enter") {
              F(), Bc();
              return;
            }
            A.current !== null && !H.metaKey && !H.ctrlKey && (H.key.length === 1 || ["Backspace", "Delete", "Escape"].includes(H.key)) && F(H.key === "Escape" ? "Not sent (Esc)" : "Not sent: you are editing — ⌘↵ to send");
          }, placeholder: "Speak, type, or drop files here…", rows: 2 }),
          /* @__PURE__ */ n.jsx("button", { className: "voice-send", onClick: Bc, disabled: u || !d.trim(), children: "Send" })
        ] }),
        !!x.length && /* @__PURE__ */ n.jsx("div", { className: "voice-files", children: x.map((H) => /* @__PURE__ */ n.jsxs("span", { children: [
          "📎 ",
          H.name,
          /* @__PURE__ */ n.jsx("button", { onClick: () => C(($) => $.filter((G) => G !== H)), children: "×" })
        ] }, H.path)) }),
        /* @__PURE__ */ n.jsxs("div", { className: "voice-status", children: [
          u && /* @__PURE__ */ n.jsx("i", {}),
          /* @__PURE__ */ n.jsx("span", { children: h }),
          /* @__PURE__ */ n.jsx("small", { children: "⌘↵ to send" })
        ] }),
        f && /* @__PURE__ */ n.jsx("div", { className: "voice-answer", children: hh(f, Cn) }),
        p === "history" && /* @__PURE__ */ n.jsxs("div", { className: "voice-subpanel", children: [
          /* @__PURE__ */ n.jsxs("header", { children: [
            /* @__PURE__ */ n.jsx("b", { children: "Command log" }),
            /* @__PURE__ */ n.jsx("button", { onClick: async () => {
              await Q("/api/voice-history-clear", { method: "POST" }), w([]);
            }, children: "Clear" })
          ] }),
          S.length ? S.map((H, $) => /* @__PURE__ */ n.jsxs("div", { className: "voice-history-row", children: [
            /* @__PURE__ */ n.jsx("time", { children: new Date(H.at * 1e3).toLocaleString() }),
            /* @__PURE__ */ n.jsx("b", { children: H.prompt }),
            /* @__PURE__ */ n.jsx("span", { children: H.answer })
          ] }, $)) : /* @__PURE__ */ n.jsx("p", { children: "No commands yet." })
        ] }),
        p === "instructions" && /* @__PURE__ */ n.jsxs("div", { className: "voice-subpanel", children: [
          /* @__PURE__ */ n.jsxs("header", { children: [
            /* @__PURE__ */ n.jsx("b", { children: "Voice guide — one set of instructions for ChatGPT and Claude" }),
            /* @__PURE__ */ n.jsx("button", { onClick: async () => {
              await Q("/api/voice-instructions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instructions: D }) }), v("Instructions saved");
            }, children: "Save" })
          ] }),
          /* @__PURE__ */ n.jsx("textarea", { rows: 14, value: D, onChange: (H) => U(H.target.value), placeholder: "Examples: Use my swipe files as creative references. Keep answers concise. For call searches, prefer exact section names…" })
        ] })
      ] })
    ] }) })
  ] });
}
const Ai = (e, t = !0) => {
  const l = Number(e);
  return l === 0 ? [t ? "☀️" : "🌙", "Clear"] : l <= 2 ? [t ? "🌤️" : "☁️", l === 1 ? "Mostly clear" : "Partly cloudy"] : l === 3 ? ["☁️", "Cloudy"] : l <= 48 ? ["🌫️", "Fog"] : l <= 57 ? ["🌦️", "Drizzle"] : l <= 67 || l >= 80 && l <= 82 ? ["🌧️", l >= 80 ? "Showers" : "Rain"] : l <= 77 || l === 85 || l === 86 ? ["🌨️", "Snow"] : l >= 95 ? ["⛈️", "Thunderstorm"] : ["🌡️", ""];
}, Vr = (e = !1) => Q(`/api/weather${e ? "?refresh=1" : ""}`), Ea = (e) => e == null ? "–" : Math.round(e);
function jb() {
  var p, y, S;
  const [e, t] = j.useState(null), [l, a] = j.useState(""), [s, i] = j.useState(""), [c, u] = j.useState(!1), [r, d] = j.useState(0);
  j.useEffect(() => {
    Vr().then(t).catch((w) => a(w.message));
  }, []);
  const m = async () => {
    if (s.trim())
      try {
        t(await Q("/api/weather", { method: "POST", body: JSON.stringify({ place: s }) })), u(!1), a(""), window.dispatchEvent(new CustomEvent("callstudio:weather-updated"));
      } catch (w) {
        a(w instanceof Error ? w.message : "not found");
      }
  }, f = (e == null ? void 0 : e.days) || [], o = (p = f[r]) == null ? void 0 : p.date, h = (/* @__PURE__ */ new Date()).getHours(), v = ((e == null ? void 0 : e.hours) || []).filter((w) => w.t.slice(0, 10) === o && (r > 0 || Number(w.t.slice(11, 13)) >= h)), [x, C] = Ai((y = e == null ? void 0 : e.current) == null ? void 0 : y.code, (S = e == null ? void 0 : e.current) == null ? void 0 : S.day);
  return /* @__PURE__ */ n.jsxs("main", { className: "modern-page weather-page", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "page-hero compact", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("small", { children: "WEATHER" }),
        /* @__PURE__ */ n.jsx("h1", { children: e != null && e.current ? `${x} ${Ea(e.current.temp)}° · ${C}` : "Weather" }),
        /* @__PURE__ */ n.jsx("p", { children: e ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
          "📍 ",
          c ? /* @__PURE__ */ n.jsxs("span", { className: "wx-place", children: [
            /* @__PURE__ */ n.jsx("input", { autoFocus: !0, value: s, onChange: (w) => i(w.target.value), onKeyDown: (w) => {
              w.key === "Enter" && m(), w.key === "Escape" && u(!1);
            }, placeholder: "Town or city…" }),
            /* @__PURE__ */ n.jsx("button", { onClick: m, children: "Set" })
          ] }) : /* @__PURE__ */ n.jsx("button", { className: "wx-link", title: "Change the place", onClick: () => {
            i(""), u(!0);
          }, children: e.place }),
          e.current && ` · feels ${Ea(e.current.feels)}° · wind ${Ea(e.current.wind)} km/h`
        ] }) : "Loading…" }),
        (l || (e == null ? void 0 : e.error)) && /* @__PURE__ */ n.jsxs("p", { className: "wx-err", children: [
          "⚠️ ",
          l || `Offline — showing the last forecast (${e == null ? void 0 : e.error})`
        ] })
      ] }),
      (e == null ? void 0 : e.at) && /* @__PURE__ */ n.jsxs("button", { title: "Look it up again now", onClick: () => Vr(!0).then(t), children: [
        "↻ Updated ",
        new Date(e.at * 1e3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      ] })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "wx-days", children: f.map((w, D) => {
      const [U, N] = Ai(w.code);
      return /* @__PURE__ */ n.jsxs("section", { className: D === r ? "today" : "", onClick: () => d(D), title: "Show its hours", children: [
        /* @__PURE__ */ n.jsx("b", { children: D === 0 ? "Today" : (/* @__PURE__ */ new Date(`${w.date}T12:00:00`)).toLocaleDateString([], { weekday: "short", day: "numeric" }) }),
        /* @__PURE__ */ n.jsx("span", { className: "wx-icon", children: U }),
        /* @__PURE__ */ n.jsx("small", { children: N }),
        /* @__PURE__ */ n.jsxs("strong", { children: [
          Ea(w.max),
          "° ",
          /* @__PURE__ */ n.jsxs("em", { children: [
            Ea(w.min),
            "°"
          ] })
        ] }),
        /* @__PURE__ */ n.jsxs("small", { children: [
          "💧 ",
          w.rain ?? 0,
          "%"
        ] }),
        /* @__PURE__ */ n.jsxs("small", { className: "wx-sun", children: [
          "↑ ",
          w.sunrise,
          " · ↓ ",
          w.sunset
        ] })
      ] }, w.date);
    }) }),
    v.length > 0 && /* @__PURE__ */ n.jsx("div", { className: "wx-hours", children: v.map((w) => {
      const [D] = Ai(w.code, w.day), U = Number(w.t.slice(11, 13));
      return /* @__PURE__ */ n.jsxs("div", { className: r === 0 && U === h ? "now" : "", children: [
        /* @__PURE__ */ n.jsx("small", { children: r === 0 && U === h ? "Now" : `${w.t.slice(11, 13)}:00` }),
        /* @__PURE__ */ n.jsx("span", { children: D }),
        /* @__PURE__ */ n.jsxs("b", { children: [
          Ea(w.temp),
          "°"
        ] }),
        /* @__PURE__ */ n.jsxs("small", { className: w.rain >= 50 ? "wet" : "", children: [
          "💧 ",
          w.rain ?? 0,
          "%"
        ] })
      ] }, w.t);
    }) })
  ] });
}
const bb = { day: [], dayCalls: [], dayError: "", queue: [], followups: [], swipe: [], tracker: {} }, Sl = async (e, t) => {
  try {
    return await Q(e);
  } catch {
    return t;
  }
}, Nb = (e) => {
  var t;
  return ((t = window.displayName) == null ? void 0 : t.call(window, String(e))) || String(e);
}, mh = (e, t = []) => {
  var l;
  return ((l = window.displayNamesInText) == null ? void 0 : l.call(window, String(e || ""), t)) || String(e || "");
}, Sb = (e) => `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`, wb = (e, t, l) => {
  if (!l) return { value: null, label: "" };
  const a = /* @__PURE__ */ new Date(`${l}T12:00:00`), s = new Date(a), i = Number(e.rolling || 0), c = e.id === "steps" ? "w" : e.id === "commissions" ? "m" : String(e.defaultPeriod || "d");
  i ? s.setDate(s.getDate() - i + 1) : c === "m" ? s.setDate(1) : c === "w" && s.setDate(s.getDate() - s.getDay());
  const u = /* @__PURE__ */ new Set();
  for (const o = new Date(s); o <= a; o.setDate(o.getDate() + 1)) u.add(Sb(o));
  const r = /* @__PURE__ */ new Map();
  t.filter((o) => o.metric === e.id && u.has(String(o.date || ""))).forEach((o) => {
    const h = String(o.date), v = r.get(h) || [];
    v.push(o), r.set(h, v);
  });
  const d = [...r.entries()].sort(([o], [h]) => o.localeCompare(h)).map(([, o]) => {
    const v = [...o].sort((x, C) => Number(x.at || 0) - Number(C.at || 0)).map((x) => Number(x.value)).filter(Number.isFinite);
    return v.length ? e.agg === "avg" ? e.type === "rating" && !e.multi ? v[v.length - 1] : v.reduce((x, C) => x + C, 0) / v.length : e.agg === "last" ? v[v.length - 1] : e.agg === "any" ? v.some(Boolean) ? 1 : 0 : v.reduce((x, C) => x + C, 0) : null;
  }).filter((o) => o !== null), m = i ? `${i}-day avg` : c === "m" ? "month to date" : c === "w" ? "week to date" : "today";
  return d.length ? { value: i || e.agg === "avg" ? d.reduce((o, h) => o + h, 0) / d.length : e.agg === "last" ? d[d.length - 1] : d.reduce((o, h) => o + h, 0), label: m } : { value: null, label: m };
}, Cb = (e, t) => {
  if (t === null) return "—";
  if (e.type === "money") return `$${Math.round(t).toLocaleString()}`;
  const l = e.type === "rating" || e.type === "weight" || Math.abs(t) < 100 ? Math.round(t * 10) / 10 : Math.round(t), a = String(e.unit || "");
  return `${l.toLocaleString()}${a ? `${e.type === "weight" ? " " : ""}${a}` : ""}`;
};
function Tb({ onNavigate: e, onAdd: t }) {
  const [l, a] = j.useState(bb), [s, i] = j.useState(!0), [, c] = j.useState(0);
  j.useEffect(() => {
    const h = () => c((v) => v + 1);
    return window.addEventListener("callstudio:demo-mode", h), () => window.removeEventListener("callstudio:demo-mode", h);
  }, []), j.useEffect(() => {
    const h = () => Sl("/api/tracker", {}).then((v) => a((x) => ({ ...x, tracker: v })));
    return window.addEventListener("callstudio:tracker-updated", h), () => window.removeEventListener("callstudio:tracker-updated", h);
  }, []), j.useEffect(() => {
    let h = !0;
    return Promise.all([
      Sl("/api/day-events", {}),
      Sl("/api/queue", {}),
      Sl("/api/followups", {}),
      Sl("/api/swipe", {}),
      Sl("/api/tracker", {})
    ]).then(([v, x, C, p, y]) => {
      h && (a({ day: v.events || [], dayCalls: v.calls || [], dayError: v.error || "", queue: x.items || [], followups: C.items || [], swipe: p.items || [], tracker: y }), i(!1));
    }), () => {
      h = !1;
    };
  }, []);
  const [u, r] = j.useState({});
  j.useEffect(() => {
    const h = () => Sl("/api/ai-usage", {}).then(r);
    h();
    const v = setInterval(h, 6e4);
    return () => clearInterval(v);
  }, []);
  const d = /* @__PURE__ */ new Date(), m = d.getHours() < 12 ? "Good morning" : d.getHours() < 18 ? "Good afternoon" : "Good evening", f = l.swipe.filter((h) => h.download && !["done", "error"].includes(h.download.stage)), o = (l.tracker.metrics || []).filter((h) => h.starred && !h.archived).slice(0, 5);
  return /* @__PURE__ */ n.jsxs("main", { className: "modern-page home-page", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "page-hero", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsxs("small", { children: [
          d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }).toUpperCase(),
          " · CALL STUDIO"
        ] }),
        /* @__PURE__ */ n.jsxs("h1", { children: [
          m,
          ", Stefan."
        ] }),
        /* @__PURE__ */ n.jsx("p", { children: "Your work, priorities, and ideas in one place." })
      ] }),
      /* @__PURE__ */ n.jsx(Eb, { onOpen: () => e("weather") }),
      /* @__PURE__ */ n.jsxs("div", { className: "usage-chips", children: [
        /* @__PURE__ */ n.jsx(gh, { name: "Claude", side: u.claude }),
        /* @__PURE__ */ n.jsx(gh, { name: "ChatGPT", side: u.codex })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "primary", onClick: () => t(), children: "＋ Add something" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "dashboard-grid", children: [
      /* @__PURE__ */ n.jsx(na, { title: "Today", action: "Open day", onAction: () => e("today"), wide: !0, children: s ? /* @__PURE__ */ n.jsx(ph, {}) : l.day.length ? l.day.slice(0, 5).map((h, v) => /* @__PURE__ */ n.jsxs("div", { className: "dashboard-row", children: [
        /* @__PURE__ */ n.jsx("time", { children: String(h.start || h.time || h.startLabel || "") }),
        /* @__PURE__ */ n.jsx("span", { children: mh(h.label || h.title || h.summary || "", l.dayCalls.map((x) => String(x.name || ""))) }),
        !!(h.done || h.checked) && /* @__PURE__ */ n.jsx("b", { children: "✓" })
      ] }, v)) : /* @__PURE__ */ n.jsx(qn, { children: l.dayError || "Nothing scheduled today." }) }),
      /* @__PURE__ */ n.jsx(na, { title: "Call processing", action: "Open calls", onAction: () => e("studio"), children: s ? /* @__PURE__ */ n.jsx(ph, {}) : l.queue.length ? l.queue.slice(0, 4).map((h, v) => /* @__PURE__ */ n.jsxs("div", { className: "job-row", children: [
        /* @__PURE__ */ n.jsxs("span", { children: [
          /* @__PURE__ */ n.jsx("b", { children: Nb(h.name || "Call") }),
          /* @__PURE__ */ n.jsx("small", { children: mh(h.message || h.stage || "", [String(h.name || "")]) })
        ] }),
        /* @__PURE__ */ n.jsxs("strong", { children: [
          Math.round(Number(h.percent) || 0),
          "%"
        ] })
      ] }, v)) : /* @__PURE__ */ n.jsx(qn, { children: "Nothing is processing ✓" }) }),
      /* @__PURE__ */ n.jsxs(na, { title: "Follow-ups", action: "View all", onAction: () => e("followup"), children: [
        /* @__PURE__ */ n.jsx("div", { className: "big-stat", children: l.followups.filter((h) => !h.done).length }),
        /* @__PURE__ */ n.jsx(qn, { children: "People still needing attention" })
      ] }),
      /* @__PURE__ */ n.jsxs(na, { title: "Swipe gallery", action: "Open gallery", onAction: () => e("swipe"), children: [
        /* @__PURE__ */ n.jsxs("div", { className: "stat-line", children: [
          /* @__PURE__ */ n.jsx("strong", { children: l.swipe.length }),
          /* @__PURE__ */ n.jsx("span", { children: "saved ideas" })
        ] }),
        /* @__PURE__ */ n.jsxs("p", { className: f.length ? "activity live" : "activity", children: [
          /* @__PURE__ */ n.jsx("i", {}),
          f.length ? `${f.length} download${f.length === 1 ? "" : "s"} in progress` : "No downloads in progress"
        ] })
      ] }),
      /* @__PURE__ */ n.jsx(na, { title: "Tracker", action: "Open tracker", onAction: () => e("tracker"), children: o.length ? o.map((h, v) => {
        const x = wb(h, l.tracker.entries || [], l.tracker.today);
        return /* @__PURE__ */ n.jsxs("div", { className: "dashboard-row", children: [
          /* @__PURE__ */ n.jsxs("span", { children: [
            String(h.emoji || "📊"),
            " ",
            String(h.name || ""),
            " ",
            /* @__PURE__ */ n.jsx("small", { className: "tracker-period", children: x.label })
          ] }),
          /* @__PURE__ */ n.jsx("b", { children: Cb(h, x.value) })
        ] }, v);
      }) : /* @__PURE__ */ n.jsx(qn, { children: "Star metrics in Tracker to see them here." }) }),
      /* @__PURE__ */ n.jsx(na, { title: "Quick capture", children: /* @__PURE__ */ n.jsxs("div", { className: "capture-grid", children: [
        /* @__PURE__ */ n.jsx("button", { onClick: () => {
          var h;
          return (h = document.getElementById("file-input")) == null ? void 0 : h.click();
        }, children: "🎙 Upload call" }),
        /* @__PURE__ */ n.jsx("button", { onClick: () => t("swipe"), children: "📲 Save social link" }),
        /* @__PURE__ */ n.jsx("button", { onClick: () => t("idea"), children: "💡 Content idea" }),
        /* @__PURE__ */ n.jsx("button", { onClick: () => t("tracker"), children: "📈 Log tracker" })
      ] }) }),
      /* @__PURE__ */ n.jsx(Db, {})
    ] })
  ] });
}
function Eb({ onOpen: e }) {
  var c;
  const [t, l] = j.useState(null);
  if (j.useEffect(() => {
    const u = () => Vr().then(l).catch(() => {
    });
    u();
    const r = setInterval(u, 36e5);
    return window.addEventListener("callstudio:weather-updated", u), () => {
      clearInterval(r), window.removeEventListener("callstudio:weather-updated", u);
    };
  }, []), !(t != null && t.current)) return null;
  const [a, s] = Ai(t.current.code, t.current.day), i = (c = t.days) == null ? void 0 : c[0];
  return /* @__PURE__ */ n.jsxs("button", { className: "weather-chip", onClick: e, title: `${s} in ${t.place} — open the 5-day forecast`, children: [
    /* @__PURE__ */ n.jsx("span", { children: a }),
    /* @__PURE__ */ n.jsxs("b", { children: [
      Math.round(t.current.temp),
      "°"
    ] }),
    /* @__PURE__ */ n.jsxs("small", { children: [
      i ? `${Math.round(i.max)}° / ${Math.round(i.min)}°` : s,
      /* @__PURE__ */ n.jsx("br", {}),
      t.place.split(",")[0]
    ] })
  ] });
}
const ai = (e) => {
  if (!e) return "";
  const t = e - Date.now() / 1e3;
  if (t <= 0) return "resets now";
  const l = Math.floor(t / 86400), a = Math.floor(t % 86400 / 3600), s = Math.floor(t % 3600 / 60);
  return "resets in " + (l ? `${l}d ${a}h` : a ? `${a}h ${s}m` : `${s}m`);
};
function gh({ name: e, side: t }) {
  const l = t == null ? void 0 : t.weekly, a = t == null ? void 0 : t.five_hour, s = t != null && t.saved_at ? Date.now() / 1e3 - t.saved_at > 6 * 3600 : !1;
  if (!a || a.used == null) return /* @__PURE__ */ n.jsxs("div", { className: "usage-row", children: [
    /* @__PURE__ */ n.jsx("b", { children: e }),
    /* @__PURE__ */ n.jsx("div", { className: "usage-bar" }),
    /* @__PURE__ */ n.jsx("span", { children: "no data yet" })
  ] });
  const i = Math.max(0, Math.round(100 - a.used)), c = (l == null ? void 0 : l.used) == null ? null : Math.max(0, Math.round(100 - l.used)), u = i <= 10 ? "low" : i <= 30 ? "mid" : "";
  return /* @__PURE__ */ n.jsxs("div", { className: `usage-row ${u}`, tabIndex: 0, "aria-label": `${e} session limit: ${i}% left, ${ai(a.resets_at)}${c == null ? "" : `. Weekly limit: ${c}% left, ${ai(l == null ? void 0 : l.resets_at)}`}${s ? ". Data last seen a while ago" : ""}`, children: [
    /* @__PURE__ */ n.jsx("b", { children: e }),
    /* @__PURE__ */ n.jsx("div", { className: "usage-bar", children: /* @__PURE__ */ n.jsx("i", { style: { width: `${i}%` } }) }),
    /* @__PURE__ */ n.jsxs("span", { children: [
      i,
      "% left",
      s ? "*" : "",
      " · ",
      ai(a.resets_at)
    ] }),
    c != null && /* @__PURE__ */ n.jsxs("div", { className: "usage-tooltip", role: "tooltip", children: [
      /* @__PURE__ */ n.jsx("strong", { children: "Weekly limit" }),
      /* @__PURE__ */ n.jsxs("span", { children: [
        c,
        "% left · ",
        ai(l == null ? void 0 : l.resets_at)
      ] })
    ] })
  ] });
}
function na({ title: e, action: t, onAction: l, wide: a, children: s }) {
  return /* @__PURE__ */ n.jsxs("section", { className: `dashboard-card${a ? " wide" : ""}`, children: [
    /* @__PURE__ */ n.jsxs("header", { children: [
      /* @__PURE__ */ n.jsx("h2", { children: e }),
      t && /* @__PURE__ */ n.jsxs("button", { onClick: l, children: [
        t,
        " →"
      ] })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "card-body", children: s })
  ] });
}
function qn({ children: e }) {
  return /* @__PURE__ */ n.jsx("p", { className: "empty", children: e });
}
function ph() {
  return /* @__PURE__ */ n.jsxs("div", { className: "skeleton", children: [
    /* @__PURE__ */ n.jsx("i", {}),
    /* @__PURE__ */ n.jsx("i", {}),
    /* @__PURE__ */ n.jsx("i", {})
  ] });
}
function Db() {
  const [e, t] = j.useState([]), [l, a] = j.useState(""), [s, i] = j.useState(""), c = async (C) => {
    try {
      await navigator.clipboard.writeText(C.text), i(C.id), window.setTimeout(() => i((p) => p === C.id ? "" : p), 1200);
    } catch {
    }
  }, u = j.useCallback(() => Sl("/api/records?name=todos", {}).then((C) => t(C.items || [])), []);
  j.useEffect(() => (u(), window.addEventListener("callstudio:todos-updated", u), () => window.removeEventListener("callstudio:todos-updated", u)), [u]);
  const r = async (C) => {
    t(C), await fetch("/api/records?name=todos", { method: "POST", body: JSON.stringify({ items: C }) });
  }, d = () => {
    l.trim() && (r([{ id: crypto.randomUUID(), text: l.trim(), done: !1, created: Date.now() / 1e3 }, ...e]), a(""));
  }, [m, f] = j.useState(""), o = (C, p) => {
    f("");
    const y = p == null ? void 0 : p.trim();
    y && y !== C.text && r(e.map((S) => S.id === C.id ? { ...S, text: y } : S));
  }, h = [...e.filter((C) => !C.done), ...e.filter((C) => C.done)], v = (C) => {
    const p = h.filter((S) => S.id !== C.id), y = { ...C, done: !C.done };
    r([...p.filter((S) => !S.done), y, ...p.filter((S) => S.done)]);
  }, x = (C) => {
    C && (C.style.height = "auto", C.style.height = `${C.scrollHeight}px`);
  };
  return /* @__PURE__ */ n.jsxs(na, { title: "General to-do", wide: !0, children: [
    /* @__PURE__ */ n.jsxs("div", { className: "todo-add", children: [
      /* @__PURE__ */ n.jsx("input", { value: l, onChange: (C) => a(C.target.value), onKeyDown: (C) => C.key === "Enter" && d(), placeholder: "Something to do that isn't a calendar event…" }),
      /* @__PURE__ */ n.jsx("button", { onClick: d, children: "Add" })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "todo-list", children: e.length ? h.map((C, p) => /* @__PURE__ */ n.jsxs("div", { className: `todo-item${C.done ? " done" : ""}`, children: [
      /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: C.done, onChange: () => v(C) }),
      /* @__PURE__ */ n.jsxs("span", { className: "todo-num", children: [
        p + 1,
        "."
      ] }),
      m === C.id ? /* @__PURE__ */ n.jsx("textarea", { className: "todo-edit", autoFocus: !0, defaultValue: C.text, ref: x, onInput: (y) => x(y.currentTarget), onFocus: (y) => {
        const S = y.currentTarget;
        S.setSelectionRange(S.value.length, S.value.length);
      }, onBlur: (y) => o(C, y.currentTarget.value), onKeyDown: (y) => {
        y.key === "Enter" && !y.shiftKey && (y.preventDefault(), o(C, y.currentTarget.value)), y.key === "Escape" && o(C, null);
      } }) : /* @__PURE__ */ n.jsx("span", { className: "todo-text", title: "Click to edit", onClick: () => f(C.id), children: C.text }),
      /* @__PURE__ */ n.jsx("button", { className: "todo-copy", title: "Copy this task", onClick: (y) => {
        y.preventDefault(), y.stopPropagation(), c(C);
      }, children: s === C.id ? "✓" : "⧉" }),
      /* @__PURE__ */ n.jsx("button", { onClick: () => r(e.filter((y) => y.id !== C.id)), children: "×" })
    ] }, C.id)) : /* @__PURE__ */ n.jsx(qn, { children: "No general tasks yet." }) })
  ] });
}
function kb({ refreshToken: e, onAddLink: t }) {
  const [l, a] = j.useState([]), [s, i] = j.useState(!0), [c, u] = j.useState(""), [r, d] = j.useState(null), [m, f] = j.useState(null), [o, h] = j.useState(() => localStorage.getItem("modernSwipeMode") === "carousel" ? "carousel" : "grid"), v = j.useRef(null), x = j.useCallback(async () => {
    try {
      const D = await db();
      a(D.items), u("");
    } catch (D) {
      u(D instanceof Error ? D.message : "Could not load gallery");
    } finally {
      i(!1);
    }
  }, []);
  j.useEffect(() => {
    x();
  }, [x, e]), j.useEffect(() => {
    if (!l.some((N) => N.download && !["done", "error"].includes(N.download.stage))) return;
    const U = window.setInterval(x, 900);
    return () => clearInterval(U);
  }, [l, x]), j.useEffect(() => {
    localStorage.setItem("modernSwipeMode", o);
  }, [o]), j.useEffect(() => {
    const D = (U) => {
      var _, E, T;
      if ((_ = U.target) != null && _.closest("input,textarea")) return;
      const N = [...((E = U.clipboardData) == null ? void 0 : E.files) || []].filter((b) => b.type.startsWith("image/"));
      if (N.length)
        U.preventDefault(), C(N);
      else {
        const b = (T = U.clipboardData) == null ? void 0 : T.getData("text").trim();
        b && /^https?:\/\//.test(b) && (U.preventDefault(), p(b));
      }
    };
    return document.addEventListener("paste", D), () => document.removeEventListener("paste", D);
  });
  const C = async (D) => {
    u("");
    for (const U of D)
      try {
        const N = await mb(U);
        a((_) => [N.item, ..._]);
      } catch (N) {
        u(N instanceof Error ? N.message : "Upload failed");
      }
  }, p = async (D) => {
    try {
      const U = await $r({ link: D });
      a((N) => [U.item, ...N.filter((_) => _.id !== U.item.id)]);
    } catch (U) {
      u(U instanceof Error ? U.message : "Download failed");
    }
  }, y = async (D) => {
    try {
      const U = await $r({ id: D.id });
      a((N) => N.map((_) => _.id === D.id ? U.item : _));
    } catch (U) {
      u(U instanceof Error ? U.message : "Retry failed");
    }
  }, S = async (D) => {
    confirm(`Delete “${D.title || "this swipe"}”?`) && (await hb(D.id), a((U) => U.filter((N) => N.id !== D.id)), d(null));
  }, w = (D) => {
    a((U) => U.map((N) => N.id === D.id ? D : N)), d(D);
  };
  return /* @__PURE__ */ n.jsxs("main", { className: "modern-page swipe-page", onDragOver: (D) => {
    [...D.dataTransfer.types].includes("Files") && D.preventDefault();
  }, onDrop: (D) => {
    D.preventDefault(), C([...D.dataTransfer.files].filter((U) => U.type.startsWith("image/") || U.type.startsWith("video/")));
  }, children: [
    /* @__PURE__ */ n.jsxs("header", { className: "page-hero compact", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("small", { children: "CONTENT RESEARCH" }),
        /* @__PURE__ */ n.jsx("h1", { children: "Swipe Gallery" }),
        /* @__PURE__ */ n.jsx("p", { children: "Your locally saved reference library for hooks, formats, and ideas." })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "hero-actions", children: [
        /* @__PURE__ */ n.jsxs("div", { className: "view-toggle", children: [
          /* @__PURE__ */ n.jsx("button", { className: o === "grid" ? "on" : "", onClick: () => h("grid"), children: "▦ Grid" }),
          /* @__PURE__ */ n.jsx("button", { className: o === "carousel" ? "on" : "", onClick: () => h("carousel"), children: "↔ Strip" })
        ] }),
        /* @__PURE__ */ n.jsx("button", { onClick: () => {
          var D;
          return (D = v.current) == null ? void 0 : D.click();
        }, children: "＋ Upload" }),
        /* @__PURE__ */ n.jsx("button", { className: "primary", onClick: t, children: "＋ Save link" }),
        /* @__PURE__ */ n.jsx("input", { ref: v, type: "file", accept: "image/*,video/*", multiple: !0, hidden: !0, onChange: (D) => {
          C([...D.target.files || []]), D.target.value = "";
        } })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "gallery-summary", children: [
      /* @__PURE__ */ n.jsxs("span", { children: [
        /* @__PURE__ */ n.jsx("b", { children: l.length }),
        " saved items"
      ] }),
      /* @__PURE__ */ n.jsx("span", { children: "Paste a link or screenshot anywhere · drop media onto this page" })
    ] }),
    c && /* @__PURE__ */ n.jsxs("div", { className: "modern-error", children: [
      "⚠ ",
      c
    ] }),
    s ? /* @__PURE__ */ n.jsx("div", { className: "gallery-loading", children: /* @__PURE__ */ n.jsx(Mb, {}) }) : l.length ? /* @__PURE__ */ n.jsx("div", { className: `swipe-grid ${o}`, children: l.map((D) => /* @__PURE__ */ n.jsx(Ab, { item: D, onOpen: () => d(D), onRetry: () => y(D), onMenu: (U, N) => f({ item: D, x: U, y: N }) }, D.id)) }) : /* @__PURE__ */ n.jsxs("div", { className: "gallery-empty", children: [
      /* @__PURE__ */ n.jsx("b", { children: "Your reference library is empty." }),
      /* @__PURE__ */ n.jsx("span", { children: "Save an Instagram, TikTok, YouTube, or Facebook link to begin." }),
      /* @__PURE__ */ n.jsx("button", { className: "primary", onClick: t, children: "Save your first link" })
    ] }),
    m && /* @__PURE__ */ n.jsxs("div", { className: "swipe-context", style: { left: m.x, top: m.y }, onMouseLeave: () => f(null), children: [
      /* @__PURE__ */ n.jsx("button", { onClick: async () => {
        try {
          await gb(m.item.id);
        } catch (D) {
          u(D instanceof Error ? D.message : "Could not reveal file");
        }
        f(null);
      }, children: "Open file location" }),
      /* @__PURE__ */ n.jsx("button", { onClick: async () => {
        try {
          const D = await oh(m.item.id);
          await navigator.clipboard.writeText(D.path);
        } catch (D) {
          u(D instanceof Error ? D.message : "Could not copy path");
        }
        f(null);
      }, children: "Copy file path" }),
      /* @__PURE__ */ n.jsx("button", { onClick: async () => {
        try {
          const D = await oh(m.item.id);
          window.dispatchEvent(new CustomEvent("callstudio:voice-attach", { detail: { name: D.name, path: D.path } }));
        } catch (D) {
          u(D instanceof Error ? D.message : "Could not attach file");
        }
        f(null);
      }, children: "Attach to voice" })
    ] }),
    r && /* @__PURE__ */ n.jsx(Ob, { item: r, onClose: () => d(null), onChange: w, onDelete: () => S(r) })
  ] });
}
function Ab({ item: e, onOpen: t, onRetry: l, onMenu: a }) {
  const s = e.download, i = s && !["done", "error"].includes(s.stage), c = (s == null ? void 0 : s.stage) === "error";
  return /* @__PURE__ */ n.jsxs("article", { className: "swipe-card", onClick: t, onContextMenu: (u) => {
    u.preventDefault(), a(u.clientX, u.clientY);
  }, children: [
    /* @__PURE__ */ n.jsxs("div", { className: "swipe-media", children: [
      e.video ? /* @__PURE__ */ n.jsx("video", { src: `${gy(e.video)}#t=0.1`, muted: !0, preload: "metadata", onMouseEnter: (u) => u.currentTarget.play().catch(() => {
      }), onMouseLeave: (u) => {
        u.currentTarget.pause(), u.currentTarget.currentTime = 0.1;
      } }) : e.image ? /* @__PURE__ */ n.jsx("img", { src: Kr(e.image), alt: "" }) : /* @__PURE__ */ n.jsxs("div", { className: "link-placeholder", children: [
        /* @__PURE__ */ n.jsx("span", { children: c ? "!" : i ? "↓" : "↗" }),
        /* @__PURE__ */ n.jsx("b", { children: c ? "Download needs attention" : i ? "Saving locally" : "Saved link" })
      ] }),
      e.video && /* @__PURE__ */ n.jsx("span", { className: "video-badge", children: "▶" }),
      e.images && e.images.length > 1 && /* @__PURE__ */ n.jsx("span", { className: "count-badge", children: e.images.length })
    ] }),
    s && s.stage !== "done" && /* @__PURE__ */ n.jsxs("div", { className: `download-strip ${c ? "failed" : ""}`, onClick: (u) => u.stopPropagation(), children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { children: s.message }),
        /* @__PURE__ */ n.jsxs("b", { children: [
          Math.round(s.percent || 0),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ n.jsx("progress", { max: "100", value: s.percent || 0 }),
      c && /* @__PURE__ */ n.jsx("button", { onClick: l, children: "Retry" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "swipe-copy", children: [
      /* @__PURE__ */ n.jsx("h3", { children: e.title || "Untitled reference" }),
      /* @__PURE__ */ n.jsx("p", { children: e.response || "Add why this caught your eye…" }),
      /* @__PURE__ */ n.jsxs("footer", { children: [
        /* @__PURE__ */ n.jsx("span", { children: e.source || zb(e.link) || "Reference" }),
        e.via === "phone" && /* @__PURE__ */ n.jsx("span", { className: "swipe-via", title: e.viaAt ? `Shared from your phone, ${new Date(e.viaAt * 1e3).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Shared from your phone", children: "📱 From phone" }),
        /* @__PURE__ */ n.jsx("time", { children: new Date(e.added * 1e3).toLocaleDateString([], { day: "numeric", month: "short" }) })
      ] })
    ] })
  ] });
}
function Ob({ item: e, onClose: t, onChange: l, onDelete: a }) {
  var m, f;
  const [s, i] = j.useState(e), [c, u] = j.useState("");
  j.useEffect(() => {
    const o = (h) => h.key === "Escape" && t();
    return document.addEventListener("keydown", o), () => document.removeEventListener("keydown", o);
  }, [t]);
  const r = async () => {
    u("Saving…");
    try {
      await fb(e, { title: s.title, source: s.source, link: s.link, response: s.response }), l(s), u("Saved ✓");
    } catch (o) {
      u(`⚠ ${o instanceof Error ? o.message : "Not saved"}`);
    }
  }, d = s.video ? /* @__PURE__ */ n.jsx("video", { src: gy(s.video), controls: !0, autoPlay: !0 }) : (m = s.images) != null && m.length ? /* @__PURE__ */ n.jsx("div", { className: "editor-images", children: s.images.map((o) => /* @__PURE__ */ n.jsx("img", { src: Kr(o), alt: "" }, o)) }) : s.image ? /* @__PURE__ */ n.jsx("img", { src: Kr(s.image), alt: "" }) : /* @__PURE__ */ n.jsxs("div", { className: "link-placeholder large", children: [
    /* @__PURE__ */ n.jsx("span", { children: "↗" }),
    /* @__PURE__ */ n.jsx("b", { children: "Link-only reference" })
  ] });
  return /* @__PURE__ */ n.jsx("div", { className: "modern-modal-backdrop editor-backdrop", onMouseDown: (o) => o.target === o.currentTarget && t(), children: /* @__PURE__ */ n.jsxs("div", { className: "swipe-editor", children: [
    /* @__PURE__ */ n.jsx("div", { className: "editor-media", children: d }),
    /* @__PURE__ */ n.jsxs("aside", { children: [
      /* @__PURE__ */ n.jsxs("header", { children: [
        /* @__PURE__ */ n.jsx("span", { children: ((f = s.download) == null ? void 0 : f.stage) === "done" ? "SAVED LOCALLY" : "SWIPE REFERENCE" }),
        /* @__PURE__ */ n.jsx("button", { onClick: t, children: "×" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Title",
        /* @__PURE__ */ n.jsx("input", { value: s.title, onChange: (o) => i({ ...s, title: o.target.value }) })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Creator / source",
        /* @__PURE__ */ n.jsx("input", { value: s.source, onChange: (o) => i({ ...s, source: o.target.value }) })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Original link",
        /* @__PURE__ */ n.jsx("input", { value: s.link, onChange: (o) => i({ ...s, link: o.target.value }) })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { className: "response-field", children: [
        "Why it works / your response",
        /* @__PURE__ */ n.jsx("textarea", { value: s.response, onChange: (o) => i({ ...s, response: o.target.value }), placeholder: "Capture the hook, structure, visual idea, or your response…" })
      ] }),
      /* @__PURE__ */ n.jsx("div", { className: "editor-status", children: c }),
      /* @__PURE__ */ n.jsxs("footer", { children: [
        /* @__PURE__ */ n.jsx("button", { className: "danger", onClick: a, children: "Delete" }),
        s.link && /* @__PURE__ */ n.jsx("a", { href: s.link, target: "_blank", rel: "noreferrer", children: "Open original ↗" }),
        /* @__PURE__ */ n.jsx("button", { className: "primary", onClick: r, children: "Save notes" })
      ] })
    ] })
  ] }) });
}
const zb = (e) => {
  try {
    return new URL(e).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
function Mb() {
  return /* @__PURE__ */ n.jsx(n.Fragment, { children: [1, 2, 3, 4].map((e) => /* @__PURE__ */ n.jsx("i", {}, e)) });
}
function Nt(e, t) {
  const [l, a] = j.useState(null), [s, i] = j.useState(""), c = j.useRef(), u = j.useRef(t), r = j.useCallback(() => Q(`/api/records?name=${encodeURIComponent(e)}`).then((m) => a({ ...u.current, ...m })).catch((m) => i(m instanceof Error ? m.message : "could not load")), [e]);
  j.useEffect(() => {
    r();
  }, [r]);
  const d = j.useCallback((m) => a((f) => {
    if (!f) return f;
    const o = m(structuredClone(f));
    return i("Saving…"), window.clearTimeout(c.current), c.current = window.setTimeout(() => fetch(`/api/records?name=${encodeURIComponent(e)}`, { method: "POST", body: JSON.stringify(o) }).then((h) => i(h.ok ? "" : "Not saved — is Call Studio running?")).catch(() => i("Not saved — is Call Studio running?")), 500), o;
  }), [e]);
  return { doc: l, update: d, status: s, reload: r };
}
const uc = () => Math.random().toString(36).slice(2, 10), _b = ["", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#64748b"], yh = (e = "My board") => ({ id: uc(), name: e, columns: ["To do", "Doing", "Done"].map((t) => ({ id: uc(), name: t, cards: [] })) }), vh = () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
function Rb() {
  const { doc: e, update: t, status: l } = Nt("kanban", { boards: [] }), [a, s] = j.useState(""), [i, c] = j.useState(""), [u, r] = j.useState(null), [d, m] = j.useState(null), [f, o] = j.useState(null), [h, v] = j.useState(null);
  if (j.useEffect(() => {
    e && (!e.boards.length || !e.boards.some((T) => T.id === e.active)) && t((T) => (T.boards.length || (T.boards = [yh()]), T.active = T.boards[0].id, T));
  }, [e, t]), j.useEffect(() => {
    const T = () => v(null);
    return window.addEventListener("click", T), () => window.removeEventListener("click", T);
  }, []), !e || !e.boards.length) return /* @__PURE__ */ n.jsx("main", { className: "modern-page kanban-page", children: /* @__PURE__ */ n.jsx("p", { children: l || "Loading…" }) });
  const x = e.boards.find((T) => T.id === e.active) || e.boards[0], C = (T) => T.boards.find((b) => b.id === x.id), p = (T, b) => C(T).columns.find((g) => g.id === b), y = (T) => {
    const b = i.split(`
`).map((g) => g.trim()).filter(Boolean);
    if (!b.length) {
      s("");
      return;
    }
    t((g) => (p(g, T).cards.push(...b.map((A) => ({ id: uc(), title: A, created: Date.now() / 1e3 }))), g)), c("");
  }, S = (T, b) => {
    d && (t((g) => {
      const A = p(g, d.from), O = A.cards.findIndex((R) => R.id === d.card);
      if (O < 0) return g;
      const [z] = A.cards.splice(O, 1);
      return p(g, T).cards.splice(d.from === T && O < b ? b - 1 : b, 0, z), g;
    }), m(null), o(null));
  }, w = (T) => {
    var A;
    const b = x.columns.find((O) => O.id === T), g = (A = prompt("Column name", b.name)) == null ? void 0 : A.trim();
    g && t((O) => (p(O, T).name = g, O));
  }, D = (T, b) => t((g) => {
    const A = C(g).columns, O = A.findIndex((k) => k.id === T), z = O + b;
    return z >= 0 && z < A.length && ([A[O], A[z]] = [A[z], A[O]]), g;
  }), U = (T) => {
    const b = x.columns.find((g) => g.id === T);
    b.cards.length && !confirm(`Delete "${b.name}" and its ${b.cards.length} card${b.cards.length === 1 ? "" : "s"}?`) || t((g) => {
      const A = C(g);
      return A.columns = A.columns.filter((O) => O.id !== T), g;
    });
  }, N = (T) => {
    var A;
    const b = e.boards.find((O) => O.id === T), g = (A = prompt("Board name", b.name)) == null ? void 0 : A.trim();
    g && t((O) => (O.boards.find((z) => z.id === T).name = g, O));
  }, _ = (T) => {
    const b = e.boards.find((A) => A.id === T), g = b.columns.reduce((A, O) => A + O.cards.length, 0);
    if (e.boards.length === 1) {
      alert("This is your only board.");
      return;
    }
    confirm(`Delete the board "${b.name}"${g ? ` and its ${g} cards` : ""}?`) && t((A) => (A.boards = A.boards.filter((O) => O.id !== T), A.active === T && (A.active = A.boards[0].id), A));
  }, E = (T, b, g) => {
    t((A) => {
      const O = p(A, T), z = O.cards.findIndex((k) => k.id === (u == null ? void 0 : u.card.id));
      return z < 0 ? A : b ? (g && g !== T ? (O.cards.splice(z, 1), p(A, g).cards.unshift(b)) : O.cards[z] = b, A) : (O.cards.splice(z, 1), A);
    }), r(null);
  };
  return /* @__PURE__ */ n.jsxs("main", { className: "modern-page kanban-page", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "kb-head", children: [
      /* @__PURE__ */ n.jsx("h1", { children: "▦ Kanban" }),
      /* @__PURE__ */ n.jsxs("nav", { className: "kb-boards", children: [
        e.boards.map((T) => /* @__PURE__ */ n.jsx("button", { className: T.id === x.id ? "on" : "", onClick: () => t((b) => (b.active = T.id, b)), onDoubleClick: () => N(T.id), onContextMenu: (b) => {
          b.preventDefault(), b.stopPropagation(), v({ kind: "board", id: T.id, x: b.clientX, y: b.clientY });
        }, title: "Double-click to rename · right-click for more", children: T.name }, T.id)),
        /* @__PURE__ */ n.jsx("button", { className: "kb-new", title: "New board", onClick: () => {
          var b;
          const T = (b = prompt("New board name", "New board")) == null ? void 0 : b.trim();
          if (T) {
            const g = yh(T);
            t((A) => (A.boards.push(g), A.active = g.id, A));
          }
        }, children: "＋" })
      ] }),
      l && l !== "Saving…" && /* @__PURE__ */ n.jsxs("span", { className: "kb-err", children: [
        "⚠️ ",
        l
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "kb-columns", children: [
      x.columns.map((T) => /* @__PURE__ */ n.jsxs("section", { className: `kb-col${(f == null ? void 0 : f.col) === T.id ? " over" : ""}`, onDragOver: (b) => {
        d && (b.preventDefault(), b.target.closest(".kb-card") || o({ col: T.id, index: T.cards.length }));
      }, onDrop: (b) => {
        b.preventDefault(), S(T.id, (f == null ? void 0 : f.col) === T.id ? f.index : T.cards.length);
      }, children: [
        /* @__PURE__ */ n.jsxs("header", { onDoubleClick: () => w(T.id), onContextMenu: (b) => {
          b.preventDefault(), b.stopPropagation(), v({ kind: "column", id: T.id, x: b.clientX, y: b.clientY });
        }, title: "Double-click to rename · right-click for more", children: [
          /* @__PURE__ */ n.jsx("b", { children: T.name }),
          /* @__PURE__ */ n.jsx("small", { children: T.cards.length })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "kb-cards", children: [
          T.cards.map((b, g) => /* @__PURE__ */ n.jsxs(
            "div",
            {
              className: `kb-card${(d == null ? void 0 : d.card) === b.id ? " dragging" : ""}${(f == null ? void 0 : f.col) === T.id && f.index === g ? " drop-before" : ""}`,
              draggable: !0,
              onDragStart: (A) => {
                m({ card: b.id, from: T.id }), A.dataTransfer.effectAllowed = "move", A.dataTransfer.setData("text/plain", b.title);
              },
              onDragEnd: () => {
                m(null), o(null);
              },
              onDragOver: (A) => {
                if (!d) return;
                A.preventDefault(), A.stopPropagation();
                const O = A.currentTarget.getBoundingClientRect();
                o({ col: T.id, index: A.clientY > O.top + O.height / 2 ? g + 1 : g });
              },
              onClick: () => r({ col: T.id, card: b }),
              style: b.label ? { borderLeftColor: b.label } : void 0,
              children: [
                /* @__PURE__ */ n.jsx("span", { children: b.title }),
                (b.due || b.notes) && /* @__PURE__ */ n.jsxs("div", { className: "kb-meta", children: [
                  b.due && /* @__PURE__ */ n.jsxs("em", { className: b.due < vh() ? "late" : b.due === vh() ? "today" : "", children: [
                    "📅 ",
                    (/* @__PURE__ */ new Date(`${b.due}T12:00:00`)).toLocaleDateString([], { day: "numeric", month: "short" })
                  ] }),
                  b.notes && /* @__PURE__ */ n.jsx("i", { title: b.notes, children: "📝" })
                ] })
              ]
            },
            b.id
          )),
          (f == null ? void 0 : f.col) === T.id && f.index === T.cards.length && d && /* @__PURE__ */ n.jsx("div", { className: "kb-drop-end" })
        ] }),
        a === T.id ? /* @__PURE__ */ n.jsxs("div", { className: "kb-add", children: [
          /* @__PURE__ */ n.jsx("textarea", { autoFocus: !0, value: i, onChange: (b) => c(b.target.value), placeholder: "Card title… (several lines = several cards)", onKeyDown: (b) => {
            b.stopPropagation(), b.key === "Enter" && !b.shiftKey && (b.preventDefault(), y(T.id)), b.key === "Escape" && (s(""), c(""));
          }, onBlur: () => {
            i.trim() && y(T.id), s("");
          } }),
          /* @__PURE__ */ n.jsx("small", { children: "Enter adds · ⇧Enter new line · Esc closes" })
        ] }) : /* @__PURE__ */ n.jsx("button", { className: "kb-add-btn", onClick: () => {
          s(T.id), c("");
        }, children: "＋ Add card" })
      ] }, T.id)),
      /* @__PURE__ */ n.jsx("button", { className: "kb-add-col", onClick: () => {
        var b;
        const T = (b = prompt("New column name")) == null ? void 0 : b.trim();
        T && t((g) => (C(g).columns.push({ id: uc(), name: T, cards: [] }), g));
      }, children: "＋ Add column" })
    ] }),
    h && /* @__PURE__ */ n.jsx("div", { className: "modern-context-menu", style: { left: Math.min(h.x, window.innerWidth - 200), top: Math.min(h.y, window.innerHeight - 160) }, onClick: (T) => T.stopPropagation(), children: h.kind === "column" ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
      /* @__PURE__ */ n.jsx("button", { onClick: () => {
        v(null), w(h.id);
      }, children: "✏️ Rename column" }),
      /* @__PURE__ */ n.jsx("button", { onClick: () => {
        v(null), D(h.id, -1);
      }, children: "← Move left" }),
      /* @__PURE__ */ n.jsx("button", { onClick: () => {
        v(null), D(h.id, 1);
      }, children: "→ Move right" }),
      /* @__PURE__ */ n.jsx("button", { onClick: () => {
        v(null), U(h.id);
      }, children: "🗑 Delete column" })
    ] }) : /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
      /* @__PURE__ */ n.jsx("button", { onClick: () => {
        v(null), N(h.id);
      }, children: "✏️ Rename board" }),
      /* @__PURE__ */ n.jsx("button", { onClick: () => {
        v(null), _(h.id);
      }, children: "🗑 Delete board" })
    ] }) }),
    u && /* @__PURE__ */ n.jsx(Ub, { card: u.card, columns: x.columns, col: u.col, onClose: () => r(null), onSave: (T, b) => E(u.col, T, b), onDelete: () => E(u.col, null) })
  ] });
}
function Ub({ card: e, columns: t, col: l, onClose: a, onSave: s, onDelete: i }) {
  const [c, u] = j.useState(e), [r, d] = j.useState(l), m = () => s({ ...c, title: c.title.trim() || e.title }, r);
  return /* @__PURE__ */ n.jsx("div", { className: "modern-modal-backdrop kb-modal-bg", onMouseDown: (f) => {
    f.target === f.currentTarget && m();
  }, onKeyDown: (f) => {
    f.stopPropagation(), f.key === "Escape" && a(), (f.metaKey || f.ctrlKey) && f.key === "Enter" && m();
  }, children: /* @__PURE__ */ n.jsxs("div", { className: "kb-modal", children: [
    /* @__PURE__ */ n.jsx("input", { className: "kb-title", autoFocus: !0, value: c.title, onChange: (f) => u((o) => ({ ...o, title: f.target.value })), onKeyDown: (f) => {
      f.key === "Enter" && m();
    } }),
    /* @__PURE__ */ n.jsx("textarea", { value: c.notes || "", onChange: (f) => u((o) => ({ ...o, notes: f.target.value })), placeholder: "Notes…", rows: 6 }),
    /* @__PURE__ */ n.jsxs("div", { className: "kb-row", children: [
      /* @__PURE__ */ n.jsx("span", { children: "Label" }),
      _b.map((f) => /* @__PURE__ */ n.jsx("button", { className: `kb-swatch${(c.label || "") === f ? " on" : ""}`, style: { background: f || "transparent" }, title: f ? "" : "No label", onClick: () => u((o) => ({ ...o, label: f })), children: f ? "" : "∅" }, f || "none"))
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "kb-row", children: [
      /* @__PURE__ */ n.jsx("span", { children: "Due" }),
      /* @__PURE__ */ n.jsx("input", { type: "date", value: c.due || "", onChange: (f) => u((o) => ({ ...o, due: f.target.value })) }),
      c.due && /* @__PURE__ */ n.jsx("button", { className: "kb-link", onClick: () => u((f) => ({ ...f, due: "" })), children: "clear" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "kb-row", children: [
      /* @__PURE__ */ n.jsx("span", { children: "Column" }),
      /* @__PURE__ */ n.jsx("select", { value: r, onChange: (f) => d(f.target.value), children: t.map((f) => /* @__PURE__ */ n.jsx("option", { value: f.id, children: f.name }, f.id)) })
    ] }),
    /* @__PURE__ */ n.jsxs("footer", { children: [
      /* @__PURE__ */ n.jsx("button", { className: "kb-del", onClick: () => {
        confirm("Delete this card?") && i();
      }, children: "🗑 Delete" }),
      /* @__PURE__ */ n.jsx("span", {}),
      /* @__PURE__ */ n.jsx("button", { onClick: a, children: "Cancel" }),
      /* @__PURE__ */ n.jsx("button", { className: "primary", onClick: m, children: "Save" })
    ] })
  ] }) });
}
const Lb = [["all", "All"], ["in", "✅ In Call Studio"], ["missing", "❌ Missing"], ["upcoming", "🗓 Upcoming"]], Bb = { "Closed won": "#16a34a", "Closed lost": "#dc2626", "No show": "#ea580c", "No offer / bad fit": "#2563eb", "Follow up": "#ec4899", Cancelled: "#8b5cf6", "N/A": "#64748b", Notes: "#ca8a04" }, Hb = (e) => `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`, Yb = () => {
  const e = /* @__PURE__ */ new Date();
  return e.setDate(e.getDate() + 14), Hb(e);
}, xh = (e, t) => {
  try {
    if (t === void 0) return localStorage.getItem(e);
    localStorage.setItem(e, t);
  } catch {
  }
  return null;
};
function qb({ onNavigate: e }) {
  const [t, l] = j.useState(null), [a, s] = j.useState(""), [i, c] = j.useState(!1), [u, r] = j.useState("2026-08-23"), [d, m] = j.useState(Yb), [f, o] = j.useState(() => xh("seFilter") || "all"), [h, v] = j.useState(!0), [x, C] = j.useState(""), p = (N) => {
    o(N), xh("seFilter", N);
  }, y = j.useCallback(async (N = !1) => {
    c(!0), s("");
    try {
      l(await Q(`/api/sessions?since=${u}&until=${d}${N ? "&refresh=1" : ""}`));
    } catch (_) {
      s(_ instanceof Error ? _.message : "could not read the calendar");
    } finally {
      c(!1);
    }
  }, [u, d]);
  j.useEffect(() => {
    y();
  }, [y]);
  const S = j.useMemo(() => ((t == null ? void 0 : t.items) || []).filter((N) => (!h || !N.cancelled) && (!x.trim() || N.name.toLowerCase().includes(x.trim().toLowerCase())) && (f === "all" || f === "in" && N.inStudio || f === "missing" && N.expected && !N.inStudio || f === "upcoming" && N.upcoming)), [t, h, x, f]), w = (N, _) => {
    const E = window;
    N.metaKey || N.ctrlKey || !E.selectPerson || (N.preventDefault(), e("studio"), E.selectPerson(_));
  }, D = t == null ? void 0 : t.counts;
  let U = "";
  return /* @__PURE__ */ n.jsxs("main", { className: "modern-page sessions-page", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "page-hero compact", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("small", { children: "CALLS" }),
        /* @__PURE__ */ n.jsx("h1", { children: "📅 Sessions" }),
        /* @__PURE__ */ n.jsx("p", { children: "Every complimentary session on your calendar, with its Aloware link, and whether its recording is in Call Studio." })
      ] }),
      /* @__PURE__ */ n.jsx("button", { onClick: () => y(!0), disabled: i, title: "Read the calendar again now", children: i ? "Reading…" : "↻ Refresh" })
    ] }),
    /* @__PURE__ */ n.jsxs("section", { className: "ss-card", children: [
      /* @__PURE__ */ n.jsxs("div", { className: "ss-tools", children: [
        /* @__PURE__ */ n.jsxs("label", { children: [
          "From ",
          /* @__PURE__ */ n.jsx("input", { type: "date", value: u, onChange: (N) => N.target.value && r(N.target.value) })
        ] }),
        /* @__PURE__ */ n.jsxs("label", { children: [
          "to ",
          /* @__PURE__ */ n.jsx("input", { type: "date", value: d, onChange: (N) => N.target.value && m(N.target.value) })
        ] }),
        /* @__PURE__ */ n.jsx("div", { className: "ss-seg", children: Lb.map(([N, _]) => /* @__PURE__ */ n.jsx("button", { className: N === f ? "on" : "", onClick: () => p(N), children: _ }, N)) }),
        /* @__PURE__ */ n.jsxs("label", { className: "ss-check", children: [
          /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: h, onChange: (N) => v(N.target.checked) }),
          " Hide cancelled"
        ] }),
        /* @__PURE__ */ n.jsx("input", { type: "search", className: "ss-search", placeholder: "Search a name…", value: x, onChange: (N) => C(N.target.value), onKeyDown: (N) => N.stopPropagation() })
      ] }),
      D && /* @__PURE__ */ n.jsxs("div", { className: "ss-counts", children: [
        /* @__PURE__ */ n.jsxs("span", { children: [
          /* @__PURE__ */ n.jsx("b", { children: D.sessions }),
          " sessions"
        ] }),
        /* @__PURE__ */ n.jsxs("span", { children: [
          "✅ ",
          /* @__PURE__ */ n.jsx("b", { children: D.inStudio }),
          " in Call Studio"
        ] }),
        /* @__PURE__ */ n.jsxs("span", { children: [
          "❌ ",
          /* @__PURE__ */ n.jsx("b", { children: D.missing }),
          " missing"
        ] }),
        /* @__PURE__ */ n.jsxs("span", { children: [
          "🗓 ",
          D.upcoming,
          " upcoming"
        ] }),
        /* @__PURE__ */ n.jsxs("span", { className: "ss-muted", children: [
          D.cancelled,
          " cancelled · ",
          D.noShow,
          " no-shows (no recording expected)"
        ] })
      ] }),
      a ? /* @__PURE__ */ n.jsxs("p", { className: "ss-empty", children: [
        "⚠️ ",
        a
      ] }) : t ? S.length ? /* @__PURE__ */ n.jsx("div", { className: "ss-list", children: S.map((N) => {
        var b;
        const _ = (/* @__PURE__ */ new Date(`${N.date}T12:00:00`)).toLocaleDateString(void 0, { weekday: "short", day: "numeric", month: "short" }), E = _ !== U ? /* @__PURE__ */ n.jsx("div", { className: "ss-day", children: _ }) : null;
        U = _;
        const T = ((b = window.displayName) == null ? void 0 : b.call(window, N.name)) || N.name;
        return /* @__PURE__ */ n.jsxs("div", { children: [
          E,
          /* @__PURE__ */ n.jsxs("div", { className: `ss-row${N.cancelled ? " cancelled" : ""}`, children: [
            /* @__PURE__ */ n.jsx("span", { className: "ss-time", children: N.time }),
            /* @__PURE__ */ n.jsxs("span", { className: "ss-name", children: [
              N.done ? "✅ " : "",
              T || "(no name)",
              N.tag && /* @__PURE__ */ n.jsx("small", { className: "ss-tag", children: N.tag })
            ] }),
            /* @__PURE__ */ n.jsx("span", { children: N.outcome && /* @__PURE__ */ n.jsx("span", { className: "ss-outcome", style: { "--oc": Bb[N.outcome] || "#64748b" }, children: N.outcome }) }),
            /* @__PURE__ */ n.jsxs("span", { className: "ss-links", children: [
              N.aloware ? /* @__PURE__ */ n.jsx("a", { className: "ss-al", href: N.aloware, target: "_blank", rel: "noopener noreferrer", children: "Aloware ↗" }) : /* @__PURE__ */ n.jsx("span", { className: "ss-muted", children: "no Aloware link" }),
              /* @__PURE__ */ n.jsx("a", { className: "ss-ev", href: N.url, target: "_blank", rel: "noopener noreferrer", title: "Open the calendar event", children: "📅" })
            ] }),
            /* @__PURE__ */ n.jsx("span", { className: "ss-studio", children: N.inStudio ? N.calls.map((g) => {
              var A;
              return /* @__PURE__ */ n.jsxs("a", { className: "ss-call", href: g.link, onClick: (O) => w(O, g.name), title: "Open this call in Call Studio", children: [
                "🎧 ",
                ((A = window.displayName) == null ? void 0 : A.call(window, g.name)) || g.name
              ] }, g.name);
            }) : N.upcoming ? /* @__PURE__ */ n.jsx("span", { className: "ss-muted", children: "to come" }) : N.expected ? /* @__PURE__ */ n.jsx("span", { className: "ss-missing", children: "❌ not in Call Studio" }) : /* @__PURE__ */ n.jsx("span", { className: "ss-muted", children: "no recording expected" }) })
          ] })
        ] }, N.id);
      }) }) : /* @__PURE__ */ n.jsx("p", { className: "ss-empty", children: "Nothing matches." }) : /* @__PURE__ */ n.jsx("p", { className: "ss-empty", children: "Reading your calendar…" })
    ] })
  ] });
}
const ud = ["Facebook", "Instagram", "WhatsApp", "Skool", "Other"], Gb = () => Math.random().toString(36).slice(2, 11), zn = (e) => !!e.followUp && new Date(e.followUp).getTime() <= Date.now(), Xr = (e) => {
  const t = String(e || "").trim();
  return /^(https?:\/\/|\/)/i.test(t) && !/^\/\//.test(t) ? t : "";
}, jh = (e = 0) => {
  const t = new Date(Date.now() + e * 864e5);
  t.setMinutes(Math.round(t.getMinutes() / 5) * 5, 0, 0);
  const l = (a) => String(a).padStart(2, "0");
  return `${t.getFullYear()}-${l(t.getMonth() + 1)}-${l(t.getDate())}T${l(t.getHours())}:${l(t.getMinutes())}`;
}, bh = (e) => {
  if (!e) return null;
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? e : new Intl.DateTimeFormat(void 0, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(t);
};
function $b() {
  const { doc: e, update: t, status: l } = Nt("leadgen", { leads: [] }), [a, s] = j.useState(""), [i, c] = j.useState(""), [, u] = j.useState(0), [r, d] = j.useState(null), [m, f] = j.useState(null);
  j.useEffect(() => {
    const p = setInterval(() => u((y) => y + 1), 3e4);
    return () => clearInterval(p);
  }, []);
  const o = (e == null ? void 0 : e.leads) || [], h = j.useMemo(() => o.filter((p) => (!i || p.source === i) && (!a.trim() || `${p.name} ${p.source}`.toLowerCase().includes(a.trim().toLowerCase()))).sort((p, y) => Number(zn(y)) - Number(zn(p)) || (p.followUp || "9999").localeCompare(y.followUp || "9999") || p.name.localeCompare(y.name)), [o, a, i]), v = (p, y, S) => t((w) => {
    const D = w.leads.find((U) => U.id === p);
    return D && (D[y] = S), w;
  }), x = (p) => {
    confirm(`Remove ${p.name} from Lead Gen?`) && t((y) => (y.leads = y.leads.filter((S) => S.id !== p.id), y));
  }, C = (p, y, S) => /* @__PURE__ */ n.jsx(
    "td",
    {
      "data-label": { source: "Source", name: "Name", link: "Link", lastContact: "Last contact", followUp: "Follow up" }[y],
      className: "lg-cell",
      onClick: (w) => {
        w.target.closest("a, button, .lg-inline") || f({ id: p.id, f: y });
      },
      children: (m == null ? void 0 : m.id) === p.id && m.f === y ? /* @__PURE__ */ n.jsx(Kb, { lead: p, f: y, onDone: (w) => {
        if (f(null), w !== null && !(y === "name" && !w)) {
          if (y === "link" && w && !Xr(w)) {
            alert("Use an https:// link, or leave it empty.");
            return;
          }
          w !== (p[y] || "") && v(p.id, y, w);
        }
      } }) : S
    }
  );
  return /* @__PURE__ */ n.jsxs("main", { className: "lg-wrap", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "lg-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "lg-kicker", children: "PERSONAL PIPELINE" }),
        /* @__PURE__ */ n.jsx("h1", { children: "Lead Gen" }),
        /* @__PURE__ */ n.jsx("p", { children: "Keep conversations warm and know exactly who needs a follow-up." })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "button", onClick: () => d({ id: "", source: "Facebook", name: "", link: "", lastContact: "", followUp: "" }), children: "＋ Add lead" })
    ] }),
    /* @__PURE__ */ n.jsxs("section", { className: "lg-summary", "aria-label": "Lead summary", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { children: "Total leads" }),
        /* @__PURE__ */ n.jsx("strong", { children: o.length })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "lg-summary-due", children: [
        /* @__PURE__ */ n.jsx("span", { children: "Due now" }),
        /* @__PURE__ */ n.jsx("strong", { children: o.filter(zn).length })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { children: "Scheduled" }),
        /* @__PURE__ */ n.jsx("strong", { children: o.filter((p) => p.followUp && !zn(p)).length })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "lg-tools", children: [
      /* @__PURE__ */ n.jsxs("label", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "sr-only", children: "Search leads" }),
        /* @__PURE__ */ n.jsx("input", { type: "search", placeholder: "Search leads…", value: a, onChange: (p) => s(p.target.value), onKeyDown: (p) => p.stopPropagation() })
      ] }),
      /* @__PURE__ */ n.jsxs("select", { "aria-label": "Filter by source", value: i, onChange: (p) => c(p.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "", children: "All sources" }),
        ud.map((p) => /* @__PURE__ */ n.jsx("option", { children: p }, p))
      ] }),
      /* @__PURE__ */ n.jsx("span", { className: "bk-status", "aria-live": "polite", children: l === "Saving…" ? "" : l })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "lg-table-wrap", children: /* @__PURE__ */ n.jsxs("table", { className: "lg-table", children: [
      /* @__PURE__ */ n.jsx("thead", { children: /* @__PURE__ */ n.jsxs("tr", { children: [
        /* @__PURE__ */ n.jsx("th", { children: "Source" }),
        /* @__PURE__ */ n.jsx("th", { children: "Name" }),
        /* @__PURE__ */ n.jsx("th", { children: "Link" }),
        /* @__PURE__ */ n.jsx("th", { children: "Last contact" }),
        /* @__PURE__ */ n.jsx("th", { children: "Time to follow up" }),
        /* @__PURE__ */ n.jsx("th", { children: /* @__PURE__ */ n.jsx("span", { className: "sr-only", children: "Actions" }) })
      ] }) }),
      /* @__PURE__ */ n.jsx("tbody", { id: "lg-body", children: e ? h.length ? h.map((p) => {
        const y = zn(p), S = Xr(p.link);
        return /* @__PURE__ */ n.jsxs("tr", { "data-id": p.id, className: y ? "lg-is-due" : "", onDoubleClick: (w) => {
          w.target.closest("a, button, input, select") || d(p);
        }, children: [
          C(p, "source", /* @__PURE__ */ n.jsx("span", { className: `lg-source lg-source-${String(p.source).toLowerCase()}`, children: p.source || "Other" })),
          C(p, "name", /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
            /* @__PURE__ */ n.jsx("strong", { children: p.name }),
            y && /* @__PURE__ */ n.jsx("span", { className: "lg-due-label", children: "Follow up now" })
          ] })),
          C(p, "link", S ? /* @__PURE__ */ n.jsx("a", { className: "lg-open", href: S, target: "_blank", rel: "noopener noreferrer", children: "Open ↗" }) : /* @__PURE__ */ n.jsx("span", { className: "lg-empty-value", children: "No link" })),
          C(p, "lastContact", bh(p.lastContact) || /* @__PURE__ */ n.jsx("span", { className: "lg-empty-value", children: "Not set" })),
          C(p, "followUp", /* @__PURE__ */ n.jsx("span", { className: "lg-follow-time", children: bh(p.followUp) || /* @__PURE__ */ n.jsx("span", { className: "lg-empty-value", children: "Not set" }) })),
          /* @__PURE__ */ n.jsxs("td", { className: "lg-row-actions", children: [
            /* @__PURE__ */ n.jsx("button", { type: "button", "aria-label": `Edit ${p.name}`, onClick: () => d(p), children: "✎" }),
            /* @__PURE__ */ n.jsx("button", { type: "button", "aria-label": `Delete ${p.name}`, onClick: () => x(p), children: "×" })
          ] })
        ] }, p.id);
      }) : /* @__PURE__ */ n.jsx("tr", { children: /* @__PURE__ */ n.jsx("td", { colSpan: 6, className: "lg-no-results", children: "No leads match this view." }) }) : /* @__PURE__ */ n.jsx("tr", { children: /* @__PURE__ */ n.jsx("td", { colSpan: 6, className: "lg-no-results", children: "Loading…" }) }) })
    ] }) }),
    r && /* @__PURE__ */ n.jsx(Vb, { lead: r, onClose: () => d(null), onSave: (p) => {
      t((y) => {
        if (r.id) {
          const S = y.leads.find((w) => w.id === r.id);
          S && Object.assign(S, p);
        } else y.leads.push({ id: Gb(), added: Date.now(), ...p });
        return y;
      }), d(null);
    } })
  ] });
}
function Kb({ lead: e, f: t, onDone: l }) {
  const a = j.useRef(null), s = j.useRef(!1), i = (u) => {
    s.current || (s.current = !0, l(u));
  };
  j.useEffect(() => {
    var u, r;
    (u = a.current) == null || u.focus(), ((r = a.current) == null ? void 0 : r.type) === "text" && a.current.select();
  }, []);
  const c = (u) => {
    u.stopPropagation(), u.key === "Enter" && (u.preventDefault(), i(u.target.value.trim())), u.key === "Escape" && (u.preventDefault(), i(null));
  };
  return t === "source" ? /* @__PURE__ */ n.jsx("select", { ref: a, className: "lg-inline", defaultValue: e.source, onKeyDown: c, onChange: (u) => i(u.target.value), onBlur: (u) => i(u.target.value), children: ud.map((u) => /* @__PURE__ */ n.jsx("option", { children: u }, u)) }) : /* @__PURE__ */ n.jsx("input", { ref: a, className: "lg-inline", type: t === "lastContact" || t === "followUp" ? "datetime-local" : "text", placeholder: t === "link" ? "https://…" : void 0, defaultValue: e[t] || "", onKeyDown: c, onBlur: (u) => i(u.target.value.trim()) });
}
function Vb({ lead: e, onClose: t, onSave: l }) {
  const [a, s] = j.useState({ source: e.source || "Facebook", name: e.name, link: e.link, lastContact: e.id ? e.lastContact : jh(), followUp: e.followUp }), [i, c] = j.useState(""), u = (r) => (d) => s((m) => ({ ...m, [r]: d.target.value }));
  return j.useEffect(() => {
    const r = (d) => d.key === "Escape" && t();
    return document.addEventListener("keydown", r), () => document.removeEventListener("keydown", r);
  }, [t]), /* @__PURE__ */ n.jsx("div", { className: "sm-dialog", onClick: (r) => {
    r.target === r.currentTarget && t();
  }, children: /* @__PURE__ */ n.jsxs("form", { className: "sm-dialog-card", onKeyDown: (r) => r.stopPropagation(), onSubmit: (r) => {
    if (r.preventDefault(), a.link.trim() && !Xr(a.link)) {
      c("Use an https:// link or leave the link blank.");
      return;
    }
    l({ ...a, name: a.name.trim(), link: a.link.trim() });
  }, children: [
    /* @__PURE__ */ n.jsxs("div", { className: "sm-dialog-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "lg-kicker", children: "LEAD" }),
        /* @__PURE__ */ n.jsx("h2", { children: e.id ? "Edit lead" : "Add lead" })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "sm-icon-btn", type: "button", "aria-label": "Close", onClick: t, children: "×" })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Source",
      /* @__PURE__ */ n.jsx("select", { value: a.source, onChange: u("source"), children: ud.map((r) => /* @__PURE__ */ n.jsx("option", { children: r }, r)) })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Name",
      /* @__PURE__ */ n.jsx("input", { required: !0, autoFocus: !0, placeholder: "Lead name", value: a.name, onChange: u("name") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Link",
      /* @__PURE__ */ n.jsx("input", { placeholder: "https://… (optional)", value: a.link, onChange: u("link") })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "lg-date-pair", children: [
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Last contact",
        /* @__PURE__ */ n.jsx("input", { type: "datetime-local", value: a.lastContact, onChange: u("lastContact") })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Time to follow up",
        /* @__PURE__ */ n.jsx("input", { type: "datetime-local", value: a.followUp, onChange: u("followUp") }),
        /* @__PURE__ */ n.jsx("span", { className: "lg-quick", children: [1, 2, 4, 7].map((r) => /* @__PURE__ */ n.jsxs("button", { type: "button", className: "ctl", title: `Follow up in ${r} day${r === 1 ? "" : "s"}`, onClick: () => s((d) => ({ ...d, followUp: jh(r) })), children: [
          "+",
          r,
          "d"
        ] }, r)) })
      ] })
    ] }),
    /* @__PURE__ */ n.jsx("p", { className: "sm-form-error", role: "alert", children: i }),
    /* @__PURE__ */ n.jsxs("div", { className: "sm-dialog-actions", children: [
      /* @__PURE__ */ n.jsx("button", { className: "ctl", type: "button", onClick: t, children: "Cancel" }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "submit", children: "Save lead" })
    ] })
  ] }) });
}
const Xb = { clientRegions: [], products: [1, 2, 3].map((e) => ({ id: `product-${e}`, name: `Product Agreement ${e}`, url: "", notes: "" })) }, Nh = (e) => /^https?:\/\/\S+$/i.test(String(e || "").trim()), Qb = (e) => {
  try {
    return /(^|\.)(youtube\.com|youtu\.be)$/.test(new URL(e).hostname);
  } catch {
    return !1;
  }
};
function Sh({ url: e, className: t = "ctl ag-copy", disabled: l }) {
  const [a, s] = j.useState("Copy link"), i = async () => {
    try {
      await navigator.clipboard.writeText(e.trim()), s("✅ Copied");
    } catch {
      s("⚠️ Failed");
    }
    window.setTimeout(() => s("Copy link"), 1200);
  };
  return /* @__PURE__ */ n.jsx("button", { className: t, title: "Copy this link", disabled: l, onClick: i, children: a });
}
function Zb() {
  var m;
  const { doc: e, update: t, status: l } = Nt("agreements", Xb), [a, s] = j.useState("client"), i = ((e == null ? void 0 : e.products) || []).filter((f) => f && f.id), c = i.find((f) => f.id === a), u = (f) => t((o) => {
    const h = o.products.find((v) => v.id === a);
    return h && Object.assign(h, f), o;
  }), r = () => {
    const f = { id: Math.random().toString(36).slice(2, 11), name: `Product Agreement ${i.length + 1}`, url: "", notes: "" };
    t((o) => (o.products.push(f), o)), s(f.id);
  }, d = () => {
    !c || !confirm(`Delete “${c.name || "Untitled product"}”?`) || (t((f) => (f.products = f.products.filter((o) => o.id !== c.id), f)), s("client"));
  };
  return /* @__PURE__ */ n.jsxs("div", { className: "ag-workspace", children: [
    /* @__PURE__ */ n.jsxs("aside", { className: "ag-sidebar", "aria-label": "Agreement library", children: [
      /* @__PURE__ */ n.jsx("div", { className: "ag-sidebar-title", children: "Agreement library" }),
      /* @__PURE__ */ n.jsxs("button", { className: `ag-nav${a === "client" ? " active" : ""}`, onClick: () => s("client"), children: [
        /* @__PURE__ */ n.jsx("span", { children: "▤" }),
        " Client agreements"
      ] }),
      /* @__PURE__ */ n.jsx("div", { className: "ag-sidebar-label", children: "My products" }),
      /* @__PURE__ */ n.jsx("div", { id: "ag-product-nav", children: i.map((f) => /* @__PURE__ */ n.jsxs("button", { className: `ag-nav${f.id === a ? " active" : ""}`, onClick: () => s(f.id), children: [
        /* @__PURE__ */ n.jsx("span", { children: "◫" }),
        /* @__PURE__ */ n.jsx("b", { children: f.name.trim() || "Untitled product" })
      ] }, f.id)) }),
      /* @__PURE__ */ n.jsx("button", { className: "ag-add", onClick: r, children: "＋ Add product" }),
      /* @__PURE__ */ n.jsx("div", { className: "ag-sidebar-status", children: l === "Saving…" ? "Saving…" : l })
    ] }),
    c ? /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc ag-page ag-product-page active", children: [
      /* @__PURE__ */ n.jsx("div", { className: "ag-page-kicker", children: "MY PRODUCT" }),
      /* @__PURE__ */ n.jsxs("div", { className: "ag-product-head", children: [
        /* @__PURE__ */ n.jsx("input", { className: "ag-product-name", defaultValue: c.name, placeholder: "Product name", "aria-label": "Product name", onChange: (f) => u({ name: f.target.value.slice(0, 100) }), onKeyDown: (f) => f.stopPropagation() }, c.id + "-name"),
        /* @__PURE__ */ n.jsx("span", { className: "ag-status", children: "Edit details below" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { className: "ag-field", children: [
        "AGREEMENT LINK",
        /* @__PURE__ */ n.jsx("input", { type: "url", defaultValue: c.url, placeholder: "https://form.pandadoc.com/…", autoComplete: "off", onChange: (f) => u({ url: f.target.value.slice(0, 2e3) }), onKeyDown: (f) => f.stopPropagation() }, c.id + "-url")
      ] }),
      /* @__PURE__ */ n.jsxs("label", { className: "ag-field", children: [
        "NOTES / VARIANTS",
        /* @__PURE__ */ n.jsx("textarea", { defaultValue: c.notes, placeholder: "Price, payment-plan variants, fulfilment terms, or anything to check before sending…", onChange: (f) => u({ notes: f.target.value.slice(0, 2e4) }), onKeyDown: (f) => f.stopPropagation() }, c.id + "-notes")
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "ag-product-actions", children: [
        /* @__PURE__ */ n.jsx("button", { className: "ctl danger", onClick: d, children: "Delete product" }),
        /* @__PURE__ */ n.jsx(Sh, { url: c.url, className: "ctl", disabled: !Nh(c.url) }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl primary", disabled: !Nh(c.url), onClick: () => window.open(c.url.trim(), "_blank", "noopener"), children: "Open agreement ↗" })
      ] })
    ] }) : /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc ag-page active", children: [
      /* @__PURE__ */ n.jsx("div", { className: "ag-page-kicker", children: "CURRENT SALES LIBRARY" }),
      /* @__PURE__ */ n.jsx("h1", { className: "ag-page-title", children: "Client agreements" }),
      e && !((m = e.clientRegions) != null && m.length) && /* @__PURE__ */ n.jsx("p", { children: "No client agreement links have been configured on this installation." }),
      ((e == null ? void 0 : e.clientRegions) || []).map((f) => /* @__PURE__ */ n.jsxs("section", { children: [
        /* @__PURE__ */ n.jsx("h2", { children: f.region }),
        f.sections.map((o, h) => /* @__PURE__ */ n.jsxs("div", { children: [
          o.title && /* @__PURE__ */ n.jsxs("h3", { children: [
            o.title,
            o.warn && /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
              " ",
              /* @__PURE__ */ n.jsx("span", { className: "ag-warn", children: o.warn })
            ] })
          ] }),
          /* @__PURE__ */ n.jsx("div", { className: "ag-list", children: o.links.map((v) => /* @__PURE__ */ n.jsxs("div", { className: "ag-row", children: [
            /* @__PURE__ */ n.jsxs("a", { className: "ag-link", href: v.url, target: "_blank", rel: "noopener noreferrer", children: [
              Qb(v.url) && /* @__PURE__ */ n.jsxs("svg", { className: "yt-icon", viewBox: "0 0 28 20", "aria-label": "YouTube", children: [
                /* @__PURE__ */ n.jsx("rect", { width: "28", height: "20", rx: "5", fill: "#ff0000" }),
                /* @__PURE__ */ n.jsx("path", { d: "M11 5.5v9l8-4.5z", fill: "#fff" })
              ] }),
              /* @__PURE__ */ n.jsx("span", { className: "ag-name", children: v.name }),
              /* @__PURE__ */ n.jsx("span", { className: "ag-open", children: "↗" })
            ] }),
            /* @__PURE__ */ n.jsx(Sh, { url: v.url })
          ] }, v.url)) })
        ] }, h))
      ] }, f.region))
    ] })
  ] });
}
const Jb = (e) => (/* @__PURE__ */ new Date(`${e}T12:00:00`)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", "");
function Fb() {
  const [e, t] = j.useState(null), [l, a] = j.useState(""), s = j.useCallback(() => Q("/api/day-limits").then((u) => t(u.days)).catch(() => a("Can't reach the server.")), []);
  j.useEffect(() => {
    s();
  }, [s]);
  const i = async (u, r, d) => {
    try {
      t((await Q("/api/day-limits", { method: "POST", body: JSON.stringify({ date: u, max: r, title: d }) })).days), a("");
    } catch (m) {
      a(m instanceof Error ? m.message : "Not saved"), s();
    }
  }, c = (u, r) => t((d) => d && d.map((m) => m.date === u ? { ...m, ...r } : m));
  return /* @__PURE__ */ n.jsxs("section", { className: "bf-limits", children: [
    /* @__PURE__ */ n.jsx("h3", { children: "Max calls per day" }),
    /* @__PURE__ */ n.jsx("p", { className: "bf-note", children: "On a day that's On, a 9am–9pm event with your name goes on the calendar. It shows as free time while you're under the max, and turns busy once the max is booked, so nothing more gets booked that day." }),
    l && /* @__PURE__ */ n.jsxs("p", { className: "bf-note", children: [
      "⚠️ ",
      l
    ] }),
    e ? e.map((u) => /* @__PURE__ */ n.jsxs("div", { className: `bf-day ${u.max ? "on" : ""}`, children: [
      /* @__PURE__ */ n.jsx("b", { children: Jb(u.date) }),
      /* @__PURE__ */ n.jsxs("div", { className: "bf-seg", children: [
        /* @__PURE__ */ n.jsx("button", { className: u.max ? "" : "on", onClick: () => u.max && i(u.date, null, ""), children: "Off" }),
        /* @__PURE__ */ n.jsx("button", { className: u.max ? "on" : "", onClick: () => !u.max && i(u.date, 5, ""), children: "On" })
      ] }),
      u.max ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
        /* @__PURE__ */ n.jsxs("label", { children: [
          "max ",
          /* @__PURE__ */ n.jsx("input", { type: "number", min: 1, max: 30, value: u.max, onChange: (r) => c(u.date, { max: Number(r.target.value) || 1 }), onBlur: (r) => {
            const d = Math.min(30, Math.max(1, Number(r.target.value) || 1));
            i(u.date, d, /^\d+ Call Limit$/.test(u.title) ? "" : u.title);
          } }),
          " calls"
        ] }),
        /* @__PURE__ */ n.jsx("input", { className: "bf-day-title", value: u.title, placeholder: "Event name", onChange: (r) => c(u.date, { title: r.target.value }), onBlur: () => i(u.date, u.max, u.title), onKeyDown: (r) => {
          r.key === "Enter" && r.target.blur();
        } })
      ] }) : /* @__PURE__ */ n.jsx("span", { className: "bf-day-off", children: "No limit" })
    ] }, u.date)) : /* @__PURE__ */ n.jsx("p", { className: "bf-note", children: "Loading…" })
  ] });
}
const wh = (e) => `${(e - 1) % 12 + 1}${e < 12 ? "am" : "pm"}`;
function Ib() {
  const [e, t] = j.useState(null), [l, a] = j.useState(""), [s, i] = j.useState(0), [c, u] = j.useState(null), r = j.useCallback(() => Q("/api/buffers").then((x) => {
    t(x), a("");
  }).catch(() => a("Can't reach the server.")), []);
  j.useEffect(() => {
    r();
    const x = setInterval(() => {
      document.hidden || r();
    }, 3e4);
    return () => clearInterval(x);
  }, [r]);
  const d = s || (e == null ? void 0 : e.max_in_a_row) || 3;
  j.useEffect(() => {
    e && Q(`/api/buffer-diagrams?n=${d}`).then(u).catch(() => {
    });
  }, [d, e]);
  const m = async (x) => {
    if (!(!e || x === e.mode) && !(e.paused && x !== "off" && !confirm(`Turn auto-buffering ON with up to ${x} calls in a row? Within a minute buffers will start being added to your calendar.`))) {
      try {
        await Q(`/api/buffers-set?mode=${x}`, { method: "POST" });
      } catch {
        alert("Couldn't change it: server not answering");
      }
      r();
    }
  }, f = e != null && e.paused_since ? new Date(e.paused_since).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "", o = (e == null ? void 0 : e.max_in_a_row) || 0, h = e ? e.on ? `Up to ${o} calls in a row are allowed. ${o === 2 ? "Any back-to-back pair is walled in by buffers, and a lone open hour between two calls is blocked." : `Once ${o} calls are back-to-back, buffers go before and after them; an open hour between calls is blocked only if booking it would make ${o + 1} or more in a row.`}` : e.paused ? `Paused on purpose${f ? " since " + f : ""}. No buffers are being added to the calendar.` : "The auto-buffer poller isn't running, so no buffers are being added." : "", v = c ? Array.from({ length: c.last - c.first + 1 }, (x, C) => c.first + C) : [];
  return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc", children: [
    /* @__PURE__ */ n.jsxs("h2", { children: [
      "🧱 Buffers ",
      e && /* @__PURE__ */ n.jsx("span", { children: e.mode === "off" ? "(OFF)" : `(${e.mode})` })
    ] }),
    l ? /* @__PURE__ */ n.jsx("p", { className: "bf-note", children: l }) : e ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
      /* @__PURE__ */ n.jsxs("div", { className: `bf-card ${e.on ? "on" : "off"}`, children: [
        /* @__PURE__ */ n.jsx("div", { className: "bf-state", children: e.on ? "ON" : "OFF" }),
        /* @__PURE__ */ n.jsxs("div", { className: "bf-label", children: [
          "Auto-buffering",
          e.on ? ` · ${o} in a row` : ""
        ] })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "bf-seg-wrap", children: [
        /* @__PURE__ */ n.jsx("div", { className: "bf-seg", role: "radiogroup", "aria-label": "Calls in a row", children: [["off", "Off"], ["2", "2"], ["3", "3"], ["4", "4"]].map(([x, C]) => /* @__PURE__ */ n.jsx("button", { className: e.mode === x ? "on" : "", onClick: () => m(x), children: C }, x)) }),
        /* @__PURE__ */ n.jsx("span", { className: "bf-switch-label", children: "calls in a row before a buffer" })
      ] }),
      /* @__PURE__ */ n.jsx("p", { className: "bf-note", children: h }),
      /* @__PURE__ */ n.jsx(Fb, {}),
      c && /* @__PURE__ */ n.jsxs("section", { className: "bf-diagrams", children: [
        /* @__PURE__ */ n.jsx("h3", { children: "See how it works" }),
        /* @__PURE__ */ n.jsx("div", { className: "bf-seg-wrap", children: /* @__PURE__ */ n.jsx("div", { className: "bf-seg", children: [2, 3, 4].map((x) => /* @__PURE__ */ n.jsxs("button", { className: x === d ? "on" : "", onClick: () => i(x), children: [
          x,
          " in a row"
        ] }, x)) }) }),
        /* @__PURE__ */ n.jsxs("div", { className: "bf-legend", children: [
          /* @__PURE__ */ n.jsxs("span", { className: "bf-key call", children: [
            /* @__PURE__ */ n.jsx("i", {}),
            "call"
          ] }),
          /* @__PURE__ */ n.jsxs("span", { className: "bf-key block", children: [
            /* @__PURE__ */ n.jsx("i", {}),
            "blocked by a buffer"
          ] }),
          /* @__PURE__ */ n.jsxs("span", { className: "bf-key open", children: [
            /* @__PURE__ */ n.jsx("i", {}),
            "open: can still be booked"
          ] })
        ] }),
        c.sections.map((x) => /* @__PURE__ */ n.jsxs("section", { className: "bf-section", children: [
          /* @__PURE__ */ n.jsx("h4", { className: "bf-sec-title", children: x.title }),
          /* @__PURE__ */ n.jsx("p", { className: "bf-sec-blurb", children: x.blurb }),
          /* @__PURE__ */ n.jsx("div", { className: "bf-cases", children: x.cases.map((C) => /* @__PURE__ */ n.jsxs("article", { className: `bf-case ${C.blocked.length ? "blocks" : "free"}`, children: [
            /* @__PURE__ */ n.jsxs("h5", { children: [
              C.title,
              /* @__PURE__ */ n.jsx("span", { className: `bf-badge ${C.blocked.length ? "blocks" : "free"}`, children: C.blocked.length ? "Blocks " + C.blocked.map(wh).join(", ") : "Nothing blocked" })
            ] }),
            /* @__PURE__ */ n.jsx("div", { className: "bf-strip", children: v.map((p) => {
              const y = C.calls.includes(p) ? "call" : C.blocked.includes(p) ? "block" : "open";
              return /* @__PURE__ */ n.jsxs("div", { className: `bf-slot ${y}`, children: [
                /* @__PURE__ */ n.jsx("span", { className: "bf-t", children: wh(p) }),
                /* @__PURE__ */ n.jsx("span", { className: "bf-k", children: y === "call" ? "CALL" : y === "block" ? "BLOCKED" : "open" })
              ] }, p);
            }) }),
            /* @__PURE__ */ n.jsx("p", { children: C.notes.map((p, y) => /* @__PURE__ */ n.jsxs("span", { children: [
              y > 0 && /* @__PURE__ */ n.jsx("br", {}),
              p
            ] }, y)) })
          ] }, C.title)) })
        ] }, x.title)),
        /* @__PURE__ */ n.jsx("p", { className: "bf-note", children: "Drawn by running the real buffer rules on made-up one-hour calls, so this always matches what the poller does. A buffer never goes on top of an existing call." })
      ] })
    ] }) : /* @__PURE__ */ n.jsx("p", { className: "bf-note", children: "Loading…" })
  ] });
}
function rc({ title: e, className: t = "", onClose: l, footer: a, children: s }) {
  return j.useEffect(() => {
    const i = (c) => {
      c.key === "Escape" && (c.preventDefault(), l());
    };
    return document.addEventListener("keydown", i, !0), () => document.removeEventListener("keydown", i, !0);
  }, [l]), /* @__PURE__ */ n.jsx("div", { className: "cs-dialog-bg", onMouseDown: (i) => {
    i.target === i.currentTarget && l();
  }, onKeyDown: (i) => i.stopPropagation(), children: /* @__PURE__ */ n.jsxs("div", { className: `cs-dialog ${t}`, role: "dialog", "aria-modal": "true", children: [
    /* @__PURE__ */ n.jsxs("header", { children: [
      /* @__PURE__ */ n.jsx("b", { children: e }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl cs-dialog-x", title: "Close (Esc)", onClick: l, children: "✕" })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "cs-dialog-body", children: s }),
    a && /* @__PURE__ */ n.jsx("footer", { children: a })
  ] }) });
}
const Wb = { create: "＋ copied", update: "✎ updated", delete: "− removed", missing: "⚠ went missing", note: "✎ source changed" }, Ch = (e) => typeof e == "object" && e ? e.dateTime || e.date || JSON.stringify(e) : String(e ?? ""), ju = { enabled: !1, everySeconds: 120, calendars: [], rules: {}, options: { days: 30, allDay: !1, free: !1, buffers: !1, prefix: !0, reminders: !1, lookalikes: !0, skipCounters: !0, skipWords: [], skipColors: [] } }, Pb = ["A", "B", "C", "D"], e0 = [["1", "Lavender", "#7986cb"], ["2", "Sage", "#33b679"], ["3", "Grape", "#8e24aa"], ["4", "Flamingo", "#e67c73"], ["5", "Banana", "#f6bf26"], ["6", "Tangerine", "#f4511e"], ["7", "Peacock", "#039be5"], ["8", "Graphite", "#616161"], ["9", "Blueberry", "#3f51b5"], ["10", "Basil", "#0b8043"], ["11", "Tomato", "#d50000"]], Th = { busy: "Busy only", title: "Title only", full: "Full details" }, Eh = { owner: "yours", writer: "can edit", reader: "read only", freeBusyReader: "free/busy only" }, bu = (e) => e ? new Date(e).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "", Nu = (e) => e ? `${e.create || 0} new · ${e.update || 0} updated · ${e.delete || 0} removed` : "";
function t0() {
  var Cn;
  const [e, t] = j.useState(ju), [l, a] = j.useState(null), [s, i] = j.useState(null), [c, u] = j.useState(""), [r, d] = j.useState(null), [m, f] = j.useState(""), [o, h] = j.useState(""), v = j.useRef(void 0), [x, C] = j.useState(null), [p, y] = j.useState(!1), [S, w] = j.useState(null), [D, U] = j.useState(!1), N = j.useCallback(() => Q("/api/calsync-history").then(C).catch(() => {
  }), []), _ = j.useCallback((L = !1) => Q(`/api/calsync-calendars${L ? "?fresh=1" : ""}`).then((q) => i(q.calendars)).catch((q) => f(q instanceof Error ? q.message : "Couldn't list your calendars")), []);
  j.useEffect(() => {
    Q("/api/calsync").then((q) => {
      t({ ...ju, ...q.config, options: { ...ju.options, ...q.config.options || {} } }), a(q.lastRun);
    }).catch(() => f("Can't reach the server.")), _(), N();
    const L = setInterval(() => {
      document.hidden || Q("/api/calsync").then((q) => a(q.lastRun)).catch(() => {
      });
    }, 3e4);
    return () => clearInterval(L);
  }, [_]);
  const E = (L, q = !1) => {
    t(L), window.clearTimeout(v.current);
    const V = () => Q("/api/calsync", { method: "POST", body: JSON.stringify(L) }).then((re) => {
      t((lt) => ({ ...lt, calendars: re.config.calendars })), f("");
    }).catch((re) => f(re instanceof Error ? re.message : "Not saved"));
    return q ? V() : (v.current = window.setTimeout(V, 500), Promise.resolve());
  }, T = e.calendars.map((L, q) => ({ ...L, key: Pb[q] })), b = (L) => {
    var q;
    return L.label || ((q = s == null ? void 0 : s.find((V) => V.id === L.id)) == null ? void 0 : q.name) || L.id;
  }, g = (L) => {
    var q;
    return ((q = s == null ? void 0 : s.find((V) => V.id === L)) == null ? void 0 : q.role) || "";
  }, A = T.flatMap((L) => T.filter((q) => q.key !== L.key).map((q) => [L, q])), O = (L) => e.rules[L] || { on: !1, mode: "busy", busyTitle: "Busy" }, z = (L, q) => E({ ...e, rules: { ...e.rules, [L]: { ...O(L), ...q } } }), k = (L, q) => {
    const V = e.calendars.slice();
    V[L] = { ...V[L], ...q }, E({ ...e, calendars: V });
  }, R = (L) => {
    confirm(`Take ${b(e.calendars[L])} out of the sync? Its copies (and the copies made from it) are removed on the next sync. Directions are re-lettered.`) && E({ ...e, calendars: e.calendars.filter((q, V) => V !== L), rules: {} }, !0);
  }, M = (L) => E({ ...e, rules: Object.fromEntries(A.map(([q, V]) => [`${q.key}>${V.key}`, { ...O(`${q.key}>${V.key}`), on: L }])) }), Y = async (L) => {
    u(L ? "Working out what would change…" : "Syncing…"), d(null), await E(e, !0);
    try {
      const q = await Q(`/api/calsync-run${L ? "?dry=1" : ""}`, { method: "POST" });
      d(q), L || a(q);
    } catch (q) {
      d({ error: q instanceof Error ? q.message : "failed" });
    }
    u(""), L || N();
  }, K = async () => {
    if (!e.enabled) {
      if (!Object.values(e.rules).some((q) => q.on)) {
        alert("Switch on at least one direction first.");
        return;
      }
      u("Checking what the first sync will do…"), await E(e, !0);
      const L = await Q("/api/calsync-run?dry=1", { method: "POST" }).catch(() => null);
      if (u(""), L && d(L), !confirm(`Switch CalendarSync on?

The first sync will make ${Nu(L == null ? void 0 : L.planned) || "some changes"} across your calendars, then it keeps them in step every ${Math.round(e.everySeconds / 60)} min.`)) return;
    }
    E({ ...e, enabled: !e.enabled }, !0);
  }, he = async () => {
    var re;
    u("Counting synced copies…");
    const L = await Q("/api/calsync-cleanup?dry=1", { method: "POST" }).catch(() => null);
    u("");
    const q = ((re = L == null ? void 0 : L.planned) == null ? void 0 : re.delete) || 0;
    if (!q) {
      alert("There are no synced copies on any calendar.");
      return;
    }
    if (!confirm(`Delete all ${q} synced copies from every calendar? Your own events aren't touched.${e.enabled ? `

The sync is ON, so it will make them again: switch it off first if you want them gone for good.` : ""}`)) return;
    u("Removing synced copies…");
    const V = await Q("/api/calsync-cleanup", { method: "POST" }).catch((lt) => ({ error: String(lt) }));
    u(""), d(V);
  }, ge = async () => {
    try {
      await Q("/api/calsync-add", { method: "POST", body: JSON.stringify({ email: o }) }), h(""), _(!0);
    } catch (L) {
      alert(L instanceof Error ? L.message : "Not added");
    }
  }, I = r || l, Ne = (L, q) => E({ ...e, options: { ...e.options, [L]: q } }), F = ({ k: L, label: q, tip: V }) => /* @__PURE__ */ n.jsxs("label", { className: "cs-toggle", title: V, children: [
    /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: !!e.options[L], onChange: (re) => Ne(L, re.target.checked) }),
    /* @__PURE__ */ n.jsx("span", { children: q })
  ] }), qe = ({ topic: L }) => /* @__PURE__ */ n.jsx("button", { className: "cs-info", title: "What's this?", onClick: () => w(L), children: "i" }), al = (s || []).filter((L) => !T.some((q) => q.id === L.id)), wn = e.options.skipWords.filter(Boolean).length + e.options.skipColors.length;
  return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc cs-sync", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "cs-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsxs("h2", { children: [
          "🔁 CalendarSync ",
          /* @__PURE__ */ n.jsx("span", { className: `cs-pill ${e.enabled ? "on" : ""}`, children: e.enabled ? `ON · every ${Math.round(e.everySeconds / 60)} min` : "OFF" }),
          " ",
          /* @__PURE__ */ n.jsx(qe, { topic: "how" })
        ] }),
        /* @__PURE__ */ n.jsx("p", { className: "cs-sub", children: "Keep up to 4 calendars in step, with a privacy level for each direction." })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cs-actions", children: [
        /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => Y(!0), disabled: !!c || !T.length, children: "👀 Preview" }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => Y(!1), disabled: !!c || !Object.values(e.rules).some((L) => L.on), children: "↻ Sync now" }),
        /* @__PURE__ */ n.jsx("button", { className: `ctl ${e.enabled ? "" : "biz-primary"}`, onClick: K, disabled: !!c, children: e.enabled ? "Switch off" : "Switch on" })
      ] })
    ] }),
    m && /* @__PURE__ */ n.jsxs("p", { className: "cs-err", children: [
      "⚠️ ",
      m
    ] }),
    (c || I) && /* @__PURE__ */ n.jsx("div", { className: "cs-result", children: c ? /* @__PURE__ */ n.jsx("span", { children: c }) : I && /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
      /* @__PURE__ */ n.jsx("b", { children: I.error ? "⚠️ " + I.error : I.skipped ? I.skipped : I.dry ? `Preview: ${Nu(I.planned)}` : `Last sync ${bu(I.at)}: ${Nu(I.done || I.planned)}` }),
      !!I.more && /* @__PURE__ */ n.jsxs("span", { children: [
        " · ",
        I.more,
        " more next run"
      ] }),
      (I.errors || []).map((L, q) => /* @__PURE__ */ n.jsxs("p", { className: "cs-err", children: [
        "⚠️ ",
        L
      ] }, q)),
      I.dry && !!((Cn = I.sample) != null && Cn.length) && /* @__PURE__ */ n.jsxs("details", { children: [
        /* @__PURE__ */ n.jsx("summary", { children: "See the changes" }),
        /* @__PURE__ */ n.jsx("table", { className: "cs-plan", children: /* @__PURE__ */ n.jsx("tbody", { children: I.sample.map((L, q) => /* @__PURE__ */ n.jsxs("tr", { children: [
          /* @__PURE__ */ n.jsx("td", { children: L.op === "create" ? "＋" : L.op === "update" ? "✎" : "−" }),
          /* @__PURE__ */ n.jsx("td", { children: L.calendar }),
          /* @__PURE__ */ n.jsx("td", { children: L.title }),
          /* @__PURE__ */ n.jsx("td", { children: bu(L.start) })
        ] }, q)) }) })
      ] })
    ] }) }),
    /* @__PURE__ */ n.jsxs("section", { className: "cs-card", children: [
      /* @__PURE__ */ n.jsxs("h3", { children: [
        "Calendars ",
        /* @__PURE__ */ n.jsx(qe, { topic: "calendars" })
      ] }),
      T.map((L, q) => /* @__PURE__ */ n.jsxs("div", { className: "cs-cal", children: [
        /* @__PURE__ */ n.jsx("span", { className: "cs-letter", children: L.key }),
        /* @__PURE__ */ n.jsx("input", { className: "cs-label", value: L.label, placeholder: "Name", title: "Short name, shown in front of copied titles", onChange: (V) => k(q, { label: V.target.value }) }),
        /* @__PURE__ */ n.jsxs("select", { value: L.id, onChange: (V) => k(q, { id: V.target.value }), children: [
          !(s != null && s.some((V) => V.id === L.id)) && /* @__PURE__ */ n.jsx("option", { value: L.id, children: L.id }),
          (s || []).map((V) => /* @__PURE__ */ n.jsxs("option", { value: V.id, disabled: T.some((re) => re.id === V.id && re.key !== L.key), children: [
            V.name,
            V.primary ? " (main)" : "",
            " · ",
            Eh[V.role] || V.role
          ] }, V.id))
        ] }),
        g(L.id) && !["owner", "writer"].includes(g(L.id)) && /* @__PURE__ */ n.jsx("small", { className: "cs-warn", title: "It can send events, not receive copies", children: "source only" }),
        /* @__PURE__ */ n.jsx("button", { className: "cs-x", title: "Take out of the sync", onClick: () => R(q), children: "×" })
      ] }, q)),
      T.length < 4 && /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => U(!0), children: "＋ Add calendar" })
    ] }),
    T.length >= 2 && /* @__PURE__ */ n.jsxs("section", { className: "cs-card", children: [
      /* @__PURE__ */ n.jsxs("h3", { children: [
        "Directions ",
        /* @__PURE__ */ n.jsx(qe, { topic: "directions" }),
        /* @__PURE__ */ n.jsxs("span", { className: "cs-links", children: [
          /* @__PURE__ */ n.jsx("button", { onClick: () => M(!0), children: "Tick all" }),
          " · ",
          /* @__PURE__ */ n.jsx("button", { onClick: () => M(!1), children: "Untick all" })
        ] })
      ] }),
      /* @__PURE__ */ n.jsx("div", { className: "cs-rules", children: A.map(([L, q]) => {
        const V = `${L.key}>${q.key}`, re = O(V), lt = !g(q.id) || ["owner", "writer"].includes(g(q.id));
        return /* @__PURE__ */ n.jsxs("div", { className: `cs-rule ${re.on ? "on" : ""}`, children: [
          /* @__PURE__ */ n.jsxs("label", { className: "cs-pair", children: [
            /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: re.on, disabled: !lt, onChange: (at) => z(V, { on: at.target.checked }) }),
            " ",
            b(L),
            " ",
            /* @__PURE__ */ n.jsx("span", { className: "cs-arrow", children: "→" }),
            " ",
            b(q)
          ] }),
          lt ? re.on && /* @__PURE__ */ n.jsxs("div", { className: "cs-rule-opts", children: [
            /* @__PURE__ */ n.jsx("div", { className: "cs-seg", children: Object.keys(Th).map((at) => /* @__PURE__ */ n.jsx("button", { className: re.mode === at ? "on" : "", onClick: () => z(V, { mode: at }), children: Th[at] }, at)) }),
            re.mode === "busy" && /* @__PURE__ */ n.jsx("input", { className: "cs-busy", value: re.busyTitle, onChange: (at) => z(V, { busyTitle: at.target.value }), title: "What the copies are called" }),
            re.mode !== "busy" && /* @__PURE__ */ n.jsxs("label", { className: "cs-demo", title: "Every copy becomes “Demo • …” and phone numbers become random US ones", children: [
              /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: !!re.demo, onChange: (at) => z(V, { demo: at.target.checked }) }),
              " 🎭 Demo"
            ] })
          ] }) : /* @__PURE__ */ n.jsxs("small", { className: "cs-warn", children: [
            b(q),
            " is read only"
          ] })
        ] }, V);
      }) })
    ] }),
    /* @__PURE__ */ n.jsxs("section", { className: "cs-card", children: [
      /* @__PURE__ */ n.jsxs("h3", { children: [
        "Options ",
        /* @__PURE__ */ n.jsx(qe, { topic: "options" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cs-toggles", children: [
        /* @__PURE__ */ n.jsxs("label", { className: "cs-toggle", children: [
          "Sync the next ",
          /* @__PURE__ */ n.jsx("input", { type: "number", min: 1, max: 90, value: e.options.days, onChange: (L) => Ne("days", Number(L.target.value) || 30) }),
          " days"
        ] }),
        /* @__PURE__ */ n.jsx(F, { k: "prefix", label: "Name in front (TSD • …)", tip: "The source calendar's name in front of copied titles. Never on Busy copies." }),
        /* @__PURE__ */ n.jsx(F, { k: "lookalikes", label: "Skip lookalikes", tip: "Don't copy an event if the target already has one with the same title and time." }),
        /* @__PURE__ */ n.jsx(F, { k: "skipCounters", label: "Skip counters & trackers", tip: "Titles like “4/8 Calls Sched.” or “5.5/20 SALES”." }),
        /* @__PURE__ */ n.jsx(F, { k: "buffers", label: "Include buffers & call limits", tip: "Call Studio's own aBuffers and call-limit blocks." }),
        /* @__PURE__ */ n.jsx(F, { k: "allDay", label: "Include all-day events", tip: "All-day events are skipped unless this is on." }),
        /* @__PURE__ */ n.jsx(F, { k: "free", label: "Include “free” events", tip: "Events marked as free time are skipped unless this is on." }),
        /* @__PURE__ */ n.jsx(F, { k: "reminders", label: "Reminders on copies", tip: "Off: copies never notify you." })
      ] }),
      /* @__PURE__ */ n.jsxs("details", { className: "cs-filters", children: [
        /* @__PURE__ */ n.jsxs("summary", { children: [
          "Filters",
          wn ? ` (${wn})` : "",
          ": skip by word or colour"
        ] }),
        /* @__PURE__ */ n.jsxs("label", { className: "cs-col", children: [
          "Skip events whose title contains (one per line)",
          /* @__PURE__ */ n.jsx("textarea", { rows: 3, value: e.options.skipWords.join(`
`), placeholder: `e.g.
Call Maxxing`, onChange: (L) => Ne("skipWords", L.target.value.split(`
`)) })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "cs-colors", children: [
          /* @__PURE__ */ n.jsx("span", { children: "Skip events coloured" }),
          e0.map(([L, q, V]) => {
            const re = e.options.skipColors.includes(L);
            return /* @__PURE__ */ n.jsx(
              "button",
              {
                className: re ? "on" : "",
                title: q,
                style: { background: V },
                onClick: () => Ne("skipColors", re ? e.options.skipColors.filter((lt) => lt !== L) : [...e.options.skipColors, L]),
                children: re ? "✕" : ""
              },
              L
            );
          })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("section", { className: "cs-card", children: [
      /* @__PURE__ */ n.jsxs("h3", { children: [
        "History ",
        /* @__PURE__ */ n.jsx(qe, { topic: "history" })
      ] }),
      x && Object.keys(x.counts).length > 0 ? /* @__PURE__ */ n.jsx("div", { className: "cs-counts", children: Object.entries(x.counts).map(([L, q]) => /* @__PURE__ */ n.jsxs("span", { className: "cs-chip", children: [
        /* @__PURE__ */ n.jsx("b", { children: L }),
        " ",
        q.active,
        " synced",
        q.missing ? ` · ${q.missing} missing` : "",
        q.deleted ? ` · ${q.deleted} removed` : ""
      ] }, L)) }) : /* @__PURE__ */ n.jsx("p", { className: "cs-sub", children: "Nothing synced yet." }),
      /* @__PURE__ */ n.jsxs("div", { className: "cs-actions", children: [
        /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => {
          y((L) => !L), N();
        }, children: p ? "Hide changes" : "Recent changes" }),
        /* @__PURE__ */ n.jsx("a", { className: "ctl", href: "/api/calsync-ledger", download: !0, children: "⬇ Download record" }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl cs-danger", onClick: he, disabled: !!c, title: "Deletes every synced copy from every calendar. Your own events are never touched.", children: "🧹 Remove all copies" })
      ] }),
      p && !!(x != null && x.log.length) && /* @__PURE__ */ n.jsx("table", { className: "cs-plan cs-log", children: /* @__PURE__ */ n.jsx("tbody", { children: x.log.map((L, q) => /* @__PURE__ */ n.jsxs("tr", { className: L.op === "missing" ? "warn" : "", children: [
        /* @__PURE__ */ n.jsx("td", { children: bu(L.at) }),
        /* @__PURE__ */ n.jsx("td", { children: Wb[L.op] || L.op }),
        /* @__PURE__ */ n.jsxs("td", { children: [
          L.calendar,
          L.from ? /* @__PURE__ */ n.jsxs("small", { children: [
            " from ",
            L.from
          ] }) : null
        ] }),
        /* @__PURE__ */ n.jsxs("td", { children: [
          L.title,
          L.reason && /* @__PURE__ */ n.jsxs("small", { children: [
            /* @__PURE__ */ n.jsx("br", {}),
            L.reason
          ] }),
          L.changes && /* @__PURE__ */ n.jsx("small", { children: Object.entries(L.changes).map(([V, [re, lt]]) => /* @__PURE__ */ n.jsxs("span", { children: [
            /* @__PURE__ */ n.jsx("br", {}),
            V,
            ": ",
            Ch(re),
            " → ",
            Ch(lt)
          ] }, V)) })
        ] })
      ] }, q)) }) })
    ] }),
    S && /* @__PURE__ */ n.jsx(rc, { title: Dh[S].title, onClose: () => w(null), children: Dh[S].body }),
    D && /* @__PURE__ */ n.jsxs(rc, { title: "＋ Add calendar", onClose: () => U(!1), children: [
      al.length > 0 && /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
        /* @__PURE__ */ n.jsx("p", { className: "cs-sub", children: "Calendars your Google account can already see:" }),
        /* @__PURE__ */ n.jsx("div", { className: "cs-pick", children: al.map((L) => /* @__PURE__ */ n.jsxs("button", { className: "ctl", onClick: () => {
          E({ ...e, calendars: [...e.calendars, { id: L.id, label: "" }] }), U(!1);
        }, children: [
          L.name,
          L.primary ? " (main)" : "",
          " ",
          /* @__PURE__ */ n.jsx("small", { children: Eh[L.role] || L.role })
        ] }, L.id)) })
      ] }),
      /* @__PURE__ */ n.jsxs("p", { className: "cs-sub", children: [
        /* @__PURE__ */ n.jsx("b", { children: "Not listed?" }),
        " In that account's Google Calendar: Settings → the calendar → ",
        /* @__PURE__ */ n.jsx("i", { children: "Share with specific people" }),
        " → add your signed-in email with ",
        /* @__PURE__ */ n.jsx("i", { children: "Make changes to events" }),
        " (or ",
        /* @__PURE__ */ n.jsx("i", { children: "See only free/busy" }),
        " if it only sends). Then add it here:"
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cs-actions", children: [
        /* @__PURE__ */ n.jsx("input", { value: o, onChange: (L) => h(L.target.value), placeholder: "its email, e.g. you@otheroffer.com", onKeyDown: (L) => {
          L.key === "Enter" && ge();
        } }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: ge, disabled: !o.trim(), children: "Add" }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => _(!0), title: "Look again", children: "↻" })
      ] })
    ] })
  ] });
}
const Dh = {
  how: { title: "How CalendarSync works", body: /* @__PURE__ */ n.jsxs("ul", { className: "cs-how", children: [
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "No duplicates or loops." }),
      " Copies are marked and never copied again, so A→B plus B→A can't ping-pong."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "One copy per meeting." }),
      " The same meeting on two calendars is copied once. If the target already has it, it isn't copied."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Changes follow." }),
      " Moving, renaming or deleting an event updates its copies. A hand-edited copy is put back."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Safe." }),
      " Only its own copies are ever changed or deleted. If a calendar can't be read, its copies are left alone."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Automatic" }),
      " every couple of minutes while it's ON; Sync now runs it straight away."
    ] })
  ] }) },
  calendars: { title: "Calendars", body: /* @__PURE__ */ n.jsxs("ul", { className: "cs-how", children: [
    /* @__PURE__ */ n.jsx("li", { children: "Up to 4, e.g. one per company, offer or your personal one." }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      "The ",
      /* @__PURE__ */ n.jsx("b", { children: "name" }),
      " (e.g. TSD) goes in front of copied titles: “TSD • …”."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      "A calendar shared with you as read only can ",
      /* @__PURE__ */ n.jsx("b", { children: "send" }),
      " events but can't receive copies."
    ] }),
    /* @__PURE__ */ n.jsx("li", { children: "Taking a calendar out removes the copies it received and the copies made from it." })
  ] }) },
  directions: { title: "Directions and privacy", body: /* @__PURE__ */ n.jsxs("ul", { className: "cs-how", children: [
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Busy only" }),
      ": just the time, titled “Busy” (or your word). No title, notes, location, guests or links."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Title only" }),
      ": time and title."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Full details" }),
      ": title, notes, location and meeting link. Guests are never copied, so nobody gets invites."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "🎭 Demo" }),
      ": every copy is titled “Demo • …” and every phone number in it becomes a random US one."
    ] }),
    /* @__PURE__ */ n.jsx("li", { children: "Unticking a direction removes its copies on the next sync. To pause but keep them, switch the sync off." })
  ] }) },
  options: { title: "Options", body: /* @__PURE__ */ n.jsxs("ul", { className: "cs-how", children: [
    /* @__PURE__ */ n.jsx("li", { children: "Each sync covers 24 hours back to the number of days ahead you set." }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Skip lookalikes" }),
      ": a block you typed into both calendars isn't copied again."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Skip counters" }),
      ": tracker events like “4/8 Calls Sched.” stay put."
    ] }),
    /* @__PURE__ */ n.jsxs("li", { children: [
      /* @__PURE__ */ n.jsx("b", { children: "Filters" }),
      " skip events by a word in the title or by colour."
    ] }),
    /* @__PURE__ */ n.jsx("li", { children: "Declined meetings are never copied." })
  ] }) },
  history: { title: "History", body: /* @__PURE__ */ n.jsxs("ul", { className: "cs-how", children: [
    /* @__PURE__ */ n.jsx("li", { children: "Every copy is recorded on this Mac only (never on a calendar): where it is, which event it came from, and that event's details at the last sync." }),
    /* @__PURE__ */ n.jsx("li", { children: "So a changed or lost original can be traced and rebuilt from the record." }),
    /* @__PURE__ */ n.jsx("li", { children: "Removed copies stay on record for 180 days. A copy that vanishes is logged and recreated." }),
    /* @__PURE__ */ n.jsx("li", { children: "Heads-up: copies are created by your signed-in Google account, which people with full access to the target can see." })
  ] }) }
}, kh = ["month", "night", "week", "total"], Mt = (e) => {
  const t = parseFloat(String(e).replace(/[^0-9.]/g, ""));
  return Number.isFinite(t) ? t : NaN;
}, Su = (e) => {
  try {
    return new URL(e).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}, Ah = (e) => e ? (/* @__PURE__ */ new Date(`${e}T12:00:00`)).toLocaleDateString([], { day: "numeric", month: "short" }) : "…", l0 = (e, t) => e.avail !== "dates" || (e.ranges || []).some((l) => (!l.from || l.from <= t) && (!l.to || t <= l.to)), a0 = (e) => {
  var t;
  return (((t = /\bin ([A-Z][\p{L}' -]+?)(?:\s*[·,|(]|$)/u.exec(e)) == null ? void 0 : t[1]) || "").trim();
};
function n0() {
  const { doc: e, update: t, status: l } = Nt("travel", { places: [] }), [a, s] = j.useState(""), [i, c] = j.useState(!1), [u, r] = j.useState(""), [d, m] = j.useState(""), [f, o] = j.useState(""), [h, v] = j.useState(""), [x, C] = j.useState(""), [p, y] = j.useState(""), [S, w] = j.useState(!1), [D, U] = j.useState("new"), N = (e == null ? void 0 : e.places) || [], _ = j.useMemo(() => [...new Set(N.map((g) => g.city.trim()).filter(Boolean))].sort(), [N]), E = j.useMemo(() => {
    const g = u.toLowerCase().split(/\s+/).filter(Boolean), A = N.filter((z) => (!d || z.city.trim() === d) && (!p || z.per === p) && (!S || z.fav) && (!f || !(Mt(z.price) > Mt(f))) && (!h || Mt(z.sqm) >= Mt(h)) && (!x || l0(z, x)) && g.every((k) => `${z.title} ${z.city} ${z.notes} ${Su(z.url)}`.toLowerCase().includes(k))), O = (z) => D === "price" ? Mt(z.price) : D === "pricedesc" ? -Mt(z.price) : D === "sqm" ? -Mt(z.sqm) : D === "persqm" ? Mt(z.price) / Mt(z.sqm) : -Date.parse(z.added || "0");
    return A.sort((z, k) => {
      const R = O(z), M = O(k);
      return (Number.isNaN(R) ? 1 : 0) - (Number.isNaN(M) ? 1 : 0) || R - M || 0;
    });
  }, [N, u, d, p, S, f, h, x, D]), T = (g, A) => t((O) => {
    const z = O.places.find((k) => k.id === g);
    return z && Object.assign(z, A), O;
  }), b = async () => {
    const g = a.trim();
    if (!/^https?:\/\//.test(g)) {
      alert("Paste a full link (starting with https://).");
      return;
    }
    if (N.some((k) => k.url === g) && !confirm("That link is already on the list. Add it again?")) return;
    c(!0);
    const A = await Q(`/api/link-title?url=${encodeURIComponent(g)}`).catch(() => ({ title: "", image: "" })), O = (A.title || "").replace(/\s+/g, " ").trim(), z = N[0];
    t((k) => (k.places.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      url: g,
      title: O || Su(g),
      image: A.image || "",
      city: a0(O) || d,
      price: "",
      per: (z == null ? void 0 : z.per) || "month",
      currency: (z == null ? void 0 : z.currency) || "€",
      sqm: "",
      notes: "",
      fav: !1,
      added: (/* @__PURE__ */ new Date()).toISOString()
    }), k)), s(""), c(!1);
  };
  return e ? /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc tv-page", children: [
    /* @__PURE__ */ n.jsxs("h2", { children: [
      "✈️ Travel ",
      /* @__PURE__ */ n.jsxs("span", { className: "tv-count", children: [
        N.length,
        " place",
        N.length === 1 ? "" : "s"
      ] }),
      l && /* @__PURE__ */ n.jsx("small", { className: "tv-status", children: l }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl tc-back", onClick: () => {
        var g;
        return (g = document.getElementById("tab-travelcontacts")) == null ? void 0 : g.click();
      }, children: "👥 Contacts" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "tv-add", children: [
      /* @__PURE__ */ n.jsx("input", { value: a, onChange: (g) => s(g.target.value), onKeyDown: (g) => {
        g.key === "Enter" && b();
      }, placeholder: "Paste a rental link (Airbnb, Booking, any site)…" }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl biz-primary", onClick: b, disabled: i || !a.trim(), children: i ? "Looking it up…" : "＋ Add" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "tv-filters", children: [
      /* @__PURE__ */ n.jsx("input", { value: u, onChange: (g) => r(g.target.value), placeholder: "Search title, notes…" }),
      /* @__PURE__ */ n.jsxs("select", { value: d, onChange: (g) => m(g.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "", children: "All cities" }),
        _.map((g) => /* @__PURE__ */ n.jsx("option", { children: g }, g))
      ] }),
      /* @__PURE__ */ n.jsxs("select", { value: p, onChange: (g) => y(g.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "", children: "Any period" }),
        kh.map((g) => /* @__PURE__ */ n.jsxs("option", { value: g, children: [
          "per ",
          g
        ] }, g))
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "max price ",
        /* @__PURE__ */ n.jsx("input", { type: "number", value: f, onChange: (g) => o(g.target.value) })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "min m² ",
        /* @__PURE__ */ n.jsx("input", { type: "number", value: h, onChange: (g) => v(g.target.value) })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { title: "Only places free on this day (any time, or a date range that includes it)", children: [
        "free on ",
        /* @__PURE__ */ n.jsx("input", { type: "date", value: x, onChange: (g) => C(g.target.value) })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: S, onChange: (g) => w(g.target.checked) }),
        " ★ only"
      ] }),
      /* @__PURE__ */ n.jsxs("select", { value: D, onChange: (g) => U(g.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "new", children: "Newest first" }),
        /* @__PURE__ */ n.jsx("option", { value: "price", children: "Price: low → high" }),
        /* @__PURE__ */ n.jsx("option", { value: "pricedesc", children: "Price: high → low" }),
        /* @__PURE__ */ n.jsx("option", { value: "sqm", children: "Biggest first" }),
        /* @__PURE__ */ n.jsx("option", { value: "persqm", children: "Cheapest per m²" })
      ] })
    ] }),
    !N.length && /* @__PURE__ */ n.jsx("p", { className: "tv-empty", children: "Paste a link above to start your shortlist." }),
    !!N.length && !E.length && /* @__PURE__ */ n.jsx("p", { className: "tv-empty", children: "Nothing matches these filters." }),
    /* @__PURE__ */ n.jsx("div", { className: "tv-grid", children: E.map((g) => {
      const A = Mt(g.price) / Mt(g.sqm);
      return /* @__PURE__ */ n.jsxs("section", { className: `tv-card${g.fav ? " fav" : ""}`, children: [
        /* @__PURE__ */ n.jsxs("a", { className: "tv-thumb", href: g.url, target: "_blank", rel: "noopener noreferrer", title: "Open the listing", children: [
          g.image ? /* @__PURE__ */ n.jsx("img", { src: g.image, alt: "", referrerPolicy: "no-referrer", loading: "lazy", onError: (O) => {
            O.currentTarget.style.display = "none";
          } }) : null,
          /* @__PURE__ */ n.jsx("span", { className: "tv-site", children: Su(g.url) })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "tv-body", children: [
          /* @__PURE__ */ n.jsxs("div", { className: "tv-top", children: [
            /* @__PURE__ */ n.jsx("input", { className: "tv-title", value: g.title, onChange: (O) => T(g.id, { title: O.target.value }) }),
            /* @__PURE__ */ n.jsx("button", { className: "tv-star", title: g.fav ? "Unstar" : "Star", onClick: () => T(g.id, { fav: !g.fav }), children: g.fav ? "★" : "☆" }),
            /* @__PURE__ */ n.jsx("button", { className: "tv-x", title: "Remove", onClick: () => {
              confirm(`Remove “${g.title}”?`) && t((O) => (O.places = O.places.filter((z) => z.id !== g.id), O));
            }, children: "×" })
          ] }),
          /* @__PURE__ */ n.jsxs("div", { className: "tv-fields", children: [
            /* @__PURE__ */ n.jsxs("label", { children: [
              "City ",
              /* @__PURE__ */ n.jsx("input", { value: g.city, list: "tv-cities", onChange: (O) => T(g.id, { city: O.target.value }) })
            ] }),
            /* @__PURE__ */ n.jsxs("label", { children: [
              "Price ",
              /* @__PURE__ */ n.jsxs("span", { className: "tv-price", children: [
                /* @__PURE__ */ n.jsx("input", { className: "tv-cur", value: g.currency, onChange: (O) => T(g.id, { currency: O.target.value }) }),
                /* @__PURE__ */ n.jsx("input", { value: g.price, inputMode: "decimal", onChange: (O) => T(g.id, { price: O.target.value }) }),
                /* @__PURE__ */ n.jsx("select", { value: g.per, onChange: (O) => T(g.id, { per: O.target.value }), children: kh.map((O) => /* @__PURE__ */ n.jsxs("option", { value: O, children: [
                  "/ ",
                  O
                ] }, O)) })
              ] })
            ] }),
            /* @__PURE__ */ n.jsxs("label", { children: [
              "m² ",
              /* @__PURE__ */ n.jsx("input", { value: g.sqm, inputMode: "decimal", onChange: (O) => T(g.id, { sqm: O.target.value }) })
            ] }),
            Number.isFinite(A) && /* @__PURE__ */ n.jsxs("span", { className: "tv-ppm", children: [
              g.currency,
              A.toFixed(A < 10 ? 1 : 0),
              " / m²"
            ] })
          ] }),
          /* @__PURE__ */ n.jsxs("div", { className: "tv-avail", children: [
            /* @__PURE__ */ n.jsx("span", { children: "📅" }),
            /* @__PURE__ */ n.jsxs("select", { value: g.avail || "any", onChange: (O) => {
              var z;
              return T(g.id, O.target.value === "dates" ? { avail: "dates", ranges: (z = g.ranges) != null && z.length ? g.ranges : [{ from: "", to: "" }] } : { avail: "any" });
            }, children: [
              /* @__PURE__ */ n.jsx("option", { value: "any", children: "Any time" }),
              /* @__PURE__ */ n.jsx("option", { value: "dates", children: "Only these dates" })
            ] }),
            g.avail === "dates" && /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
              (g.ranges || []).map((O, z) => /* @__PURE__ */ n.jsxs("span", { className: "tv-range", children: [
                /* @__PURE__ */ n.jsx("input", { type: "date", value: O.from, onChange: (k) => T(g.id, { ranges: (g.ranges || []).map((R, M) => M === z ? { ...R, from: k.target.value } : R) }) }),
                "–",
                /* @__PURE__ */ n.jsx("input", { type: "date", value: O.to, min: O.from || void 0, onChange: (k) => T(g.id, { ranges: (g.ranges || []).map((R, M) => M === z ? { ...R, to: k.target.value } : R) }) }),
                /* @__PURE__ */ n.jsx("button", { title: "Remove these dates", onClick: () => T(g.id, { ranges: (g.ranges || []).filter((k, R) => R !== z) }), children: "×" })
              ] }, z)),
              /* @__PURE__ */ n.jsx("button", { className: "tv-addrange", onClick: () => T(g.id, { ranges: [...g.ranges || [], { from: "", to: "" }] }), children: "＋ dates" })
            ] }),
            g.avail === "dates" && !!(g.ranges || []).some((O) => O.from || O.to) && /* @__PURE__ */ n.jsx("small", { className: "tv-avail-sum", children: (g.ranges || []).filter((O) => O.from || O.to).map((O) => `${Ah(O.from)} – ${Ah(O.to)}`).join(" · ") })
          ] }),
          /* @__PURE__ */ n.jsx("textarea", { value: g.notes, placeholder: "Notes: area, pros/cons, host replies…", onChange: (O) => T(g.id, { notes: O.target.value }) }),
          /* @__PURE__ */ n.jsxs("details", { className: "tv-more", children: [
            /* @__PURE__ */ n.jsx("summary", { children: "Link & picture" }),
            /* @__PURE__ */ n.jsxs("label", { children: [
              "Link ",
              /* @__PURE__ */ n.jsx("input", { value: g.url, onChange: (O) => T(g.id, { url: O.target.value }) })
            ] }),
            /* @__PURE__ */ n.jsxs("label", { children: [
              "Picture URL ",
              /* @__PURE__ */ n.jsx("input", { value: g.image, placeholder: "right-click the listing's photo → Copy image address", onChange: (O) => T(g.id, { image: O.target.value }) })
            ] })
          ] })
        ] })
      ] }, g.id);
    }) }),
    /* @__PURE__ */ n.jsx("datalist", { id: "tv-cities", children: _.map((g) => /* @__PURE__ */ n.jsx("option", { value: g }, g)) })
  ] }) : /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc", children: [
    /* @__PURE__ */ n.jsx("h2", { children: "✈️ Travel" }),
    /* @__PURE__ */ n.jsx("p", { children: l || "Loading…" })
  ] });
}
const Qr = ["cleaner", "chef", "assistant", "driver", "networking", "other"], Zr = { cleaner: "🧹", chef: "👨‍🍳", assistant: "🗂️", driver: "🚗", networking: "🤝", other: "✳️" }, Da = (e) => e.category === "other" ? e.other.trim() || "other" : e.category, Oi = (e) => e.charAt(0).toUpperCase() + e.slice(1), Oh = (e, t) => {
  const l = e.trim();
  if (!l) return "";
  if (/^https?:\/\//.test(l)) return l;
  const a = l.replace(/^@/, "");
  return t === "ig" ? `https://instagram.com/${a}` : `https://facebook.com/${a}`;
}, s0 = () => ({ id: "", name: "", category: "cleaner", other: "", city: "", phone: "", fb: "", ig: "", price: "", currency: "€", notes: "", added: "" });
function i0() {
  const { doc: e, update: t, status: l } = Nt("travelcontacts", { contacts: [] }), [a, s] = j.useState(""), [i, c] = j.useState(""), [u, r] = j.useState(""), [d, m] = j.useState("new"), [f, o] = j.useState(null), h = (e == null ? void 0 : e.contacts) || [], v = j.useMemo(() => [...new Set(h.map(Da))].sort(), [h]), x = j.useMemo(() => [...new Set(h.map((w) => w.city.trim()).filter(Boolean))].sort(), [h]), C = j.useMemo(() => {
    const w = a.toLowerCase().split(/\s+/).filter(Boolean), D = h.filter((N) => (!i || Da(N) === i) && (!u || N.city.trim() === u) && w.every((_) => `${N.name} ${Da(N)} ${N.city} ${N.notes} ${N.phone} ${N.ig} ${N.fb}`.toLowerCase().includes(_))), U = (N) => {
      const _ = parseFloat(N.price.replace(/[^0-9.]/g, ""));
      return Number.isFinite(_) ? _ : 1 / 0;
    };
    return D.sort((N, _) => d === "name" ? N.name.localeCompare(_.name) : d === "cat" ? Da(N).localeCompare(Da(_)) || N.name.localeCompare(_.name) : d === "price" ? U(N) - U(_) : (_.added || "").localeCompare(N.added || ""));
  }, [h, a, i, u, d]), p = (w) => {
    t((D) => {
      if (w.id) {
        const U = D.contacts.find((N) => N.id === w.id);
        U && Object.assign(U, w);
      } else D.contacts.unshift({ ...w, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), added: (/* @__PURE__ */ new Date()).toISOString() });
      return D;
    }), o(null);
  }, y = (w) => {
    confirm(`Remove ${w.name}?`) && t((D) => (D.contacts = D.contacts.filter((U) => U.id !== w.id), D));
  }, S = /* @__PURE__ */ n.jsx("span", { className: "lg-empty-value", children: "—" });
  return /* @__PURE__ */ n.jsxs("main", { className: "lg-wrap tc2", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "lg-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "lg-kicker", children: "TRAVEL" }),
        /* @__PURE__ */ n.jsx("h1", { children: "Travel Contacts" }),
        /* @__PURE__ */ n.jsx("p", { children: "Cleaners, chefs, assistants, drivers and people worth knowing wherever you're staying." })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "tc2-head-actions", children: [
        /* @__PURE__ */ n.jsx("button", { className: "ctl", type: "button", onClick: () => {
          var w;
          return (w = document.getElementById("tab-travel")) == null ? void 0 : w.click();
        }, children: "✈️ Travel" }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "button", onClick: () => o({ ...s0(), city: u, category: i && Qr.includes(i) ? i : "cleaner" }), children: "＋ Add contact" })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("section", { className: "lg-summary", "aria-label": "Contacts summary", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { children: "Contacts" }),
        /* @__PURE__ */ n.jsx("strong", { children: h.length })
      ] }),
      Qr.filter((w) => h.some((D) => D.category === w)).slice(0, 4).map((w) => /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsxs("span", { children: [
          Zr[w],
          " ",
          Oi(w),
          "s"
        ] }),
        /* @__PURE__ */ n.jsx("strong", { children: h.filter((D) => D.category === w).length })
      ] }, w))
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "lg-tools", children: [
      /* @__PURE__ */ n.jsxs("label", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "sr-only", children: "Search contacts" }),
        /* @__PURE__ */ n.jsx("input", { type: "search", placeholder: "Search contacts…", value: a, onChange: (w) => s(w.target.value), onKeyDown: (w) => w.stopPropagation() })
      ] }),
      /* @__PURE__ */ n.jsxs("select", { "aria-label": "Category", value: i, onChange: (w) => c(w.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "", children: "All categories" }),
        v.map((w) => /* @__PURE__ */ n.jsx("option", { value: w, children: Oi(w) }, w))
      ] }),
      /* @__PURE__ */ n.jsxs("select", { "aria-label": "City", value: u, onChange: (w) => r(w.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "", children: "All cities" }),
        x.map((w) => /* @__PURE__ */ n.jsx("option", { children: w }, w))
      ] }),
      /* @__PURE__ */ n.jsxs("select", { "aria-label": "Sort", value: d, onChange: (w) => m(w.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "new", children: "Newest first" }),
        /* @__PURE__ */ n.jsx("option", { value: "name", children: "Name A–Z" }),
        /* @__PURE__ */ n.jsx("option", { value: "cat", children: "By category" }),
        /* @__PURE__ */ n.jsx("option", { value: "price", children: "Cheapest per hour" })
      ] }),
      /* @__PURE__ */ n.jsx("span", { className: "bk-status", "aria-live": "polite", children: l === "Saving…" ? "" : l })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "lg-table-wrap", children: /* @__PURE__ */ n.jsxs("table", { className: "lg-table", children: [
      /* @__PURE__ */ n.jsx("thead", { children: /* @__PURE__ */ n.jsxs("tr", { children: [
        /* @__PURE__ */ n.jsx("th", { children: "Category" }),
        /* @__PURE__ */ n.jsx("th", { children: "Name" }),
        /* @__PURE__ */ n.jsx("th", { children: "City" }),
        /* @__PURE__ */ n.jsx("th", { children: "Phone" }),
        /* @__PURE__ */ n.jsx("th", { children: "Socials" }),
        /* @__PURE__ */ n.jsx("th", { children: "Price / hour" }),
        /* @__PURE__ */ n.jsx("th", { children: "Notes" }),
        /* @__PURE__ */ n.jsx("th", { children: /* @__PURE__ */ n.jsx("span", { className: "sr-only", children: "Actions" }) })
      ] }) }),
      /* @__PURE__ */ n.jsx("tbody", { children: e ? C.length ? C.map((w) => {
        const D = Oh(w.fb, "fb"), U = Oh(w.ig, "ig");
        return /* @__PURE__ */ n.jsxs("tr", { onDoubleClick: (N) => {
          N.target.closest("a, button") || o(w);
        }, children: [
          /* @__PURE__ */ n.jsx("td", { "data-label": "Category", children: /* @__PURE__ */ n.jsxs("span", { className: `tc2-cat tc2-cat-${w.category}`, children: [
            Zr[w.category] || "✳️",
            " ",
            Oi(Da(w))
          ] }) }),
          /* @__PURE__ */ n.jsx("td", { "data-label": "Name", children: /* @__PURE__ */ n.jsx("strong", { children: w.name }) }),
          /* @__PURE__ */ n.jsx("td", { "data-label": "City", children: w.city || S }),
          /* @__PURE__ */ n.jsx("td", { "data-label": "Phone", children: w.phone ? /* @__PURE__ */ n.jsx("a", { className: "lg-open", href: `tel:${w.phone.replace(/[^\d+]/g, "")}`, children: w.phone }) : S }),
          /* @__PURE__ */ n.jsx("td", { "data-label": "Socials", children: D || U ? /* @__PURE__ */ n.jsxs("span", { className: "tc2-socials", children: [
            D && /* @__PURE__ */ n.jsx("a", { className: "lg-open", href: D, target: "_blank", rel: "noopener noreferrer", children: "Facebook ↗" }),
            U && /* @__PURE__ */ n.jsx("a", { className: "lg-open", href: U, target: "_blank", rel: "noopener noreferrer", children: "Instagram ↗" })
          ] }) : S }),
          /* @__PURE__ */ n.jsx("td", { "data-label": "Price / hour", children: w.price ? `${w.currency}${w.price}` : S }),
          /* @__PURE__ */ n.jsx("td", { "data-label": "Notes", className: "tc2-notes", title: w.notes, children: w.notes || S }),
          /* @__PURE__ */ n.jsxs("td", { className: "lg-row-actions", children: [
            /* @__PURE__ */ n.jsx("button", { type: "button", "aria-label": `Edit ${w.name}`, onClick: () => o(w), children: "✎" }),
            /* @__PURE__ */ n.jsx("button", { type: "button", "aria-label": `Remove ${w.name}`, onClick: () => y(w), children: "×" })
          ] })
        ] }, w.id);
      }) : /* @__PURE__ */ n.jsx("tr", { children: /* @__PURE__ */ n.jsx("td", { colSpan: 8, className: "lg-no-results", children: h.length ? "Nobody matches this view." : "No contacts yet: ＋ Add contact." }) }) : /* @__PURE__ */ n.jsx("tr", { children: /* @__PURE__ */ n.jsx("td", { colSpan: 8, className: "lg-no-results", children: "Loading…" }) }) })
    ] }) }),
    /* @__PURE__ */ n.jsx("datalist", { id: "tc2-cities", children: x.map((w) => /* @__PURE__ */ n.jsx("option", { value: w }, w)) }),
    f && /* @__PURE__ */ n.jsx(c0, { contact: f, onClose: () => o(null), onSave: p })
  ] });
}
function c0({ contact: e, onClose: t, onSave: l }) {
  const [a, s] = j.useState(e), [i, c] = j.useState(""), u = (r) => (d) => s((m) => ({ ...m, [r]: d.target.value }));
  return /* @__PURE__ */ n.jsx("div", { className: "sm-dialog", onClick: (r) => {
    r.target === r.currentTarget && t();
  }, children: /* @__PURE__ */ n.jsxs("form", { className: "sm-dialog-card", onKeyDown: (r) => {
    r.stopPropagation(), r.key === "Escape" && t();
  }, onSubmit: (r) => {
    if (r.preventDefault(), !a.name.trim()) {
      c("Give them a name.");
      return;
    }
    l({ ...a, name: a.name.trim() });
  }, children: [
    /* @__PURE__ */ n.jsxs("div", { className: "sm-dialog-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "lg-kicker", children: "CONTACT" }),
        /* @__PURE__ */ n.jsx("h2", { children: e.id ? "Edit contact" : "Add contact" })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "sm-icon-btn", type: "button", "aria-label": "Close", onClick: t, children: "×" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "tc2-form", children: [
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Name",
        /* @__PURE__ */ n.jsx("input", { autoFocus: !0, value: a.name, onChange: u("name"), placeholder: "e.g. Ana" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Category",
        /* @__PURE__ */ n.jsx("select", { value: a.category, onChange: u("category"), children: Qr.map((r) => /* @__PURE__ */ n.jsxs("option", { value: r, children: [
          Zr[r],
          " ",
          Oi(r)
        ] }, r)) })
      ] }),
      a.category === "other" && /* @__PURE__ */ n.jsxs("label", { children: [
        "What do they do?",
        /* @__PURE__ */ n.jsx("input", { value: a.other, onChange: u("other"), placeholder: "e.g. barber, translator" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "City",
        /* @__PURE__ */ n.jsx("input", { value: a.city, onChange: u("city"), list: "tc2-cities", placeholder: "e.g. Belgrade" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Phone",
        /* @__PURE__ */ n.jsx("input", { value: a.phone, onChange: u("phone"), inputMode: "tel", placeholder: "+381 …" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Facebook",
        /* @__PURE__ */ n.jsx("input", { value: a.fb, onChange: u("fb"), placeholder: "profile link or name" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Instagram",
        /* @__PURE__ */ n.jsx("input", { value: a.ig, onChange: u("ig"), placeholder: "@handle" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { children: [
        "Price per hour",
        /* @__PURE__ */ n.jsxs("span", { className: "tc2-price", children: [
          /* @__PURE__ */ n.jsx("input", { value: a.currency, onChange: u("currency"), className: "tc2-cur" }),
          /* @__PURE__ */ n.jsx("input", { value: a.price, onChange: u("price"), inputMode: "decimal", placeholder: "e.g. 15" })
        ] })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { className: "tc2-wide", children: [
        "Notes",
        /* @__PURE__ */ n.jsx("textarea", { value: a.notes, onChange: u("notes"), rows: 3, placeholder: "Availability, languages, who recommended them…" })
      ] })
    ] }),
    /* @__PURE__ */ n.jsx("p", { className: "sm-form-error", role: "alert", children: i }),
    /* @__PURE__ */ n.jsxs("div", { className: "sm-dialog-actions", children: [
      /* @__PURE__ */ n.jsx("button", { className: "ctl", type: "button", onClick: t, children: "Cancel" }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "submit", children: "Save contact" })
    ] })
  ] }) });
}
const zi = [
  ["identity", "Professional identity", "Who you are when you sell"],
  ["efficacy", "Self-efficacy", "Evidence that you can do it"],
  ["standards", "Standards & discipline", "What you do when nobody checks"],
  ["emotion", "Emotional regulation", "Staying steady under pressure"],
  ["mastery", "Sales mastery", "The craft itself"],
  ["beliefs", "Limiting beliefs & resistance", "What gets in your own way"]
], wu = Object.fromEntries(zi.map(([e, t]) => [e, t])), zh = {
  identity: ["The closer I am becoming would never…", "As {t}, I walk into every call…", "Prospects trust me when I…", "The way I want a client to describe me after a call is…", "Being {t} means I…", "What separates me from an average closer is…"],
  efficacy: ["A call I handled well recently showed me that I…", "When a call gets hard, I can count on myself to…", "I know I can close because…", "Something I can do on calls now that I couldn’t a year ago is…", "The skill I’ve proven to myself this month is…", "When I trust my preparation, I…"],
  standards: ["My non-negotiable before every call is…", "If I held myself to the standard of {t} this week, I would…", "The habit that costs me the most deals is…", "When nobody is checking my numbers, I…", "Doing the work properly today looks like…", "The corner I am tempted to cut is…"],
  emotion: ["When a prospect pushes back on price, I feel… and I can…", "After a no, the first thing I do is…", "When I notice tension on a call, I…", "When a call goes off-script, I steady myself by…", "The emotion that shows up before a big call is…", "If I stay calm in silence after the price, I…"],
  mastery: ["The part of my calls I most want to sharpen is…", "A question I could ask more often is…", "When I really listen, I notice…", "A great close sounds like…", "The objection I handle best is… because…", "If I slowed my discovery down, I would…"],
  beliefs: ["The story I tell myself after a lost deal is…", "Part of me hesitates to ask for the money because…", "If I stopped needing every prospect to like me…", "Something I avoid on calls is… because…", "I sometimes doubt I am {t} because…", "The excuse I reach for most often is…"]
}, Cu = ["$10K/month closer", "$20K/month closer", "$50K/month closer"], Mn = 6, Tu = 10, py = 5, ni = () => {
  const e = /* @__PURE__ */ new Date();
  return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}, Jr = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7), Fr = (e, t) => e.replace(/\{t\}/g, `a ${t}`), Eu = (e) => (/* @__PURE__ */ new Date(`${e}T12:00:00`)).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
function u0(e) {
  const t = new Set(e.sessions.slice(0, 3).flatMap((r) => r.stems.map((d) => d.text))), l = Math.floor(Date.now() / 864e5), a = zi[l % zi.length][0], s = zi.map((r) => r[0]).filter((r) => r !== a), i = e.suggestions.filter((r) => !r.used), c = [];
  return { stems: s.slice(0, py).map((r, d) => {
    const m = i.find((h) => h.category === r && !c.includes(h.id));
    if (m)
      return c.push(m.id), { id: Jr(), category: r, text: m.text, endings: [], suggested: !0, reason: m.reason };
    const f = zh[r].filter((h) => !t.has(h)), o = f.length ? f : zh[r];
    return { id: Jr(), category: r, text: o[(l + d) % o.length], endings: [] };
  }), used: c };
}
const Le = { top: 230, line: 70, left: 90, right: 930, h: 1500, ink: "#2b3a9e" }, Gn = { hand: '"Bradley Hand", "Noteworthy", "Segoe Print", "Comic Sans MS", cursive', sans: '"Avenir Next", "Helvetica Neue", Arial, sans-serif' }, Mh = () => {
  try {
    const e = localStorage.getItem("notebookFont");
    return e === "sans" || e === "hand" ? e : "mix";
  } catch {
    return "mix";
  }
}, _h = Math.floor((Le.h - Le.top - 110) / Le.line);
let rd = { stem: "", gap: "", end: "" };
const r0 = (e) => {
  const t = e === "hand" ? `bold 48px ${Gn.hand}` : `600 42px ${Gn.sans}`, l = e === "sans" ? `40px ${Gn.sans}` : `46px ${Gn.hand}`;
  rd = { stem: t, gap: l, end: l };
};
function si(e, t, l, a = 0, s = !1) {
  e.font = rd[l];
  const i = Le.right - Le.left - a, c = [];
  let u = "", r = !0;
  for (const d of t.split(/\s+/).filter(Boolean)) {
    const m = u ? u + " " + d : d;
    e.measureText(m).width <= i || !u ? u = m : (c.push({ text: u, kind: l, bullet: s && r, indent: a }), r = !1, u = d);
  }
  return c.push({ text: u, kind: l, bullet: s && r, indent: a }), c;
}
function o0(e, t) {
  const l = e.stems.filter((a) => a.endings.some((s) => s.trim())).map((a) => [
    ...si(t, Fr(a.text, e.target), "stem"),
    { text: "", kind: "gap" },
    ...a.endings.filter((s) => s.trim()).flatMap((s) => si(t, s.trim(), "end", 50, !0))
  ]);
  return e.commitment.trim() && l.push([...si(t, "On my next call, I will…", "stem"), { text: "", kind: "gap" }, ...si(t, e.commitment.trim(), "end", 50, !0)]), l;
}
function d0(e, t) {
  r0(t);
  const l = window.jtDrawPage;
  if (!l) return [];
  const a = document.createElement("canvas").getContext("2d"), s = o0(e, a).flatMap((i) => {
    const c = [];
    for (let u = 0; u < i.length; u += _h) c.push(i.slice(u, u + _h));
    return c;
  });
  return s.map((i, c) => {
    const u = l([], e.date, c + 1, s.length), r = u.getContext("2d");
    if (t !== "hand") {
      r.fillStyle = "#fbfaf6", r.fillRect(60, 92, 840, 128);
      const d = /* @__PURE__ */ new Date(`${e.date}T12:00:00`), m = `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${s.length > 1 ? `  (${c + 1}/${s.length})` : ""}`;
      r.fillStyle = Le.ink, r.strokeStyle = Le.ink, r.font = `600 48px ${Gn.sans}`, r.fillText(m, Le.left, Le.top - 70), r.lineWidth = 2.5, r.beginPath(), r.moveTo(Le.left - 6, Le.top - 52), r.lineTo(Le.left + r.measureText(m).width + 30, Le.top - 52), r.stroke();
    }
    return i.forEach((d, m) => {
      if (d.kind === "gap") return;
      const f = Le.top + Le.line * (m + 1) - 14;
      r.font = rd[d.kind], r.fillStyle = d.kind === "stem" ? "#1f2937" : Le.ink, d.bullet && (r.beginPath(), r.arc(Le.left + 14, f - 14, 5.5, 0, Math.PI * 2), r.fill()), r.fillText(d.text, Le.left + (d.indent || 0), f);
    }), u.toDataURL("image/png");
  });
}
function f0({ session: e }) {
  const [t, l] = j.useState(Mh);
  j.useEffect(() => {
    const c = () => l(Mh());
    return window.addEventListener("callstudio:notebook-font", c), window.addEventListener("storage", c), () => {
      window.removeEventListener("callstudio:notebook-font", c), window.removeEventListener("storage", c);
    };
  }, []);
  const a = j.useMemo(() => d0(e, t), [e, t]), [s, i] = j.useState(null);
  return j.useEffect(() => {
    if (s === null) return;
    const c = (u) => {
      if (u.key === "Escape") i(null);
      else if (u.key === "ArrowRight") i((r) => r === null ? r : (r + 1) % a.length);
      else if (u.key === "ArrowLeft") i((r) => r === null ? r : (r - 1 + a.length) % a.length);
      else return;
      u.preventDefault(), u.stopPropagation();
    };
    return document.addEventListener("keydown", c, !0), () => document.removeEventListener("keydown", c, !0);
  }, [s, a.length]), a.length ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsx("div", { className: "il-pages", children: a.map((c, u) => /* @__PURE__ */ n.jsx("button", { className: "il-sheet", title: "Click to open the gallery", onClick: () => i(u), children: /* @__PURE__ */ n.jsx("img", { src: c, alt: `Page ${u + 1} of ${a.length}` }) }, u)) }),
    s !== null && rm.createPortal(/* @__PURE__ */ n.jsxs("div", { className: "il-gallery", onClick: (c) => {
      c.target === c.currentTarget && i(null);
    }, children: [
      /* @__PURE__ */ n.jsx("button", { className: "il-g-nav prev", "aria-label": "Previous page", onClick: () => i((s - 1 + a.length) % a.length), children: "‹" }),
      /* @__PURE__ */ n.jsx("img", { src: a[s], alt: `Page ${s + 1} of ${a.length}` }),
      /* @__PURE__ */ n.jsx("button", { className: "il-g-nav next", "aria-label": "Next page", onClick: () => i((s + 1) % a.length), children: "›" }),
      /* @__PURE__ */ n.jsxs("div", { className: "il-g-bar", children: [
        /* @__PURE__ */ n.jsxs("span", { children: [
          s + 1,
          " / ",
          a.length
        ] }),
        /* @__PURE__ */ n.jsx("span", { children: "← → to flip · Esc to close" }),
        /* @__PURE__ */ n.jsx("button", { onClick: () => i(null), children: "✕ Close" })
      ] })
    ] }), document.body)
  ] }) : /* @__PURE__ */ n.jsx("p", { className: "il-hint", children: "The notebook pages need the Journal's page painter, which hasn't loaded." });
}
function h0() {
  const { doc: e, update: t, status: l, reload: a } = Nt("identitylab", { target: Cu[1], sessions: [], suggestions: [] }), [s, i] = j.useState(null), [c, u] = j.useState(0), [r, d] = j.useState(null), [m, f] = j.useState(!1), [o, h] = j.useState(() => {
    try {
      return localStorage.getItem("identityLabView") === "book";
    } catch {
      return !1;
    }
  }), v = (g) => {
    h(g);
    try {
      localStorage.setItem("identityLabView", g ? "book" : "list");
    } catch {
    }
  }, x = j.useRef([]), C = j.useRef(null), p = (e == null ? void 0 : e.sessions) || [], y = p.find((g) => g.date === ni()), S = p.find((g) => g.id === s) || null, w = j.useMemo(() => p.find((g) => g.done && g.commitment.trim() && !g.practised && g.date !== ni()), [p]);
  if (j.useEffect(() => {
    var g;
    C.current != null && ((g = x.current[C.current]) == null || g.focus(), C.current = null);
  }), j.useEffect(() => {
    const g = () => {
      !document.hidden && !s && a();
    };
    return document.addEventListener("visibilitychange", g), window.addEventListener("focus", g), () => {
      document.removeEventListener("visibilitychange", g), window.removeEventListener("focus", g);
    };
  }, [a, s]), !e) return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc il-page", children: [
    /* @__PURE__ */ n.jsx("h2", { children: "🧠 Identity Lab" }),
    /* @__PURE__ */ n.jsx("p", { children: l || "Loading…" })
  ] });
  const D = () => (/* @__PURE__ */ new Date()).toISOString(), U = (g) => t((A) => {
    const O = A.sessions.find((z) => z.id === s);
    return O && (g(O), O.updatedAt = D()), A;
  }), N = (g, A) => t((O) => {
    const z = O.sessions.find((k) => k.id === g);
    return z && (A(z), z.updatedAt = D()), O;
  }), _ = (g) => t((A) => (A.target = g, A.targetAt = D(), A)), E = () => {
    if (y) {
      i(y.id), u(y.done ? y.stems.length : 0);
      return;
    }
    const { stems: g, used: A } = u0(e), O = { id: Jr(), date: ni(), target: e.target, stems: g, commitment: "", practised: "", createdAt: D(), updatedAt: D() };
    t((z) => (z.sessions.unshift(O), z.suggestions.forEach((k) => {
      A.includes(k.id) && (k.used = !0);
    }), z)), i(O.id), u(0), C.current = 0;
  }, T = (g) => {
    u(g), C.current = 0;
  };
  if (S) {
    const g = S.stems[c];
    if (!g)
      return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc il-page il-focus", children: [
        /* @__PURE__ */ n.jsxs("div", { className: "il-top", children: [
          /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => T(S.stems.length - 1), children: "← Back" }),
          /* @__PURE__ */ n.jsxs("span", { className: "il-progress", children: [
            S.stems.map((R, M) => /* @__PURE__ */ n.jsx("i", { className: R.endings.filter(Boolean).length >= Mn ? "full" : R.endings.some(Boolean) ? "some" : "", onClick: () => T(M) }, R.id)),
            /* @__PURE__ */ n.jsx("i", { className: "now" })
          ] }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => i(null), children: "Close" })
        ] }),
        /* @__PURE__ */ n.jsxs("h2", { className: "il-stem", children: [
          /* @__PURE__ */ n.jsx("span", { className: "il-stem-cat", children: "Action commitment" }),
          /* @__PURE__ */ n.jsx("span", { className: "il-dash", children: "—" }),
          /* @__PURE__ */ n.jsx("span", { className: "il-stem-text", children: "On my next sales call, I will…" })
        ] }),
        /* @__PURE__ */ n.jsx("p", { className: "il-hint", children: "One concrete, observable behaviour. Not “be confident”, but e.g. “stay silent for five seconds after I give the price”." }),
        /* @__PURE__ */ n.jsx(
          "textarea",
          {
            className: "il-commit",
            autoFocus: !0,
            rows: 3,
            value: S.commitment,
            placeholder: "e.g. ask two more follow-up questions before I present the offer",
            onChange: (R) => U((M) => {
              M.commitment = R.target.value;
            }),
            onKeyDown: (R) => {
              R.stopPropagation(), R.key === "Enter" && (R.metaKey || R.ctrlKey) && (R.preventDefault(), U((M) => {
                M.done = !0;
              }), i(null));
            }
          }
        ),
        /* @__PURE__ */ n.jsxs("div", { className: "il-actions", children: [
          /* @__PURE__ */ n.jsx("span", { className: "il-keys", children: "⌘↵ finish" }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl biz-primary", onClick: () => {
            U((R) => {
              R.done = !0;
            }), i(null);
          }, children: "Finish session" })
        ] })
      ] });
    const A = g.endings.length ? g.endings : [""], O = g.endings.filter((R) => R.trim()).length, z = (R, M) => U((Y) => {
      const K = Y.stems[c], he = K.endings.length ? K.endings : [""];
      he[R] = M, K.endings = he;
    }), k = (R) => (M) => {
      var K, he, ge;
      M.stopPropagation();
      const Y = M.currentTarget.value;
      if (M.key === "Enter" && (M.metaKey || M.ctrlKey)) {
        M.preventDefault(), T(c + 1);
        return;
      }
      if (M.key === "Enter") {
        if (M.preventDefault(), !Y.trim() && O >= Mn) {
          T(c + 1);
          return;
        }
        R === A.length - 1 && A.length < Tu && Y.trim() && U((I) => {
          I.stems[c].endings = [...A, ""];
        }), C.current = Math.min(R + 1, Tu - 1), R < A.length - 1 && ((K = x.current[R + 1]) == null || K.focus());
      } else M.key === "Backspace" && !Y && R > 0 ? (M.preventDefault(), U((I) => {
        I.stems[c].endings = A.filter((Ne, F) => F !== R);
      }), C.current = R - 1) : M.key === "ArrowDown" && R < A.length - 1 ? (M.preventDefault(), (he = x.current[R + 1]) == null || he.focus()) : M.key === "ArrowUp" && R > 0 && (M.preventDefault(), (ge = x.current[R - 1]) == null || ge.focus());
    };
    return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc il-page il-focus", children: [
      /* @__PURE__ */ n.jsxs("div", { className: "il-top", children: [
        /* @__PURE__ */ n.jsx("button", { className: "ctl", disabled: c === 0, onClick: () => T(c - 1), children: "← Back" }),
        /* @__PURE__ */ n.jsxs("span", { className: "il-progress", children: [
          S.stems.map((R, M) => /* @__PURE__ */ n.jsx("i", { title: wu[R.category], className: `${M === c ? "now " : ""}${R.endings.filter(Boolean).length >= Mn ? "full" : R.endings.some(Boolean) ? "some" : ""}`, onClick: () => T(M) }, R.id)),
          /* @__PURE__ */ n.jsx("i", { title: "Action commitment", onClick: () => T(S.stems.length) })
        ] }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => i(null), children: "Close" })
      ] }),
      /* @__PURE__ */ n.jsxs("h2", { className: "il-stem", children: [
        /* @__PURE__ */ n.jsx("span", { className: "il-stem-cat", children: wu[g.category] }),
        /* @__PURE__ */ n.jsx("span", { className: "il-dash", children: "—" }),
        /* @__PURE__ */ n.jsx("span", { className: "il-stem-text", children: Fr(g.text, S.target) }),
        g.suggested && /* @__PURE__ */ n.jsx("span", { className: "il-from", title: g.reason || "", children: "from your calls" })
      ] }),
      /* @__PURE__ */ n.jsx("ol", { className: "il-endings", children: A.map((R, M) => /* @__PURE__ */ n.jsx("li", { children: /* @__PURE__ */ n.jsx(
        "input",
        {
          ref: (Y) => {
            x.current[M] = Y;
          },
          value: R,
          autoFocus: M === 0 && !R,
          placeholder: M === 0 ? "First thing that comes to mind…" : "",
          onChange: (Y) => z(M, Y.target.value),
          onKeyDown: k(M)
        }
      ) }, M)) }),
      /* @__PURE__ */ n.jsxs("div", { className: "il-actions", children: [
        /* @__PURE__ */ n.jsxs("span", { className: `il-count ${O >= Mn ? "ok" : ""}`, children: [
          O,
          " / ",
          Mn,
          "–",
          Tu,
          " endings"
        ] }),
        /* @__PURE__ */ n.jsx("span", { className: "il-keys", children: "↵ next ending · ⌘↵ next stem" }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl biz-primary", onClick: () => T(c + 1), children: c === S.stems.length - 1 ? "Commitment →" : "Next stem →" })
      ] }),
      /* @__PURE__ */ n.jsx("p", { className: "il-hint", children: "Write fast and don’t edit. Some endings will be obvious, some surprising: the surprising ones are worth a second look." })
    ] });
  }
  const b = (() => {
    let g = 0;
    const A = /* @__PURE__ */ new Date();
    for (; ; ) {
      const O = `${A.getFullYear()}-${String(A.getMonth() + 1).padStart(2, "0")}-${String(A.getDate()).padStart(2, "0")}`;
      if (p.some((z) => z.date === O && z.done))
        g++, A.setDate(A.getDate() - 1);
      else if (g === 0 && O === ni()) A.setDate(A.getDate() - 1);
      else return g;
    }
  })();
  return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc il-page", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "il-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("h2", { children: "🧠 Identity Lab" }),
        /* @__PURE__ */ n.jsx("p", { className: "il-sub", children: "Sentence completion for closers: a few minutes of fast, honest writing, then one behaviour to practise on your next call." })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "il-stats", children: [
        /* @__PURE__ */ n.jsxs("span", { children: [
          /* @__PURE__ */ n.jsx("b", { children: p.filter((g) => g.done).length }),
          " sessions"
        ] }),
        /* @__PURE__ */ n.jsxs("span", { children: [
          /* @__PURE__ */ n.jsx("b", { children: b }),
          " day streak"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "il-target", children: [
      /* @__PURE__ */ n.jsx("span", { children: "Identity target" }),
      Cu.map((g) => /* @__PURE__ */ n.jsx("button", { className: e.target === g && !m ? "on" : "", onClick: () => {
        f(!1), _(g);
      }, children: g.replace(" closer", "") }, g)),
      m || !Cu.includes(e.target) ? /* @__PURE__ */ n.jsx("input", { autoFocus: m, value: e.target, placeholder: "e.g. top closer on my team", onChange: (g) => _(g.target.value), onKeyDown: (g) => g.stopPropagation() }) : /* @__PURE__ */ n.jsx("button", { onClick: () => f(!0), children: "Custom…" })
    ] }),
    w && /* @__PURE__ */ n.jsxs("section", { className: "il-review", children: [
      /* @__PURE__ */ n.jsxs("p", { className: "il-cat", children: [
        "Last commitment · ",
        Eu(w.date)
      ] }),
      /* @__PURE__ */ n.jsxs("p", { className: "il-commit-text", children: [
        "“",
        w.commitment,
        "”"
      ] }),
      /* @__PURE__ */ n.jsx("p", { children: "Did you practise it on a call?" }),
      /* @__PURE__ */ n.jsx("div", { className: "il-choices", children: ["yes", "partly", "no"].map((g) => /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => N(w.id, (A) => {
        A.practised = g;
      }), children: g === "yes" ? "✅ Yes" : g === "partly" ? "◐ Partly" : "✕ Not yet" }, g)) })
    ] }),
    /* @__PURE__ */ n.jsx("section", { className: "il-start", children: y != null && y.done ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
      /* @__PURE__ */ n.jsxs("p", { children: [
        "✅ Today’s session is done. Commitment: ",
        /* @__PURE__ */ n.jsx("b", { children: y.commitment || "—" })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: E, children: "Review / edit today" })
    ] }) : /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
      /* @__PURE__ */ n.jsx("p", { children: y ? "You started today’s session." : `${py} stems · about 10 minutes · as a ${e.target}` }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl biz-primary il-go", onClick: E, children: y ? "Continue today’s session →" : "Start today’s session →" })
    ] }) }),
    /* @__PURE__ */ n.jsxs("div", { className: "il-h3row", children: [
      /* @__PURE__ */ n.jsx("h3", { className: "il-h3", children: "Previous sessions" }),
      /* @__PURE__ */ n.jsxs("div", { className: "rl-view il-viewswitch", role: "group", "aria-label": "Show sessions as", children: [
        /* @__PURE__ */ n.jsx("button", { type: "button", className: o ? "" : "on", onClick: () => v(!1), children: "List" }),
        /* @__PURE__ */ n.jsx("button", { type: "button", className: o ? "on" : "", onClick: () => v(!0), children: "📓 Notebook" })
      ] })
    ] }),
    !p.length && /* @__PURE__ */ n.jsx("p", { className: "il-hint", children: "Nothing yet. Your sessions will show up here." }),
    o ? /* @__PURE__ */ n.jsx("div", { className: "il-book", children: p.map((g) => /* @__PURE__ */ n.jsxs("section", { className: "il-book-day", children: [
      /* @__PURE__ */ n.jsxs("h4", { children: [
        (/* @__PURE__ */ new Date(`${g.date}T12:00:00`)).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        " ",
        /* @__PURE__ */ n.jsxs("span", { children: [
          g.target,
          g.practised ? ` · ${g.practised === "yes" ? "practised" : g.practised === "partly" ? "partly practised" : "not practised yet"}` : ""
        ] })
      ] }),
      /* @__PURE__ */ n.jsx(f0, { session: g })
    ] }, g.id)) }) : /* @__PURE__ */ n.jsx("div", { className: "il-history", children: p.map((g) => {
      const A = g.stems.reduce((O, z) => O + z.endings.filter(Boolean).length, 0);
      return /* @__PURE__ */ n.jsxs("div", { className: "il-past", children: [
        /* @__PURE__ */ n.jsxs("button", { className: "il-past-head", onClick: () => d((O) => O === g.id ? null : g.id), children: [
          /* @__PURE__ */ n.jsx("b", { children: Eu(g.date) }),
          /* @__PURE__ */ n.jsx("span", { children: g.target }),
          /* @__PURE__ */ n.jsxs("span", { children: [
            A,
            " endings"
          ] }),
          g.commitment && /* @__PURE__ */ n.jsxs("span", { className: "il-past-commit", children: [
            "→ ",
            g.commitment
          ] }),
          g.practised && /* @__PURE__ */ n.jsx("span", { className: `il-badge ${g.practised}`, children: g.practised === "yes" ? "practised" : g.practised === "partly" ? "partly" : "not yet" }),
          !g.done && /* @__PURE__ */ n.jsx("span", { className: "il-badge", children: "unfinished" })
        ] }),
        r === g.id && /* @__PURE__ */ n.jsxs("div", { className: "il-past-body", children: [
          g.stems.map((O) => /* @__PURE__ */ n.jsxs("div", { children: [
            /* @__PURE__ */ n.jsxs("p", { className: "il-stem il-past-stem", children: [
              /* @__PURE__ */ n.jsx("span", { className: "il-stem-cat", children: wu[O.category] }),
              /* @__PURE__ */ n.jsx("span", { className: "il-dash", children: "—" }),
              /* @__PURE__ */ n.jsx("span", { className: "il-stem-text", children: Fr(O.text, g.target) })
            ] }),
            /* @__PURE__ */ n.jsx("ul", { children: O.endings.filter(Boolean).map((z, k) => /* @__PURE__ */ n.jsx("li", { children: z }, k)) })
          ] }, O.id)),
          g.done && g.practised && /* @__PURE__ */ n.jsx(
            "textarea",
            {
              rows: 2,
              className: "il-reflect",
              placeholder: "What happened when you tried it? (optional)",
              value: g.reflection || "",
              onChange: (O) => N(g.id, (z) => {
                z.reflection = O.target.value;
              }),
              onKeyDown: (O) => O.stopPropagation()
            }
          ),
          /* @__PURE__ */ n.jsx("button", { className: "ctl il-del", onClick: () => {
            confirm(`Delete the session from ${Eu(g.date)}?`) && t((O) => (O.sessions = O.sessions.filter((z) => z.id !== g.id), O.deleted = [...O.deleted || [], g.id], O));
          }, children: "Delete session" })
        ] })
      ] }, g.id);
    }) }),
    /* @__PURE__ */ n.jsx("p", { className: "il-note", children: "A reflection practice: it helps you notice how you think about selling. The change comes from acting on it, call by call." }),
    l && l !== "Saving…" && /* @__PURE__ */ n.jsxs("p", { className: "il-hint", children: [
      "⚠️ ",
      l
    ] })
  ] });
}
const Du = [["todo", "To do"], ["doing", "Doing"], ["waiting", "Waiting on someone"], ["done", "Done"]], m0 = [
  { title: "Delegation brief (use for every handover)", owner: "Me", steps: `What exactly needs doing (one sentence)
Why it matters / what it unlocks
What "done" looks like (link an example)
Deadline
Who approves it, and how (Loom / message / call)
Where the files and logins live
What they can decide without asking me` },
  { title: "New client onboarding", owner: "Me", steps: `Agreement signed and saved
First payment received (add it in Clients)
Create the client folder in Drive
Add the client to the Clients tab with goal and timezone
Send the welcome message and booking link
Schedule the kickoff call and first check-in
Add them to the community / resources` },
  { title: "Weekly content batch", owner: "Me", steps: `Pick 5 ideas from Content ideas
Write hooks and scripts
Record in one sitting
Hand clips to the editor with the brief
Approve edits
Schedule posts
Log results next week` },
  { title: "After every sales call", owner: "Me", steps: `Tick the call and set its colour
Download the recording
Write the quick note while it is fresh
Send the follow-up message
Schedule the follow-up reminder
Update the Clients tab if they signed` }
], _n = () => Math.random().toString(36).slice(2, 11), ea = () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA"), Rt = (e) => e.stopPropagation(), yy = (e) => e.split(`
`).filter((t) => t.trim()).map((t) => "☐ " + t.trim()).join(`
`);
function g0() {
  const { doc: e, update: t, status: l } = Nt("delegation", { tasks: [], sops: [], people: [] }), [a, s] = j.useState(""), [i, c] = j.useState(null), [u, r] = j.useState(null), [d, m] = j.useState({ title: "", assignee: "Me", due: "", priority: "normal" }), [f, o] = j.useState({ name: "", role: "" }), [h, v] = j.useState("");
  if (!e) return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc", children: [
    /* @__PURE__ */ n.jsx("h2", { children: "🧭 Delegation" }),
    /* @__PURE__ */ n.jsx("p", { className: "biz-dim", children: l || "Loading…" })
  ] });
  const x = ["Me", ...e.people.map((b) => b.name)], C = (b) => !!b.due && b.status !== "done" && b.due < ea(), p = e.tasks.filter((b) => b.status !== "done"), y = new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA"), S = e.tasks.filter((b) => !a || (b.assignee || "Me") === a), w = { high: 0, normal: 1 }, D = (b, g) => t((A) => {
    const O = A.tasks.find((z) => z.id === b);
    return O && Object.assign(O, g), A;
  }), U = (b, g) => t((A) => {
    const O = A.sops.find((z) => z.id === b);
    return O && Object.assign(O, g, { updated: ea() }), A;
  }), N = () => {
    d.title.trim() && (t((b) => (b.tasks.push({ id: _n(), ...d, title: d.title.trim(), status: "todo", notes: "", created: ea() }), b)), m((b) => ({ ...b, title: "", due: "" })));
  }, _ = (b, g) => {
    const A = Du[Du.findIndex((O) => O[0] === b.status) + g][0];
    D(b.id, { status: A, doneAt: A === "done" ? ea() : "" });
  }, E = () => {
    f.name.trim() && (t((b) => (b.people.push({ id: _n(), name: f.name.trim(), role: f.role.trim() }), b)), o({ name: "", role: "" }));
  }, T = () => {
    if (!h.trim()) return;
    const b = { id: _n(), title: h.trim(), owner: "Me", steps: "", updated: ea() };
    t((g) => (g.sops.push(b), g)), r(b.id), v("");
  };
  return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc", children: [
    /* @__PURE__ */ n.jsxs("h2", { children: [
      "🧭 Delegation ",
      /* @__PURE__ */ n.jsx("span", { className: "bk-status", children: l })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "biz-cards", children: [
      /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
        /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Open tasks" }),
        /* @__PURE__ */ n.jsx("b", { children: p.length })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
        /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Overdue" }),
        /* @__PURE__ */ n.jsx("b", { className: p.filter(C).length ? "biz-out" : "", children: p.filter(C).length })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
        /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Waiting on others" }),
        /* @__PURE__ */ n.jsx("b", { children: e.tasks.filter((b) => b.status === "waiting").length })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
        /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Done this week" }),
        /* @__PURE__ */ n.jsx("b", { className: "biz-in", children: e.tasks.filter((b) => b.status === "done" && (b.doneAt || "") >= y).length })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "biz-form", children: [
      /* @__PURE__ */ n.jsx("input", { placeholder: "New task, e.g. Edit Tuesday's reel", style: { flex: 1, minWidth: 220 }, value: d.title, onChange: (b) => m((g) => ({ ...g, title: b.target.value })), onKeyDown: (b) => {
        Rt(b), b.key === "Enter" && N();
      } }),
      /* @__PURE__ */ n.jsx("select", { value: d.assignee, onChange: (b) => m((g) => ({ ...g, assignee: b.target.value })), children: x.map((b) => /* @__PURE__ */ n.jsx("option", { children: b }, b)) }),
      /* @__PURE__ */ n.jsx("input", { type: "date", value: d.due, onChange: (b) => m((g) => ({ ...g, due: b.target.value })), onKeyDown: Rt }),
      /* @__PURE__ */ n.jsxs("select", { value: d.priority, onChange: (b) => m((g) => ({ ...g, priority: b.target.value })), children: [
        /* @__PURE__ */ n.jsx("option", { value: "normal", children: "Normal" }),
        /* @__PURE__ */ n.jsx("option", { value: "high", children: "High priority" })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl biz-primary", onClick: N, children: "＋ Add task" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "biz-bar-top", children: [
      /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: "Show" }),
      /* @__PURE__ */ n.jsxs("select", { value: a, onChange: (b) => s(b.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "", children: "Everyone" }),
        x.map((b) => /* @__PURE__ */ n.jsx("option", { children: b }, b))
      ] })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "dg-board", children: Du.map(([b, g], A) => {
      const O = S.filter((z) => z.status === b).sort((z, k) => (w[z.priority] ?? 1) - (w[k.priority] ?? 1) || (z.due || "9999").localeCompare(k.due || "9999"));
      return /* @__PURE__ */ n.jsxs("div", { className: "dg-col", children: [
        /* @__PURE__ */ n.jsxs("div", { className: "dg-col-head", children: [
          g,
          " ",
          /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: O.length })
        ] }),
        O.length ? O.map((z) => /* @__PURE__ */ n.jsxs("div", { className: `dg-card${z.priority === "high" ? " high" : ""}`, children: [
          /* @__PURE__ */ n.jsx("div", { className: "dg-title", children: z.title }),
          /* @__PURE__ */ n.jsxs("div", { className: "dg-meta", children: [
            /* @__PURE__ */ n.jsx("span", { className: "biz-pill", children: z.assignee || "Me" }),
            z.due && /* @__PURE__ */ n.jsxs("span", { className: C(z) ? "biz-out" : "biz-dim", children: [
              C(z) ? "⚠ " : "",
              z.due
            ] }),
            z.priority === "high" && /* @__PURE__ */ n.jsx("span", { className: "biz-warn", children: "● high" }),
            z.sop && /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: "SOP" })
          ] }),
          /* @__PURE__ */ n.jsxs("div", { className: "dg-acts", children: [
            A > 0 && /* @__PURE__ */ n.jsx("button", { className: "ctl", title: "Move back", onClick: () => _(z, -1), children: "←" }),
            A < 3 && /* @__PURE__ */ n.jsx("button", { className: "ctl", title: "Move forward", onClick: () => _(z, 1), children: "→" }),
            /* @__PURE__ */ n.jsx("button", { className: "ctl", title: "Edit", onClick: () => c(i === z.id ? null : z.id), children: "✎" }),
            /* @__PURE__ */ n.jsx("button", { className: "ctl", title: "Delete", onClick: () => {
              confirm(`Delete "${z.title}"?`) && t((k) => (k.tasks = k.tasks.filter((R) => R.id !== z.id), k));
            }, children: "✕" })
          ] }),
          i === z.id ? /* @__PURE__ */ n.jsxs("div", { className: "dg-editor", children: [
            /* @__PURE__ */ n.jsx("input", { defaultValue: z.title, onBlur: (k) => k.target.value.trim() && D(z.id, { title: k.target.value.trim() }), onKeyDown: Rt }),
            /* @__PURE__ */ n.jsxs("div", { className: "cl-row2", children: [
              /* @__PURE__ */ n.jsx("select", { value: z.assignee || "Me", onChange: (k) => D(z.id, { assignee: k.target.value }), children: x.map((k) => /* @__PURE__ */ n.jsx("option", { children: k }, k)) }),
              /* @__PURE__ */ n.jsx("input", { type: "date", value: z.due, onChange: (k) => D(z.id, { due: k.target.value }), onKeyDown: Rt })
            ] }),
            /* @__PURE__ */ n.jsxs("select", { value: z.priority, onChange: (k) => D(z.id, { priority: k.target.value }), children: [
              /* @__PURE__ */ n.jsx("option", { value: "normal", children: "Normal" }),
              /* @__PURE__ */ n.jsx("option", { value: "high", children: "High priority" })
            ] }),
            /* @__PURE__ */ n.jsx("textarea", { rows: 3, placeholder: "Notes / brief / links", defaultValue: z.notes, onBlur: (k) => D(z.id, { notes: k.target.value }), onKeyDown: Rt })
          ] }) : z.notes && /* @__PURE__ */ n.jsx("div", { className: "dg-note", children: z.notes.slice(0, 140) })
        ] }, z.id)) : /* @__PURE__ */ n.jsx("div", { className: "biz-dim dg-empty", children: "Nothing here" })
      ] }, b);
    }) }),
    /* @__PURE__ */ n.jsxs("div", { className: "biz-two", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsxs("h3", { children: [
          "People ",
          /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: "who tasks can go to" })
        ] }),
        e.people.length ? e.people.map((b) => /* @__PURE__ */ n.jsxs("div", { className: "biz-sub", children: [
          /* @__PURE__ */ n.jsx("b", { children: b.name }),
          /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: b.role }),
          /* @__PURE__ */ n.jsx("span", { style: { flex: 1 } }),
          /* @__PURE__ */ n.jsxs("span", { className: "biz-dim", children: [
            e.tasks.filter((g) => g.assignee === b.name && g.status !== "done").length,
            " open"
          ] }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => {
            confirm(`Remove ${b.name}? Their tasks keep the name.`) && t((g) => (g.people = g.people.filter((A) => A.id !== b.id), g));
          }, children: "✕" })
        ] }, b.id)) : /* @__PURE__ */ n.jsx("p", { className: "biz-dim", children: "Add your VA, editor, setters or closers here." }),
        /* @__PURE__ */ n.jsxs("div", { className: "biz-form", children: [
          /* @__PURE__ */ n.jsx("input", { placeholder: "Name", style: { width: 140 }, value: f.name, onChange: (b) => o((g) => ({ ...g, name: b.target.value })), onKeyDown: (b) => {
            Rt(b), b.key === "Enter" && E();
          } }),
          /* @__PURE__ */ n.jsx("input", { placeholder: "Role (VA, editor…)", style: { flex: 1, minWidth: 120 }, value: f.role, onChange: (b) => o((g) => ({ ...g, role: b.target.value })), onKeyDown: (b) => {
            Rt(b), b.key === "Enter" && E();
          } }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: E, children: "＋ Add person" })
        ] })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsxs("h3", { children: [
          "SOP library ",
          /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: e.sops.length })
        ] }),
        e.sops.length ? e.sops.map((b) => /* @__PURE__ */ n.jsx(
          p0,
          {
            s: b,
            open: u === b.id,
            onToggle: () => r(u === b.id ? null : b.id),
            onSet: (g) => U(b.id, g),
            onTask: () => t((g) => (g.tasks.push({ id: _n(), title: b.title, assignee: "Me", due: "", priority: "normal", status: "todo", notes: yy(b.steps), sop: b.id, created: ea() }), g)),
            onDelete: () => {
              confirm(`Delete the SOP "${b.title}"?`) && (t((g) => (g.sops = g.sops.filter((A) => A.id !== b.id), g)), r(null));
            }
          },
          b.id
        )) : /* @__PURE__ */ n.jsx("p", { className: "biz-dim", children: "Write each repeatable job as steps once, then hand it over with one click." }),
        /* @__PURE__ */ n.jsxs("div", { className: "biz-form", children: [
          /* @__PURE__ */ n.jsx("input", { placeholder: "New SOP title", style: { flex: 1, minWidth: 160 }, value: h, onChange: (b) => v(b.target.value), onKeyDown: (b) => {
            Rt(b), b.key === "Enter" && T();
          } }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: T, children: "＋ Add SOP" }),
          !e.sops.length && /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => t((b) => (m0.forEach((g) => b.sops.push({ id: _n(), ...g, updated: ea() })), b)), children: "✨ Add 4 starter SOPs" })
        ] })
      ] })
    ] })
  ] });
}
function p0({ s: e, open: t, onToggle: l, onSet: a, onTask: s, onDelete: i }) {
  const [c, u] = j.useState("📋 Copy as checklist"), r = e.steps.split(`
`).map((d) => d.trim()).filter(Boolean);
  return /* @__PURE__ */ n.jsxs("div", { className: "dg-sop", children: [
    /* @__PURE__ */ n.jsxs("div", { className: "biz-sub dg-sop-head", children: [
      /* @__PURE__ */ n.jsx("b", { children: e.title }),
      /* @__PURE__ */ n.jsxs("span", { className: "biz-dim", children: [
        r.length,
        " steps · ",
        e.owner || ""
      ] }),
      /* @__PURE__ */ n.jsx("span", { style: { flex: 1 } }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl", title: "Create a task from this SOP", onClick: s, children: "→ Task" }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: l, children: t ? "Close" : "Open" })
    ] }),
    t && /* @__PURE__ */ n.jsxs("div", { className: "dg-editor", children: [
      /* @__PURE__ */ n.jsx("input", { defaultValue: e.title, onBlur: (d) => d.target.value.trim() && a({ title: d.target.value.trim() }), onKeyDown: Rt }),
      /* @__PURE__ */ n.jsx("input", { defaultValue: e.owner, placeholder: "Owner (who runs it)", onBlur: (d) => a({ owner: d.target.value }), onKeyDown: Rt }),
      /* @__PURE__ */ n.jsx("textarea", { rows: 9, placeholder: "One step per line", defaultValue: e.steps, onBlur: (d) => a({ steps: d.target.value }), onKeyDown: Rt }),
      /* @__PURE__ */ n.jsxs("div", { className: "dg-acts", children: [
        /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: async () => {
          try {
            await navigator.clipboard.writeText(e.title + `
` + yy(e.steps)), u("✓ Copied");
          } catch {
            u("⚠ Failed");
          }
        }, children: c }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl", style: { color: "#dc2626" }, onClick: i, children: "🗑 Delete" })
      ] })
    ] })
  ] });
}
const we = (e) => (e < 0 ? "-" : "") + "$" + Math.abs(Number(e) || 0).toLocaleString(void 0, { maximumFractionDigits: 2 }), ae = (e) => {
  const t = parseFloat(String(e ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(t) ? t : 0;
}, Ce = () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA"), oc = (e) => String(e || "").slice(0, 7), Ir = (e, t) => Math.round(((/* @__PURE__ */ new Date(t + "T12:00:00")).getTime() - (/* @__PURE__ */ new Date(e + "T12:00:00")).getTime()) / 864e5), Ht = () => Math.random().toString(36).slice(2, 11), vy = (e) => e.map((t) => t.map((l) => '"' + String(l ?? "").replace(/"/g, '""') + '"').join(",")).join(`
`);
function xy(e, t) {
  const l = document.createElement("a");
  l.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" })), l.download = e, document.body.appendChild(l), l.click(), l.remove();
}
const od = (e) => {
  var t;
  return (t = window.csToast) == null ? void 0 : t.call(window, e);
}, jy = ["Lead", "Call booked", "Follow up", "Signed", "Active", "Paused", "Completed", "Churned"], by = ["Unpaid", "Deposit paid", "Payment plan", "PAID", "Overdue", "Refunded"], Ny = {
  EST: ["America/New_York", "Eastern US"],
  EDT: ["America/New_York", "Eastern US"],
  ET: ["America/New_York", "Eastern US"],
  CST: ["America/Chicago", "Central US"],
  CDT: ["America/Chicago", "Central US"],
  CT: ["America/Chicago", "Central US"],
  MST: ["America/Denver", "Mountain US"],
  MDT: ["America/Denver", "Mountain US"],
  MT: ["America/Denver", "Mountain US"],
  PST: ["America/Los_Angeles", "Pacific US"],
  PDT: ["America/Los_Angeles", "Pacific US"],
  PT: ["America/Los_Angeles", "Pacific US"],
  AKST: ["America/Anchorage", "Alaska"],
  AKDT: ["America/Anchorage", "Alaska"],
  HST: ["Pacific/Honolulu", "Hawaii"],
  AST: ["America/Halifax", "Atlantic Canada"],
  ADT: ["America/Halifax", "Atlantic Canada"],
  NST: ["America/St_Johns", "Newfoundland"],
  NDT: ["America/St_Johns", "Newfoundland"],
  GMT: ["Europe/London", "UK / Ireland winter"],
  BST: ["Europe/London", "UK summer"],
  UK: ["Europe/London", "United Kingdom"],
  UTC: ["UTC", "Universal"],
  CET: ["Europe/Paris", "Central Europe"],
  CEST: ["Europe/Paris", "Central Europe"],
  EET: ["Europe/Athens", "Eastern Europe"],
  EEST: ["Europe/Athens", "Eastern Europe"],
  WET: ["Europe/Lisbon", "Western Europe"],
  IST: ["Asia/Kolkata", "India"],
  GST: ["Asia/Dubai", "Gulf / Dubai"],
  SGT: ["Asia/Singapore", "Singapore"],
  HKT: ["Asia/Hong_Kong", "Hong Kong"],
  JST: ["Asia/Tokyo", "Japan"],
  KST: ["Asia/Seoul", "Korea"],
  AEST: ["Australia/Sydney", "Sydney / Melbourne"],
  AEDT: ["Australia/Sydney", "Sydney / Melbourne"],
  ACST: ["Australia/Adelaide", "Adelaide"],
  ACDT: ["Australia/Adelaide", "Adelaide"],
  AWST: ["Australia/Perth", "Perth"],
  NZST: ["Pacific/Auckland", "New Zealand"],
  NZDT: ["Pacific/Auckland", "New Zealand"],
  SAST: ["Africa/Johannesburg", "South Africa"],
  EAT: ["Africa/Nairobi", "East Africa"],
  WAT: ["Africa/Lagos", "West Africa"]
}, y0 = ["Europe/London", "Europe/Dublin", "Europe/Belgrade", "Europe/Paris", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Australia/Sydney", "Australia/Perth", "Pacific/Auckland", "Asia/Dubai", "Asia/Singapore"];
function v0(e) {
  const t = String(e || "").trim();
  if (!t) return "";
  const l = /^(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i.exec(t);
  if (l) {
    const s = +l[2];
    return s <= 14 ? "Etc/GMT" + (l[1] === "+" ? "-" : "+") + s : "";
  }
  const a = Ny[t.toUpperCase().replace(/[^A-Z]/g, "")];
  if (a) return a[0];
  try {
    return new Intl.DateTimeFormat([], { timeZone: t }), t;
  } catch {
    return "";
  }
}
function Sy(e) {
  const t = v0(e);
  if (!t) return "";
  try {
    const l = (s) => new Intl.DateTimeFormat(s, { timeZone: t, hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" }).format(/* @__PURE__ */ new Date());
    let a = l("en-US");
    if (/GMT[+-]/.test(a)) {
      const s = l("en-GB");
      (!/GMT[+-]/.test(s) || /BST|CES?T|EES?T/.test(s)) && (a = s);
    }
    return a.replace(/^24:/, "00:");
  } catch {
    return "";
  }
}
const x0 = () => ({ id: Ht(), name: "", status: "Lead", pay: "Unpaid", revenue: 0, cash: 0, phone: "", email: "", nextDue: "", nextAmount: "", signed: "", timezone: "", engagement: 0, goal: "", program: "", source: "", lastContact: "", nextCheckin: "", renewal: "", notes: "", link: "" }), Ml = (e) => Math.max(0, ae(e.revenue) - ae(e.cash)), j0 = (e) => !!e.nextDue && e.nextDue < Ce() && e.pay !== "PAID" && e.status !== "Churned" && e.status !== "Completed" && Ml(e) > 0, b0 = (e) => "★".repeat(e) + "☆".repeat(5 - e), N0 = (e) => {
  if (!e.nextDue || e.pay === "PAID") return "";
  const t = Ir(Ce(), e.nextDue);
  return t < 0 ? "biz-out" : t <= 7 ? "biz-warn" : "";
}, $n = (e) => e.stopPropagation(), Rh = {
  due: ["Sort: next payment due", (e, t) => (e.nextDue || "9999").localeCompare(t.nextDue || "9999")],
  owed: ["Sort: most owed", (e, t) => Ml(t) - Ml(e)],
  revenue: ["Sort: revenue", (e, t) => ae(t.revenue) - ae(e.revenue)],
  signed: ["Sort: newest signed", (e, t) => (t.signed || "").localeCompare(e.signed || "")],
  engagement: ["Sort: engagement", (e, t) => (t.engagement || 0) - (e.engagement || 0)],
  name: ["Sort: name", (e, t) => e.name.localeCompare(t.name)]
};
async function Uh(e, t, l, a) {
  const s = await Q("/api/records?name=accounting"), i = [...s.entries || [], { id: Ht(), type: "in", date: l, amount: ae(t), category: e.pay === "PAID" ? "Coaching sale" : "Recurring payment", method: a, party: e.name, note: "from Clients tab", recurring: "" }];
  await Q("/api/records?name=accounting", { method: "POST", body: JSON.stringify({ ...s, entries: i }) });
}
function S0() {
  const { doc: e, update: t, status: l } = Nt("clients", { clients: [] }), [a, s] = j.useState(""), [i, c] = j.useState("All"), [u, r] = j.useState(""), [d, m] = j.useState("due"), [f, o] = j.useState(null), h = (e == null ? void 0 : e.clients) || [], v = j.useMemo(() => h.filter((E) => (i === "All" || E.status === i) && (!u || E.pay === u) && (!a || [E.name, E.email, E.phone, E.goal, E.notes, E.program].join(" ").toLowerCase().includes(a.toLowerCase()))).sort(Rh[d][1]), [h, i, u, a, d]), x = (E, T) => t((b) => {
    const g = b.clients.find((A) => A.id === E);
    return g && Object.assign(g, T), b;
  }), C = async (E) => {
    const T = ae(E.cash) - ae(E.acctLogged) - ae(E.acctDeclined);
    if (!E.name || T <= 0) return;
    if (!confirm(`Add ${we(T)} from ${E.name} to Accounting as an incoming?

OK = add it (you'll pick the date and how they paid)
Cancel = not now`)) {
      x(E.id, { acctDeclined: ae(E.acctDeclined) + T });
      return;
    }
    const b = prompt("Date received (YYYY-MM-DD):", E.signed || Ce());
    if (!b) return;
    const g = prompt("How were you paid? (Stripe, PayPal, Bank transfer, Wise, Cash…):", "Stripe") || "";
    try {
      await Uh(E, T, b, g), x(E.id, { acctLogged: ae(E.acctLogged) + T }), od(`Added ${we(T)} to Accounting`);
    } catch (A) {
      alert("Could not add it to Accounting: " + (A instanceof Error ? A.message : A));
    }
  }, p = (E) => {
    const T = h.find((b) => b.id === f);
    o(E), T && T.id !== E && setTimeout(() => C(T), 50);
  }, y = async (E) => {
    const T = prompt(`Payment received from ${E.name || "this client"} ($):`, String(E.nextAmount || ""));
    if (T === null || !ae(T)) return;
    const b = prompt("Date received (YYYY-MM-DD):", Ce());
    if (!b) return;
    const g = prompt("How were you paid? (Stripe, PayPal, Bank transfer, Wise, Cash…):", "Stripe") || "", A = prompt("Next payment due date (YYYY-MM-DD) — leave empty if none:", ""), O = { cash: ae(E.cash) + ae(T), lastContact: E.lastContact || b };
    Ml({ ...E, ...O }) <= 0 && ae(E.revenue) > 0 ? Object.assign(O, { pay: "PAID", nextDue: "", nextAmount: "" }) : ((E.pay === "Unpaid" || E.pay === "Overdue") && (O.pay = "Deposit paid"), A && (O.nextDue = A)), x(E.id, O);
    try {
      await Uh({ ...E, ...O }, ae(T), b, g), x(E.id, { acctLogged: ae(E.acctLogged) + ae(T) });
    } catch (z) {
      alert("Saved on the client, but could not add it to Accounting: " + (z instanceof Error ? z.message : z));
    }
  };
  if (!e) return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc", children: [
    /* @__PURE__ */ n.jsx("h2", { children: "👥 Clients" }),
    /* @__PURE__ */ n.jsx("p", { className: "biz-dim", children: l || "Loading…" })
  ] });
  const S = h.filter((E) => ["Signed", "Active"].includes(E.status)), w = h.reduce((E, T) => E + ae(T.revenue), 0), D = h.reduce((E, T) => E + ae(T.cash), 0), U = h.filter(j0), N = h.filter((E) => E.nextDue && E.pay !== "PAID" && Ir(Ce(), E.nextDue) >= 0 && Ir(Ce(), E.nextDue) <= 7), _ = h.find((E) => E.id === f);
  return /* @__PURE__ */ n.jsxs("div", { className: _ ? "cl-panel-open" : "", children: [
    /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc", children: [
      /* @__PURE__ */ n.jsxs("h2", { children: [
        "👥 Clients ",
        /* @__PURE__ */ n.jsx("span", { className: "bk-status", children: l })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-cards", children: [
        /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
          /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Active clients" }),
          /* @__PURE__ */ n.jsx("b", { children: S.length })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
          /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Total revenue sold" }),
          /* @__PURE__ */ n.jsx("b", { children: we(w) })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
          /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Cash collected" }),
          /* @__PURE__ */ n.jsx("b", { className: "biz-in", children: we(D) })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
          /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Still to collect" }),
          /* @__PURE__ */ n.jsx("b", { className: w - D > 0 ? "biz-warn" : "", children: we(Math.max(0, w - D)) })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
          /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Overdue" }),
          /* @__PURE__ */ n.jsxs("b", { className: U.length ? "biz-out" : "", children: [
            U.length,
            " · ",
            we(U.reduce((E, T) => E + (ae(T.nextAmount) || Ml(T)), 0))
          ] })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
          /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Due in 7 days" }),
          /* @__PURE__ */ n.jsx("b", { children: N.length })
        ] })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-bar-top", children: [
        /* @__PURE__ */ n.jsx("input", { placeholder: "Search name, email, phone, goal, notes…", value: a, onChange: (E) => s(E.target.value), onKeyDown: $n, style: { flex: 1, minWidth: 200 } }),
        /* @__PURE__ */ n.jsxs("select", { value: u, onChange: (E) => r(E.target.value), children: [
          /* @__PURE__ */ n.jsx("option", { value: "", children: "Any payment status" }),
          by.map((E) => /* @__PURE__ */ n.jsx("option", { children: E }, E))
        ] }),
        /* @__PURE__ */ n.jsx("select", { value: d, onChange: (E) => m(E.target.value), children: Object.entries(Rh).map(([E, [T]]) => /* @__PURE__ */ n.jsx("option", { value: E, children: T }, E)) }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl biz-primary", onClick: () => {
          const E = x0();
          t((T) => (T.clients.unshift(E), T)), p(E.id);
        }, children: "＋ Add client" }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => xy("clients.csv", vy([["Name", "Status", "Payment", "Revenue", "Cash collected", "Owed", "Next due", "Next amount", "Phone", "Email", "Timezone", "Signed", "Engagement", "Goal", "Program", "Source", "Notes"], ...h.map((E) => [E.name, E.status, E.pay, E.revenue, E.cash, Ml(E), E.nextDue, E.nextAmount, E.phone, E.email, E.timezone, E.signed, E.engagement, E.goal, E.program, E.source, E.notes])])), children: "⬇ CSV" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-chips", children: [
        /* @__PURE__ */ n.jsxs("button", { className: i === "All" ? "on" : "", onClick: () => c("All"), children: [
          "All ",
          h.length
        ] }),
        jy.map((E) => /* @__PURE__ */ n.jsxs("button", { className: i === E ? "on" : "", onClick: () => c(E), children: [
          E,
          " ",
          h.filter((T) => T.status === E).length
        ] }, E))
      ] }),
      /* @__PURE__ */ n.jsx("div", { className: "biz-scroll", children: /* @__PURE__ */ n.jsxs("table", { className: "biz-table biz-click", children: [
        /* @__PURE__ */ n.jsx("thead", { children: /* @__PURE__ */ n.jsxs("tr", { children: [
          /* @__PURE__ */ n.jsx("th", { children: "Client" }),
          /* @__PURE__ */ n.jsx("th", { children: "Status" }),
          /* @__PURE__ */ n.jsx("th", { children: "Payment" }),
          /* @__PURE__ */ n.jsx("th", { className: "r", children: "Revenue" }),
          /* @__PURE__ */ n.jsx("th", { className: "r", children: "Cash" }),
          /* @__PURE__ */ n.jsx("th", { className: "r", children: "Owed" }),
          /* @__PURE__ */ n.jsx("th", { children: "Next due" }),
          /* @__PURE__ */ n.jsx("th", { children: "Engagement" }),
          /* @__PURE__ */ n.jsx("th", { children: "Goal" })
        ] }) }),
        /* @__PURE__ */ n.jsx("tbody", { children: v.length ? v.map((E) => /* @__PURE__ */ n.jsxs("tr", { onClick: () => p(E.id), children: [
          /* @__PURE__ */ n.jsxs("td", { children: [
            /* @__PURE__ */ n.jsx("b", { children: E.name || "(no name)" }),
            E.timezone && /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
              " ",
              /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: Sy(E.timezone) })
            ] })
          ] }),
          /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("span", { className: "biz-pill", children: E.status }) }),
          /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("span", { className: `biz-pill ${E.pay === "PAID" ? "ok" : E.pay === "Overdue" ? "bad" : ""}`, children: E.pay }) }),
          /* @__PURE__ */ n.jsx("td", { className: "r", children: we(ae(E.revenue)) }),
          /* @__PURE__ */ n.jsx("td", { className: "r biz-in", children: we(ae(E.cash)) }),
          /* @__PURE__ */ n.jsx("td", { className: "r", children: we(Ml(E)) }),
          /* @__PURE__ */ n.jsxs("td", { className: N0(E), children: [
            E.nextDue,
            E.nextAmount ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
              " ",
              /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: we(ae(E.nextAmount)) })
            ] }) : null
          ] }),
          /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("span", { className: "biz-stars", children: b0(E.engagement || 0) }) }),
          /* @__PURE__ */ n.jsx("td", { className: "biz-trunc", children: E.goal })
        ] }, E.id)) : /* @__PURE__ */ n.jsx("tr", { children: /* @__PURE__ */ n.jsx("td", { colSpan: 9, className: "biz-dim", children: "No clients match. Add one with “＋ Add client”." }) }) })
      ] }) })
    ] }),
    _ && /* @__PURE__ */ n.jsx(
      w0,
      {
        c: _,
        onSet: (E) => x(_.id, E),
        onClose: () => p(null),
        onPay: () => y(_),
        onDelete: () => {
          confirm(`Delete ${_.name || "this client"}? This can't be undone.`) && (t((E) => (E.clients = E.clients.filter((T) => T.id !== _.id), E)), o(null));
        }
      },
      `${_.id}-${_.cash}-${_.pay}-${_.nextDue}-${_.nextAmount}`
    )
  ] });
}
function w0({ c: e, onSet: t, onClose: l, onPay: a, onDelete: s }) {
  const i = ["revenue", "cash", "nextAmount"], c = (f, o) => t({ [f]: i.includes(f) ? o === "" ? "" : ae(o) : o }), u = (f, o, h = {}) => /* @__PURE__ */ n.jsxs("label", { className: "cl-f", children: [
    /* @__PURE__ */ n.jsx("span", { children: f }),
    /* @__PURE__ */ n.jsx("input", { defaultValue: String(e[o] ?? ""), onBlur: (v) => v.target.value !== String(e[o] ?? "") && c(o, v.target.value), onKeyDown: $n, ...h })
  ] }), r = (f, o, h) => /* @__PURE__ */ n.jsxs("label", { className: "cl-f", children: [
    /* @__PURE__ */ n.jsx("span", { children: f }),
    /* @__PURE__ */ n.jsx("select", { value: String(e[o]), onChange: (v) => c(o, v.target.value), children: h.map((v) => /* @__PURE__ */ n.jsx("option", { children: v }, v)) })
  ] }), d = String(e.phone || "").replace(/[^0-9]/g, ""), m = e.timezone ? Sy(e.timezone) : "";
  return /* @__PURE__ */ n.jsxs("aside", { id: "cl-panel", style: { display: "flex" }, children: [
    /* @__PURE__ */ n.jsxs("div", { className: "cl-panel-head", children: [
      /* @__PURE__ */ n.jsx("b", { children: e.name || "New client" }),
      /* @__PURE__ */ n.jsx("span", { style: { flex: 1 } }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl", title: "Close", onClick: l, children: "✕" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "cl-panel-body", children: [
      u("Name", "name"),
      r("Pipeline status", "status", jy),
      r("Payment status", "pay", by),
      /* @__PURE__ */ n.jsxs("div", { className: "cl-row2", children: [
        u("Revenue (contract) $", "revenue", { inputMode: "decimal" }),
        u("Cash collected $", "cash", { inputMode: "decimal" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cl-row2", children: [
        u("Next payment due", "nextDue", { type: "date" }),
        u("Next amount $", "nextAmount", { inputMode: "decimal" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cl-owed", children: [
        "Still to collect: ",
        /* @__PURE__ */ n.jsx("b", { children: we(Ml(e)) }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl biz-primary", onClick: a, children: "💰 Add payment" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cl-row2", children: [
        u("Phone", "phone", { type: "tel" }),
        u("Email", "email", { type: "email" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cl-links", children: [
        e.phone && /* @__PURE__ */ n.jsx("a", { className: "ctl", href: `tel:${e.phone}`, children: "📞 Call" }),
        d && /* @__PURE__ */ n.jsx("a", { className: "ctl", target: "_blank", rel: "noopener noreferrer", href: `https://wa.me/${d}`, children: "WhatsApp ↗" }),
        e.email && /* @__PURE__ */ n.jsx("a", { className: "ctl", href: `mailto:${e.email}`, children: "✉ Email" }),
        e.link && /* @__PURE__ */ n.jsx("a", { className: "ctl", target: "_blank", rel: "noopener noreferrer", href: e.link, children: "CRM / Aloware ↗" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { className: "cl-f", children: [
        /* @__PURE__ */ n.jsxs("span", { children: [
          "Timezone ",
          e.timezone && m ? `· now ${m} there` : e.timezone ? "· not recognised" : ""
        ] }),
        /* @__PURE__ */ n.jsx("input", { list: "cl-zones", defaultValue: e.timezone, placeholder: "EST, PST, GMT, CET, Europe/London…", onBlur: (f) => f.target.value !== e.timezone && c("timezone", f.target.value), onKeyDown: $n })
      ] }),
      /* @__PURE__ */ n.jsxs("datalist", { id: "cl-zones", children: [
        Object.entries(Ny).map(([f, o]) => /* @__PURE__ */ n.jsx("option", { value: f, label: o[1] }, f)),
        y0.map((f) => /* @__PURE__ */ n.jsx("option", { value: f }, f))
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cl-row2", children: [
        u("Date signed", "signed", { type: "date" }),
        u("Renewal / end date", "renewal", { type: "date" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cl-row2", children: [
        u("Last contact", "lastContact", { type: "date" }),
        u("Next check-in", "nextCheckin", { type: "date" })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { className: "cl-f", children: [
        /* @__PURE__ */ n.jsx("span", { children: "Engagement" }),
        /* @__PURE__ */ n.jsx("span", { className: "biz-stars cl-stars", children: [1, 2, 3, 4, 5].map((f) => /* @__PURE__ */ n.jsx("b", { className: f <= (e.engagement || 0) ? "on" : "", onClick: (o) => {
          o.preventDefault(), t({ engagement: e.engagement === f ? 0 : f });
        }, children: "★" }, f)) })
      ] }),
      /* @__PURE__ */ n.jsxs("label", { className: "cl-f", children: [
        /* @__PURE__ */ n.jsx("span", { children: "Goal" }),
        /* @__PURE__ */ n.jsx("textarea", { rows: 2, defaultValue: e.goal, onBlur: (f) => f.target.value !== e.goal && c("goal", f.target.value), onKeyDown: $n })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "cl-row2", children: [
        u("Program / offer", "program"),
        u("Source", "source", { placeholder: "content, ad, referral…" })
      ] }),
      u("CRM / Aloware / folder link", "link", { placeholder: "https://…" }),
      /* @__PURE__ */ n.jsxs("label", { className: "cl-f", children: [
        /* @__PURE__ */ n.jsx("span", { children: "Notes" }),
        /* @__PURE__ */ n.jsx("textarea", { rows: 5, defaultValue: e.notes, onBlur: (f) => f.target.value !== e.notes && c("notes", f.target.value), onKeyDown: $n })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl", style: { color: "#dc2626" }, onClick: s, children: "🗑 Delete client" })
    ] })
  ] });
}
const C0 = ["Subscriptions", "Software & tools", "Advertising", "Team & contractors", "Education & coaching", "Equipment", "Travel", "Food & household", "Rent & utilities", "Taxes & fees", "Health", "Other"], T0 = ["Coaching sale", "Recurring payment", "Commission", "Content / sponsorship", "Product / course", "Other"], E0 = ["Stripe", "PayPal", "Bank transfer", "Wise", "Cash", "Crypto", "Card", "Other"], Rn = 5e4, D0 = ["summary", "incomings", "outgoings"], k0 = (e) => String.fromCharCode(65 + e), Lh = (e, t) => {
  try {
    if (t === void 0) return localStorage.getItem(e);
    localStorage.setItem(e, t);
  } catch {
  }
  return null;
};
function Bh(e) {
  const t = String(e).trim().toLowerCase();
  if (!t) return "";
  const l = /* @__PURE__ */ new Date();
  if (t === "t" || t === "today") return Ce();
  if (t === "y" || t === "yesterday")
    return l.setDate(l.getDate() - 1), l.toLocaleDateString("en-CA");
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(t)) {
    const [s, i, c] = t.split("-");
    return `${s}-${i.padStart(2, "0")}-${c.padStart(2, "0")}`;
  }
  const a = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/.exec(t);
  return a ? `${a[3] ? a[3].length === 2 ? "20" + a[3] : a[3] : String(l.getFullYear())}-${a[2].padStart(2, "0")}-${a[1].padStart(2, "0")}` : null;
}
const ku = (e, t) => e.filter((l) => l.type === t).reduce((l, a) => l + ae(a.amount), 0), Wr = (e, t) => e.t === "money" ? t === "" || t == null ? "" : ae(t).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : e.k === "recurring" ? t === "monthly" ? "Monthly" : t === "yearly" ? "Yearly" : String(t || "") : String(t ?? "");
function A0() {
  const { doc: e, update: t, status: l } = Nt("accounting", { entries: [], customOut: [], customIn: [], customMethods: [] }), [a, s] = j.useState(() => {
    const o = Lh("acSub");
    return D0.includes(o || "") ? o : "summary";
  }), [i, c] = j.useState("all"), [u, r] = j.useState([]);
  j.useEffect(() => {
    Q("/api/records?name=clients").then((o) => r((o.clients || []).map((h) => h.name).filter(Boolean))).catch(() => {
    });
  }, []);
  const d = (o) => {
    s(o), Lh("acSub", o);
  };
  if (!e) return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc", children: [
    /* @__PURE__ */ n.jsx("h2", { children: "💰 Accounting" }),
    /* @__PURE__ */ n.jsx("p", { className: "biz-dim", children: l || "Loading…" })
  ] });
  const m = [...new Set(e.entries.map((o) => oc(o.date)).filter(Boolean))].sort().reverse(), f = /* @__PURE__ */ n.jsxs("label", { children: [
    "Period ",
    /* @__PURE__ */ n.jsxs("select", { value: i, onChange: (o) => c(o.target.value), children: [
      /* @__PURE__ */ n.jsx("option", { value: "all", children: "All time" }),
      m.map((o) => /* @__PURE__ */ n.jsx("option", { children: o }, o))
    ] })
  ] });
  return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc", children: [
    /* @__PURE__ */ n.jsxs("h2", { children: [
      "💰 Accounting ",
      /* @__PURE__ */ n.jsx("span", { className: "bk-status", children: l })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "ac-subtabs", children: [["summary", "📊 Summary"], ["incomings", "⬆ Incomings"], ["outgoings", "⬇ Outgoings"]].map(([o, h]) => /* @__PURE__ */ n.jsxs("button", { className: a === o ? "on" : "", onClick: () => d(o), children: [
      h,
      " ",
      o !== "summary" && /* @__PURE__ */ n.jsx("span", { className: "biz-dim", children: e.entries.filter((v) => v.type === (o === "incomings" ? "in" : "out")).length })
    ] }, o)) }),
    a === "summary" ? /* @__PURE__ */ n.jsx(z0, { doc: e, month: i, picker: f, onRelog: (o) => {
      t((h) => (h.entries.push({ ...o, id: Ht(), date: Ce() }), h)), od("Logged again, dated today");
    } }) : /* @__PURE__ */ n.jsx(M0, { type: a === "incomings" ? "in" : "out", doc: e, update: t, month: i, picker: f, clientNames: u }, a)
  ] });
}
function O0(e) {
  const t = {};
  return e.entries.filter((l) => l.type === "out" && (l.recurring === "monthly" || l.recurring === "yearly" || l.category === "Subscriptions")).forEach((l) => {
    const a = (l.party || l.note || l.category).toLowerCase().trim();
    (!t[a] || l.date > t[a].date) && (t[a] = l);
  }), Object.values(t).map((l) => {
    const a = l.recurring === "yearly", s = ae(l.amount) / (a ? 12 : 1), i = /* @__PURE__ */ new Date((l.date || Ce()) + "T12:00:00");
    return a ? i.setFullYear(i.getFullYear() + 1) : i.setMonth(i.getMonth() + 1), { e: l, per: s, next: i.toLocaleDateString("en-CA") };
  }).sort((l, a) => a.per - l.per);
}
function z0({ doc: e, month: t, picker: l, onRelog: a }) {
  const s = e.entries.filter((o) => t === "all" || oc(o.date) === t), i = ku(s, "in"), c = ku(s, "out"), u = i - c, r = ku(e.entries.filter((o) => oc(o.date) === Ce().slice(0, 7)), "in"), d = O0(e), m = d.reduce((o, h) => o + h.per, 0), f = (o, h, v) => {
    const x = {};
    s.filter((y) => y.type === h).forEach((y) => {
      const S = y[o] || v;
      x[S] = (x[S] || 0) + ae(y.amount);
    });
    const C = Object.values(x).reduce((y, S) => y + S, 0) || 1, p = Object.entries(x).sort((y, S) => S[1] - y[1]);
    return p.length ? p.map(([y, S]) => /* @__PURE__ */ n.jsxs("div", { className: "biz-bar", children: [
      /* @__PURE__ */ n.jsxs("div", { className: "biz-bar-head", children: [
        /* @__PURE__ */ n.jsx("span", { children: y }),
        /* @__PURE__ */ n.jsx("b", { children: we(S) }),
        /* @__PURE__ */ n.jsxs("span", { className: "biz-dim", children: [
          Math.round(100 * S / C),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ n.jsx("div", { className: "biz-bar-track", children: /* @__PURE__ */ n.jsx("div", { className: `biz-bar-fill ${h}`, style: { width: `${Math.max(2, 100 * S / C)}%` } }) })
    ] }, y)) : /* @__PURE__ */ n.jsx("p", { className: "biz-dim", children: "Nothing yet." });
  };
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsx("div", { className: "biz-bar-top", children: l }),
    /* @__PURE__ */ n.jsxs("div", { className: "biz-cards", children: [
      /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
        /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Incomings" }),
        /* @__PURE__ */ n.jsx("b", { className: "biz-in", children: we(i) })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
        /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Outgoings" }),
        /* @__PURE__ */ n.jsx("b", { className: "biz-out", children: we(c) })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
        /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Net" }),
        /* @__PURE__ */ n.jsx("b", { className: u >= 0 ? "biz-in" : "biz-out", children: we(u) })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "biz-card", children: [
        /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: "Subscriptions / month" }),
        /* @__PURE__ */ n.jsx("b", { children: we(m) })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "biz-bridge", children: [
      /* @__PURE__ */ n.jsxs("div", { className: "biz-bar-head", children: [
        /* @__PURE__ */ n.jsx("span", { children: "Bridge to your goal (this month)" }),
        /* @__PURE__ */ n.jsxs("b", { children: [
          we(r),
          " of ",
          we(Rn)
        ] })
      ] }),
      /* @__PURE__ */ n.jsx("div", { className: "biz-bar-track big", children: /* @__PURE__ */ n.jsx("div", { className: "biz-bar-fill in", style: { width: `${Math.min(100, 100 * r / Rn)}%` } }) }),
      /* @__PURE__ */ n.jsx("div", { className: "biz-dim", children: r >= Rn ? "🎯 Goal reached." : `${we(Rn - r)} to go (${Math.round(100 * r / Rn)}%)` })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "biz-two", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("h3", { children: "Outgoings by category" }),
        f("category", "out", "Uncategorised"),
        /* @__PURE__ */ n.jsx("h3", { children: "Incomings by how you were paid" }),
        f("method", "in", "Not set")
      ] }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsxs("h3", { children: [
          "Subscriptions ",
          /* @__PURE__ */ n.jsxs("span", { className: "biz-dim", children: [
            we(m),
            "/month"
          ] })
        ] }),
        d.length ? d.map((o) => /* @__PURE__ */ n.jsxs("div", { className: "biz-sub", children: [
          /* @__PURE__ */ n.jsx("span", { children: o.e.party || o.e.note || o.e.category }),
          /* @__PURE__ */ n.jsxs("b", { children: [
            we(o.per),
            "/mo"
          ] }),
          /* @__PURE__ */ n.jsxs("span", { className: "biz-dim", children: [
            "next ~",
            o.next
          ] }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl", title: "Log this payment again, dated today", onClick: () => a(o.e), children: "＋ Log" })
        ] }, o.e.id)) : /* @__PURE__ */ n.jsx("p", { className: "biz-dim", children: "Mark an outgoing Monthly or Yearly (or use the Subscriptions category) and it shows here." }),
        /* @__PURE__ */ n.jsx("button", { className: "ctl", style: { marginTop: 14 }, onClick: () => xy("accounting.csv", vy([["Date", "Type", "Amount", "Who", "Category", "Method", "Recurring", "Note"], ...e.entries.slice().sort((o, h) => (o.date || "").localeCompare(h.date || "")).map((o) => [o.date, o.type === "in" ? "Incoming" : "Outgoing", o.amount, o.party, o.category, o.method, o.recurring || "", o.note])])), children: "⬇ Export everything (CSV)" })
      ] })
    ] })
  ] });
}
function M0({ type: e, doc: t, update: l, month: a, picker: s, clientNames: i }) {
  const [c, u] = j.useState(null), [r, d] = j.useState({ r: 0, c: 0 }), [m, f] = j.useState(null), [o, h] = j.useState(!1), v = j.useRef(null), x = [...C0, ...t.customOut || []], C = [...T0, ...t.customIn || []], p = [...E0, ...t.customMethods || []], y = j.useMemo(() => {
    const g = [{ k: "date", l: "Date", t: "date", w: 110 }, { k: "amount", l: "Amount", t: "money", w: 110 }];
    return e === "in" ? [...g, { k: "party", l: "Client / source", t: "list", w: 190, list: () => i }, { k: "category", l: "What for", t: "list", w: 170, list: () => C }, { k: "method", l: "Paid via", t: "list", w: 130, list: () => p }, { k: "note", l: "Note", t: "text", w: 260 }] : [...g, { k: "party", l: "Vendor", t: "list", w: 170, list: () => [...new Set(t.entries.filter((A) => A.type === "out").map((A) => A.party).filter(Boolean))] }, { k: "category", l: "Category", t: "list", w: 170, list: () => x }, { k: "method", l: "Paid with", t: "list", w: 120, list: () => p }, { k: "recurring", l: "Recurring", t: "list", w: 100, list: () => ["One-off", "Monthly", "Yearly"] }, { k: "note", l: "Note", t: "text", w: 220 }];
  }, [e, t, i]), S = j.useMemo(() => {
    let g = t.entries.filter((A) => A.type === e && (a === "all" || oc(A.date) === a));
    return c && (g = g.slice().sort((A, O) => {
      const z = A[c.k] ?? "", k = O[c.k] ?? "";
      return c.dir * (c.k === "amount" ? ae(z) - ae(k) : String(z).localeCompare(String(k)));
    })), g;
  }, [t, e, a, c]), w = S.length + 1, D = (g, A) => d({ r: Math.max(0, Math.min(w - 1, g)), c: Math.max(0, Math.min(y.length - 1, A)) });
  j.useEffect(() => {
    var g, A;
    (A = (g = v.current) == null ? void 0 : g.querySelector("td.sel")) == null || A.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [r]);
  const U = (g, A, O, z, k) => {
    const R = y[z];
    let M = k.trim(), Y = A[O] ? g.entries.find((K) => K.id === A[O].id) : void 0;
    if (R.t === "date" && M !== "") {
      const K = Bh(String(M));
      if (K === null) return !1;
      M = K;
    }
    if (R.t === "money" && (M = M === "" ? "" : ae(M)), R.k === "recurring" && (M = /^m/i.test(String(M)) ? "monthly" : /^y/i.test(String(M)) ? "yearly" : ""), R.k === "category" && M && !(e === "in" ? C : x).some((K) => K.toLowerCase() === String(M).toLowerCase())) {
      const K = e === "in" ? "customIn" : "customOut";
      g[K] = [...g[K] || [], String(M)];
    }
    if (R.k === "method" && M && !p.some((K) => K.toLowerCase() === String(M).toLowerCase()) && (g.customMethods = [...g.customMethods || [], String(M)]), !Y) {
      if (M === "" || M === 0) return !0;
      Y = { id: Ht(), type: e, date: Ce(), amount: "", category: "", method: "", party: "", note: "", recurring: "" }, g.entries.push(Y), A.push(Y);
    }
    return Y[R.k] = M, !0;
  }, N = (g, A, O) => {
    let z = !0;
    return l((k) => (z = U(k, S.slice(), g, A, O), k)), z;
  }, _ = (g, A, O) => {
    var R;
    if (!m) return;
    const { r: z, c: k } = m;
    if (g !== null) {
      const M = y[k], Y = S[z], K = Y ? M.t === "money" ? Y[M.k] === "" ? "" : String(Y[M.k]) : M.k === "recurring" ? Wr(M, Y[M.k]) : String(Y[M.k] ?? "") : "";
      if (g !== K && M.t === "date" && g.trim() && Bh(g) === null) {
        h(!0);
        return;
      }
      g !== K && N(z, k, g);
    }
    h(!1), f(null), D(z + A, k + O), (R = v.current) == null || R.focus();
  }, E = (g) => {
    if (g.target.classList.contains("ac-edit")) return;
    g.stopPropagation();
    const { r: A, c: O } = r, z = g.key;
    z === "ArrowDown" || z === "Enter" ? (g.preventDefault(), D(A + 1, O)) : z === "ArrowUp" ? (g.preventDefault(), D(A - 1, O)) : z === "ArrowRight" || z === "Tab" && !g.shiftKey ? (g.preventDefault(), D(A, O + 1)) : z === "ArrowLeft" || z === "Tab" && g.shiftKey ? (g.preventDefault(), D(A, O - 1)) : z === "F2" ? (g.preventDefault(), f({ r: A, c: O, start: null })) : z === "Delete" || z === "Backspace" ? (g.preventDefault(), S[A] && N(A, O, "")) : z.length === 1 && !g.metaKey && !g.ctrlKey && !g.altKey && (g.preventDefault(), f({ r: A, c: O, start: z }));
  }, T = (g) => {
    if (g.target.classList.contains("ac-edit")) return;
    const A = g.clipboardData.getData("text");
    if (!A) return;
    g.preventDefault();
    const O = A.replace(/\r/g, "").replace(/\n$/, "").split(`
`).map((k) => k.split("	"));
    let z = 0;
    l((k) => {
      const R = S.slice();
      return O.forEach((M, Y) => M.forEach((K, he) => {
        const ge = r.c + he;
        ge < y.length && !U(k, R, r.r + Y, ge, K) && z++;
      })), k;
    }), od(z ? `${z} cell${z === 1 ? "" : "s"} skipped (dates need YYYY-MM-DD or DD/MM/YYYY)` : `Pasted ${O.length} row${O.length === 1 ? "" : "s"}`);
  }, b = S.reduce((g, A) => g + ae(A.amount), 0);
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsxs("div", { className: "biz-bar-top", children: [
      s,
      /* @__PURE__ */ n.jsxs("span", { className: "biz-dim", children: [
        S.length,
        " rows · click a cell and type · paste from Excel / Sheets works"
      ] }),
      /* @__PURE__ */ n.jsx("span", { style: { flex: 1 } }),
      /* @__PURE__ */ n.jsxs("b", { className: e === "in" ? "biz-in" : "biz-out", children: [
        e === "in" ? "Total in" : "Total out",
        ": ",
        we(b)
      ] })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "ac-sheet-wrap", tabIndex: 0, ref: v, onKeyDown: E, onPaste: T, children: /* @__PURE__ */ n.jsxs("table", { className: "ac-sheet", children: [
      /* @__PURE__ */ n.jsxs("thead", { children: [
        /* @__PURE__ */ n.jsxs("tr", { className: "ac-letters", children: [
          /* @__PURE__ */ n.jsx("th", { className: "ac-corner" }),
          y.map((g, A) => /* @__PURE__ */ n.jsxs("th", { style: { minWidth: g.w }, title: "Click to sort", onClick: () => u((O) => !O || O.k !== g.k ? { k: g.k, dir: 1 } : O.dir === 1 ? { k: g.k, dir: -1 } : null), children: [
            k0(A),
            c && c.k === g.k ? c.dir > 0 ? " ▲" : " ▼" : ""
          ] }, g.k)),
          /* @__PURE__ */ n.jsx("th", { className: "ac-corner" })
        ] }),
        /* @__PURE__ */ n.jsxs("tr", { className: "ac-names", children: [
          /* @__PURE__ */ n.jsx("th", { className: "ac-corner", children: "#" }),
          y.map((g) => /* @__PURE__ */ n.jsx("th", { className: g.t === "money" ? "r" : "", children: g.l }, g.k)),
          /* @__PURE__ */ n.jsx("th", { className: "ac-corner" })
        ] })
      ] }),
      /* @__PURE__ */ n.jsx("tbody", { children: [...S, null].map((g, A) => /* @__PURE__ */ n.jsxs("tr", { children: [
        /* @__PURE__ */ n.jsx("th", { className: "ac-rn", children: g ? A + 1 : "＊" }),
        y.map((O, z) => {
          const k = r.r === A && r.c === z, R = m && m.r === A && m.c === z;
          return /* @__PURE__ */ n.jsx(
            "td",
            {
              className: `${O.t === "money" ? "r " : ""}${O.t === "money" && g ? e === "in" ? "biz-in " : "biz-out " : ""}${k ? "sel" : ""}`,
              onClick: () => {
                R || D(A, z);
              },
              onDoubleClick: () => f({ r: A, c: z, start: null }),
              children: R ? /* @__PURE__ */ n.jsx(_0, { col: O, entry: g, start: m.start, bad: o, onDone: _ }) : g ? Wr(O, g[O.k]) : ""
            },
            O.k
          );
        }),
        /* @__PURE__ */ n.jsx("th", { className: "ac-rn ac-x", children: g && /* @__PURE__ */ n.jsx("button", { className: "ac-delrow", title: "Delete row", onClick: () => {
          confirm(`Delete this row (${we(ae(g.amount))})?`) && l((O) => (O.entries = O.entries.filter((z) => z.id !== g.id), O));
        }, children: "✕" }) })
      ] }, g ? g.id : "new")) }),
      /* @__PURE__ */ n.jsx("tfoot", { children: /* @__PURE__ */ n.jsxs("tr", { className: "ac-sumrow", children: [
        /* @__PURE__ */ n.jsx("th", { className: "ac-corner", children: "Σ" }),
        y.map((g, A) => /* @__PURE__ */ n.jsx("td", { className: g.t === "money" ? "r" : "", children: A === 0 ? "SUM" : g.t === "money" ? /* @__PURE__ */ n.jsx("b", { children: we(b) }) : "" }, g.k)),
        /* @__PURE__ */ n.jsx("th", { className: "ac-corner" })
      ] }) })
    ] }) })
  ] });
}
function _0({ col: e, entry: t, start: l, bad: a, onDone: s }) {
  var d;
  const i = j.useRef(null), c = j.useRef(!1), u = t ? e.t === "money" ? t[e.k] === "" ? "" : String(t[e.k]) : e.k === "recurring" ? Wr(e, t[e.k]) : String(t[e.k] ?? "") : "";
  j.useEffect(() => {
    const m = i.current;
    m && (m.focus(), l == null && m.select());
  }, [l]);
  const r = (m, f, o) => {
    c.current && !a || (c.current = !0, s(m, f, o), setTimeout(() => {
      c.current = !1;
    }, 0));
  };
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsx(
      "input",
      {
        ref: i,
        className: `ac-edit${a ? " bad" : ""}`,
        defaultValue: l ?? u,
        list: e.t === "list" ? "ac-dl" : void 0,
        placeholder: e.t === "date" ? "YYYY-MM-DD" : void 0,
        onKeyDown: (m) => {
          m.stopPropagation();
          const f = m.target.value;
          m.key === "Enter" ? (m.preventDefault(), r(f, 1, 0)) : m.key === "Tab" ? (m.preventDefault(), r(f, 0, m.shiftKey ? -1 : 1)) : m.key === "Escape" && (m.preventDefault(), r(null, 0, 0));
        },
        onBlur: (m) => r(m.target.value, 0, 0)
      }
    ),
    e.t === "list" && /* @__PURE__ */ n.jsx("datalist", { id: "ac-dl", children: (((d = e.list) == null ? void 0 : d.call(e)) || []).map((m) => /* @__PURE__ */ n.jsx("option", { value: m }, m)) })
  ] });
}
const wy = ["Document", "Video", "Template", "Tool", "Folder", "Link", "Other"], Hh = { Document: "📄", Video: "▶", Template: "▦", Tool: "⚙", Folder: "📁", Link: "↗", Other: "◇" }, Cy = (e) => {
  const t = String(e || "").trim();
  return /^(https?:\/\/|\/)/i.test(t) && !/^\/\//.test(t) ? t : "";
};
function R0() {
  const { doc: e, update: t, status: l } = Nt("resources", { items: [] }), [a, s] = j.useState(""), [i, c] = j.useState(""), [u, r] = j.useState(null), [d, m] = j.useState(!1), f = ((e == null ? void 0 : e.items) || []).filter((x) => x.archived).length, o = (x, C) => t((p) => {
    const y = p.items.find((S) => S.id === x);
    return y && (y.archived = C), p;
  }), h = j.useMemo(() => ((e == null ? void 0 : e.items) || []).filter((x) => !!x.archived === d && (!i || x.type === i) && (!a.trim() || `${x.title} ${x.type} ${x.description} ${x.tags}`.toLowerCase().includes(a.trim().toLowerCase()))).sort((x, C) => Number(C.added || 0) - Number(x.added || 0)), [e, a, i, d]), v = () => ({ id: "", type: "Document", title: "", url: "", description: "", tags: "" });
  return /* @__PURE__ */ n.jsxs("main", { className: "rl-wrap", children: [
    /* @__PURE__ */ n.jsxs("header", { className: "rl-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "rl-kicker", children: "BUSINESS LIBRARY" }),
        /* @__PURE__ */ n.jsx("h1", { children: "Resources" }),
        /* @__PURE__ */ n.jsx("p", { children: "Documents, videos, templates, tools and anything worth keeping close." })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "button", onClick: () => r(v()), children: "＋ Add resource" })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "rl-tools", children: [
      /* @__PURE__ */ n.jsxs("label", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "sr-only", children: "Search resources" }),
        /* @__PURE__ */ n.jsx("input", { type: "search", placeholder: "Search resources…", value: a, onChange: (x) => s(x.target.value), onKeyDown: (x) => x.stopPropagation() })
      ] }),
      /* @__PURE__ */ n.jsxs("select", { "aria-label": "Filter resource type", value: i, onChange: (x) => c(x.target.value), children: [
        /* @__PURE__ */ n.jsx("option", { value: "", children: "All types" }),
        wy.map((x) => /* @__PURE__ */ n.jsx("option", { children: x }, x))
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: "rl-view", role: "group", "aria-label": "Show", children: [
        /* @__PURE__ */ n.jsx("button", { type: "button", className: d ? "" : "on", onClick: () => m(!1), children: "Active" }),
        /* @__PURE__ */ n.jsxs("button", { type: "button", className: d ? "on" : "", onClick: () => m(!0), children: [
          "🗄 Archived",
          f ? ` (${f})` : ""
        ] })
      ] }),
      /* @__PURE__ */ n.jsx("span", { className: "bk-status", "aria-live": "polite", children: l === "Saving…" ? "" : l })
    ] }),
    /* @__PURE__ */ n.jsx("section", { className: "rl-grid", "aria-label": "Business resources", children: e ? h.length ? h.map((x) => {
      const C = Cy(x.url), p = String(x.tags || "").split(",").map((y) => y.trim()).filter(Boolean);
      return /* @__PURE__ */ n.jsxs("article", { className: "rl-card", onDoubleClick: (y) => {
        y.target.closest("a, button") || r(x);
      }, children: [
        /* @__PURE__ */ n.jsxs("div", { className: "rl-card-top", children: [
          /* @__PURE__ */ n.jsx("span", { className: `rl-type-icon rl-type-${String(x.type || "Other").toLowerCase()}`, children: Hh[x.type] || Hh.Other }),
          /* @__PURE__ */ n.jsx("span", { className: "rl-type-name", children: x.type || "Other" }),
          /* @__PURE__ */ n.jsx("button", { type: "button", className: "rl-more", "aria-label": `Edit ${x.title}`, onClick: () => r(x), children: "⋯" })
        ] }),
        /* @__PURE__ */ n.jsx("h2", { children: x.title }),
        /* @__PURE__ */ n.jsx("p", { children: x.description || "No description added." }),
        p.length > 0 && /* @__PURE__ */ n.jsx("div", { className: "rl-tags", children: p.map((y) => /* @__PURE__ */ n.jsx("span", { children: y }, y)) }),
        /* @__PURE__ */ n.jsxs("div", { className: "rl-card-actions", children: [
          C ? /* @__PURE__ */ n.jsxs("a", { className: "ctl primary", href: C, target: "_blank", rel: "noopener noreferrer", children: [
            "Open ",
            /* @__PURE__ */ n.jsx("span", { children: "↗" })
          ] }) : /* @__PURE__ */ n.jsx("span", { className: "rl-no-link", children: "Saved reference" }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl", type: "button", title: x.archived ? "Back to the active list" : "Tuck away (find it under Archived)", onClick: () => o(x.id, !x.archived), children: x.archived ? "↩ Unarchive" : "🗄 Archive" }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl rl-delete", type: "button", onClick: () => {
            confirm(`Remove "${x.title}" from Resources?`) && t((y) => (y.items = y.items.filter((S) => S.id !== x.id), y));
          }, children: "Delete" })
        ] })
      ] }, x.id);
    }) : /* @__PURE__ */ n.jsxs("div", { className: "rl-empty", children: [
      /* @__PURE__ */ n.jsx("div", { children: "▥" }),
      /* @__PURE__ */ n.jsx("h2", { children: a || i ? "Nothing matches that search" : d ? "Nothing archived" : "Build your business library" }),
      /* @__PURE__ */ n.jsx("p", { children: a || i ? "Try another search or resource type." : "Save the documents, videos, templates, tools and links you use repeatedly." }),
      !(a || i) && /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "button", onClick: () => r(v()), children: "＋ Add your first resource" })
    ] }) : null }),
    u && /* @__PURE__ */ n.jsx(U0, { item: u, onClose: () => r(null), onSave: (x) => {
      t((C) => {
        if (u.id) {
          const p = C.items.find((y) => y.id === u.id);
          p && Object.assign(p, x);
        } else C.items.unshift({ id: Ht(), added: Date.now(), ...x });
        return C;
      }), r(null);
    } })
  ] });
}
function U0({ item: e, onClose: t, onSave: l }) {
  const [a, s] = j.useState({ type: e.type || "Document", title: e.title, url: e.url, description: e.description, tags: e.tags }), [i, c] = j.useState(""), u = (r) => (d) => s((m) => ({ ...m, [r]: d.target.value }));
  return j.useEffect(() => {
    const r = (d) => d.key === "Escape" && t();
    return document.addEventListener("keydown", r), () => document.removeEventListener("keydown", r);
  }, [t]), /* @__PURE__ */ n.jsx("div", { className: "sm-dialog", onClick: (r) => {
    r.target === r.currentTarget && t();
  }, children: /* @__PURE__ */ n.jsxs("form", { className: "sm-dialog-card", onKeyDown: (r) => r.stopPropagation(), onSubmit: (r) => {
    if (r.preventDefault(), a.url.trim() && !Cy(a.url)) {
      c("Use an https:// link, an internal /link, or leave it blank.");
      return;
    }
    l({ type: a.type, title: a.title.trim(), url: a.url.trim(), description: a.description.trim(), tags: a.tags.trim() });
  }, children: [
    /* @__PURE__ */ n.jsxs("div", { className: "sm-dialog-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "rl-kicker", children: "RESOURCE" }),
        /* @__PURE__ */ n.jsx("h2", { children: e.id ? "Edit resource" : "Add resource" })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "sm-icon-btn", type: "button", "aria-label": "Close", onClick: t, children: "×" })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Type",
      /* @__PURE__ */ n.jsx("select", { value: a.type, onChange: u("type"), children: wy.map((r) => /* @__PURE__ */ n.jsx("option", { children: r }, r)) })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Title",
      /* @__PURE__ */ n.jsx("input", { required: !0, autoFocus: !0, placeholder: "Resource name", value: a.title, onChange: u("title") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Link",
      /* @__PURE__ */ n.jsx("input", { placeholder: "https://… or an internal /link", value: a.url, onChange: u("url") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Description",
      /* @__PURE__ */ n.jsx("textarea", { rows: 3, placeholder: "What this is and when to use it", value: a.description, onChange: u("description") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Tags",
      /* @__PURE__ */ n.jsx("input", { placeholder: "sales, onboarding, scripts", value: a.tags, onChange: u("tags") })
    ] }),
    /* @__PURE__ */ n.jsx("p", { className: "sm-form-error", role: "alert", children: i }),
    /* @__PURE__ */ n.jsxs("div", { className: "sm-dialog-actions", children: [
      /* @__PURE__ */ n.jsx("button", { className: "ctl", type: "button", onClick: t, children: "Cancel" }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "submit", children: "Save resource" })
    ] })
  ] }) });
}
function L0() {
  const { doc: e, status: t } = Nt("statement-content", { sections: [] }), l = (e == null ? void 0 : e.sections) || [], a = l.reduce((f, o) => f + o.items.length, 0), [s, i] = j.useState(/* @__PURE__ */ new Set()), [c, u] = j.useState(/* @__PURE__ */ new Set()), r = j.useRef(void 0);
  j.useEffect(() => {
    Q("/api/statement-box").then((f) => i(new Set(f.ticked || []))).catch(() => {
    });
  }, []);
  const d = (f, o) => i((h) => {
    const v = new Set(h);
    return o ? v.add(f) : v.delete(f), window.clearTimeout(r.current), r.current = window.setTimeout(() => fetch("/api/statement-box", { method: "POST", body: JSON.stringify({ ticked: [...v] }), keepalive: !0 }).catch(() => {
    }), 400), v;
  }), m = (f) => u((o) => {
    const h = new Set(o);
    return h.has(f) ? h.delete(f) : h.add(f), h;
  });
  return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc", id: "sb-doc", children: [
    /* @__PURE__ */ n.jsxs("div", { className: "sb-count", children: [
      s.size,
      " of ",
      a,
      " drilled 20 times"
    ] }),
    t && /* @__PURE__ */ n.jsxs("p", { role: "alert", children: [
      "Could not load statement content: ",
      t
    ] }),
    e && !l.length && /* @__PURE__ */ n.jsx("p", { children: "No statement content has been configured on this installation." }),
    l.map((f, o) => /* @__PURE__ */ n.jsxs("section", { children: [
      /* @__PURE__ */ n.jsx("h2", { children: f.title }),
      f.ask && /* @__PURE__ */ n.jsx("div", { className: "sb-ask", children: f.ask }),
      f.items.map((h, v) => {
        const x = `${o}-${v}`, C = s.has(x);
        return /* @__PURE__ */ n.jsxs("div", { className: "sb-item", children: [
          /* @__PURE__ */ n.jsxs("div", { className: `sb-row${C ? " done" : ""}${h.b ? " has-body" : ""}${c.has(x) ? " open" : ""}`, onClick: () => h.b && m(x), children: [
            /* @__PURE__ */ n.jsx("span", { className: "sb-arrow", children: "▸" }),
            /* @__PURE__ */ n.jsx("span", { className: "sb-title", children: h.t }),
            /* @__PURE__ */ n.jsxs("label", { className: "sb-drill", onClick: (p) => p.stopPropagation(), children: [
              /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: C, onChange: (p) => d(x, p.target.checked) }),
              " Drilled 20 times?"
            ] })
          ] }),
          h.b && /* @__PURE__ */ n.jsx("div", { className: "sb-body", children: h.b })
        ] }, x);
      })
    ] }, o))
  ] });
}
function B0() {
  return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc", children: [
    /* @__PURE__ */ n.jsx("h2", { children: "📨 Integrated messaging" }),
    /* @__PURE__ */ n.jsxs("div", { className: "msg-soon", children: [
      /* @__PURE__ */ n.jsx("h3", { children: "Coming soon" }),
      /* @__PURE__ */ n.jsxs("div", { className: "msg-chips", children: [
        /* @__PURE__ */ n.jsx("span", { title: "Facebook", children: "FB" }),
        /* @__PURE__ */ n.jsx("span", { title: "Instagram", children: "IG" }),
        /* @__PURE__ */ n.jsx("span", { title: "WhatsApp", children: "WPP" })
      ] })
    ] })
  ] });
}
const H0 = `<article class="selfdev-doc">
    <h2>Sales</h2>
    <ul>
      <li>4+ calls daily, 30% close rate = ~4.5 hours on call = 90 calls a month (23x4) = 27 sales = assume 160gbp per sale if some drop outs long term = 4320 + 800 base = 5120gbp = 6800 $USD/mo.</li>
      <li>30 minutes follow up</li>
      <li>1 hour training min (rn focus = D1 and fear split)</li>
    </ul>
    <p>Total time = 6+ hours x 6 days a week</p>

    <h2>Self development</h2>
    <ul>
      <li>operating out of soul alignment, truth, rawness, call a spade a spade, no bullshit, don't manufacture narratives to feed ego</li>
      <li>seek discomfort – if lost for where to find discomfort then start with a cold shower</li>
      <li>observing and improving decisions, buying decisions</li>
      <li>journalling, self forgiveness (meditation or otherwise)</li>
      <li>subconscious programming (holding cash, affirmations, meditation, visualising at times)</li>
      <li>observing the "wave" and momentum I am on without automatically identifying with it</li>
      <li>striving for my life vision</li>
      <li>"if this was my last day on Earth, what would I do differently?" living in the here in now</li>
      <li>information minimisation, avoiding information overload</li>
      <li>get fucking ripped, great job so far</li>
    </ul>
    <ul>
      <li>"how can I get the most out of my day with the least amount of time, energy and effort, and continue to create leverage, so that I can manifest my vision ASAP?"</li>
      <li>"what tools, systems, mindsets, beliefs or habits will facilitate this?"</li>
      <li>what can I double or triple stack on my calendar without creating additional strain? How can I get more input per unit of time or slot?</li>
    </ul>
    <p>Pairing activities that require rest (workout) or little focus (walking) with additional activity (listening, reading, subconscious reprogramming, note taking, social)</p>
    <p>1 hour of drilling specific bottlenecks in sales can produce more income than generic training.</p>

    <h2>Music</h2>
    <p>1.5 hours is the standard of practice, going to double up from temporary dip to 40 minutes.</p>

    <h2>Fitness</h2>
    <p class="selfdev-note">(target 77.5kg BW end of month)</p>
    <p>Cutting – going great, keep going</p>
    <p>Strength – more consistent with lower body (lunges) and chin-ups (as of 3rd October), maintain 25+ chin-ups and back to 30 dips.</p>

    <h2>Dating</h2>
    <ul>
      <li>45 minutes of meditation daily immediately prescribed, at least 1 30 minute session.</li>
      <li>First date closes from here out only, BAMFAM scheduled, physical escalation or gtfo. No half measures.</li>
      <li>loosen qualification criteria for now, approach EVERY hot girl, avoid filtering by vibe too much.</li>
    </ul>

    <h2>Journal Prompt</h2>
    <p>What would the 50k/version of myself do differently today/tomorrow? What would the version of me with amazing relationship do? Am I allowing myself to be maximally happy? Am I going about my life today in decisiveness as I would like my prospects to? If I were self sabotaging, where? Is my mind clear, because how can I expect people to make clear confident decisions if I am not clear?</p>
  </article>
`;
function Y0() {
  return /* @__PURE__ */ n.jsx("div", { dangerouslySetInnerHTML: { __html: H0 } });
}
const Rc = [["prep", "Pre-call prep"], ["rapport", "Rapport"], ["discovery", "Discovery"], ["tonality", "Tonality"], ["script", "Script"], ["objections", "Objection handling"], ["closing", "Closing"], ["followup", "Follow-up"]], q0 = ["1-1", "Call review", "Role-play", "Shadowing", "Group"], Pr = [{ key: "training", label: "Training", unit: "h", target: 3 }, { key: "roleplay", label: "Role-plays", unit: "", target: 3 }, { key: "submitted", label: "Calls submitted", unit: "", target: 2 }, { key: "listen", label: "Call listen-backs", unit: "", target: 2 }, { key: "drills", label: "Script drills", unit: "", target: 5 }], gn = ["#2563eb", "#16a34a", "#db2777", "#ea580c", "#7c3aed", "#0891b2", "#ca8a04", "#475569"], Jl = (e) => e ? (/* @__PURE__ */ new Date(e + "T12:00:00")).toLocaleDateString(void 0, { weekday: "short", day: "numeric", month: "short" }) : "", Kn = (e) => e ? Math.round(((/* @__PURE__ */ new Date(Ce() + "T12:00:00")).getTime() - (/* @__PURE__ */ new Date(e + "T12:00:00")).getTime()) / 864e5) : null, eo = (e) => {
  const t = /* @__PURE__ */ new Date(e + "T12:00:00");
  return t.setDate(t.getDate() - (t.getDay() + 6) % 7), t.toLocaleDateString("en-CA");
}, Ss = (e) => {
  const t = /* @__PURE__ */ new Date(eo(Ce()) + "T12:00:00");
  return t.setDate(t.getDate() - 7 * e), t.toLocaleDateString("en-CA");
}, Ty = (e) => (e || "?").split(/\s+/).map((t) => t[0]).join("").slice(0, 2).toUpperCase(), Vn = (e) => (e.sessions || []).map((t) => t.date).sort().pop() || null, G0 = (e, t) => {
  const l = (e.skills || {})[t] || [];
  return l.length ? l[l.length - 1].score : null;
}, $0 = (e) => {
  const t = Rc.map(([l, a]) => [a, G0(e, l)]).filter(([, l]) => l != null);
  return t.length ? t.sort((l, a) => l[1] - a[1])[0] : null;
}, K0 = (e, t = 4) => {
  const l = (e.numbers || []).slice().sort((i, c) => c.week.localeCompare(i.week)).slice(0, t), a = l.reduce((i, c) => i + (+c.calls || 0), 0), s = l.reduce((i, c) => i + (+c.closes || 0), 0);
  return a ? Math.round(s / a * 100) : null;
}, dc = (e) => (e.actions || []).filter((t) => !t.done), Yh = (e) => (e.sessions || []).filter((t) => t.date.slice(0, 7) === Ce().slice(0, 7)).length, ws = (e) => e.habits && e.habits.length ? e.habits : Pr, Cs = (e, t) => {
  const l = (e.checkins || {})[t] || {}, a = ws(e);
  return { hit: a.filter((s) => (+l[s.key] || 0) >= +s.target).length, total: a.length, any: Object.keys(l).length > 0 };
}, to = (e, t = 4) => {
  let l = 0, a = 0;
  for (let s = 1; s <= t; s++) {
    const i = Cs(e, Ss(s));
    l += i.hit, a += i.total;
  }
  return a ? Math.round(l / a * 100) : null;
}, Ey = (e) => {
  let t = 0;
  for (let l = 1; l < 60; l++) {
    const a = Cs(e, Ss(l));
    if (!a.total || a.hit / a.total < 0.8) break;
    t++;
  }
  return t;
}, fc = (e) => e == null ? "" : e >= 80 ? "ok" : e >= 50 ? "amber" : "red", Dy = (e) => e == null ? "never" : e > 14 ? "red" : e > 7 ? "amber" : "ok", ky = (e, t = "") => e == null ? "never coached" : e === 0 ? "coached today" : t + e + "d ago", Xt = (e) => e.stopPropagation(), Ay = () => {
  try {
    return localStorage.getItem("demoMode") === "1";
  } catch {
    return !1;
  }
}, V0 = ["Jordan Price", "Sam Carter", "Alex Rivera", "Jamie Brooks", "Taylor Quinn", "Morgan Reid", "Chris Lane", "Robin Hale", "Casey Ward", "Drew Fisher"];
function Pt(e) {
  if (!Ay() || !e) return e;
  let t = {};
  try {
    t = JSON.parse(localStorage.getItem("demoRepNames") || "{}") || {};
  } catch {
  }
  if (!t[e]) {
    const l = new Set(Object.values(t));
    t[e] = V0.find((a) => !l.has(a)) || `Rep ${Object.keys(t).length + 1}`;
    try {
      localStorage.setItem("demoRepNames", JSON.stringify(t));
    } catch {
    }
  }
  return t[e];
}
const X0 = (e) => {
  var t;
  return ((t = window.displayName) == null ? void 0 : t.call(window, e)) || e;
};
function Q0({ onNavigate: e }) {
  const { doc: t, update: l, status: a } = Nt("coaching", { reps: [] }), [, s] = j.useState(0);
  j.useEffect(() => {
    const v = () => s((x) => x + 1);
    return window.addEventListener("callstudio:demo-mode", v), () => window.removeEventListener("callstudio:demo-mode", v);
  }, []);
  const [i, c] = j.useState(null), [u, r] = j.useState("sessions"), [d, m] = j.useState(null);
  if (!t) return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc co-doc", children: [
    /* @__PURE__ */ n.jsx("h2", { children: "🧑‍🏫 Rep Coaching" }),
    /* @__PURE__ */ n.jsx("p", { className: "biz-dim", children: a || "Loading…" })
  ] });
  const f = t.reps.find((v) => v.id === i) || null, o = (v) => l((x) => {
    const C = x.reps.find((p) => p.id === i);
    return C && v(C), x;
  }), h = (v, x) => {
    const C = window;
    v.metaKey || v.ctrlKey || !C.selectPerson || (v.preventDefault(), e("studio"), C.selectPerson(x));
  };
  return /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc biz-doc co-doc", children: [
    /* @__PURE__ */ n.jsxs("h2", { children: [
      "🧑‍🏫 Rep Coaching ",
      /* @__PURE__ */ n.jsx("span", { className: "bk-status", children: a })
    ] }),
    /* @__PURE__ */ n.jsx("div", { id: "co-root", children: f ? /* @__PURE__ */ n.jsx(
      J0,
      {
        r: f,
        tab: u,
        setTab: r,
        back: () => c(null),
        edit: o,
        onLog: (v) => m({ kind: "session", s: v }),
        openCall: h,
        onDelete: () => {
          confirm(`Delete ${Pt(f.name)} and all their sessions, scores and numbers? This can't be undone.`) && (l((v) => (v.reps = v.reps.filter((x) => x.id !== f.id), v)), c(null));
        }
      }
    ) : /* @__PURE__ */ n.jsx(Z0, { reps: t.reps, onAdd: () => m({ kind: "rep" }), onOpen: (v, x) => {
      c(v), r(x);
    } }) }),
    (d == null ? void 0 : d.kind) === "rep" && /* @__PURE__ */ n.jsx(lN, { onClose: () => m(null), onSave: (v) => {
      const x = { id: Ht(), ...v, status: "active", colour: gn[t.reps.length % gn.length], sessions: [], skills: {}, numbers: [], actions: [] };
      l((C) => (C.reps.push(x), C)), c(x.id), r("sessions"), m(null);
    } }),
    (d == null ? void 0 : d.kind) === "session" && f && /* @__PURE__ */ n.jsx(aN, { r: f, s: d.s, onClose: () => m(null), onSave: (v, x) => {
      o((C) => {
        C.sessions || (C.sessions = []), C.actions || (C.actions = []);
        let p = d.s ? C.sessions.find((S) => S.id === d.s.id) : void 0;
        p ? Object.assign(p, v) : (p = { id: Ht(), ...v }, C.sessions.push(p));
        const y = C.actions.filter((S) => S.session === p.id);
        C.actions = C.actions.filter((S) => S.session !== p.id).concat(x.map((S) => y.find((w) => w.text === S) || { id: Ht(), text: S, done: !1, due: "", session: p.id }));
      }), m(null);
    } })
  ] });
}
function Z0({ reps: e, onAdd: t, onOpen: l }) {
  const a = e.filter((u) => u.status !== "paused"), s = e.reduce((u, r) => u + (r.sessions || []).filter((d) => d.date.slice(0, 7) === Ce().slice(0, 7)).reduce((d, m) => d + (+m.minutes || 0), 0), 0), i = a.filter((u) => {
    const r = Kn(Vn(u));
    return r == null || r > 7;
  }), c = Ss(0);
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsxs("div", { className: "co-bar", children: [
      /* @__PURE__ */ n.jsx("button", { className: "ctl co-primary", onClick: t, children: "＋ Add rep" }),
      /* @__PURE__ */ n.jsx("span", { className: "co-hint", children: "Click a rep for their sessions, skills, numbers and actions." })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "co-stats", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("b", { children: a.length }),
        /* @__PURE__ */ n.jsx("span", { children: "reps coached" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("b", { children: e.reduce((u, r) => u + Yh(r), 0) }),
        /* @__PURE__ */ n.jsx("span", { children: "sessions this month" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("b", { children: Math.round(s / 6) / 10 }),
        /* @__PURE__ */ n.jsx("span", { children: "hours coached this month" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("b", { children: e.reduce((u, r) => u + dc(r).length, 0) }),
        /* @__PURE__ */ n.jsx("span", { children: "open action items" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { className: i.length ? "warn" : "", children: [
        /* @__PURE__ */ n.jsx("b", { children: i.length }),
        /* @__PURE__ */ n.jsx("span", { children: "due a session (7+ days)" })
      ] })
    ] }),
    e.length ? /* @__PURE__ */ n.jsx("div", { className: "co-grid", children: e.slice().sort((u, r) => +(u.status === "paused") - +(r.status === "paused") || (Kn(Vn(r)) ?? 999) - (Kn(Vn(u)) ?? 999)).map((u) => {
      const r = Kn(Vn(u)), d = $0(u), m = K0(u), f = to(u), o = Ey(u);
      return /* @__PURE__ */ n.jsxs("button", { className: `co-card${u.status === "paused" ? " paused" : ""}`, style: { "--c": u.colour || gn[0] }, onClick: () => l(u.id, "sessions"), children: [
        /* @__PURE__ */ n.jsxs("div", { className: "co-card-top", children: [
          /* @__PURE__ */ n.jsx("span", { className: "co-avatar", children: Ty(Pt(u.name)) }),
          /* @__PURE__ */ n.jsxs("div", { children: [
            /* @__PURE__ */ n.jsx("b", { children: Pt(u.name) }),
            /* @__PURE__ */ n.jsxs("small", { children: [
              u.role || "",
              u.status === "paused" ? " · paused" : ""
            ] })
          ] }),
          /* @__PURE__ */ n.jsx("span", { className: `co-due ${Dy(r)}`, children: ky(r) })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "co-card-nums", children: [
          /* @__PURE__ */ n.jsxs("span", { children: [
            /* @__PURE__ */ n.jsx("b", { children: Yh(u) }),
            " sessions this month"
          ] }),
          /* @__PURE__ */ n.jsxs("span", { children: [
            /* @__PURE__ */ n.jsx("b", { children: m == null ? "—" : m + "%" }),
            " close rate (4 wks)"
          ] }),
          /* @__PURE__ */ n.jsxs("span", { children: [
            /* @__PURE__ */ n.jsx("b", { children: dc(u).length }),
            " open actions"
          ] })
        ] }),
        /* @__PURE__ */ n.jsxs("div", { className: "co-card-acc", children: [
          "🔥 Accountability ",
          /* @__PURE__ */ n.jsx("b", { className: `co-acc ${fc(f)}`, children: f == null ? "—" : f + "%" }),
          " ",
          /* @__PURE__ */ n.jsx("small", { children: "4 wks" }),
          " · this week ",
          /* @__PURE__ */ n.jsxs("b", { children: [
            Cs(u, c).hit,
            "/",
            ws(u).length
          ] }),
          o ? ` · ${o}-week streak` : ""
        ] }),
        /* @__PURE__ */ n.jsx("div", { className: "co-card-skill", children: d ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
          "Work on: ",
          /* @__PURE__ */ n.jsx("b", { children: d[0] }),
          " (",
          d[1],
          "/5)"
        ] }) : "No skills scored yet" })
      ] }, u.id);
    }) }) : /* @__PURE__ */ n.jsxs("div", { className: "co-empty", children: [
      /* @__PURE__ */ n.jsx("h3", { children: "No reps yet" }),
      /* @__PURE__ */ n.jsx("p", { children: "Add the first sales rep you coach. Then log each session: what you worked on, their wins, what to improve and the actions you set." })
    ] }),
    a.length > 0 && /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
      /* @__PURE__ */ n.jsxs("h3", { className: "co-h3", children: [
        "🔥 This week's accountability ",
        /* @__PURE__ */ n.jsxs("small", { children: [
          "week of ",
          Jl(c),
          " · click a rep to log it"
        ] })
      ] }),
      /* @__PURE__ */ n.jsxs("table", { className: "co-table co-acc-table", children: [
        /* @__PURE__ */ n.jsx("thead", { children: /* @__PURE__ */ n.jsxs("tr", { children: [
          /* @__PURE__ */ n.jsx("th", { children: "Rep" }),
          Pr.map((u) => /* @__PURE__ */ n.jsx("th", { children: u.label }, u.key)),
          /* @__PURE__ */ n.jsx("th", { children: "4-week score" })
        ] }) }),
        /* @__PURE__ */ n.jsx("tbody", { children: a.map((u) => {
          const r = (u.checkins || {})[c] || {}, d = ws(u), m = to(u);
          return /* @__PURE__ */ n.jsxs("tr", { onClick: () => l(u.id, "accountability"), children: [
            /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("b", { children: Pt(u.name) }) }),
            Pr.map((f) => {
              const o = d.find((v) => v.key === f.key) || f, h = +r[o.key] || 0;
              return /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsxs("span", { className: `co-hab ${h >= +o.target ? "ok" : h > 0 ? "amber" : "none"}`, children: [
                h,
                o.unit,
                "/",
                o.target,
                o.unit
              ] }) }, o.key);
            }),
            /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("b", { className: `co-acc ${fc(m)}`, children: m == null ? "—" : m + "%" }) })
          ] }, u.id);
        }) })
      ] })
    ] })
  ] });
}
function J0({ r: e, tab: t, setTab: l, back: a, edit: s, onLog: i, openCall: c, onDelete: u }) {
  const r = Kn(Vn(e)), d = Pt(e.name).split(" ")[0], m = [["sessions", "🗓 Sessions"], ["accountability", "🔥 Accountability"], ["skills", "🎯 Skills"], ["numbers", "📊 Numbers"], ["actions", "✅ Actions"], ["profile", "👤 Profile"]];
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsxs("div", { className: "co-bar", children: [
      /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: a, children: "‹ All reps" }),
      /* @__PURE__ */ n.jsx("span", { className: "co-avatar big", style: { "--c": e.colour || gn[0] }, children: Ty(Pt(e.name)) }),
      /* @__PURE__ */ n.jsxs("div", { className: "co-who", children: [
        /* @__PURE__ */ n.jsx("b", { children: Pt(e.name) }),
        /* @__PURE__ */ n.jsxs("small", { children: [
          e.role || "Sales rep",
          " · ",
          /* @__PURE__ */ n.jsx("span", { className: `co-due ${Dy(r)}`, children: ky(r, "last coached ") })
        ] })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl co-primary", onClick: () => i(), children: "＋ Log session" })
    ] }),
    /* @__PURE__ */ n.jsx("nav", { className: "co-tabs", children: m.map(([f, o]) => /* @__PURE__ */ n.jsxs("button", { className: f === t ? "on" : "", onClick: () => l(f), children: [
      o,
      f === "actions" && dc(e).length > 0 && /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
        " ",
        /* @__PURE__ */ n.jsx("i", { children: dc(e).length })
      ] })
    ] }, f)) }),
    /* @__PURE__ */ n.jsxs("div", { className: "co-pane", children: [
      t === "sessions" && /* @__PURE__ */ n.jsx(F0, { r: e, edit: s, onEdit: i, openCall: c }),
      t === "accountability" && /* @__PURE__ */ n.jsx(eN, { r: e, edit: s, first: d }),
      t === "skills" && /* @__PURE__ */ n.jsx(I0, { r: e, edit: s, first: d }),
      t === "numbers" && /* @__PURE__ */ n.jsx(W0, { r: e, edit: s }),
      t === "actions" && /* @__PURE__ */ n.jsx(P0, { r: e, edit: s, first: d }),
      t === "profile" && /* @__PURE__ */ n.jsx(tN, { r: e, edit: s, onDelete: u })
    ] })
  ] });
}
function F0({ r: e, edit: t, onEdit: l, openCall: a }) {
  const s = (e.sessions || []).slice().sort((i, c) => c.date.localeCompare(i.date));
  return s.length ? /* @__PURE__ */ n.jsx(n.Fragment, { children: s.map((i) => {
    const c = (e.actions || []).filter((u) => u.session === i.id);
    return /* @__PURE__ */ n.jsxs("div", { className: "co-session", children: [
      /* @__PURE__ */ n.jsxs("div", { className: "co-s-head", children: [
        /* @__PURE__ */ n.jsx("b", { children: Jl(i.date) }),
        /* @__PURE__ */ n.jsx("span", { className: "co-tag", children: i.type }),
        i.minutes ? /* @__PURE__ */ n.jsxs("span", { className: "co-muted", children: [
          i.minutes,
          " min"
        ] }) : null,
        (i.focus || []).map((u) => /* @__PURE__ */ n.jsx("span", { className: "co-skill-chip", children: (Rc.find((r) => r[0] === u) || [u, u])[1] }, u)),
        i.call && /* @__PURE__ */ n.jsxs("a", { className: "co-call", href: `/?person=${encodeURIComponent(i.call)}`, title: "Open the call in Call Studio", onClick: (u) => a(u, i.call), children: [
          "🎧 ",
          X0(i.call)
        ] }),
        /* @__PURE__ */ n.jsxs("span", { className: "co-s-acts", children: [
          /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => l(i), children: "Edit" }),
          /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => {
            confirm("Delete this session (and the action items set in it)?") && t((u) => {
              u.sessions = u.sessions.filter((r) => r.id !== i.id), u.actions = (u.actions || []).filter((r) => r.session !== i.id);
            });
          }, children: "🗑" })
        ] })
      ] }),
      i.worked && /* @__PURE__ */ n.jsxs("div", { className: "co-s-row", children: [
        /* @__PURE__ */ n.jsx("span", { children: "Worked on" }),
        /* @__PURE__ */ n.jsx("p", { children: i.worked })
      ] }),
      i.wins && /* @__PURE__ */ n.jsxs("div", { className: "co-s-row good", children: [
        /* @__PURE__ */ n.jsx("span", { children: "Wins" }),
        /* @__PURE__ */ n.jsx("p", { children: i.wins })
      ] }),
      i.improve && /* @__PURE__ */ n.jsxs("div", { className: "co-s-row work", children: [
        /* @__PURE__ */ n.jsx("span", { children: "To improve" }),
        /* @__PURE__ */ n.jsx("p", { children: i.improve })
      ] }),
      c.length > 0 && /* @__PURE__ */ n.jsxs("div", { className: "co-s-row", children: [
        /* @__PURE__ */ n.jsx("span", { children: "Actions" }),
        /* @__PURE__ */ n.jsx("p", { children: c.map((u, r) => /* @__PURE__ */ n.jsxs("span", { children: [
          r > 0 && /* @__PURE__ */ n.jsx("br", {}),
          u.done ? "✅" : "⬜",
          " ",
          u.text
        ] }, u.id)) })
      ] })
    ] }, i.id);
  }) }) : /* @__PURE__ */ n.jsx("p", { className: "co-empty-line", children: "No sessions yet. Log your first one with ＋ Log session." });
}
function I0({ r: e, edit: t, first: l }) {
  const a = (s, i) => t((c) => {
    var r;
    c.skills || (c.skills = {});
    const u = (r = c.skills)[s] || (r[s] = []);
    u.length && u[u.length - 1].date === Ce() ? u[u.length - 1].score = i : u.push({ date: Ce(), score: i });
  });
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsxs("p", { className: "co-hint", children: [
      "Tap a score to rate ",
      l,
      " today (1 = needs a lot of work, 5 = excellent). The dots are the history, oldest first."
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "co-skills", children: Rc.map(([s, i]) => {
      const c = (e.skills || {})[s] || [], u = c.length ? c[c.length - 1].score : null, r = c.length ? c[0].score : null;
      return /* @__PURE__ */ n.jsxs("div", { className: "co-skill-row", children: [
        /* @__PURE__ */ n.jsx("b", { children: i }),
        /* @__PURE__ */ n.jsx("span", { className: "co-scores", children: [1, 2, 3, 4, 5].map((d) => /* @__PURE__ */ n.jsx("button", { className: u === d ? "on" : "", onClick: () => a(s, d), children: d }, d)) }),
        /* @__PURE__ */ n.jsx("span", { className: "co-hist", children: c.slice(-12).map((d, m) => /* @__PURE__ */ n.jsx("i", { title: `${Jl(d.date)}: ${d.score}/5`, style: { "--h": `${d.score * 20}%` } }, m)) }),
        /* @__PURE__ */ n.jsx("span", { className: "co-delta", children: c.length > 1 && u != null && r != null ? u - r > 0 ? `▲ ${u - r}` : u - r < 0 ? `▼ ${r - u}` : "＝" : "" })
      ] }, s);
    }) })
  ] });
}
function W0({ r: e, edit: t }) {
  const [l, a] = j.useState({ week: eo(Ce()), calls: "", closes: "", cash: "" }), s = (e.numbers || []).slice().sort((r, d) => d.week.localeCompare(r.week)), i = Math.max(1, ...s.map((r) => +r.calls || 0)), c = () => {
    const r = eo(l.week || Ce());
    t((d) => {
      d.numbers = (d.numbers || []).filter((m) => m.week !== r).concat({ week: r, calls: l.calls, closes: l.closes, cash: l.cash });
    });
  }, u = (r, d = "number") => /* @__PURE__ */ n.jsx("input", { type: d, min: "0", value: l[r], onChange: (m) => a((f) => ({ ...f, [r]: m.target.value })), onKeyDown: Xt });
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsxs("div", { className: "co-num-add", children: [
      "Week of ",
      u("week", "date"),
      " Calls ",
      u("calls"),
      " Closes ",
      u("closes"),
      " Cash $ ",
      u("cash"),
      /* @__PURE__ */ n.jsx("button", { className: "ctl co-primary", onClick: c, children: "Save week" })
    ] }),
    s.length ? /* @__PURE__ */ n.jsxs("table", { className: "co-table", children: [
      /* @__PURE__ */ n.jsx("thead", { children: /* @__PURE__ */ n.jsxs("tr", { children: [
        /* @__PURE__ */ n.jsx("th", { children: "Week of" }),
        /* @__PURE__ */ n.jsx("th", { children: "Calls" }),
        /* @__PURE__ */ n.jsx("th", { children: "Closes" }),
        /* @__PURE__ */ n.jsx("th", { children: "Close rate" }),
        /* @__PURE__ */ n.jsx("th", { children: "Cash" }),
        /* @__PURE__ */ n.jsx("th", {})
      ] }) }),
      /* @__PURE__ */ n.jsx("tbody", { children: s.map((r) => {
        const d = +r.calls ? Math.round(+r.closes / +r.calls * 100) : null;
        return /* @__PURE__ */ n.jsxs("tr", { children: [
          /* @__PURE__ */ n.jsx("td", { children: Jl(r.week) }),
          /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("span", { className: "co-bar-cell", style: { "--w": `${(+r.calls || 0) / i * 100}%` }, children: r.calls || 0 }) }),
          /* @__PURE__ */ n.jsx("td", { children: r.closes || 0 }),
          /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("b", { children: d == null ? "—" : d + "%" }) }),
          /* @__PURE__ */ n.jsx("td", { children: r.cash ? "$" + Number(r.cash).toLocaleString() : "—" }),
          /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => {
            confirm("Delete that week?") && t((m) => {
              m.numbers = m.numbers.filter((f) => f.week !== r.week);
            });
          }, children: "🗑" }) })
        ] }, r.week);
      }) })
    ] }) : /* @__PURE__ */ n.jsx("p", { className: "co-empty-line", children: "No weeks logged yet. Add their calls, closes and cash each week to see if the coaching is moving the numbers." })
  ] });
}
function P0({ r: e, edit: t, first: l }) {
  const [a, s] = j.useState(""), [i, c] = j.useState(""), u = (e.actions || []).slice().sort((d, m) => Number(d.done) - Number(m.done) || (d.due || "9").localeCompare(m.due || "9")), r = () => {
    a.trim() && (t((d) => {
      (d.actions || (d.actions = [])).push({ id: Ht(), text: a.trim(), due: i, done: !1 });
    }), s(""), c(""));
  };
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsxs("div", { className: "co-num-add", children: [
      /* @__PURE__ */ n.jsx("input", { placeholder: `An action for ${l}…  (Enter)`, value: a, onChange: (d) => s(d.target.value), onKeyDown: (d) => {
        Xt(d), d.key === "Enter" && r();
      } }),
      " due ",
      /* @__PURE__ */ n.jsx("input", { type: "date", value: i, onChange: (d) => c(d.target.value), onKeyDown: Xt }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl co-primary", onClick: r, children: "Add" })
    ] }),
    u.length ? u.map((d) => /* @__PURE__ */ n.jsxs("label", { className: `co-action${d.done ? " done" : ""}${!d.done && d.due && d.due < Ce() ? " late" : ""}`, children: [
      /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: d.done, onChange: (m) => t((f) => {
        const o = f.actions.find((h) => h.id === d.id);
        o && (o.done = m.target.checked, o.doneAt = m.target.checked ? Ce() : "");
      }) }),
      /* @__PURE__ */ n.jsx("span", { children: d.text }),
      /* @__PURE__ */ n.jsxs("small", { children: [
        d.due ? "due " + Jl(d.due) : "",
        d.done && d.doneAt ? " · done " + Jl(d.doneAt) : ""
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "co-x", title: "Delete", onClick: (m) => {
        m.preventDefault(), confirm("Delete this action?") && t((f) => {
          f.actions = f.actions.filter((o) => o.id !== d.id);
        });
      }, children: "✕" })
    ] }, d.id)) : /* @__PURE__ */ n.jsx("p", { className: "co-empty-line", children: "No actions yet. Add them here, or in a session." })
  ] });
}
function eN({ r: e, edit: t, first: l }) {
  const a = ws(e), s = Ss(0), i = (e.checkins || {})[s] || {}, c = to(e), u = Ey(e), r = Array.from({ length: 8 }, (m, f) => Ss(f)), d = (m, f, o) => t((h) => {
    var x;
    h.checkins || (h.checkins = {});
    const v = (x = h.checkins)[m] || (x[m] = {});
    o == null ? delete v[f] : v[f] = Math.max(0, o);
  });
  return /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsxs("div", { className: "co-acc-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("b", { className: `co-acc big ${fc(c)}`, children: c == null ? "—" : c + "%" }),
        /* @__PURE__ */ n.jsx("span", { children: "of targets hit, last 4 weeks" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("b", { className: "big", children: u }),
        /* @__PURE__ */ n.jsxs("span", { children: [
          "week",
          u === 1 ? "" : "s",
          " in a row at 80%+"
        ] })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsxs("b", { className: "big", children: [
          Cs(e, s).hit,
          "/",
          a.length
        ] }),
        /* @__PURE__ */ n.jsx("span", { children: "on target so far this week" })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("h3", { className: "co-h3", children: [
      "This week ",
      /* @__PURE__ */ n.jsxs("small", { children: [
        "week of ",
        Jl(s),
        " · what ",
        l,
        " has actually done"
      ] })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "co-habits", children: a.map((m) => {
      const f = +i[m.key] || 0, o = Math.min(100, f / (+m.target || 1) * 100);
      return /* @__PURE__ */ n.jsxs("div", { className: `co-habit ${f >= +m.target ? "done" : ""}`, children: [
        /* @__PURE__ */ n.jsxs("div", { className: "co-habit-top", children: [
          /* @__PURE__ */ n.jsx("b", { children: m.label }),
          /* @__PURE__ */ n.jsxs("span", { children: [
            f,
            m.unit,
            " / ",
            m.target,
            m.unit
          ] })
        ] }),
        /* @__PURE__ */ n.jsx("div", { className: "co-habit-bar", children: /* @__PURE__ */ n.jsx("i", { style: { width: `${o}%` } }) }),
        /* @__PURE__ */ n.jsxs("div", { className: "co-habit-btns", children: [
          /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => d(s, m.key, f - 1), children: "−" }),
          /* @__PURE__ */ n.jsxs("button", { className: "ctl", onClick: () => d(s, m.key, f + 1), children: [
            "＋",
            m.unit === "h" ? " 1h" : ""
          ] }),
          m.unit === "h" && /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: () => d(s, m.key, f + 0.5), children: "＋½h" })
        ] })
      ] }, m.key);
    }) }),
    /* @__PURE__ */ n.jsxs("h3", { className: "co-h3", children: [
      "Week by week ",
      /* @__PURE__ */ n.jsx("small", { children: "edit any number; green = target hit" })
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "co-table-wrap", children: /* @__PURE__ */ n.jsxs("table", { className: "co-table co-acc-hist", children: [
      /* @__PURE__ */ n.jsx("thead", { children: /* @__PURE__ */ n.jsxs("tr", { children: [
        /* @__PURE__ */ n.jsx("th", { children: "Week of" }),
        a.map((m) => /* @__PURE__ */ n.jsxs("th", { children: [
          m.label,
          /* @__PURE__ */ n.jsx("br", {}),
          /* @__PURE__ */ n.jsxs("small", { children: [
            "target ",
            m.target,
            m.unit
          ] })
        ] }, m.key)),
        /* @__PURE__ */ n.jsx("th", { children: "Hit" })
      ] }) }),
      /* @__PURE__ */ n.jsx("tbody", { children: r.map((m) => {
        const f = (e.checkins || {})[m] || {}, o = Cs(e, m);
        return /* @__PURE__ */ n.jsxs("tr", { children: [
          /* @__PURE__ */ n.jsxs("td", { children: [
            Jl(m),
            m === s && /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
              " ",
              /* @__PURE__ */ n.jsx("small", { children: "(now)" })
            ] })
          ] }),
          a.map((h) => {
            const v = f[h.key] ?? "";
            return /* @__PURE__ */ n.jsx("td", { className: v === "" ? "" : +v >= +h.target ? "ok" : "miss", children: /* @__PURE__ */ n.jsx("input", { type: "number", min: "0", step: h.unit === "h" ? "0.5" : "1", defaultValue: v, onKeyDown: Xt, onBlur: (x) => {
              x.target.value !== String(v) && d(m, h.key, x.target.value === "" ? null : Number(x.target.value));
            } }, `${m}-${h.key}-${v}`) }, h.key);
          }),
          /* @__PURE__ */ n.jsx("td", { children: /* @__PURE__ */ n.jsx("b", { className: `co-acc ${o.any ? fc(o.hit / o.total * 100) : ""}`, children: o.any ? `${o.hit}/${o.total}` : "—" }) })
        ] }, m);
      }) })
    ] }) }),
    /* @__PURE__ */ n.jsxs("details", { className: "co-targets", children: [
      /* @__PURE__ */ n.jsxs("summary", { children: [
        "🎯 ",
        l,
        "'s weekly targets"
      ] }),
      /* @__PURE__ */ n.jsx("div", { className: "co-num-add", children: a.map((m, f) => /* @__PURE__ */ n.jsxs("label", { children: [
        m.label,
        " ",
        /* @__PURE__ */ n.jsx("input", { type: "number", min: "0", step: "0.5", defaultValue: m.target, onKeyDown: Xt, onBlur: (o) => t((h) => {
          h.habits = ws(h).map((v, x) => x === f ? { ...v, target: Math.max(0, Number(o.target.value) || 0) } : v);
        }) })
      ] }, m.key)) })
    ] })
  ] });
}
function tN({ r: e, edit: t, onDelete: l }) {
  const a = (s) => (i) => {
    const c = i.target.value.trim();
    t((u) => {
      u[s] = c;
    });
  };
  return /* @__PURE__ */ n.jsxs("div", { className: "co-form", children: [
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Name",
      Ay() ? /* @__PURE__ */ n.jsx("input", { value: Pt(e.name), readOnly: !0, title: "Demo mode is on: switch it off to rename" }) : /* @__PURE__ */ n.jsx("input", { defaultValue: e.name, onBlur: a("name"), onKeyDown: Xt })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Role",
      /* @__PURE__ */ n.jsx("input", { defaultValue: e.role || "", placeholder: "e.g. Closer, Setter, New hire", onBlur: a("role"), onKeyDown: Xt })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Started",
      /* @__PURE__ */ n.jsx("input", { type: "date", defaultValue: e.start || "", onBlur: a("start"), onKeyDown: Xt })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Status",
      /* @__PURE__ */ n.jsxs("select", { value: e.status === "paused" ? "paused" : "active", onChange: a("status"), children: [
        /* @__PURE__ */ n.jsx("option", { value: "active", children: "Active" }),
        /* @__PURE__ */ n.jsx("option", { value: "paused", children: "Paused" })
      ] })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { className: "wide", children: [
      "Goals",
      /* @__PURE__ */ n.jsx("textarea", { rows: 3, defaultValue: e.goal || "", placeholder: "What are they working towards? e.g. 25% close rate by December", onBlur: a("goal"), onKeyDown: Xt })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { className: "wide", children: [
      "Notes",
      /* @__PURE__ */ n.jsx("textarea", { rows: 5, defaultValue: e.notes || "", placeholder: "Personality, how they like feedback, what motivates them…", onBlur: a("notes"), onKeyDown: Xt })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "wide co-colours", children: [
      "Colour ",
      gn.map((s) => /* @__PURE__ */ n.jsx("button", { style: { background: s }, className: (e.colour || gn[0]) === s ? "on" : "", onClick: () => t((i) => {
        i.colour = s;
      }) }, s))
    ] }),
    /* @__PURE__ */ n.jsx("div", { className: "wide", children: /* @__PURE__ */ n.jsxs("button", { className: "ctl co-danger", onClick: l, children: [
      "Delete ",
      Pt(e.name)
    ] }) })
  ] });
}
function lN({ onClose: e, onSave: t }) {
  const [l, a] = j.useState({ name: "", role: "", start: Ce(), goal: "" }), s = (c) => (u) => a((r) => ({ ...r, [c]: u.target.value })), i = () => {
    if (!l.name.trim()) {
      alert("Give them a name.");
      return;
    }
    t({ name: l.name.trim(), role: l.role.trim(), start: l.start, goal: l.goal.trim() });
  };
  return /* @__PURE__ */ n.jsx(rc, { title: "＋ Add a rep", className: "co-modal-card", onClose: e, footer: /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: e, children: "Cancel" }),
    /* @__PURE__ */ n.jsx("button", { className: "ctl cs-primary", onClick: i, children: "Save" })
  ] }), children: /* @__PURE__ */ n.jsxs("div", { className: "co-form", children: [
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Name",
      /* @__PURE__ */ n.jsx("input", { autoFocus: !0, placeholder: "e.g. Jordan Price", value: l.name, onChange: s("name") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Role",
      /* @__PURE__ */ n.jsx("input", { placeholder: "Closer, Setter, New hire…", value: l.role, onChange: s("role") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Started",
      /* @__PURE__ */ n.jsx("input", { type: "date", value: l.start, onChange: s("start") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { className: "wide", children: [
      "Goals",
      /* @__PURE__ */ n.jsx("textarea", { rows: 3, placeholder: "What are they working towards?", value: l.goal, onChange: s("goal") })
    ] })
  ] }) });
}
function aN({ r: e, s: t, onClose: l, onSave: a }) {
  const s = (window.people || []).map((f) => f.name), [i, c] = j.useState({
    date: (t == null ? void 0 : t.date) || Ce(),
    type: (t == null ? void 0 : t.type) || "1-1",
    minutes: String((t == null ? void 0 : t.minutes) ?? 30),
    call: (t == null ? void 0 : t.call) || "",
    worked: (t == null ? void 0 : t.worked) || "",
    wins: (t == null ? void 0 : t.wins) || "",
    improve: (t == null ? void 0 : t.improve) || "",
    actions: t ? (e.actions || []).filter((f) => f.session === t.id).map((f) => f.text).join(`
`) : ""
  }), [u, r] = j.useState((t == null ? void 0 : t.focus) || []), d = (f) => (o) => c((h) => ({ ...h, [f]: o.target.value })), m = () => a({ date: i.date || Ce(), type: i.type, minutes: i.minutes, call: i.call.trim(), worked: i.worked.trim(), wins: i.wins.trim(), improve: i.improve.trim(), focus: u }, i.actions.split(`
`).map((f) => f.trim()).filter(Boolean));
  return /* @__PURE__ */ n.jsx(rc, { title: t ? "Edit session" : `＋ Session with ${Pt(e.name)}`, className: "co-modal-card", onClose: l, footer: /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsx("button", { className: "ctl", onClick: l, children: "Cancel" }),
    /* @__PURE__ */ n.jsx("button", { className: "ctl cs-primary", onClick: m, children: "Save" })
  ] }), children: /* @__PURE__ */ n.jsxs("div", { className: "co-form", children: [
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Date",
      /* @__PURE__ */ n.jsx("input", { type: "date", value: i.date, onChange: d("date") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Type",
      /* @__PURE__ */ n.jsx("select", { value: i.type, onChange: d("type"), children: q0.map((f) => /* @__PURE__ */ n.jsx("option", { children: f }, f)) })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Minutes",
      /* @__PURE__ */ n.jsx("input", { type: "number", min: "0", value: i.minutes, onChange: d("minutes") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Call reviewed (optional)",
      /* @__PURE__ */ n.jsx("input", { list: "co-calls", placeholder: "a call in Call Studio", value: i.call, onChange: d("call") }),
      /* @__PURE__ */ n.jsx("datalist", { id: "co-calls", children: s.map((f) => /* @__PURE__ */ n.jsx("option", { value: f }, f)) })
    ] }),
    /* @__PURE__ */ n.jsxs("div", { className: "wide co-focus", children: [
      "Focus ",
      Rc.map(([f, o]) => /* @__PURE__ */ n.jsxs("label", { className: "co-chip", children: [
        /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: u.includes(f), onChange: (h) => r((v) => h.target.checked ? [...v, f] : v.filter((x) => x !== f)) }),
        " ",
        o
      ] }, f))
    ] }),
    /* @__PURE__ */ n.jsxs("label", { className: "wide", children: [
      "What we worked on",
      /* @__PURE__ */ n.jsx("textarea", { rows: 3, value: i.worked, onChange: d("worked") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Wins",
      /* @__PURE__ */ n.jsx("textarea", { rows: 3, value: i.wins, onChange: d("wins") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "To improve",
      /* @__PURE__ */ n.jsx("textarea", { rows: 3, value: i.improve, onChange: d("improve") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { className: "wide", children: [
      "Action items ",
      /* @__PURE__ */ n.jsx("small", { children: "(one per line)" }),
      /* @__PURE__ */ n.jsx("textarea", { rows: 3, placeholder: `Role-play the price objection 3x
Listen back to Tuesday's call`, value: i.actions, onChange: d("actions") })
    ] })
  ] }) });
}
const nN = (e) => {
  const t = String(e || "").trim();
  return /^(https?:\/\/|\/)/i.test(t) && !/^\/\//.test(t);
}, qh = (e) => {
  const t = document.createElement("a");
  t.href = e, t.target = "_blank", t.rel = "noopener", document.body.appendChild(t), t.click(), t.remove();
};
function sN() {
  const { doc: e, update: t, status: l } = Nt("sheetmusic", { items: [] }), [a, s] = j.useState(null), [i, c] = j.useState(""), [u, r] = j.useState(!1), d = j.useRef(0), m = (e == null ? void 0 : e.items) || [], f = async (o) => {
    const h = [...o].filter((x) => x.type === "application/pdf" || /\.pdf$/i.test(x.name));
    if (!h.length) {
      c("⚠️ Drop PDF files only");
      return;
    }
    const v = [];
    for (let x = 0; x < h.length; x++) {
      const C = h[x];
      c(`Uploading ${x + 1} of ${h.length}…`);
      try {
        const p = await fetch("/api/sheet-music-upload", { method: "POST", body: C, headers: { "X-Filename": encodeURIComponent(C.name) } }), y = await p.json();
        if (!p.ok) throw new Error(y.error || "Upload failed");
        v.push({ id: Ht(), title: C.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Untitled score", composer: "", url: y.url, notes: "", added: Date.now(), uploaded: !0 });
      } catch (p) {
        c(`⚠️ ${C.name}: ${p instanceof Error ? p.message : p}`);
        break;
      }
    }
    v.length && (t((x) => (x.items.unshift(...v.reverse()), x)), c(`${v.length} PDF${v.length === 1 ? "" : "s"} added ✓`), setTimeout(() => c((x) => /added/.test(x) ? "" : x), 1800));
  };
  return /* @__PURE__ */ n.jsxs(
    "div",
    {
      id: "music-view",
      className: u ? "sm-dragging" : "",
      style: { minHeight: "100%" },
      onDragEnter: (o) => {
        o.preventDefault(), d.current++, r(!0);
      },
      onDragOver: (o) => {
        o.preventDefault(), o.dataTransfer.dropEffect = "copy";
      },
      onDragLeave: (o) => {
        o.preventDefault(), d.current--, d.current <= 0 && (d.current = 0, r(!1));
      },
      onDrop: (o) => {
        o.preventDefault(), d.current = 0, r(!1), f(o.dataTransfer.files);
      },
      children: [
        /* @__PURE__ */ n.jsxs("main", { className: "sm-wrap", children: [
          /* @__PURE__ */ n.jsxs("header", { className: "sm-hero", children: [
            /* @__PURE__ */ n.jsxs("div", { children: [
              /* @__PURE__ */ n.jsx("span", { className: "sm-kicker", children: "PERSONAL · MUSIC" }),
              /* @__PURE__ */ n.jsx("h1", { children: "Sheet music" }),
              /* @__PURE__ */ n.jsx("p", { children: "Your PDF library for practice, rehearsal and sight-reading." })
            ] }),
            /* @__PURE__ */ n.jsxs("div", { className: "sm-hero-actions", children: [
              /* @__PURE__ */ n.jsxs("a", { className: "ctl sm-sightreading", href: "https://sightreadingfactory.com/", target: "_blank", rel: "noopener noreferrer", children: [
                "♫ Sight Reading Factory ",
                /* @__PURE__ */ n.jsx("span", { children: "↗" })
              ] }),
              /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "button", onClick: () => s({ id: "", title: "", composer: "", url: "", notes: "" }), children: "＋ Add PDF" })
            ] })
          ] }),
          /* @__PURE__ */ n.jsxs("div", { className: "sm-toolbar", children: [
            /* @__PURE__ */ n.jsxs("strong", { children: [
              m.length,
              " ",
              m.length === 1 ? "piece" : "pieces"
            ] }),
            /* @__PURE__ */ n.jsx("span", { className: "bk-status", "aria-live": "polite", children: i || (l === "Saving…" ? "" : l) })
          ] }),
          /* @__PURE__ */ n.jsx("section", { className: "sm-gallery", "aria-label": "Sheet music PDF gallery", children: e ? m.length ? m.map((o, h) => /* @__PURE__ */ n.jsxs("article", { className: "sm-card", children: [
            /* @__PURE__ */ n.jsxs("button", { className: "sm-cover", type: "button", "aria-label": `Open ${o.title}`, onClick: () => qh(o.url), children: [
              /* @__PURE__ */ n.jsx("span", { className: "sm-cover-number", children: String(h + 1).padStart(2, "0") }),
              /* @__PURE__ */ n.jsx("span", { className: "sm-clef", children: "𝄞" }),
              /* @__PURE__ */ n.jsx("span", { className: "sm-cover-title", children: o.title }),
              /* @__PURE__ */ n.jsx("span", { className: "sm-cover-composer", children: o.composer || "Sheet music" })
            ] }),
            /* @__PURE__ */ n.jsxs("div", { className: "sm-card-info", children: [
              /* @__PURE__ */ n.jsxs("div", { children: [
                /* @__PURE__ */ n.jsx("h2", { children: o.title }),
                /* @__PURE__ */ n.jsx("p", { children: o.composer || "No composer added" })
              ] }),
              /* @__PURE__ */ n.jsx("button", { className: "sm-card-more", type: "button", "aria-label": `Edit ${o.title}`, onClick: () => s(o), children: "⋯" })
            ] }),
            o.notes && /* @__PURE__ */ n.jsx("p", { className: "sm-card-notes", children: o.notes }),
            /* @__PURE__ */ n.jsxs("div", { className: "sm-card-actions", children: [
              /* @__PURE__ */ n.jsxs("button", { className: "ctl", type: "button", onClick: () => qh(o.url), children: [
                "Open PDF ",
                /* @__PURE__ */ n.jsx("span", { children: "↗" })
              ] }),
              /* @__PURE__ */ n.jsx("button", { className: "ctl sm-delete", type: "button", onClick: () => {
                confirm(`Remove "${o.title}" from the gallery?

The original PDF will not be deleted.`) && t((v) => (v.items = v.items.filter((x) => x.id !== o.id), v));
              }, children: "Delete" })
            ] })
          ] }, o.id)) : /* @__PURE__ */ n.jsxs("div", { className: "sm-empty", children: [
            /* @__PURE__ */ n.jsx("div", { className: "sm-empty-mark", children: "♫" }),
            /* @__PURE__ */ n.jsx("h2", { children: "Your sheet music will live here" }),
            /* @__PURE__ */ n.jsx("p", { children: "Drop PDFs here, or add the internal PDF links when you have them. Each piece will appear as a visual card you can open in one click." }),
            /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "button", onClick: () => s({ id: "", title: "", composer: "", url: "", notes: "" }), children: "＋ Add your first PDF" })
          ] }) : null }),
          /* @__PURE__ */ n.jsx("p", { className: "sm-drop-hint", children: "Drop PDF files anywhere on this page to add them" })
        ] }),
        a && /* @__PURE__ */ n.jsx(iN, { piece: a, onClose: () => s(null), onSave: (o) => {
          t((h) => {
            if (a.id) {
              const v = h.items.find((x) => x.id === a.id);
              v && Object.assign(v, o);
            } else h.items.unshift({ id: Ht(), added: Date.now(), ...o });
            return h;
          }), s(null);
        } })
      ]
    }
  );
}
function iN({ piece: e, onClose: t, onSave: l }) {
  const [a, s] = j.useState({ title: e.title, composer: e.composer, url: e.url, notes: e.notes }), [i, c] = j.useState(""), u = (r) => (d) => s((m) => ({ ...m, [r]: d.target.value }));
  return j.useEffect(() => {
    const r = (d) => d.key === "Escape" && t();
    return document.addEventListener("keydown", r), () => document.removeEventListener("keydown", r);
  }, [t]), /* @__PURE__ */ n.jsx("div", { className: "sm-dialog", onClick: (r) => {
    r.target === r.currentTarget && t();
  }, children: /* @__PURE__ */ n.jsxs("form", { className: "sm-dialog-card", onKeyDown: (r) => r.stopPropagation(), onSubmit: (r) => {
    if (r.preventDefault(), !nN(a.url)) {
      c("Use an https:// link or an internal link beginning with /.");
      return;
    }
    l({ title: a.title.trim(), composer: a.composer.trim(), url: a.url.trim(), notes: a.notes.trim() });
  }, children: [
    /* @__PURE__ */ n.jsxs("div", { className: "sm-dialog-head", children: [
      /* @__PURE__ */ n.jsxs("div", { children: [
        /* @__PURE__ */ n.jsx("span", { className: "sm-kicker", children: "SHEET MUSIC" }),
        /* @__PURE__ */ n.jsx("h2", { children: e.id ? "Edit sheet music" : "Add a PDF" })
      ] }),
      /* @__PURE__ */ n.jsx("button", { className: "sm-icon-btn", type: "button", "aria-label": "Close", onClick: t, children: "×" })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Title",
      /* @__PURE__ */ n.jsx("input", { required: !0, autoFocus: !0, placeholder: "e.g. Clair de Lune", value: a.title, onChange: u("title") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Composer or collection ",
      /* @__PURE__ */ n.jsx("input", { placeholder: "Optional", value: a.composer, onChange: u("composer") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "PDF link ",
      /* @__PURE__ */ n.jsx("input", { required: !0, placeholder: "Paste an internal or https:// link", value: a.url, onChange: u("url") })
    ] }),
    /* @__PURE__ */ n.jsxs("label", { children: [
      "Notes ",
      /* @__PURE__ */ n.jsx("textarea", { rows: 3, placeholder: "Key, level, fingering notes…", value: a.notes, onChange: u("notes") })
    ] }),
    /* @__PURE__ */ n.jsx("p", { className: "sm-form-error", role: "alert", children: i }),
    /* @__PURE__ */ n.jsxs("div", { className: "sm-dialog-actions", children: [
      /* @__PURE__ */ n.jsx("button", { className: "ctl", type: "button", onClick: t, children: "Cancel" }),
      /* @__PURE__ */ n.jsx("button", { className: "ctl primary", type: "submit", children: "Save to gallery" })
    ] })
  ] }) });
}
const ii = [
  {
    id: "p0",
    text: "(Time) Upgrade eScooter – $250–$800"
  },
  {
    id: "p1",
    text: "(Wealth/Necessity) Pay off Loans – $200 a month"
  },
  {
    id: "p2",
    text: "(Freedom) Go to Thailand – $600 round trip"
  },
  {
    id: "p3",
    text: "(Joy) Burner classical guitar – $300"
  },
  {
    id: "p4",
    text: "(Joy) 15.6 inch tablet AND accessories – $450"
  },
  {
    id: "p5",
    text: "(Time) 2nd Airfryer – $110"
  },
  {
    id: "p6",
    text: "(Status) Trousers x 2, Shorts x 2 – $300"
  },
  {
    id: "p7",
    text: "(Wealth) Invest $5000/month for long term investments"
  },
  {
    id: "p8",
    text: "(Time/Wealth) Hire a cleaner $80/month."
  },
  {
    id: "p9",
    text: "(Comfort) Upgrade apartment – $750/month (+ $300)"
  },
  {
    id: "p10",
    text: "(Freedom) Go to Brazil – $1000 round trip"
  },
  {
    id: "p11",
    text: "(Joy) Acoustic guitar – $700"
  },
  {
    id: "p12",
    text: "(Necessity) Phone – $500+"
  },
  {
    id: "p13",
    text: "(Wealth) Replace laptop battery – $300"
  },
  {
    id: "p14",
    text: "(Status) Loafers – $300"
  },
  {
    id: "p15",
    text: "(Status) Black Chelsea Boots – $400"
  },
  {
    id: "p16",
    text: "(Status/Comfort) LASIK – $4500"
  },
  {
    id: "p17",
    text: "(Joy) 3 Months Guitar Education/Lessons, $300-$500"
  },
  {
    id: "p18",
    text: "(Time/Family) Self-driving Car – $20,000"
  },
  {
    id: "p19",
    text: "(Status/Family) Gun Training – $1000"
  },
  {
    id: "p20",
    text: "(Status/Family) 40 1-1 Boxings – $1000"
  },
  {
    id: "p21",
    text: "(Joy) Classical Guitar Case – $1000?"
  },
  {
    id: "p22",
    text: "(Joy) Shibari Workshop or similar – $300?"
  },
  {
    id: "p23",
    text: "50 1-1 dance classes $1200"
  },
  {
    id: "p24",
    text: "Xteink 4 $110"
  },
  {
    id: "p25",
    text: "Oura Ring 5 – $560 (450 USD in NZ; Oura Ring 4 is 275 USD in NZ)"
  },
  {
    id: "p26",
    text: "Loop Earplugs x 3"
  },
  {
    id: "p27",
    text: "Loop Eclipse"
  },
  {
    id: "p28",
    text: "Smartwatch – $210"
  },
  {
    id: "p29",
    text: "Walking pad – about $370"
  }
], ci = "Purchase List", Gh = ["Time", "Wealth", "Freedom", "Joy", "Status", "Comfort", "Necessity", "Family"], $h = ["Health", "Growth", "Skill", "Sleep", "Fun"], ui = (e) => {
  const t = /^\(([^)]+)\)\s*(.*)$/.exec(e);
  return t ? { tags: t[1].split("/").map((l) => l.trim()).filter(Boolean), body: t[2] } : { tags: [], body: e };
}, cN = /\$\s?(\d[\d,]*(?:\.\d+)?)(?:\s*[–-]\s*\$?\s?(\d[\d,]*(?:\.\d+)?))?\+?(\s*(?:\/\s*month|a month|per month|\/\s*mo\b))?/gi, Kh = (e) => parseFloat(String(e).replace(/,/g, "")), ri = (e) => "$" + Math.round(e).toLocaleString(), is = (e, t) => {
  try {
    if (t === void 0) return localStorage.getItem(e);
    localStorage.setItem(e, t);
  } catch {
  }
  return null;
};
function uN({ text: e }) {
  const t = /^\(([^)]+)\)\s*(.*)$/.exec(e);
  return t ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsxs("span", { className: "pl-tag", children: [
      "(",
      t[1],
      ")"
    ] }),
    " ",
    t[2]
  ] }) : /* @__PURE__ */ n.jsx(n.Fragment, { children: e });
}
function rN() {
  const [e, t] = j.useState({ title: ci, items: [], order: ii.map((N) => N.id), stars: {}, texts: {}, tags: {} }), [l, a] = j.useState(null), [s, i] = j.useState(null), [c, u] = j.useState(null), [r, d] = j.useState(null), m = j.useRef();
  j.useEffect(() => {
    Q("/api/purchase-list").then((N) => {
      const _ = (N.items || []).filter((b) => b && b.id && b.text).map((b) => ({ id: String(b.id), text: String(b.text) })), E = /* @__PURE__ */ new Set([...ii.map((b) => b.id), ..._.map((b) => b.id)]), T = (N.order || []).filter((b) => E.has(b));
      E.forEach((b) => {
        T.includes(b) || T.push(b);
      }), t({ title: String(N.title || ci).replace(/\s+/g, " ").trim() || ci, items: _, order: T, stars: N.stars || {}, texts: N.texts || {}, tags: N.tags || {} });
    }).catch(() => {
    });
  }, []);
  const f = j.useCallback((N) => t((_) => {
    const E = N(structuredClone(_));
    return window.clearTimeout(m.current), m.current = window.setTimeout(() => fetch("/api/purchase-list", { method: "POST", body: JSON.stringify(E), keepalive: !0 }).catch(() => {
    }), 400), E;
  }), []), o = (N) => {
    var _;
    return e.texts[N] || ((_ = e.items.find((E) => E.id === N) || ii.find((E) => E.id === N)) == null ? void 0 : _.text) || "";
  }, h = (N) => e.tags[N] || ui(o(N)).tags, v = (N) => {
    if (!e.tags[N]) return o(N);
    const _ = e.tags[N];
    return (_.length ? `(${_.join("/")}) ` : "") + ui(o(N)).body;
  }, x = [...e.order].sort((N, _) => (e.stars[_] || 0) - (e.stars[N] || 0));
  let C = 0, p = 0, y = 0, S = 0;
  e.order.forEach((N) => {
    let _ = !1;
    for (const E of v(N).replace(/^\([^)]*\)\s*/, "").replace(/\((?!\s*\+)[^)]*\)/g, "").matchAll(cN)) {
      const T = Kh(E[1]), b = E[2] ? Kh(E[2]) : T;
      E[3] ? y += Math.min(T, b) : (C += Math.min(T, b), p += Math.max(T, b)), _ = !0;
    }
    _ && S++;
  });
  const w = (N, _) => f((E) => {
    var g;
    const T = (E.tags[N] || ui(E.texts[N] || ((g = E.items.find((A) => A.id === N) || ii.find((A) => A.id === N)) == null ? void 0 : g.text) || "").tags).slice(), b = T.findIndex((A) => A.toLowerCase() === _.toLowerCase());
    return b >= 0 ? T.splice(b, 1) : T.push(_), E.tags[N] = T, E;
  }), [D, U] = j.useState(() => is("purchaseNotesMin") === "1");
  return /* @__PURE__ */ n.jsxs("div", { id: "purchase-view", className: `pn-shown${D ? "" : " pn-open"}`, children: [
    /* @__PURE__ */ n.jsx(fN, { min: D, setMin: (N) => {
      U(N), is("purchaseNotesMin", N ? "1" : "0");
    } }),
    /* @__PURE__ */ n.jsxs("article", { className: "selfdev-doc", children: [
      /* @__PURE__ */ n.jsxs("div", { className: "pl-heading-row", children: [
        /* @__PURE__ */ n.jsx(
          "h2",
          {
            id: "pl-title",
            contentEditable: !0,
            suppressContentEditableWarning: !0,
            spellCheck: !1,
            role: "textbox",
            "aria-label": "Purchase list title",
            title: "Click to edit · Enter to save · Escape to cancel",
            onKeyDown: (N) => {
              N.stopPropagation(), N.key === "Enter" ? (N.preventDefault(), N.currentTarget.blur()) : N.key === "Escape" && (N.preventDefault(), N.currentTarget.textContent = e.title, N.currentTarget.blur());
            },
            onBlur: (N) => {
              const _ = (N.currentTarget.textContent || "").replace(/\s+/g, " ").trim() || ci;
              N.currentTarget.textContent = _, _ !== e.title && f((E) => (E.title = _, E));
            },
            onPaste: (N) => {
              N.preventDefault(), document.execCommand("insertText", !1, N.clipboardData.getData("text/plain"));
            },
            children: e.title
          },
          e.title
        ),
        /* @__PURE__ */ n.jsx("button", { className: "ctl", id: "pl-add-item", onClick: () => {
          const N = (prompt("New purchase item (you can include a tag and price):", "(Joy) ") || "").replace(/\s+/g, " ").trim();
          if (!N || N === "(Joy)") return;
          const _ = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          f((E) => (E.items.push({ id: _, text: N }), E.order.push(_), E));
        }, children: "＋ Add purchase" })
      ] }),
      /* @__PURE__ */ n.jsxs("div", { id: "pl-sum", title: "One-off amounts added up (a range counts its low and high end). Amounts per month are added separately. Notes in brackets are ignored.", children: [
        /* @__PURE__ */ n.jsxs("span", { className: "pl-sum-main", children: [
          /* @__PURE__ */ n.jsx("b", { children: "Total" }),
          " ",
          p > C ? `${ri(C)} – ${ri(p)}` : ri(C)
        ] }),
        y > 0 && /* @__PURE__ */ n.jsxs("span", { className: "pl-sum-part", children: [
          "+ ",
          ri(y),
          "/month"
        ] }),
        /* @__PURE__ */ n.jsxs("span", { className: "pl-sum-part", children: [
          S,
          " of ",
          e.order.length,
          " items priced"
        ] })
      ] }),
      /* @__PURE__ */ n.jsx("ol", { className: "purchase-list pl-live", children: x.map((N, _) => {
        const E = e.items.some((b) => b.id === N), T = e.stars[N] || 0;
        return /* @__PURE__ */ n.jsxs(
          "li",
          {
            className: `pl-row${c === N ? " dragging" : ""}${r === N ? " drop-target" : ""}`,
            draggable: c === N,
            onContextMenu: (b) => {
              b.preventDefault(), i({ id: N, x: b.clientX, y: b.clientY });
            },
            onDragStart: (b) => {
              b.dataTransfer.setData("text/plain", N), b.dataTransfer.effectAllowed = "move";
            },
            onDragEnd: () => {
              u(null), d(null);
            },
            onDragOver: (b) => {
              c && c !== N && (b.preventDefault(), d(N));
            },
            onDragLeave: () => d((b) => b === N ? null : b),
            onDrop: (b) => {
              if (b.preventDefault(), d(null), !c || c === N) return;
              const g = c;
              f((A) => (A.order = A.order.filter((O) => O !== g), A.order.splice(A.order.indexOf(N), 0, g), A)), u(null);
            },
            children: [
              /* @__PURE__ */ n.jsx("span", { className: "pl-grip", title: "Drag to re-order", onMouseDown: () => u(N), children: "⠿" }),
              /* @__PURE__ */ n.jsxs("span", { className: "pl-num", children: [
                _ + 1,
                "."
              ] }),
              /* @__PURE__ */ n.jsx("span", { className: "pl-text", title: "Double-click to edit · right-click to pick associations", onDoubleClick: () => a(N), children: l === N ? /* @__PURE__ */ n.jsx(oN, { value: v(N), onDone: (b) => {
                a(null), b && b !== v(N) && f((g) => (g.texts[N] = b, g.tags[N] && (g.tags[N] = ui(b).tags), g));
              } }) : /* @__PURE__ */ n.jsx(uN, { text: v(N) }) }),
              /* @__PURE__ */ n.jsx("span", { className: "pl-stars", children: [1, 2, 3, 4].map((b) => /* @__PURE__ */ n.jsx("button", { className: `pl-star${b <= T ? " on" : ""}`, title: `Priority ${b} of 4${b === 4 ? " (highest)" : ""}`, onClick: () => f((g) => ((g.stars[N] || 0) === b ? delete g.stars[N] : g.stars[N] = b, g)), children: "★" }, b)) }),
              E && /* @__PURE__ */ n.jsx("button", { className: "pl-delete", "aria-label": "Remove this custom purchase", title: "Remove this custom item", onClick: () => {
                confirm(`Delete “${v(N)}”?`) && f((b) => (b.items = b.items.filter((g) => g.id !== N), b.order = b.order.filter((g) => g !== N), delete b.stars[N], delete b.texts[N], delete b.tags[N], b));
              }, children: "×" })
            ]
          },
          N
        );
      }) })
    ] }),
    s && /* @__PURE__ */ n.jsx(dN, { x: s.x, y: s.y, on: h(s.id), used: [...new Set(e.order.flatMap(h))], onToggle: (N) => w(s.id, N), onClear: () => f((N) => (N.tags[s.id] = [], N)), onClose: () => i(null) })
  ] });
}
function oN({ value: e, onDone: t }) {
  const l = j.useRef(!1), a = (s) => {
    l.current || (l.current = !0, t(s === null ? null : s.replace(/\s+/g, " ").trim()));
  };
  return /* @__PURE__ */ n.jsx(
    "input",
    {
      type: "text",
      className: "pl-edit",
      autoFocus: !0,
      defaultValue: e,
      onFocus: (s) => s.currentTarget.select(),
      onBlur: (s) => a(s.currentTarget.value),
      onKeyDown: (s) => {
        s.stopPropagation(), s.key === "Enter" ? (s.preventDefault(), a(s.currentTarget.value)) : s.key === "Escape" && (s.preventDefault(), a(null));
      }
    }
  );
}
function dN({ x: e, y: t, on: l, used: a, onToggle: s, onClear: i, onClose: c }) {
  const u = j.useRef(null), [r, d] = j.useState({ left: e, top: t });
  j.useEffect(() => {
    var v;
    const h = (v = u.current) == null ? void 0 : v.getBoundingClientRect();
    h && d({ left: Math.max(8, Math.min(e, window.innerWidth - h.width - 8)), top: Math.max(8, Math.min(t, window.innerHeight - h.height - 8)) });
  }, [e, t]), j.useEffect(() => {
    const h = (x) => {
      var C;
      (C = u.current) != null && C.contains(x.target) || c();
    }, v = (x) => x.key === "Escape" && c();
    return document.addEventListener("mousedown", h), document.addEventListener("keydown", v), document.addEventListener("scroll", c, !0), () => {
      document.removeEventListener("mousedown", h), document.removeEventListener("keydown", v), document.removeEventListener("scroll", c, !0);
    };
  }, [c]);
  const m = l.map((h) => h.toLowerCase()), f = a.filter((h) => !Gh.includes(h) && !$h.includes(h)), o = (h) => /* @__PURE__ */ n.jsxs("label", { className: "pl-menu-row", children: [
    /* @__PURE__ */ n.jsx("input", { type: "checkbox", checked: m.includes(h.toLowerCase()), onChange: () => s(h) }),
    " ",
    h
  ] }, h);
  return /* @__PURE__ */ n.jsxs("div", { className: "pl-menu", ref: u, style: r, children: [
    /* @__PURE__ */ n.jsx("div", { className: "pl-menu-h", children: "Associations" }),
    [...Gh, ...f].map(o),
    /* @__PURE__ */ n.jsx("div", { className: "pl-menu-h", children: "Ideas" }),
    $h.map(o),
    /* @__PURE__ */ n.jsxs("div", { className: "pl-menu-foot", children: [
      /* @__PURE__ */ n.jsx("button", { onClick: () => {
        const h = (prompt("New association (one word works best):") || "").replace(/[()/]/g, "").trim();
        h && s(h);
      }, children: "+ New…" }),
      /* @__PURE__ */ n.jsx("button", { onClick: i, children: "Clear" })
    ] })
  ] });
}
function fN({ min: e, setMin: t }) {
  const [l, a] = j.useState(""), [s, i] = j.useState(""), c = j.useRef(), u = j.useRef(!1), r = j.useRef(""), d = j.useCallback(async () => {
    if (window.clearTimeout(c.current), !!u.current) {
      i("Saving…");
      try {
        if (!(await fetch("/api/purchase-notes", { method: "POST", body: r.current, keepalive: !0 })).ok) throw new Error();
        u.current = !1, i("Saved ✓"), is("purchaseNotesBackup", "");
      } catch {
        is("purchaseNotesBackup", r.current), i("⚠️ Not saved");
      }
    }
  }, []);
  j.useEffect(() => {
    Q("/api/purchase-notes").then((o) => {
      let h = o.text || "";
      const v = is("purchaseNotesBackup");
      v && v !== h && (h = v, u.current = !0), r.current = h, a(h), u.current && d();
    }).catch(() => {
    });
  }, [d]);
  const m = (l.match(/\$\s?\d[\d,]*(?:\.\d+)?/g) || []).map((o) => parseFloat(o.replace(/[$,\s]/g, ""))), f = m.reduce((o, h) => o + h, 0);
  return /* @__PURE__ */ n.jsxs("aside", { id: "pn-panel", className: e ? "min" : "", "aria-label": "Purchase notes", children: [
    /* @__PURE__ */ n.jsxs("div", { id: "pn-head", children: [
      /* @__PURE__ */ n.jsx("b", { children: "🧮 Notes" }),
      /* @__PURE__ */ n.jsx("span", { id: "pn-status", children: s }),
      /* @__PURE__ */ n.jsx("button", { id: "pn-min", className: "ctl", title: e ? "Open the notes" : "Minimise", onClick: () => t(!e), children: e ? "+" : "–" })
    ] }),
    /* @__PURE__ */ n.jsx(
      "textarea",
      {
        id: "pn-text",
        spellCheck: !1,
        placeholder: `Work out your purchases here, e.g.
Guitar $700
Phone $500`,
        value: l,
        onKeyDown: (o) => o.stopPropagation(),
        onBlur: d,
        onChange: (o) => {
          a(o.target.value), r.current = o.target.value, u.current = !0, i("Typing…"), window.clearTimeout(c.current), c.current = window.setTimeout(d, 700);
        }
      }
    ),
    /* @__PURE__ */ n.jsx("div", { id: "pn-total", children: m.length ? /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
      "Total of ",
      m.length,
      " $ amount",
      m.length === 1 ? "" : "s",
      ": ",
      /* @__PURE__ */ n.jsxs("b", { children: [
        "$",
        f.toLocaleString(void 0, { maximumFractionDigits: 2 })
      ] })
    ] }) : "Write amounts like $300 and they add up here" })
  ] });
}
function hN() {
  const [e, t] = j.useState(sh), [l, a] = j.useState(!1), [s, i] = j.useState(), [c, u] = j.useState(0), r = j.useCallback((m) => {
    t(m), cb.has(m) ? ih(m) : ub(m);
  }, []), d = j.useCallback((m) => {
    i(m), a(!0);
  }, []);
  return j.useEffect(() => (document.body.classList.add("modern-shell"), () => document.body.classList.remove("modern-shell")), []), j.useEffect(() => {
    const m = () => t(sh());
    return window.addEventListener("popstate", m), window.addEventListener("hashchange", m), () => {
      window.removeEventListener("popstate", m), window.removeEventListener("hashchange", m);
    };
  }, []), j.useEffect(() => {
    const m = (f) => {
      const o = f.detail;
      o && r(o);
    };
    return window.addEventListener("callstudio:open-route", m), () => window.removeEventListener("callstudio:open-route", m);
  }, [r]), j.useEffect(() => {
    const m = (f) => {
      const o = f.detail;
      o && t(o);
    };
    return window.addEventListener("callstudio:legacy-route", m), () => window.removeEventListener("callstudio:legacy-route", m);
  }, []), j.useEffect(() => {
    const m = (f) => {
      var o;
      (f.metaKey || f.ctrlKey) && f.key.toLowerCase() === "k" && !((o = f.target) != null && o.closest("input,textarea")) && (f.preventDefault(), d());
    };
    return document.addEventListener("keydown", m), () => document.removeEventListener("keydown", m);
  }, [d]), /* @__PURE__ */ n.jsxs(n.Fragment, { children: [
    /* @__PURE__ */ n.jsx(xb, { onNavigate: r }),
    /* @__PURE__ */ n.jsx(ob, { active: e, onNavigate: r, onAdd: () => d() }),
    e === "home" && /* @__PURE__ */ n.jsx("div", { className: "modern-content", children: /* @__PURE__ */ n.jsx(Tb, { onNavigate: r, onAdd: d }) }),
    e === "swipe" && /* @__PURE__ */ n.jsx("div", { className: "modern-content", children: /* @__PURE__ */ n.jsx(kb, { refreshToken: c, onAddLink: () => d("swipe") }) }),
    e === "purchase" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(rN, {}) }),
    e === "music" && /* @__PURE__ */ n.jsx("div", { className: "modern-content", children: /* @__PURE__ */ n.jsx(sN, {}) }),
    e === "coaching" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(Q0, { onNavigate: r }) }),
    e === "selfdev" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(Y0, {}) }),
    e === "statementbox" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(L0, {}) }),
    e === "messaging" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(B0, {}) }),
    e === "resources" && /* @__PURE__ */ n.jsx("div", { className: "modern-content resources-page", children: /* @__PURE__ */ n.jsx(R0, {}) }),
    e === "clients" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page clients-page", children: /* @__PURE__ */ n.jsx(S0, {}) }),
    e === "accounting" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(A0, {}) }),
    e === "delegation" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(g0, {}) }),
    e === "buffers" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(Ib, {}) }),
    e === "identitylab" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(h0, {}) }),
    e === "travel" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(n0, {}) }),
    e === "travelcontacts" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(i0, {}) }),
    e === "calsync" && /* @__PURE__ */ n.jsx("div", { className: "modern-content legacy-doc-page", children: /* @__PURE__ */ n.jsx(t0, {}) }),
    e === "agreements" && /* @__PURE__ */ n.jsx("div", { className: "modern-content agreements-page", children: /* @__PURE__ */ n.jsx(Zb, {}) }),
    e === "leadgen" && /* @__PURE__ */ n.jsx("div", { className: "modern-content leadgen-page", children: /* @__PURE__ */ n.jsx($b, {}) }),
    e === "sessions" && /* @__PURE__ */ n.jsx("div", { className: "modern-content", children: /* @__PURE__ */ n.jsx(qb, { onNavigate: r }) }),
    e === "kanban" && /* @__PURE__ */ n.jsx("div", { className: "modern-content", children: /* @__PURE__ */ n.jsx(Rb, {}) }),
    e === "weather" && /* @__PURE__ */ n.jsx("div", { className: "modern-content", children: /* @__PURE__ */ n.jsx(jb, {}) }),
    /* @__PURE__ */ n.jsx(pb, { open: l, initial: s || null, onClose: () => a(!1), onNavigate: r, onSwipeAdded: () => {
      u((m) => m + 1), t("swipe"), ih("swipe");
    } })
  ] });
}
const Vh = document.getElementById("modern-root");
Vh && sb.createRoot(Vh).render(/* @__PURE__ */ n.jsx(j.StrictMode, { children: /* @__PURE__ */ n.jsx(hN, {}) }));
