function deploy {
  tilesets delete-source chachopazos ge-boundaries-change-$1 && tilesets add-source chachopazos ge-boundaries-change-$1 data/processed/changes/$1.jsonl
}

for year in $@
do
  deploy $year
done
