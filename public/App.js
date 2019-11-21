'use strict';

function noop() { }
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function subscribe(store, callback) {
    const unsub = store.subscribe(callback);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
}
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
}

const invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
// https://infra.spec.whatwg.org/#noncharacter
function spread(args) {
    const attributes = Object.assign({}, ...args);
    let str = '';
    Object.keys(attributes).forEach(name => {
        if (invalid_attribute_name_character.test(name))
            return;
        const value = attributes[name];
        if (value === undefined)
            return;
        if (value === true)
            str += " " + name;
        const escaped = String(value)
            .replace(/"/g, '&#34;')
            .replace(/'/g, '&#39;');
        str += " " + name + "=" + JSON.stringify(escaped);
    });
    return str;
}
const escaped = {
    '"': '&quot;',
    "'": '&#39;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};
function escape(html) {
    return String(html).replace(/["'&<>]/g, match => escaped[match]);
}
function each(items, fn) {
    let str = '';
    for (let i = 0; i < items.length; i += 1) {
        str += fn(items[i], i);
    }
    return str;
}
const missing_component = {
    $$render: () => ''
};
function validate_component(component, name) {
    if (!component || !component.$$render) {
        if (name === 'svelte:component')
            name += ' this={...}';
        throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
    }
    return component;
}
let on_destroy;
function create_ssr_component(fn) {
    function $$render(result, props, bindings, slots) {
        const parent_component = current_component;
        const $$ = {
            on_destroy,
            context: new Map(parent_component ? parent_component.$$.context : []),
            // these will be immediately discarded
            on_mount: [],
            before_update: [],
            after_update: [],
            callbacks: blank_object()
        };
        set_current_component({ $$ });
        const html = fn(result, props, bindings, slots);
        set_current_component(parent_component);
        return html;
    }
    return {
        render: (props = {}, options = {}) => {
            on_destroy = [];
            const result = { head: '', css: new Set() };
            const html = $$render(result, props, {}, options);
            run_all(on_destroy);
            return {
                html,
                css: {
                    code: Array.from(result.css).map(css => css.code).join('\n'),
                    map: null // TODO
                },
                head: result.head
            };
        },
        $$render
    };
}
function add_attribute(name, value, boolean) {
    if (value == null || (boolean && !value))
        return '';
    return ` ${name}${value === true ? '' : `=${typeof value === 'string' ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}

const subscriber_queue = [];
/**
 * Creates a `Readable` store that allows reading by subscription.
 * @param value initial value
 * @param {StartStopNotifier}start start and stop notifications for subscriptions
 */
function readable(value, start) {
    return {
        subscribe: writable(value, start).subscribe,
    };
}
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}
/**
 * Derived value store by synchronizing one or more readable stores and
 * applying an aggregation function over its input values.
 * @param {Stores} stores input stores
 * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
 * @param {*=}initial_value when used asynchronously
 */
function derived(stores, fn, initial_value) {
    const single = !Array.isArray(stores);
    const stores_array = single
        ? [stores]
        : stores;
    const auto = fn.length < 2;
    return readable(initial_value, (set) => {
        let inited = false;
        const values = [];
        let pending = 0;
        let cleanup = noop;
        const sync = () => {
            if (pending) {
                return;
            }
            cleanup();
            const result = fn(single ? values[0] : values, set);
            if (auto) {
                set(result);
            }
            else {
                cleanup = is_function(result) ? result : noop;
            }
        };
        const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
            values[i] = value;
            pending &= ~(1 << i);
            if (inited) {
                sync();
            }
        }, () => {
            pending |= (1 << i);
        }));
        inited = true;
        sync();
        return function stop() {
            run_all(unsubscribers);
            cleanup();
        };
    });
}

const LOCATION = {};
const ROUTER = {};

/**
 * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
 *
 * https://github.com/reach/router/blob/master/LICENSE
 * */

function getLocation(source) {
  return {
    ...source.location,
    state: source.history.state,
    key: (source.history.state && source.history.state.key) || "initial"
  };
}

function createHistory(source, options) {
  const listeners = [];
  let location = getLocation(source);

  return {
    get location() {
      return location;
    },

    listen(listener) {
      listeners.push(listener);

      const popstateListener = () => {
        location = getLocation(source);
        listener({ location, action: "POP" });
      };

      source.addEventListener("popstate", popstateListener);

      return () => {
        source.removeEventListener("popstate", popstateListener);

        const index = listeners.indexOf(listener);
        listeners.splice(index, 1);
      };
    },

    navigate(to, { state, replace = false } = {}) {
      state = { ...state, key: Date.now() + "" };
      // try...catch iOS Safari limits to 100 pushState calls
      try {
        if (replace) {
          source.history.replaceState(state, null, to);
        } else {
          source.history.pushState(state, null, to);
        }
      } catch (e) {
        source.location[replace ? "replace" : "assign"](to);
      }

      location = getLocation(source);
      listeners.forEach(listener => listener({ location, action: "PUSH" }));
    }
  };
}

// Stores history entries in memory for testing or other platforms like Native
function createMemorySource(initialPathname = "/") {
  let index = 0;
  const stack = [{ pathname: initialPathname, search: "" }];
  const states = [];

  return {
    get location() {
      return stack[index];
    },
    addEventListener(name, fn) {},
    removeEventListener(name, fn) {},
    history: {
      get entries() {
        return stack;
      },
      get index() {
        return index;
      },
      get state() {
        return states[index];
      },
      pushState(state, _, uri) {
        const [pathname, search = ""] = uri.split("?");
        index++;
        stack.push({ pathname, search });
        states.push(state);
      },
      replaceState(state, _, uri) {
        const [pathname, search = ""] = uri.split("?");
        stack[index] = { pathname, search };
        states[index] = state;
      }
    }
  };
}

// Global history uses window.history as the source if available,
// otherwise a memory history
const canUseDOM = Boolean(
  typeof window !== "undefined" &&
    window.document &&
    window.document.createElement
);
const globalHistory = createHistory(canUseDOM ? window : createMemorySource());

/**
 * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
 *
 * https://github.com/reach/router/blob/master/LICENSE
 * */

const paramRe = /^:(.+)/;

const SEGMENT_POINTS = 4;
const STATIC_POINTS = 3;
const DYNAMIC_POINTS = 2;
const SPLAT_PENALTY = 1;
const ROOT_POINTS = 1;

/**
 * Check if `string` starts with `search`
 * @param {string} string
 * @param {string} search
 * @return {boolean}
 */
function startsWith(string, search) {
  return string.substr(0, search.length) === search;
}

/**
 * Check if `segment` is a root segment
 * @param {string} segment
 * @return {boolean}
 */
function isRootSegment(segment) {
  return segment === "";
}

/**
 * Check if `segment` is a dynamic segment
 * @param {string} segment
 * @return {boolean}
 */
function isDynamic(segment) {
  return paramRe.test(segment);
}

/**
 * Check if `segment` is a splat
 * @param {string} segment
 * @return {boolean}
 */
function isSplat(segment) {
  return segment[0] === "*";
}

/**
 * Split up the URI into segments delimited by `/`
 * @param {string} uri
 * @return {string[]}
 */
function segmentize(uri) {
  return (
    uri
      // Strip starting/ending `/`
      .replace(/(^\/+|\/+$)/g, "")
      .split("/")
  );
}

/**
 * Strip `str` of potential start and end `/`
 * @param {string} str
 * @return {string}
 */
function stripSlashes(str) {
  return str.replace(/(^\/+|\/+$)/g, "");
}

/**
 * Score a route depending on how its individual segments look
 * @param {object} route
 * @param {number} index
 * @return {object}
 */
function rankRoute(route, index) {
  const score = route.default
    ? 0
    : segmentize(route.path).reduce((score, segment) => {
        score += SEGMENT_POINTS;

        if (isRootSegment(segment)) {
          score += ROOT_POINTS;
        } else if (isDynamic(segment)) {
          score += DYNAMIC_POINTS;
        } else if (isSplat(segment)) {
          score -= SEGMENT_POINTS + SPLAT_PENALTY;
        } else {
          score += STATIC_POINTS;
        }

        return score;
      }, 0);

  return { route, score, index };
}

/**
 * Give a score to all routes and sort them on that
 * @param {object[]} routes
 * @return {object[]}
 */
function rankRoutes(routes) {
  return (
    routes
      .map(rankRoute)
      // If two routes have the exact same score, we go by index instead
      .sort((a, b) =>
        a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
      )
  );
}

/**
 * Ranks and picks the best route to match. Each segment gets the highest
 * amount of points, then the type of segment gets an additional amount of
 * points where
 *
 *  static > dynamic > splat > root
 *
 * This way we don't have to worry about the order of our routes, let the
 * computers do it.
 *
 * A route looks like this
 *
 *  { path, default, value }
 *
 * And a returned match looks like:
 *
 *  { route, params, uri }
 *
 * @param {object[]} routes
 * @param {string} uri
 * @return {?object}
 */
function pick(routes, uri) {
  let match;
  let default_;

  const [uriPathname] = uri.split("?");
  const uriSegments = segmentize(uriPathname);
  const isRootUri = uriSegments[0] === "";
  const ranked = rankRoutes(routes);

  for (let i = 0, l = ranked.length; i < l; i++) {
    const route = ranked[i].route;
    let missed = false;

    if (route.default) {
      default_ = {
        route,
        params: {},
        uri
      };
      continue;
    }

    const routeSegments = segmentize(route.path);
    const params = {};
    const max = Math.max(uriSegments.length, routeSegments.length);
    let index = 0;

    for (; index < max; index++) {
      const routeSegment = routeSegments[index];
      const uriSegment = uriSegments[index];

      if (routeSegment !== undefined && isSplat(routeSegment)) {
        // Hit a splat, just grab the rest, and return a match
        // uri:   /files/documents/work
        // route: /files/* or /files/*splatname
        const splatName = routeSegment === "*" ? "*" : routeSegment.slice(1);

        params[splatName] = uriSegments
          .slice(index)
          .map(decodeURIComponent)
          .join("/");
        break;
      }

      if (uriSegment === undefined) {
        // URI is shorter than the route, no match
        // uri:   /users
        // route: /users/:userId
        missed = true;
        break;
      }

      let dynamicMatch = paramRe.exec(routeSegment);

      if (dynamicMatch && !isRootUri) {
        const value = decodeURIComponent(uriSegment);
        params[dynamicMatch[1]] = value;
      } else if (routeSegment !== uriSegment) {
        // Current segments don't match, not dynamic, not splat, so no match
        // uri:   /users/123/settings
        // route: /users/:id/profile
        missed = true;
        break;
      }
    }

    if (!missed) {
      match = {
        route,
        params,
        uri: "/" + uriSegments.slice(0, index).join("/")
      };
      break;
    }
  }

  return match || default_ || null;
}

/**
 * Check if the `path` matches the `uri`.
 * @param {string} path
 * @param {string} uri
 * @return {?object}
 */
function match(route, uri) {
  return pick([route], uri);
}

/**
 * Add the query to the pathname if a query is given
 * @param {string} pathname
 * @param {string} [query]
 * @return {string}
 */
function addQuery(pathname, query) {
  return pathname + (query ? `?${query}` : "");
}

/**
 * Resolve URIs as though every path is a directory, no files. Relative URIs
 * in the browser can feel awkward because not only can you be "in a directory",
 * you can be "at a file", too. For example:
 *
 *  browserSpecResolve('foo', '/bar/') => /bar/foo
 *  browserSpecResolve('foo', '/bar') => /foo
 *
 * But on the command line of a file system, it's not as complicated. You can't
 * `cd` from a file, only directories. This way, links have to know less about
 * their current path. To go deeper you can do this:
 *
 *  <Link to="deeper"/>
 *  // instead of
 *  <Link to=`{${props.uri}/deeper}`/>
 *
 * Just like `cd`, if you want to go deeper from the command line, you do this:
 *
 *  cd deeper
 *  # not
 *  cd $(pwd)/deeper
 *
 * By treating every path as a directory, linking to relative paths should
 * require less contextual information and (fingers crossed) be more intuitive.
 * @param {string} to
 * @param {string} base
 * @return {string}
 */
function resolve(to, base) {
  // /foo/bar, /baz/qux => /foo/bar
  if (startsWith(to, "/")) {
    return to;
  }

  const [toPathname, toQuery] = to.split("?");
  const [basePathname] = base.split("?");
  const toSegments = segmentize(toPathname);
  const baseSegments = segmentize(basePathname);

  // ?a=b, /users?b=c => /users?a=b
  if (toSegments[0] === "") {
    return addQuery(basePathname, toQuery);
  }

  // profile, /users/789 => /users/789/profile
  if (!startsWith(toSegments[0], ".")) {
    const pathname = baseSegments.concat(toSegments).join("/");

    return addQuery((basePathname === "/" ? "" : "/") + pathname, toQuery);
  }

  // ./       , /users/123 => /users/123
  // ../      , /users/123 => /users
  // ../..    , /users/123 => /
  // ../../one, /a/b/c/d   => /a/b/one
  // .././one , /a/b/c/d   => /a/b/c/one
  const allSegments = baseSegments.concat(toSegments);
  const segments = [];

  allSegments.forEach(segment => {
    if (segment === "..") {
      segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  });

  return addQuery("/" + segments.join("/"), toQuery);
}

/**
 * Combines the `basepath` and the `path` into one path.
 * @param {string} basepath
 * @param {string} path
 */
function combinePaths(basepath, path) {
  return `${stripSlashes(
    path === "/" ? basepath : `${stripSlashes(basepath)}/${stripSlashes(path)}`
  )}/`;
}

/* node_modules/svelte-routing/src/Router.svelte generated by Svelte v3.12.1 */

const Router = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $base, $location, $routes;

	

  let { basepath = "/", url = null } = $$props;

  const locationContext = getContext(LOCATION);
  const routerContext = getContext(ROUTER);

  const routes = writable([]); $routes = get_store_value(routes);
  const activeRoute = writable(null);
  let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

  // If locationContext is not set, this is the topmost Router in the tree.
  // If the `url` prop is given we force the location to it.
  const location =
    locationContext ||
    writable(url ? { pathname: url } : globalHistory.location); $location = get_store_value(location);

  // If routerContext is set, the routerBase of the parent Router
  // will be the base for this Router's descendants.
  // If routerContext is not set, the path and resolved uri will both
  // have the value of the basepath prop.
  const base = routerContext
    ? routerContext.routerBase
    : writable({
        path: basepath,
        uri: basepath
      }); $base = get_store_value(base);

  const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
    // If there is no activeRoute, the routerBase will be identical to the base.
    if (activeRoute === null) {
      return base;
    }

    const { path: basepath } = base;
    const { route, uri } = activeRoute;
    // Remove the potential /* or /*splatname from
    // the end of the child Routes relative paths.
    const path = route.default ? basepath : route.path.replace(/\*.*$/, "");

    return { path, uri };
  });

  function registerRoute(route) {
    const { path: basepath } = $base;
    let { path } = route;

    // We store the original path in the _path property so we can reuse
    // it when the basepath changes. The only thing that matters is that
    // the route reference is intact, so mutation is fine.
    route._path = path;
    route.path = combinePaths(basepath, path);

    if (typeof window === "undefined") {
      // In SSR we should set the activeRoute immediately if it is a match.
      // If there are more Routes being registered after a match is found,
      // we just skip them.
      if (hasActiveRoute) {
        return;
      }

      const matchingRoute = match(route, $location.pathname);
      if (matchingRoute) {
        activeRoute.set(matchingRoute);
        hasActiveRoute = true;
      }
    } else {
      routes.update(rs => {
        rs.push(route);
        return rs;
      });
    }
  }

  function unregisterRoute(route) {
    routes.update(rs => {
      const index = rs.indexOf(route);
      rs.splice(index, 1);
      return rs;
    });
  }

  if (!locationContext) {
    // The topmost Router in the tree is responsible for updating
    // the location store and supplying it through context.
    onMount(() => {
      const unlisten = globalHistory.listen(history => {
        location.set(history.location);
      });

      return unlisten;
    });

    setContext(LOCATION, location);
  }

  setContext(ROUTER, {
    activeRoute,
    base,
    routerBase,
    registerRoute,
    unregisterRoute
  });

	if ($$props.basepath === void 0 && $$bindings.basepath && basepath !== void 0) $$bindings.basepath(basepath);
	if ($$props.url === void 0 && $$bindings.url && url !== void 0) $$bindings.url(url);

	$base = get_store_value(base);
	$location = get_store_value(location);
	$routes = get_store_value(routes);

	{
        const { path: basepath } = $base;
        routes.update(rs => {
          rs.forEach(r => (r.path = combinePaths(basepath, r._path)));
          return rs;
        });
      }
	{
        const bestMatch = pick($routes, $location.pathname);
        activeRoute.set(bestMatch);
      }

	return `${$$slots.default ? $$slots.default({}) : ``}`;
});

