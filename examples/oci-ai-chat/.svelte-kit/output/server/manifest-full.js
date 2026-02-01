export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BouHUy-J.js",app:"_app/immutable/entry/app.4srVXohN.js",imports:["_app/immutable/entry/start.BouHUy-J.js","_app/immutable/chunks/BDsM76Bt.js","_app/immutable/chunks/D_LdEIn5.js","_app/immutable/chunks/CrgApKGF.js","_app/immutable/entry/app.4srVXohN.js","_app/immutable/chunks/D_LdEIn5.js","_app/immutable/chunks/zUq2wEOL.js","_app/immutable/chunks/DMBfRyyZ.js","_app/immutable/chunks/CrgApKGF.js","_app/immutable/chunks/B-Yz9b8_.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/chat",
				pattern: /^\/api\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/chat/_server.ts.js'))
			},
			{
				id: "/api/models",
				pattern: /^\/api\/models\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/models/_server.ts.js'))
			},
			{
				id: "/api/sessions",
				pattern: /^\/api\/sessions\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/sessions/_server.ts.js'))
			},
			{
				id: "/api/sessions/[id]",
				pattern: /^\/api\/sessions\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/sessions/_id_/_server.ts.js'))
			},
			{
				id: "/api/sessions/[id]/continue",
				pattern: /^\/api\/sessions\/([^/]+?)\/continue\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/sessions/_id_/continue/_server.ts.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
