#!/bin/bash

convert_js_to_coffee()
{
  for JS in `find . -type f -name "*.js" ! -path "./ocean.js" ! -path "./public/js/purl.js" -o -path './node_modules' -prune -o -path './bower_components' -prune -o -path './developer_scripts' -prune -o -path './build' -prune`
  do
    if [[ -e "$JS" && ! -d "$JS" ]]; then
      # Workaround for non-conversion of the reserved `delete` keyword
      sed -i -e 's#\.delete#\.deletejs2coffeeworkaround#g' $JS

      # Workaround for non-conversion of the reserved `in` keyword
      sed -i -e 's#io\.sockets\.in#io\.sockets\.injs2coffeeworkaround#g' $JS
      sed -i -e 's#ioAdmin\.in#ioAdmin\.injs2coffeeworkaround#g' $JS

      COFFEE=${JS//.js/.coffee}
      echo "converting ${JS} to ${COFFEE}"
      js2coffee "$JS" > "$COFFEE"

      sed -i -e 's#deletejs2coffeeworkaround#delete#g' $JS
      sed -i -e 's#io\.sockets\.injs2coffeeworkaround#io\.sockets\.in#g' $JS
      sed -i -e 's#ioAdmin\.injs2coffeeworkaround#ioAdmin\.in#g' $JS

      sed -i -e 's#deletejs2coffeeworkaround#delete#g' $COFFEE
      sed -i -e 's#io\.sockets\.injs2coffeeworkaround#io\.sockets\.in#g' $COFFEE
    fi
  done
}

backup_coffee()
{
  git reset HEAD .
  for COFFEE in `find . -type f -name "*.coffee" -o -path './node_modules' -prune -o -path './bower_components' -prune -o -path './developer_scripts' -prune`
  do
    git add $COFFEE
  done
  git commit -m "[backup] *.coffee"
}

array_workaround()
{
  for COFFEE in `find ./test -type f -name "*.coffee" -o -path './node_modules' -prune -o -path './bower_components' -prune -o -path './developer_scripts' -prune`
  do
    if [[ -e "$COFFEE" && ! -d "$COFFEE" ]]; then
      # Workaround for faulty conversion of fishers array [{}, {}, {}, {}] in test/engine/fishers.js
      sed -i -e 's#^\s*{}$##g' $COFFEE
    fi
  done
}

beautify_and_backup_generated_js()
{
  git reset HEAD .
  for JS in `find ./build -type f -name "*.js" -o -path './node_modules' -prune -o -path './bower_components' -prune -o -path './developer_scripts' -prune`
  do
    js-beautify --config .jsbeautifyrc $JS
    git add $JS
  done
  git commit -m "[backup] *.js"
}

main()
{
  convert_js_to_coffee
  backup_coffee
  array_workaround
  backup_coffee
  cake build
  beautify_and_backup_generated_js
}

main
exit 0