/* node_modules/svelte-routing/src/Route.svelte generated by Svelte v3.12.1 */

const Route = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $activeRoute, $location;

	

  let { path = "", component = null } = $$props;

  const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER); $activeRoute = get_store_value(activeRoute);
  const location = getContext(LOCATION); $location = get_store_value(location);

  const route = {
    path,
    // If no path prop is given, this Route will act as the default Route
    // that is rendered if no other Route in the Router is a match.
    default: path === ""
  };
  let routeParams = {};
  let routeProps = {};

  registerRoute(route);

  // There is no need to unregister Routes in SSR since it will all be
  // thrown away anyway.
  if (typeof window !== "undefined") {
    onDestroy(() => {
      unregisterRoute(route);
    });
  }

	if ($$props.path === void 0 && $$bindings.path && path !== void 0) $$bindings.path(path);
	if ($$props.component === void 0 && $$bindings.component && component !== void 0) $$bindings.component(component);

	$activeRoute = get_store_value(activeRoute);
	$location = get_store_value(location);

	if ($activeRoute && $activeRoute.route === route) {
        routeParams = $activeRoute.params;
      }
	{
        const { path, component, ...rest } = $$props;
        routeProps = rest;
      }

	return `${ $activeRoute !== null && $activeRoute.route === route ? `${ component !== null ? `${validate_component(((component) || missing_component), 'svelte:component').$$render($$result, Object.assign({ location: $location }, routeParams, routeProps), {}, {})}` : `${$$slots.default ? $$slots.default({ params: routeParams, location: $location }) : ``}` }` : `` }`;
});

/* node_modules/svelte-routing/src/Link.svelte generated by Svelte v3.12.1 */

const Link = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let $base, $location;

	

  let { to = "#", replace = false, state = {}, getProps = () => ({}) } = $$props;

  const { base } = getContext(ROUTER); $base = get_store_value(base);
  const location = getContext(LOCATION); $location = get_store_value(location);

  let href, isPartiallyCurrent, isCurrent, props;

	if ($$props.to === void 0 && $$bindings.to && to !== void 0) $$bindings.to(to);
	if ($$props.replace === void 0 && $$bindings.replace && replace !== void 0) $$bindings.replace(replace);
	if ($$props.state === void 0 && $$bindings.state && state !== void 0) $$bindings.state(state);
	if ($$props.getProps === void 0 && $$bindings.getProps && getProps !== void 0) $$bindings.getProps(getProps);

	$base = get_store_value(base);
	$location = get_store_value(location);

	href = to === "/" ? $base.uri : resolve(to, $base.uri);
	isPartiallyCurrent = startsWith($location.pathname, href);
	isCurrent = href === $location.pathname;
	let ariaCurrent = isCurrent ? "page" : undefined;
	props = getProps({
        location: $location,
        href,
        isPartiallyCurrent,
        isCurrent
      });

	return `<a${spread([{ href: `${escape(href)}` }, { "aria-current": `${escape(ariaCurrent)}` }, props])}>
	  ${$$slots.default ? $$slots.default({}) : ``}
	</a>`;
});

/* src/components/NavLink.svelte generated by Svelte v3.12.1 */

function getProps({ location, href, isPartiallyCurrent, isCurrent }) {
  const isActive = href === "/" ? isCurrent : isPartiallyCurrent || isCurrent;

  // The object returned here is spread on the anchor element's attributes
  if (isActive) {
    return { class: "active" };
  }
  return {};
}

const NavLink = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { to = "" } = $$props;

	if ($$props.to === void 0 && $$bindings.to && to !== void 0) $$bindings.to(to);

	return `${validate_component(Link, 'Link').$$render($$result, { to: to, getProps: getProps }, {}, {
		default: () => `
	  ${$$slots.default ? $$slots.default({}) : ``}
	`
	})}`;
});

/* src/components/SpotlightBackground.svelte generated by Svelte v3.12.1 */

