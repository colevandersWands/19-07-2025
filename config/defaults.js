export const defaults = {
  "core": {
    "version": "2.0.0",
    "staticRoot": "/static",
    "sharedStatic": "/static/shared"
  },
  "defaults": {
    ".js": ["uppercase", "lines"],
    ".ts": ["reverse"],
    ".jsx": ["embed"],
    ".tsx": ["embed"],
    ".md": ["lines"],
    ".html": ["lines"],
    ".css": ["wordcount"],
    ".json": ["uppercase"]
  },
  "lenses": {
    "identity": {},
    "reverse": {},
    "uppercase": {},
    "embed": {
      "template": "html5",
      "styles": true
    },
    "lines": {
      "numbers": true,
      "empty": false
    },
    "wordcount": {
      "includeWhitespace": false,
      "showBreakdown": true
    }
  }
}