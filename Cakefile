{spawn, exec} = require 'child_process'

task 'build', 'Compile all CoffeeScript back into JavaScript', ->
  folders = ["engine", "middlewares", "models", "public", "routes", "test"]

  compile = (folder) ->
    exec "coffee --bare --no-header --output build/#{folder} --compile #{folder}", (err, stdout, stderr) ->
      err && throw err
      console.log 'CoffeeScript compilation completed'

  compile(folder) for folder in folders