const SpotlightBackground = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { spotSize, gradientColor, backgroundColor, backgroundImage } = $$props;
  onMount(() => {
    execute();
  });

  function execute() {
    // #### SPOTLIGHT BACKGROUND #####
    // 1. init cavas
    // 2. create radial gradient
    // 3. draw background
    // 4. add radial gradient to background

    let canvas, ctx, w, h, offsetX, offsetY, radialGradient;

    // init
    setup();
    reOffset();
    drawSpotlight(w / 2, h / 2, spotSize);

    // master function
    function drawSpotlight(cx, cy, radius) {
      ctx.save();
      ctx.clearRect(0, 0, w, h);
      createRadialGradient(cx, cy, radius);
      drawBackground();
      addRadialGradient(cx, cy, radius);
      ctx.restore();
    }

    // event function
    function drawOnMouseMove(e) {
      e.preventDefault();
      e.stopPropagation();

      const mouseX = parseInt(e.clientX - offsetX);
      const mouseY = parseInt(e.clientY - offsetY);

      drawSpotlight(mouseX, mouseY, spotSize);
    }

    // functions
    function setup() {
      canvas = document.getElementById("mask");
      ctx = canvas.getContext("2d");

      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createRadialGradient(cx, cy, radius) {
      radialGradient = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius);
      radialGradient.addColorStop(0, gradientColor[0]);
      radialGradient.addColorStop(0.65, gradientColor[1]);
      radialGradient.addColorStop(1, gradientColor[2]);
    }

    function drawBackground() {
      ctx.beginPath();
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
    }

    function addRadialGradient(cx, cy, radius) {
      ctx.arc(cx, cy, radius, 0, Math.PI * 2, false);
      ctx.fillStyle = radialGradient;
      ctx.fill();
    }

    function reOffset() {
      const BB = canvas.getBoundingClientRect();
      offsetX = BB.left;
      offsetY = BB.top;
    }

    // events
    window.onscroll = function(e) {
      reOffset();
    };
    window.onresize = function(e) {
      reOffset();
    };

    document.body.addEventListener("mousemove", drawOnMouseMove, false);
    document.body.addEventListener("touchmove", drawOnMouseMove, false);
  }

	if ($$props.spotSize === void 0 && $$bindings.spotSize && spotSize !== void 0) $$bindings.spotSize(spotSize);
	if ($$props.gradientColor === void 0 && $$bindings.gradientColor && gradientColor !== void 0) $$bindings.gradientColor(gradientColor);
	if ($$props.backgroundColor === void 0 && $$bindings.backgroundColor && backgroundColor !== void 0) $$bindings.backgroundColor(backgroundColor);
	if ($$props.backgroundImage === void 0 && $$bindings.backgroundImage && backgroundImage !== void 0) $$bindings.backgroundImage(backgroundImage);

	return `<div class="mask-wrapper">
	  <canvas id="mask" width="500" height="300"></canvas>
	  <img id="bg-img"${add_attribute("src", backgroundImage, 0)} alt="https://www.facebook.com/Kleuruwverleden/">
	</div>`;
});

/* src/routes/Home.svelte generated by Svelte v3.12.1 */

const css = {
	code: ".hero.svelte-1g5wq7f{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;width:100%;max-width:900px;height:100vh;margin:0 auto;color:#fff}.hero__intro.svelte-1g5wq7f{max-width:507px}.hero__cta.svelte-1g5wq7f a.svelte-1g5wq7f{display:flex;align-items:center;justify-content:center;text-decoration:none !important;color:#fff}.hero__cta.svelte-1g5wq7f:hover .button-round.svelte-1g5wq7f{cursor:pointer;border:2px solid rgba(255, 255, 255, 0.6)}.hero__cta.svelte-1g5wq7f:hover .title-main.svelte-1g5wq7f{transform:translateX(2px)}.hero__cta.svelte-1g5wq7f:hover .title-highlight.svelte-1g5wq7f{transform:translateX(4px)}.hero__cta.svelte-1g5wq7f:hover .button-round img.svelte-1g5wq7f{transform:rotate(-30deg)}.hero__cta.svelte-1g5wq7f .button-round.svelte-1g5wq7f{margin-right:15px}",
	map: "{\"version\":3,\"file\":\"Home.svelte\",\"sources\":[\"Home.svelte\"],\"sourcesContent\":[\"<script>\\n  import { onMount } from \\\"svelte\\\";\\n  import NavLink from \\\"../components/NavLink.svelte\\\";\\n  import SpotlightBackground from \\\"../components/SpotlightBackground.svelte\\\";\\n\\n  const spotSize = 400;\\n  const backgroundColor = \\\"rgba(10, 12, 20, 0.85)\\\";\\n  const gradientColor = [\\n    \\\"rgba(0, 0, 0, 0.3)\\\",\\n    \\\"rgba(0, 0, 0, 0.3)\\\",\\n    \\\"rgba(0, 0, 0, 0)\\\"\\n  ];\\n</script>\\n\\n<style>\\n  .hero {\\n    position: relative;\\n    z-index: 3;\\n\\n    display: flex;\\n    align-items: center;\\n    justify-content: space-between;\\n\\n    width: 100%;\\n    max-width: 900px;\\n    height: 100vh;\\n    margin: 0 auto;\\n\\n    color: #fff;\\n  }\\n\\n  .hero__intro {\\n    max-width: 507px;\\n  }\\n\\n  .hero__cta a {\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n\\n    text-decoration: none !important;\\n\\n    color: #fff;\\n  }\\n\\n  .hero__cta:hover .button-round {\\n    cursor: pointer;\\n\\n    border: 2px solid rgba(255, 255, 255, 0.6);\\n  }\\n\\n  .hero__cta:hover .title-main {\\n    transform: translateX(2px);\\n  }\\n\\n  .hero__cta:hover .title-highlight {\\n    transform: translateX(4px);\\n  }\\n\\n  .hero__cta:hover .button-round img {\\n    transform: rotate(-30deg);\\n  }\\n\\n  .hero__cta .button-round {\\n    margin-right: 15px;\\n  }\\n</style>\\n\\n<SpotlightBackground\\n  {spotSize}\\n  {backgroundColor}\\n  {gradientColor}\\n  backgroundImage=\\\"https://scontent-amt2-1.xx.fbcdn.net/v/t1.0-9/66119555_1102391759958724_1637141035295440896_n.jpg?_nc_cat=110&_nc_oc=AQkG3SAsAcfqJVWoJabTflX3U5kM6EWTLyFYbdc1eDBiTA6Kx364OmdiXynaTy3YmyI&_nc_ht=scontent-amt2-1.xx&oh=c40e6640448e035edb073b9e74c43320&oe=5E1D3AA7\\\" />\\n\\n<section class=\\\"hero\\\">\\n  <div class=\\\"hero__intro\\\">\\n    <h1 class=\\\"title-main\\\">\\n      Wat is jouw\\n      <span class=\\\"title-highlight\\\">Perspectief</span>\\n    </h1>\\n    <p class=\\\"body\\\">\\n      Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie\\n      overgenomen door de fotograaf. Landschappen, mensen en hun\\n      leefomstandigheden waren de belangrijkste onderwerpen. Het is aan jou de\\n      taak om deze zo goed mogelijk vast te leggen.\\n    </p>\\n  </div>\\n\\n  <div class=\\\"hero__cta\\\">\\n    <NavLink to=\\\"video\\\">\\n      <a href=\\\"nou en\\\">\\n        <span class=\\\"button-round\\\">\\n          <img src=\\\"icons/arrow.svg\\\" alt=\\\"\\\" />\\n        </span>\\n        <h3 class=\\\"title-main\\\">\\n          Vertel\\n          <span class=\\\"title-highlight\\\">Je verhaal</span>\\n        </h3>\\n      </a>\\n    </NavLink>\\n  </div>\\n</section>\\n\"],\"names\":[],\"mappings\":\"AAeE,KAAK,eAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,CAAC,CAEV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,CAE9B,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,KAAK,CACb,MAAM,CAAE,CAAC,CAAC,IAAI,CAEd,KAAK,CAAE,IAAI,AACb,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,SAAS,CAAE,KAAK,AAClB,CAAC,AAED,yBAAU,CAAC,CAAC,eAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CAEvB,eAAe,CAAE,IAAI,CAAC,UAAU,CAEhC,KAAK,CAAE,IAAI,AACb,CAAC,AAED,yBAAU,MAAM,CAAC,aAAa,eAAC,CAAC,AAC9B,MAAM,CAAE,OAAO,CAEf,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,AAC5C,CAAC,AAED,yBAAU,MAAM,CAAC,WAAW,eAAC,CAAC,AAC5B,SAAS,CAAE,WAAW,GAAG,CAAC,AAC5B,CAAC,AAED,yBAAU,MAAM,CAAC,gBAAgB,eAAC,CAAC,AACjC,SAAS,CAAE,WAAW,GAAG,CAAC,AAC5B,CAAC,AAED,yBAAU,MAAM,CAAC,aAAa,CAAC,GAAG,eAAC,CAAC,AAClC,SAAS,CAAE,OAAO,MAAM,CAAC,AAC3B,CAAC,AAED,yBAAU,CAAC,aAAa,eAAC,CAAC,AACxB,YAAY,CAAE,IAAI,AACpB,CAAC\"}"
};

const spotSize = 400;

const backgroundColor = "rgba(10, 12, 20, 0.85)";

const Home = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	
  const gradientColor = [
    "rgba(0, 0, 0, 0.3)",
    "rgba(0, 0, 0, 0.3)",
    "rgba(0, 0, 0, 0)"
  ];

	$$result.css.add(css);

	return `${validate_component(SpotlightBackground, 'SpotlightBackground').$$render($$result, {
		spotSize: spotSize,
		backgroundColor: backgroundColor,
		gradientColor: gradientColor,
		backgroundImage: "https://scontent-amt2-1.xx.fbcdn.net/v/t1.0-9/66119555_1102391759958724_1637141035295440896_n.jpg?_nc_cat=110&_nc_oc=AQkG3SAsAcfqJVWoJabTflX3U5kM6EWTLyFYbdc1eDBiTA6Kx364OmdiXynaTy3YmyI&_nc_ht=scontent-amt2-1.xx&oh=c40e6640448e035edb073b9e74c43320&oe=5E1D3AA7"
	}, {}, {})}

	<section class="hero svelte-1g5wq7f">
	  <div class="hero__intro svelte-1g5wq7f">
	    <h1 class="title-main">
	      Wat is jouw
	      <span class="title-highlight">Perspectief</span>
	    </h1>
	    <p class="body">
	      Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie
	      overgenomen door de fotograaf. Landschappen, mensen en hun
	      leefomstandigheden waren de belangrijkste onderwerpen. Het is aan jou de
	      taak om deze zo goed mogelijk vast te leggen.
	    </p>
	  </div>

	  <div class="hero__cta svelte-1g5wq7f">
	    ${validate_component(NavLink, 'NavLink').$$render($$result, { to: "video" }, {}, {
		default: () => `
	      <a href="nou en" class="svelte-1g5wq7f">
	        <span class="button-round svelte-1g5wq7f">
	          <img src="icons/arrow.svg" alt="" class="svelte-1g5wq7f">
	        </span>
	        <h3 class="title-main svelte-1g5wq7f">
	          Vertel
	          <span class="title-highlight svelte-1g5wq7f">Je verhaal</span>
	        </h3>
	      </a>
	    `
	})}
	  </div>
	</section>`;
});

/* src/routes/RetrieveData.svelte generated by Svelte v3.12.1 */

const RetrieveData = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { results } = $$props;

	if ($$props.results === void 0 && $$bindings.results && results !== void 0) $$bindings.results(results);

	return `${ results.length > 0 ? `${each(results, ({ id, title, description, imageLink }, i) => `<h2>${escape(title)}</h2>
	    <p>${escape(description)}</p>
	    <img${add_attribute("src", imageLink, 0)} alt="">
	    ${escape(imageLink)}`)}` : `<p>Loading</p>` }`;
});

/* src/components/VideoMeta.svelte generated by Svelte v3.12.1 */

