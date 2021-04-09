function deploy {
  tilesets delete-source yongjun21 ge-boundaries-$1 && tilesets add-source yongjun21 ge-boundaries-$1 data/processed/geojson/$1.jsonl
}

for year in $@
do
  deploy $year
done
