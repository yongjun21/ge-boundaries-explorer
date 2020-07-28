# ge-boundaries-explorer

## Prototype

- https://ge-boundaries-explorer.netlify.app/
- https://ge-boundaries-explorer.netlify.app/changes
- https://ge-boundaries-explorer.netlify.app/stacked
- https://ge-boundaries-explorer.netlify.app/buildings/bedok
- https://ge-boundaries-explorer.netlify.app/buildings/serangoon
- https://ge-boundaries-explorer.netlify.app/grid
- https://ge-boundaries-explorer.netlify.app/grid/cumulative

## Tilesets:

- Historical boundaries: https://studio.mapbox.com/tilesets/yongjun.ge-boundaries/
- Boundaries change: https://studio.mapbox.com/tilesets/yongjun.ge-boundaries-change/
- Grid format: https://studio.mapbox.com/tilesets/yongjun.ge-boundaries-grid/
- Buildings: https://studio.mapbox.com/tilesets/yongjun.ge-boundaries-buildings/

## Deploy tilesets

- tilesets add-source yongjun21 ge-boundaries-1968 data/processed/geojson/1968.jsonl
- tilesets add-source yongjun21 ge-boundaries-1972 data/processed/geojson/1972.jsonl
- tilesets add-source yongjun21 ge-boundaries-1976 data/processed/geojson/1976.jsonl
- tilesets add-source yongjun21 ge-boundaries-1980 data/processed/geojson/1980.jsonl
- tilesets add-source yongjun21 ge-boundaries-1984 data/processed/geojson/1984.jsonl
- tilesets add-source yongjun21 ge-boundaries-1988 data/processed/geojson/1988.jsonl
- tilesets add-source yongjun21 ge-boundaries-1991 data/processed/geojson/1991.jsonl
- tilesets add-source yongjun21 ge-boundaries-1997 data/processed/geojson/1997.jsonl
- tilesets add-source yongjun21 ge-boundaries-2001 data/processed/geojson/2001.jsonl
- tilesets add-source yongjun21 ge-boundaries-2006 data/processed/geojson/2006.jsonl
- tilesets add-source yongjun21 ge-boundaries-2011 data/processed/geojson/2011.jsonl
- tilesets add-source yongjun21 ge-boundaries-2015 data/processed/geojson/2015.jsonl
- tilesets add-source yongjun21 ge-boundaries-2020 data/processed/geojson/2020.jsonl
- tilesets create yongjun21.ge-boundaries --recipe data/recipes/base.json --name "GE Boundaries"
- tilesets publish yongjun21.ge-boundaries
- tilesets add-source yongjun21 ge-boundaries-change-1988 data/processed/changes/1988.jsonl
- tilesets add-source yongjun21 ge-boundaries-change-1991 data/processed/changes/1991.jsonl
- tilesets add-source yongjun21 ge-boundaries-change-1997 data/processed/changes/1997.jsonl
- tilesets add-source yongjun21 ge-boundaries-change-2001 data/processed/changes/2001.jsonl
- tilesets add-source yongjun21 ge-boundaries-change-2006 data/processed/changes/2006.jsonl
- tilesets add-source yongjun21 ge-boundaries-change-2011 data/processed/changes/2011.jsonl
- tilesets add-source yongjun21 ge-boundaries-change-2015 data/processed/changes/2015.jsonl
- tilesets add-source yongjun21 ge-boundaries-change-2020 data/processed/changes/2020.jsonl
- tilesets create yongjun21.ge-boundaries-change --recipe data/recipes/change.json --name "GE Boundaries Change"
- tilesets publish yongjun21.ge-boundaries-change
- tilesets add-source yongjun21 ge-boundaries-grid data/processed/grid/fill.jsonl
- tilesets add-source yongjun21 ge-boundaries-grid-outline data/processed/grid/outline.jsonl
- tilesets create yongjun21.ge-boundaries-grid --recipe data/recipes/grid.json --name "GE Boundaries Grid"
- tilesets publish yongjun21.ge-boundaries-grid
- tilesets add-source yongjun21 ge-boundaries-buildings data/processed/buildings.jsonl
- tilesets create yongjun21.ge-boundaries-buildings --recipe data/recipes/buildings.json --name "GE Boundaries Buildings"
- tilesets publish yongjun21.ge-boundaries-buildings

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


### Requirements:
https://github.com/mapbox/tilesets-cli

python >2.7
or install https://docs.conda.io/en/latest/miniconda.html

#### bash_profile
```
MAPBOX_ACCESS_TOKEN
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
```