const css$1 = {
	code: ".video-meta-description.svelte-deuyun{display:flex;justify-content:space-between}.video-title.svelte-deuyun{margin:20px 0;letter-spacing:4.3px;text-transform:uppercase;color:#ffe6a0;font-size:30px;font-weight:400}.video-count__title.svelte-deuyun{margin:0;margin-top:5px;letter-spacing:1.91px;text-transform:uppercase;font-size:15px;font-weight:400}.video-count__count.svelte-deuyun{margin:0;margin-top:-5px;letter-spacing:5.3px;font-family:\"Playfair Display\", serif;font-size:42px;line-height:1}",
	map: "{\"version\":3,\"file\":\"VideoMeta.svelte\",\"sources\":[\"VideoMeta.svelte\"],\"sourcesContent\":[\"<script>\\n  export let photoCount;\\n  export let videoTitle;\\n</script>\\n\\n<style>\\n  .video-meta-description {\\n    display: flex;\\n    justify-content: space-between;\\n  }\\n\\n  .video-title {\\n    margin: 20px 0;\\n\\n    letter-spacing: 4.3px;\\n    text-transform: uppercase;\\n\\n    color: #ffe6a0;\\n\\n    font-size: 30px;\\n    font-weight: 400;\\n  }\\n\\n  .video-count__title {\\n    margin: 0;\\n    margin-top: 5px;\\n\\n    letter-spacing: 1.91px;\\n    text-transform: uppercase;\\n\\n    font-size: 15px;\\n    font-weight: 400;\\n  }\\n\\n  .video-count__count {\\n    margin: 0;\\n    margin-top: -5px;\\n\\n    letter-spacing: 5.3px;\\n\\n    font-family: \\\"Playfair Display\\\", serif;\\n    font-size: 42px;\\n    line-height: 1;\\n  }\\n</style>\\n\\n<section class=\\\"video-meta-description\\\">\\n  <div class=\\\"video-count\\\">\\n    <h3 class=\\\"video-count__title\\\">Foto</h3>\\n    <p class=\\\"video-count__count\\\">{photoCount}</p>\\n  </div>\\n\\n  <h1 class=\\\"video-title\\\">{videoTitle}</h1>\\n</section>\\n\"],\"names\":[],\"mappings\":\"AAME,uBAAuB,cAAC,CAAC,AACvB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,aAAa,AAChC,CAAC,AAED,YAAY,cAAC,CAAC,AACZ,MAAM,CAAE,IAAI,CAAC,CAAC,CAEd,cAAc,CAAE,KAAK,CACrB,cAAc,CAAE,SAAS,CAEzB,KAAK,CAAE,OAAO,CAEd,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,mBAAmB,cAAC,CAAC,AACnB,MAAM,CAAE,CAAC,CACT,UAAU,CAAE,GAAG,CAEf,cAAc,CAAE,MAAM,CACtB,cAAc,CAAE,SAAS,CAEzB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,mBAAmB,cAAC,CAAC,AACnB,MAAM,CAAE,CAAC,CACT,UAAU,CAAE,IAAI,CAEhB,cAAc,CAAE,KAAK,CAErB,WAAW,CAAE,kBAAkB,CAAC,CAAC,KAAK,CACtC,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,CAAC,AAChB,CAAC\"}"
};

const VideoMeta = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { photoCount, videoTitle } = $$props;

	if ($$props.photoCount === void 0 && $$bindings.photoCount && photoCount !== void 0) $$bindings.photoCount(photoCount);
	if ($$props.videoTitle === void 0 && $$bindings.videoTitle && videoTitle !== void 0) $$bindings.videoTitle(videoTitle);

	$$result.css.add(css$1);

	return `<section class="video-meta-description svelte-deuyun">
	  <div class="video-count">
	    <h3 class="video-count__title svelte-deuyun">Foto</h3>
	    <p class="video-count__count svelte-deuyun">${escape(photoCount)}</p>
	  </div>

	  <h1 class="video-title svelte-deuyun">${escape(videoTitle)}</h1>
	</section>`;
});

/* src/components/SnapshotButton.svelte generated by Svelte v3.12.1 */

const css$2 = {
	code: "#snap.svelte-1eys2sq{position:absolute;right:0;bottom:0;display:flex;align-items:center;justify-content:center;width:55px;height:55px;cursor:pointer;opacity:0;transition:0.3s all ease;background:#ffe6a0;box-shadow:0 0 30px 4px rgba(255, 230, 160, 0.4)}#snap.svelte-1eys2sq:hover{box-shadow:0 0 30px 6px rgba(255, 230, 160, 0.4)}#snap.svelte-1eys2sq img.svelte-1eys2sq{width:20px;height:28px}",
	map: "{\"version\":3,\"file\":\"SnapshotButton.svelte\",\"sources\":[\"SnapshotButton.svelte\"],\"sourcesContent\":[\"<script>\\n  import { onMount } from \\\"svelte\\\";\\n  export let localStorageLink;\\n  let context, video, canvas, w, h;\\n\\n  onMount(() => {\\n    initVideoSnapshot();\\n    addPrevSnapshots(\\\"snapshot1\\\");\\n    addPrevSnapshots(\\\"snapshot2\\\");\\n  });\\n\\n  // #### VIDEO SNAPSHOT #####\\n  // 1. init video & Canvas\\n  // 2. draw frame from video on the canvas\\n  // 3. Convert the frame to an img(Base64) and store it\\n  // 4. Style the img\\n  // 5. Add it to the DOM\\n  // 6. Clear the canvas\\n\\n  function initVideoSnapshot() {\\n    video = document.querySelector(\\\"video\\\");\\n    canvas = document.getElementById(\\\"snapshot-canvas\\\");\\n    context = canvas.getContext(\\\"2d\\\");\\n    video.addEventListener(\\\"loadedmetadata\\\", setCanvasDimensions, false);\\n  }\\n\\n  function setCanvasDimensions() {\\n    const ratio = video.videoWidth / video.videoHeight;\\n    w = video.videoWidth - 100;\\n    h = parseInt(w / ratio, 10);\\n    canvas.width = w;\\n    canvas.height = h;\\n  }\\n\\n  function takeSnapShot() {\\n    drawVideoFrame();\\n    const snapshot = getVideoFrameFromCanvas();\\n    styleSnapshot(snapshot);\\n    addSnapshotToDOM(snapshot);\\n    context.clearRect(0, 0, canvas.width, canvas.height);\\n  }\\n\\n  function drawVideoFrame() {\\n    context.fillRect(0, 0, w, h);\\n    context.drawImage(video, 0, 0, w, h);\\n  }\\n\\n  function getVideoFrameFromCanvas() {\\n    const image = canvas\\n      .toDataURL(\\\"image/png\\\")\\n      .replace(\\\"image/png\\\", \\\"image/octet-stream\\\");\\n    localStorage.setItem(localStorageLink, image);\\n    const snapshot = new Image();\\n    snapshot.src = image;\\n    return snapshot;\\n  }\\n\\n  function styleSnapshot(snapshot) {\\n    snapshot.style.border = \\\"2px solid #c7c6c3\\\";\\n    snapshot.width = 136;\\n    snapshot.height = 91;\\n    snapshot.style.position = \\\"absolute\\\";\\n    let random = Math.floor(Math.random() * 30) + 1;\\n    random *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;\\n\\n    snapshot.style.transform = `rotate(${random}deg)`;\\n  }\\n\\n  function addSnapshotToDOM(snapshot) {\\n    document.querySelector(\\\"#snapshots-taken h4\\\").style.opacity = 1;\\n    document.querySelector(\\\"#snapshots-taken\\\").appendChild(snapshot);\\n  }\\n\\n  function addPrevSnapshots(snapshot) {\\n    if (localStorage.getItem(snapshot)) {\\n      const prevSnapshot = localStorage.getItem(snapshot);\\n      const snapshotImg = new Image();\\n      snapshotImg.src = prevSnapshot;\\n      styleSnapshot(snapshotImg);\\n      addSnapshotToDOM(snapshotImg);\\n    }\\n  }\\n</script>\\n\\n<style>\\n  #snap {\\n    position: absolute;\\n    right: 0;\\n    bottom: 0;\\n\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n\\n    width: 55px;\\n    height: 55px;\\n\\n    cursor: pointer;\\n\\n    opacity: 0;\\n    transition: 0.3s all ease;\\n    background: #ffe6a0;\\n    box-shadow: 0 0 30px 4px rgba(255, 230, 160, 0.4);\\n  }\\n\\n  #snap:hover {\\n    box-shadow: 0 0 30px 6px rgba(255, 230, 160, 0.4);\\n  }\\n\\n  #snap img {\\n    width: 20px;\\n    height: 28px;\\n  }\\n</style>\\n\\n<button id=\\\"snap\\\" on:click={takeSnapShot}>\\n  <img src=\\\"/icons/camera.svg\\\" alt=\\\"\\\" />\\n</button>\\n\"],\"names\":[],\"mappings\":\"AAqFE,KAAK,eAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,CAET,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CAEvB,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CAEZ,MAAM,CAAE,OAAO,CAEf,OAAO,CAAE,CAAC,CACV,UAAU,CAAE,IAAI,CAAC,GAAG,CAAC,IAAI,CACzB,UAAU,CAAE,OAAO,CACnB,UAAU,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAED,oBAAK,MAAM,AAAC,CAAC,AACX,UAAU,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,GAAG,CAAC,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,AACnD,CAAC,AAED,oBAAK,CAAC,GAAG,eAAC,CAAC,AACT,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,AACd,CAAC\"}"
};

function styleSnapshot(snapshot) {
  snapshot.style.border = "2px solid #c7c6c3";
  snapshot.width = 136;
  snapshot.height = 91;
  snapshot.style.position = "absolute";
  let random = Math.floor(Math.random() * 30) + 1;
  random *= Math.floor(Math.random() * 2) == 1 ? 1 : -1;

  snapshot.style.transform = `rotate(${random}deg)`;
}

function addSnapshotToDOM(snapshot) {
  document.querySelector("#snapshots-taken h4").style.opacity = 1;
  document.querySelector("#snapshots-taken").appendChild(snapshot);
}

function addPrevSnapshots(snapshot) {
  if (localStorage.getItem(snapshot)) {
    const prevSnapshot = localStorage.getItem(snapshot);
    const snapshotImg = new Image();
    snapshotImg.src = prevSnapshot;
    styleSnapshot(snapshotImg);
    addSnapshotToDOM(snapshotImg);
  }
}

const SnapshotButton = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { localStorageLink } = $$props;
  let context, video, canvas, w, h;

  onMount(() => {
    initVideoSnapshot();
    addPrevSnapshots("snapshot1");
    addPrevSnapshots("snapshot2");
  });

  // #### VIDEO SNAPSHOT #####
  // 1. init video & Canvas
  // 2. draw frame from video on the canvas
  // 3. Convert the frame to an img(Base64) and store it
  // 4. Style the img
  // 5. Add it to the DOM
  // 6. Clear the canvas

  function initVideoSnapshot() {
    video = document.querySelector("video");
    canvas = document.getElementById("snapshot-canvas");
    context = canvas.getContext("2d");
    video.addEventListener("loadedmetadata", setCanvasDimensions, false);
  }

  function setCanvasDimensions() {
    const ratio = video.videoWidth / video.videoHeight;
    w = video.videoWidth - 100;
    h = parseInt(w / ratio, 10);
    canvas.width = w;
    canvas.height = h;
  }

	if ($$props.localStorageLink === void 0 && $$bindings.localStorageLink && localStorageLink !== void 0) $$bindings.localStorageLink(localStorageLink);

	$$result.css.add(css$2);

	return `<button id="snap" class="svelte-1eys2sq">
	  <img src="/icons/camera.svg" alt="" class="svelte-1eys2sq">
	</button>`;
});

/* src/components/VideoSnapshot.svelte generated by Svelte v3.12.1 */

const css$3 = {
	code: "#snapshot-canvas.svelte-1j0v2dx{position:fixed}video.svelte-1j0v2dx{width:888px;height:496px;background:#000}.video-view.svelte-1j0v2dx{position:relative;z-index:3;display:flex;align-items:center;justify-content:center;width:100%;max-width:900px;height:100vh;margin:0 auto;color:#fff}.video-wrapper.svelte-1j0v2dx{position:relative;margin-left:100px}video.svelte-1j0v2dx:focus{outline:none}#snapshots-taken.svelte-1j0v2dx{margin-bottom:100px;margin-left:50px}#snapshots-taken.svelte-1j0v2dx h4.svelte-1j0v2dx{width:80px;margin-bottom:41px;letter-spacing:2px;text-transform:uppercase;opacity:0;font-size:14px;line-height:1.4}.video-and-snapshot-wrapper.svelte-1j0v2dx{display:flex;align-items:flex-end}.video-container.svelte-1j0v2dx{position:relative;width:100%;height:100%}.video-overlay.svelte-1j0v2dx{position:absolute;z-index:10;top:0;left:0;display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding-bottom:30px;transition:0.3s all ease;background:rgba(10, 10, 10, 0.7);cursor:pointer}.video-overlay.svelte-1j0v2dx:hover{background:rgba(0, 0, 0, 0.35)}.video-overlay.svelte-1j0v2dx:hover .button-round.svelte-1j0v2dx{border:2px solid rgba(255, 255, 255, 0.6)}.video-overlay.svelte-1j0v2dx:hover h3.svelte-1j0v2dx{opacity:1}.video-overlay.svelte-1j0v2dx button.svelte-1j0v2dx{border:none;background:none}.video-overlay.svelte-1j0v2dx h3.svelte-1j0v2dx{max-width:240px;margin:0;margin-right:10px;transition:0.3s all ease;text-align:right;letter-spacing:1px;color:#fff;font-size:17px;font-weight:400;opacity:0.7}.video-overlay.svelte-1j0v2dx button img.svelte-1j0v2dx{width:9px;height:14px}.next-video.svelte-1j0v2dx .flex.svelte-1j0v2dx{display:flex;align-items:center}",
	map: "{\"version\":3,\"file\":\"VideoSnapshot.svelte\",\"sources\":[\"VideoSnapshot.svelte\"],\"sourcesContent\":[\"<script>\\n  import { onMount } from \\\"svelte\\\";\\n  import NavLink from \\\"../components/NavLink.svelte\\\";\\n  import VideoMeta from \\\"../components/VideoMeta.svelte\\\";\\n  import SnapshotButton from \\\"../components/SnapshotButton.svelte\\\";\\n\\n  let context, video, canvas, w, h;\\n  export let videoSrc;\\n  export let videoTitle;\\n  export let localStorageLink;\\n  export let photoCount;\\n  export let posterSrc;\\n  export let linkTo;\\n  export let linkToText;\\n\\n  let isShowNextVideo = false;\\n\\n  onMount(() => {\\n    toggleNext();\\n  });\\n\\n  // #### VIDEO INSTRUCTIONS #####\\n  function playVideo() {\\n    const videoInstructions = document.getElementById(\\\"video-instructions\\\");\\n    const snapButton = document.getElementById(\\\"snap\\\");\\n    const videoPlayer = document.querySelector(\\\"video\\\");\\n\\n    function toggleVideoClass() {\\n      videoInstructions.style.opacity = 0;\\n      videoInstructions.style.visibility = \\\"hidden\\\";\\n      videoPlayer.play();\\n\\n      setTimeout(function() {\\n        snapButton.style.opacity = 1;\\n      }, 1200);\\n    }\\n\\n    videoInstructions.addEventListener(\\\"click\\\", toggleVideoClass);\\n  }\\n\\n  function toggleNext() {\\n    document.querySelector(\\\"video\\\").addEventListener(\\\"ended\\\", myHandler, false);\\n\\n    function myHandler(e) {\\n      console.log(\\\"a\\\");\\n      isShowNextVideo = true;\\n    }\\n  }\\n</script>\\n\\n<style>\\n  #snapshot-canvas {\\n    position: fixed;\\n  }\\n\\n  video {\\n    width: 888px;\\n    height: 496px;\\n\\n    background: #000;\\n  }\\n\\n  .video-view {\\n    position: relative;\\n    z-index: 3;\\n\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n\\n    width: 100%;\\n    max-width: 900px;\\n    height: 100vh;\\n    margin: 0 auto;\\n\\n    color: #fff;\\n  }\\n\\n  .video-wrapper {\\n    position: relative;\\n\\n    margin-left: 100px;\\n  }\\n\\n  video:focus {\\n    outline: none;\\n  }\\n\\n  #snapshots-taken {\\n    margin-bottom: 100px;\\n    margin-left: 50px;\\n  }\\n\\n  #snapshots-taken h4 {\\n    width: 80px;\\n    margin-bottom: 41px;\\n\\n    letter-spacing: 2px;\\n    text-transform: uppercase;\\n\\n    opacity: 0;\\n\\n    font-size: 14px;\\n    line-height: 1.4;\\n  }\\n\\n  .video-and-snapshot-wrapper {\\n    display: flex;\\n    align-items: flex-end;\\n  }\\n\\n  .video-container {\\n    position: relative;\\n\\n    width: 100%;\\n    height: 100%;\\n  }\\n\\n  .video-overlay {\\n    position: absolute;\\n    z-index: 10;\\n    top: 0;\\n    left: 0;\\n\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n\\n    width: 100%;\\n    height: 100%;\\n    padding-bottom: 30px;\\n\\n    transition: 0.3s all ease;\\n\\n    background: rgba(10, 10, 10, 0.7);\\n\\n    cursor: pointer;\\n  }\\n\\n  .video-overlay:hover {\\n    background: rgba(0, 0, 0, 0.35);\\n  }\\n\\n  .video-overlay:hover .button-round {\\n    border: 2px solid rgba(255, 255, 255, 0.6);\\n  }\\n\\n  .video-overlay:hover h3 {\\n    opacity: 1;\\n  }\\n\\n  .video-overlay button {\\n    border: none;\\n    background: none;\\n  }\\n\\n  .video-overlay h3 {\\n    max-width: 240px;\\n    margin: 0;\\n    margin-right: 10px;\\n\\n    transition: 0.3s all ease;\\n\\n    text-align: right;\\n    letter-spacing: 1px;\\n    color: #fff;\\n\\n    font-size: 17px;\\n    font-weight: 400;\\n\\n    opacity: 0.7;\\n  }\\n\\n  .video-overlay button img {\\n    width: 9px;\\n    height: 14px;\\n  }\\n\\n  .next-video .flex {\\n    display: flex;\\n    align-items: center;\\n  }\\n</style>\\n\\n<article class=\\\"video-view\\\">\\n  <div class=\\\"video-and-snapshot-wrapper\\\">\\n    <div class=\\\"video-wrapper\\\">\\n\\n      <VideoMeta {photoCount} {videoTitle} />\\n\\n      <div class=\\\"video-container\\\">\\n        <div class=\\\"video-overlay\\\" on:click={playVideo} id=\\\"video-instructions\\\">\\n          <h3>\\n            Maak momentopnames van de gebeurtenis, de laatste zie je straks\\n            terug\\n          </h3>\\n\\n          <button>\\n            <span class=\\\"button-round\\\">\\n              <img src=\\\"/icons/arrow-solid.svg\\\" alt=\\\"\\\" />\\n            </span>\\n          </button>\\n        </div>\\n\\n        {#if isShowNextVideo}\\n          <NavLink to={linkTo}>\\n            <div class=\\\"video-overlay next-video\\\">\\n              <div class=\\\"flex\\\">\\n                <h3>{linkToText}</h3>\\n                <button>\\n                  <span class=\\\"button-round\\\">\\n                    <img src=\\\"/icons/arrow.svg\\\" alt=\\\"\\\" />\\n                  </span>\\n                </button>\\n              </div>\\n            </div>\\n          </NavLink>\\n        {/if}\\n\\n        <video poster={posterSrc}>\\n          <source src={videoSrc} type=\\\"video/mp4\\\" />\\n        </video>\\n      </div>\\n\\n      {#if !isShowNextVideo}\\n        <SnapshotButton {localStorageLink} />\\n      {/if}\\n    </div>\\n\\n    <div id=\\\"snapshots-taken\\\">\\n      <h4>Jouw foto's</h4>\\n    </div>\\n\\n    <canvas id=\\\"snapshot-canvas\\\" width=\\\"640\\\" height=\\\"480\\\" />\\n  </div>\\n</article>\\n\"],\"names\":[],\"mappings\":\"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\"}"
};

const VideoSnapshot = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
  let { videoSrc, videoTitle, localStorageLink, photoCount, posterSrc, linkTo, linkToText } = $$props;

  let isShowNextVideo = false;

  onMount(() => {
    toggleNext();
  });

  function toggleNext() {
    document.querySelector("video").addEventListener("ended", myHandler, false);

    function myHandler(e) {
      console.log("a");
      isShowNextVideo = true;
    }
  }

	if ($$props.videoSrc === void 0 && $$bindings.videoSrc && videoSrc !== void 0) $$bindings.videoSrc(videoSrc);
	if ($$props.videoTitle === void 0 && $$bindings.videoTitle && videoTitle !== void 0) $$bindings.videoTitle(videoTitle);
	if ($$props.localStorageLink === void 0 && $$bindings.localStorageLink && localStorageLink !== void 0) $$bindings.localStorageLink(localStorageLink);
	if ($$props.photoCount === void 0 && $$bindings.photoCount && photoCount !== void 0) $$bindings.photoCount(photoCount);
	if ($$props.posterSrc === void 0 && $$bindings.posterSrc && posterSrc !== void 0) $$bindings.posterSrc(posterSrc);
	if ($$props.linkTo === void 0 && $$bindings.linkTo && linkTo !== void 0) $$bindings.linkTo(linkTo);
	if ($$props.linkToText === void 0 && $$bindings.linkToText && linkToText !== void 0) $$bindings.linkToText(linkToText);

	$$result.css.add(css$3);

	return `<article class="video-view svelte-1j0v2dx">
	  <div class="video-and-snapshot-wrapper svelte-1j0v2dx">
	    <div class="video-wrapper svelte-1j0v2dx">

	      ${validate_component(VideoMeta, 'VideoMeta').$$render($$result, {
		photoCount: photoCount,
		videoTitle: videoTitle
	}, {}, {})}

	      <div class="video-container svelte-1j0v2dx">
	        <div class="video-overlay svelte-1j0v2dx" id="video-instructions">
	          <h3 class="svelte-1j0v2dx">
	            Maak momentopnames van de gebeurtenis, de laatste zie je straks
	            terug
	          </h3>

	          <button class="svelte-1j0v2dx">
	            <span class="button-round svelte-1j0v2dx">
	              <img src="/icons/arrow-solid.svg" alt="" class="svelte-1j0v2dx">
	            </span>
	          </button>
	        </div>

	        ${ isShowNextVideo ? `${validate_component(NavLink, 'NavLink').$$render($$result, { to: linkTo }, {}, {
		default: () => `
	            <div class="video-overlay next-video svelte-1j0v2dx">
	              <div class="flex svelte-1j0v2dx">
	                <h3 class="svelte-1j0v2dx">${escape(linkToText)}</h3>
	                <button class="svelte-1j0v2dx">
	                  <span class="button-round svelte-1j0v2dx">
	                    <img src="/icons/arrow.svg" alt="" class="svelte-1j0v2dx">
	                  </span>
	                </button>
	              </div>
	            </div>
	          `
	})}` : `` }

	        <video${add_attribute("poster", posterSrc, 0)} class="svelte-1j0v2dx">
	          <source${add_attribute("src", videoSrc, 0)} type="video/mp4">
	        </video>
	      </div>

	      ${ !isShowNextVideo ? `${validate_component(SnapshotButton, 'SnapshotButton').$$render($$result, { localStorageLink: localStorageLink }, {}, {})}` : `` }
	    </div>

	    <div id="snapshots-taken" class="svelte-1j0v2dx">
	      <h4 class="svelte-1j0v2dx">Jouw foto's</h4>
	    </div>

	    <canvas id="snapshot-canvas" width="640" height="480" class="svelte-1j0v2dx"></canvas>
	  </div>
	</article>`;
});

/* src/routes/Video.svelte generated by Svelte v3.12.1 */

const spotSize$1 = 500;

const backgroundColor$1 = "rgba(15, 20, 20, 0.9)";

const Video = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	
  const gradientColor = [
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0)"
  ];

	return `${validate_component(SpotlightBackground, 'SpotlightBackground').$$render($$result, {
		spotSize: spotSize$1,
		backgroundColor: backgroundColor$1,
		gradientColor: gradientColor,
		backgroundImage: "https://scontent-amt2-1.xx.fbcdn.net/v/t1.0-9/27654433_764037853794118_4739243479831552770_n.jpg?_nc_cat=108&_nc_oc=AQlDa3nzcVUyWNXYYwZEXB8Kev00AxKqAS7BFDEmsjf5XUh_ovHWoSt79F4l7EvEyRw&_nc_ht=scontent-amt2-1.xx&oh=e76eebc07cb1521fc411076a32b46eb0&oe=5E1871CE"
	}, {}, {})}

	${validate_component(VideoSnapshot, 'VideoSnapshot').$$render($$result, {
		videoSrc: "/video/landing-marine.mp4",
		posterSrc: "/img/poster.jpg",
		videoTitle: "Marine landing",
		localStorageLink: "snapshot1",
		photoCount: "01",
		linkTo: "/video2",
		linkToText: "Bekijk het volgende video fragment"
	}, {}, {})}`;
});

/* src/routes/Video2.svelte generated by Svelte v3.12.1 */

const spotSize$2 = 500;

const backgroundColor$2 = "rgba(15, 20, 20, 0.9)";

const Video2 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	
  const gradientColor = [
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0)"
  ];

	return `${validate_component(SpotlightBackground, 'SpotlightBackground').$$render($$result, {
		spotSize: spotSize$2,
		backgroundColor: backgroundColor$2,
		gradientColor: gradientColor,
		backgroundImage: "/img/dummy4.jpg"
	}, {}, {})}

	${validate_component(VideoSnapshot, 'VideoSnapshot').$$render($$result, {
		videoSrc: "/video/wegversperingen.mp4",
		posterSrc: "/img/dummy5.jpg",
		videoTitle: "Wegversperingen",
		localStorageLink: "snapshot2",
		photoCount: "02",
		linkTo: "/video3",
		linkToText: "Bekijk het volgende video fragment"
	}, {}, {})}`;
});

/* src/routes/Video3.svelte generated by Svelte v3.12.1 */

const spotSize$3 = 500;

const backgroundColor$3 = "rgba(15, 20, 20, 0.9)";

const Video3 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	
  const gradientColor = [
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0.1)",
    "rgba(0, 0, 0, 0)"
  ];

	return `${validate_component(SpotlightBackground, 'SpotlightBackground').$$render($$result, {
		spotSize: spotSize$3,
		backgroundColor: backgroundColor$3,
		gradientColor: gradientColor,
		backgroundImage: "/img/dummy5.jpg"
	}, {}, {})}

	${validate_component(VideoSnapshot, 'VideoSnapshot').$$render($$result, {
		videoSrc: "/video/honger.mp4",
		posterSrc: "/img/poster.jpg",
		videoTitle: "Honger",
		localStorageLink: "snapshot3",
		photoCount: "03",
		linkTo: "/result",
		linkToText: "Zie hoe het verhaal afloopt"
	}, {}, {})}`;
});

/* src/routes/Blog.svelte generated by Svelte v3.12.1 */

const Blog = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${validate_component(Router, 'Router').$$render($$result, {}, {}, {
		default: () => `
	  <h1>Blog</h1>

	  <ul>
	    <li>
	      ${validate_component(Link, 'Link').$$render($$result, { to: "first" }, {}, {
		default: () => `Today I did something cool`
	})}
	    </li>
	    <li>
	      ${validate_component(Link, 'Link').$$render($$result, { to: "second" }, {}, {
		default: () => `I did something awesome today`
	})}
	    </li>
	    <li>
	      ${validate_component(Link, 'Link').$$render($$result, { to: "third" }, {}, {
		default: () => `Did something sweet today`
	})}
	    </li>
	  </ul>

	  ${validate_component(Route, 'Route').$$render($$result, { path: "first" }, {}, {
		default: () => `
	    <p>
	      I did something cool today. Lorem ipsum dolor sit amet, consectetur
	      adipisicing elit. Quisquam rerum asperiores, ex animi sunt ipsum. Voluptas
	      sint id hic. Vel neque maxime exercitationem facere culpa nisi, nihil
	      incidunt quo nostrum, beatae dignissimos dolores natus quaerat! Quasi sint
	      praesentium inventore quidem, deserunt atque ipsum similique dolores
	      maiores expedita, qui totam. Totam et incidunt assumenda quas explicabo
	      corporis eligendi amet sint ducimus, culpa fugit esse. Tempore dolorum sit
	      perspiciatis corporis molestias nemo, veritatis, asperiores earum! Ex
	      repudiandae aperiam asperiores esse minus veniam sapiente corrupti alias
	      deleniti excepturi saepe explicabo eveniet harum fuga numquam nostrum
	      adipisci pariatur iusto sint, impedit provident repellat quis?
	    </p>
	  `
	})}
	  ${validate_component(Route, 'Route').$$render($$result, { path: "second" }, {}, {
		default: () => `
	    <p>
	      I did something awesome today. Lorem ipsum dolor sit amet, consectetur
	      adipisicing elit. Repudiandae enim quasi animi, vero deleniti dignissimos
	      sapiente perspiciatis. Veniam, repellendus, maiores.
	    </p>
	  `
	})}
	  ${validate_component(Route, 'Route').$$render($$result, { path: "third" }, {}, {
		default: () => `
	    <p>
	      I did something sweet today. Lorem ipsum dolor sit amet, consectetur
	      adipisicing elit. Modi ad voluptas rem consequatur commodi minima
	      doloribus veritatis nam, quas, culpa autem repellat saepe quam deleniti
	      maxime delectus fuga totam libero sit neque illo! Sapiente consequatur rem
	      minima expedita nemo blanditiis, aut veritatis alias nostrum vel? Esse
	      molestias placeat, doloribus commodi.
	    </p>
	  `
	})}
	`
	})}`;
});

/* src/routes/Result.svelte generated by Svelte v3.12.1 */

const css$4 = {
	code: ".bg-img.svelte-1ahoxc5{background:url(\"img/dummy4.jpg\");width:100vw;height:100vh;position:fixed;background-size:cover}.bg-img.svelte-1ahoxc5:before{content:\"\";position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(15, 15, 20, 0.6)}.story-header.svelte-1ahoxc5{font-size:58px;color:#fff;font-weight:300;max-width:600px;margin:0 auto;margin-bottom:40px}.story-header.svelte-1ahoxc5:last-child{margin-bottom:0}.content.svelte-1ahoxc5{position:fixed;left:0;right:0;margin:0 auto;width:1020px;overflow:scroll;max-height:90vh;margin-top:10vh;padding-bottom:10vh;padding-top:15vh}.content-scroll.svelte-1ahoxc5:hover{-webkit-animation-play-state:paused;-moz-animation-play-state:paused;-o-animation-play-state:paused;animation-play-state:paused}@keyframes svelte-1ahoxc5-scroll-page{from{transform:translateY(0)}to{transform:translateY(-50%)}}.story-chapter.svelte-1ahoxc5{margin-top:50px}.story-chapter--mirror.svelte-1ahoxc5 .story__intro.svelte-1ahoxc5{margin-left:30px}.story-chapter--mirror.svelte-1ahoxc5 .story__moment-container.svelte-1ahoxc5{flex-direction:row-reverse}.story__count.svelte-1ahoxc5{margin:0;line-height:1}.story__current-count.svelte-1ahoxc5{font-size:338px;color:#ffe6a0;font-weight:300;letter-spacing:-9px}.story__total-count.svelte-1ahoxc5{font-size:68px;font-weight:300;color:#fff;padding-left:20px}.story__chapter-name.svelte-1ahoxc5{text-transform:uppercase;font-style:italic;font-weight:600;letter-spacing:4px;font-size:20px;color:#fff;margin-left:20px;margin-top:5px}.story__intro.svelte-1ahoxc5:nth-child(1){margin-left:calc(50% + 30px)}.story__moment-container.svelte-1ahoxc5{display:flex}.story-intro.svelte-1ahoxc5{margin:80px 0}.stories.svelte-1ahoxc5:last-child{padding-top:25%}.story__moment.svelte-1ahoxc5{max-width:517px;margin:40px;margin-bottom:70px}.story__moment-img.svelte-1ahoxc5{max-width:100%;object-fit:cover;max-height:300px;width:100%}.story__moment.svelte-1ahoxc5 figcaption.svelte-1ahoxc5{color:#fff;font-size:16px;font-family:\"Source Sans Pro\", sans-serif;line-height:1.5;margin-top:7px;opacity:0.85}",
	map: "{\"version\":3,\"file\":\"Result.svelte\",\"sources\":[\"Result.svelte\"],\"sourcesContent\":[\"<script>\\n  import { onMount } from \\\"svelte\\\";\\n  const fallbackImg = \\\"../img/dummy3.jpg\\\";\\n\\n  let snapshot1 = fallbackImg;\\n  let snapshot2 = fallbackImg;\\n  let snapshot3 = fallbackImg;\\n\\n  onMount(() => {\\n    snapshot1 = localStorage.getItem(\\\"snapshot1\\\")\\n      ? localStorage.getItem(\\\"snapshot1\\\")\\n      : fallbackImg;\\n\\n    snapshot2 = localStorage.getItem(\\\"snapshot2\\\")\\n      ? localStorage.getItem(\\\"snapshot2\\\")\\n      : fallbackImg;\\n\\n    snapshot3 = localStorage.getItem(\\\"snapshot3\\\")\\n      ? localStorage.getItem(\\\"snapshot3\\\")\\n      : fallbackImg;\\n  });\\n</script>\\n\\n<style>\\n  .bg-img {\\n    background: url(\\\"img/dummy4.jpg\\\");\\n    width: 100vw;\\n    height: 100vh;\\n    position: fixed;\\n    background-size: cover;\\n  }\\n\\n  .bg-img:before {\\n    content: \\\"\\\";\\n    position: absolute;\\n    top: 0;\\n    left: 0;\\n    width: 100%;\\n    height: 100%;\\n    background: rgba(15, 15, 20, 0.6);\\n  }\\n\\n  .story-header {\\n    font-size: 58px;\\n    color: #fff;\\n    font-weight: 300;\\n    max-width: 600px;\\n    margin: 0 auto;\\n    margin-bottom: 40px;\\n  }\\n\\n  .story-header:last-child {\\n    margin-bottom: 0;\\n  }\\n\\n  .content {\\n    position: fixed;\\n    left: 0;\\n    right: 0;\\n    margin: 0 auto;\\n    width: 1020px;\\n    overflow: scroll;\\n    max-height: 90vh;\\n    margin-top: 10vh;\\n    padding-bottom: 10vh;\\n    padding-top: 15vh;\\n  }\\n\\n  .content-scroll:hover {\\n    -webkit-animation-play-state: paused;\\n    -moz-animation-play-state: paused;\\n    -o-animation-play-state: paused;\\n    animation-play-state: paused;\\n  }\\n\\n  @keyframes scroll-page {\\n    from {\\n      transform: translateY(0);\\n    }\\n\\n    to {\\n      transform: translateY(-50%);\\n    }\\n  }\\n\\n  .story-chapter {\\n    margin-top: 50px;\\n  }\\n\\n  .story-chapter--mirror .story__intro {\\n    margin-left: 30px;\\n  }\\n\\n  .story-chapter--mirror .story__moment-container {\\n    flex-direction: row-reverse;\\n  }\\n\\n  .story__count {\\n    margin: 0;\\n    line-height: 1;\\n  }\\n  .story__current-count {\\n    font-size: 338px;\\n    color: #ffe6a0;\\n    font-weight: 300;\\n    letter-spacing: -9px;\\n  }\\n  .story__total-count {\\n    font-size: 68px;\\n    font-weight: 300;\\n    color: #fff;\\n    padding-left: 20px;\\n  }\\n\\n  .story__chapter-name {\\n    text-transform: uppercase;\\n    font-style: italic;\\n    font-weight: 600;\\n    letter-spacing: 4px;\\n    font-size: 20px;\\n    color: #fff;\\n    margin-left: 20px;\\n    margin-top: 5px;\\n  }\\n\\n  .story__intro:nth-child(1) {\\n    margin-left: calc(50% + 30px);\\n  }\\n\\n  .story__moment-container {\\n    display: flex;\\n  }\\n\\n  .story-intro {\\n    margin: 80px 0;\\n  }\\n\\n  .stories:last-child {\\n    padding-top: 25%;\\n  }\\n\\n  .story__moment {\\n    max-width: 517px;\\n    margin: 40px;\\n    margin-bottom: 70px;\\n  }\\n\\n  .story__moment-img {\\n    max-width: 100%;\\n    object-fit: cover;\\n    max-height: 300px;\\n    width: 100%;\\n  }\\n\\n  .story__moment figcaption {\\n    color: #fff;\\n    font-size: 16px;\\n    font-family: \\\"Source Sans Pro\\\", sans-serif;\\n    line-height: 1.5;\\n    margin-top: 7px;\\n    opacity: 0.85;\\n  }\\n</style>\\n\\n<div class=\\\"bg-img\\\" />\\n\\n<div class=\\\"content\\\">\\n  <div class=\\\"content-scroll\\\">\\n\\n    <section class=\\\"story-intro\\\">\\n      <h2 class=\\\"story-header\\\">De oorlog heeft een grote impact gehad</h2>\\n      <h2 class=\\\"story-header\\\">Indonesië was niet meer hetzelfde</h2>\\n    </section>\\n\\n    <section class=\\\"story-chapter\\\">\\n      <div class=\\\"story__intro\\\">\\n        <h3 class=\\\"story__count\\\">\\n          <span class=\\\"story__current-count\\\">01</span>\\n          <span class=\\\"story__total-count\\\">/03</span>\\n        </h3>\\n        <div class=\\\"story__chapter-name\\\">Onafhankelijkheid</div>\\n      </div>\\n\\n      <div class=\\\"story__moment-container\\\">\\n        <div class=\\\"stories\\\">\\n          <figure class=\\\"story__moment background\\\">\\n\\n            <img class=\\\"story__moment-img background\\\" src={snapshot1} alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n\\n          <figure class=\\\"story__moment\\\">\\n            <img\\n              class=\\\"story__moment-img background\\\"\\n              src=\\\"/img/dummy5.jpg\\\"\\n              alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n        </div>\\n\\n        <div class=\\\"stories\\\">\\n          <figure class=\\\"story__moment\\\">\\n            <img class=\\\"story__moment-img\\\" src=\\\"/img/dummy6.jpg\\\" alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n        </div>\\n      </div>\\n    </section>\\n\\n    <section class=\\\"story-intro\\\">\\n      <h2 class=\\\"story-header\\\">De oorlog heeft een grote impact gehad</h2>\\n      <h2 class=\\\"story-header\\\">Indonesië was niet meer hetzelfde</h2>\\n    </section>\\n\\n    <section class=\\\"story-chapter story-chapter--mirror\\\">\\n      <div class=\\\"story__intro\\\">\\n        <h3 class=\\\"story__count\\\">\\n          <span class=\\\"story__current-count\\\">02</span>\\n          <span class=\\\"story__total-count\\\">/03</span>\\n        </h3>\\n        <div class=\\\"story__chapter-name\\\">Onafhankelijkheid</div>\\n      </div>\\n\\n      <div class=\\\"story__moment-container\\\">\\n        <div class=\\\"stories\\\">\\n          <figure class=\\\"story__moment\\\">\\n\\n            <img class=\\\"story__moment-img background\\\" src={snapshot2} alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n\\n          <figure class=\\\"story__moment\\\">\\n            <img class=\\\"story__moment-img\\\" src=\\\"/img/dummy5.jpg\\\" alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n        </div>\\n\\n        <div class=\\\"stories\\\">\\n          <figure class=\\\"story__moment\\\">\\n            <img class=\\\"story__moment-img\\\" src=\\\"/img/dummy6.jpg\\\" alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n        </div>\\n      </div>\\n    </section>\\n\\n    <section class=\\\"story-intro\\\">\\n      <h2 class=\\\"story-header\\\">\\n        Indonesië was niet meer hetzelfde Indonesië was niet meer hetzelfde\\n      </h2>\\n    </section>\\n\\n    <section class=\\\"story-chapter\\\">\\n      <div class=\\\"story__intro\\\">\\n        <h3 class=\\\"story__count\\\">\\n          <span class=\\\"story__current-count\\\">03</span>\\n          <span class=\\\"story__total-count\\\">/03</span>\\n        </h3>\\n        <div class=\\\"story__chapter-name\\\">Onafhankelijkheid</div>\\n      </div>\\n\\n      <div class=\\\"story__moment-container\\\">\\n        <div class=\\\"stories\\\">\\n          <figure class=\\\"story__moment\\\">\\n            <img class=\\\"story__moment-img background\\\" src={snapshot3} alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n\\n          <figure class=\\\"story__moment\\\">\\n            <img class=\\\"story__moment-img\\\" src=\\\"/img/dummy5.jpg\\\" alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n        </div>\\n\\n        <div class=\\\"stories\\\">\\n          <figure class=\\\"story__moment\\\">\\n            <img class=\\\"story__moment-img\\\" src=\\\"/img/dummy6.jpg\\\" alt=\\\"\\\" />\\n            <figcaption>\\n              Na de uitvinding van de fotografie in 1839 werd de rol van de\\n              expeditie overgenomen door de fotograaf. Landschappen, mensen en\\n              hun leefomstandigheden waren de belangrijkste onderwerpen.\\n            </figcaption>\\n          </figure>\\n        </div>\\n      </div>\\n\\n    </section>\\n\\n  </div>\\n</div>\\n\"],\"names\":[],\"mappings\":\"AAwBE,OAAO,eAAC,CAAC,AACP,UAAU,CAAE,IAAI,gBAAgB,CAAC,CACjC,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,CACb,QAAQ,CAAE,KAAK,CACf,eAAe,CAAE,KAAK,AACxB,CAAC,AAED,sBAAO,OAAO,AAAC,CAAC,AACd,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,KAAK,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,GAAG,CAAC,AACnC,CAAC,AAED,aAAa,eAAC,CAAC,AACb,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,CACX,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,4BAAa,WAAW,AAAC,CAAC,AACxB,aAAa,CAAE,CAAC,AAClB,CAAC,AAED,QAAQ,eAAC,CAAC,AACR,QAAQ,CAAE,KAAK,CACf,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,KAAK,CAAE,MAAM,CACb,QAAQ,CAAE,MAAM,CAChB,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,IAAI,CAChB,cAAc,CAAE,IAAI,CACpB,WAAW,CAAE,IAAI,AACnB,CAAC,AAED,8BAAe,MAAM,AAAC,CAAC,AACrB,4BAA4B,CAAE,MAAM,CACpC,yBAAyB,CAAE,MAAM,CACjC,uBAAuB,CAAE,MAAM,CAC/B,oBAAoB,CAAE,MAAM,AAC9B,CAAC,AAED,WAAW,0BAAY,CAAC,AACtB,IAAI,AAAC,CAAC,AACJ,SAAS,CAAE,WAAW,CAAC,CAAC,AAC1B,CAAC,AAED,EAAE,AAAC,CAAC,AACF,SAAS,CAAE,WAAW,IAAI,CAAC,AAC7B,CAAC,AACH,CAAC,AAED,cAAc,eAAC,CAAC,AACd,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,qCAAsB,CAAC,aAAa,eAAC,CAAC,AACpC,WAAW,CAAE,IAAI,AACnB,CAAC,AAED,qCAAsB,CAAC,wBAAwB,eAAC,CAAC,AAC/C,cAAc,CAAE,WAAW,AAC7B,CAAC,AAED,aAAa,eAAC,CAAC,AACb,MAAM,CAAE,CAAC,CACT,WAAW,CAAE,CAAC,AAChB,CAAC,AACD,qBAAqB,eAAC,CAAC,AACrB,SAAS,CAAE,KAAK,CAChB,KAAK,CAAE,OAAO,CACd,WAAW,CAAE,GAAG,CAChB,cAAc,CAAE,IAAI,AACtB,CAAC,AACD,mBAAmB,eAAC,CAAC,AACnB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,CACX,YAAY,CAAE,IAAI,AACpB,CAAC,AAED,oBAAoB,eAAC,CAAC,AACpB,cAAc,CAAE,SAAS,CACzB,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,GAAG,CAChB,cAAc,CAAE,GAAG,CACnB,SAAS,CAAE,IAAI,CACf,KAAK,CAAE,IAAI,CACX,WAAW,CAAE,IAAI,CACjB,UAAU,CAAE,GAAG,AACjB,CAAC,AAED,4BAAa,WAAW,CAAC,CAAC,AAAC,CAAC,AAC1B,WAAW,CAAE,KAAK,GAAG,CAAC,CAAC,CAAC,IAAI,CAAC,AAC/B,CAAC,AAED,wBAAwB,eAAC,CAAC,AACxB,OAAO,CAAE,IAAI,AACf,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,MAAM,CAAE,IAAI,CAAC,CAAC,AAChB,CAAC,AAED,uBAAQ,WAAW,AAAC,CAAC,AACnB,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,cAAc,eAAC,CAAC,AACd,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,kBAAkB,eAAC,CAAC,AAClB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,KAAK,CACjB,UAAU,CAAE,KAAK,CACjB,KAAK,CAAE,IAAI,AACb,CAAC,AAED,6BAAc,CAAC,UAAU,eAAC,CAAC,AACzB,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,iBAAiB,CAAC,CAAC,UAAU,CAC1C,WAAW,CAAE,GAAG,CAChB,UAAU,CAAE,GAAG,CACf,OAAO,CAAE,GAAG,CAAC,AACf,CAAC\"}"
};

const fallbackImg = "../img/dummy3.jpg";

const Result = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	

  let snapshot1 = fallbackImg;
  let snapshot2 = fallbackImg;
  let snapshot3 = fallbackImg;

  onMount(() => {
    snapshot1 = localStorage.getItem("snapshot1")
      ? localStorage.getItem("snapshot1")
      : fallbackImg;

    snapshot2 = localStorage.getItem("snapshot2")
      ? localStorage.getItem("snapshot2")
      : fallbackImg;

    snapshot3 = localStorage.getItem("snapshot3")
      ? localStorage.getItem("snapshot3")
      : fallbackImg;
  });

	$$result.css.add(css$4);

	return `<div class="bg-img svelte-1ahoxc5"></div>

	<div class="content svelte-1ahoxc5">
	  <div class="content-scroll svelte-1ahoxc5">

	    <section class="story-intro svelte-1ahoxc5">
	      <h2 class="story-header svelte-1ahoxc5">De oorlog heeft een grote impact gehad</h2>
	      <h2 class="story-header svelte-1ahoxc5">Indonesië was niet meer hetzelfde</h2>
	    </section>

	    <section class="story-chapter svelte-1ahoxc5">
	      <div class="story__intro svelte-1ahoxc5">
	        <h3 class="story__count svelte-1ahoxc5">
	          <span class="story__current-count svelte-1ahoxc5">01</span>
	          <span class="story__total-count svelte-1ahoxc5">/03</span>
	        </h3>
	        <div class="story__chapter-name svelte-1ahoxc5">Onafhankelijkheid</div>
	      </div>

	      <div class="story__moment-container svelte-1ahoxc5">
	        <div class="stories svelte-1ahoxc5">
	          <figure class="story__moment background svelte-1ahoxc5">

	            <img class="story__moment-img background svelte-1ahoxc5"${add_attribute("src", snapshot1, 0)} alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>

	          <figure class="story__moment svelte-1ahoxc5">
	            <img class="story__moment-img background svelte-1ahoxc5" src="/img/dummy5.jpg" alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>
	        </div>

	        <div class="stories svelte-1ahoxc5">
	          <figure class="story__moment svelte-1ahoxc5">
	            <img class="story__moment-img svelte-1ahoxc5" src="/img/dummy6.jpg" alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>
	        </div>
	      </div>
	    </section>

	    <section class="story-intro svelte-1ahoxc5">
	      <h2 class="story-header svelte-1ahoxc5">De oorlog heeft een grote impact gehad</h2>
	      <h2 class="story-header svelte-1ahoxc5">Indonesië was niet meer hetzelfde</h2>
	    </section>

	    <section class="story-chapter story-chapter--mirror svelte-1ahoxc5">
	      <div class="story__intro svelte-1ahoxc5">
	        <h3 class="story__count svelte-1ahoxc5">
	          <span class="story__current-count svelte-1ahoxc5">02</span>
	          <span class="story__total-count svelte-1ahoxc5">/03</span>
	        </h3>
	        <div class="story__chapter-name svelte-1ahoxc5">Onafhankelijkheid</div>
	      </div>

	      <div class="story__moment-container svelte-1ahoxc5">
	        <div class="stories svelte-1ahoxc5">
	          <figure class="story__moment svelte-1ahoxc5">

	            <img class="story__moment-img background svelte-1ahoxc5"${add_attribute("src", snapshot2, 0)} alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>

	          <figure class="story__moment svelte-1ahoxc5">
	            <img class="story__moment-img svelte-1ahoxc5" src="/img/dummy5.jpg" alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>
	        </div>

	        <div class="stories svelte-1ahoxc5">
	          <figure class="story__moment svelte-1ahoxc5">
	            <img class="story__moment-img svelte-1ahoxc5" src="/img/dummy6.jpg" alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>
	        </div>
	      </div>
	    </section>

	    <section class="story-intro svelte-1ahoxc5">
	      <h2 class="story-header svelte-1ahoxc5">
	        Indonesië was niet meer hetzelfde Indonesië was niet meer hetzelfde
	      </h2>
	    </section>

	    <section class="story-chapter svelte-1ahoxc5">
	      <div class="story__intro svelte-1ahoxc5">
	        <h3 class="story__count svelte-1ahoxc5">
	          <span class="story__current-count svelte-1ahoxc5">03</span>
	          <span class="story__total-count svelte-1ahoxc5">/03</span>
	        </h3>
	        <div class="story__chapter-name svelte-1ahoxc5">Onafhankelijkheid</div>
	      </div>

	      <div class="story__moment-container svelte-1ahoxc5">
	        <div class="stories svelte-1ahoxc5">
	          <figure class="story__moment svelte-1ahoxc5">
	            <img class="story__moment-img background svelte-1ahoxc5"${add_attribute("src", snapshot3, 0)} alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>

	          <figure class="story__moment svelte-1ahoxc5">
	            <img class="story__moment-img svelte-1ahoxc5" src="/img/dummy5.jpg" alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>
	        </div>

	        <div class="stories svelte-1ahoxc5">
	          <figure class="story__moment svelte-1ahoxc5">
	            <img class="story__moment-img svelte-1ahoxc5" src="/img/dummy6.jpg" alt="">
	            <figcaption class="svelte-1ahoxc5">
	              Na de uitvinding van de fotografie in 1839 werd de rol van de
	              expeditie overgenomen door de fotograaf. Landschappen, mensen en
	              hun leefomstandigheden waren de belangrijkste onderwerpen.
	            </figcaption>
	          </figure>
	        </div>
	      </div>

	    </section>

	  </div>
	</div>`;
});

/* src/App.svelte generated by Svelte v3.12.1 */

const queryUrl =
    "https://api.data.netwerkdigitaalerfgoed.nl/datasets/ivo/NMVW/services/NMVW-20/sparql";

const App = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	

  // Used for routing
  let { url = "" } = $$props;

  const query = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dc: <http://purl.org/dc/elements/1.1/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX edm: <http://www.europeana.eu/schemas/edm/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  SELECT ?cho ?title ?placeName ?description ?imageLink WHERE {
    <https://hdl.handle.net/20.500.11840/termmaster7745> skos:narrower* ?place . #Ind0
    ?place skos:prefLabel ?placeName .
      
    <https://hdl.handle.net/20.500.11840/termmaster16239> skos:narrower* ?cat . # Strijd en oorlog
    # ?cat skos:prefLabel ?catLabel .
    
    ?cho dct:spatial ?place ;
    dc:type ?type ;
    edm:isShownBy ?imageLink ;
    dc:description ?description ;
    dc:title ?title .
    # FILTER langMatches(lang(?title), "ned")
  }
  LIMIT 50
  `;
  let results = [];

  // Fetch data & clean it
  function runQuery(queryUrl, query) {
    fetch(queryUrl + "?query=" + encodeURIComponent(query) + "&format=json")
      .then(res => res.json())
      .then(json => {
        results = JSON.parse(JSON.stringify(json.results));
        results = results.bindings;
        results = results.map((result, index) => {
          return {
            id: index,
            description: result.description.value,
            imageLink: result.imageLink.value,
            title: result.title.value,
            placeName: result.placeName.value
          };
        });
      });
  }

  onMount(() => {
    runQuery(queryUrl, query);
  });

	if ($$props.url === void 0 && $$bindings.url && url !== void 0) $$bindings.url(url);

	return `${validate_component(Router, 'Router').$$render($$result, { url: url }, {}, {
		default: () => `
	  
	  <nav class="main-nav">
	    ${validate_component(NavLink, 'NavLink').$$render($$result, { to: "/intro" }, {}, {
		default: () => `
	      <img src="/icons/logo.svg" alt="">
	    `
	})}

	    <div class="main-nav__links">
	      
	      
	      ${validate_component(NavLink, 'NavLink').$$render($$result, { to: "retrieve-data" }, {}, { default: () => `Retrieve Data` })}
	    </div>
	  </nav>

	  
	  <div>
	    
	    ${validate_component(Route, 'Route').$$render($$result, { path: "intro", component: Home }, {}, {})}
	    ${validate_component(Route, 'Route').$$render($$result, { path: "video", component: Video }, {}, {})}
	    ${validate_component(Route, 'Route').$$render($$result, { path: "video2", component: Video2 }, {}, {})}
	    ${validate_component(Route, 'Route').$$render($$result, { path: "video3", component: Video3 }, {}, {})}
	    ${validate_component(Route, 'Route').$$render($$result, { path: "result", component: Result }, {}, {})}
	    ${validate_component(Route, 'Route').$$render($$result, {
		path: "retrieve-data",
		results: results,
		component: RetrieveData
	}, {}, {})}
	    ${validate_component(Route, 'Route').$$render($$result, { path: "blog/*", component: Blog }, {}, {})}
	  </div>
	`
	})}`;
});

module.exports = App;
