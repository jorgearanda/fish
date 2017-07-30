[![Travis](https://img.shields.io/travis/jorgearanda/fish.svg)]()
[![Coveralls](https://img.shields.io/coveralls/jorgearanda/fish.svg)]()

This is a web-based version of Robert and Jonas Gifford's "FISH", a fish banks simulator for environmental psychology studies.

More information on the original FISH here:
http://web.uvic.ca/~rgifford/fish/

# Requirements
Please ensure these requirements are installed before proceeding to the Installation section.

* Node (and npm)
* Mongodb
* Ruby
* Sass (through `gem install sass`)

# Installation

1. Navigate to the fish directory in a terminal window
2. Run the command `npm install` (install dependencies specified in the package.json file)
  * Note: You may need escalated privileges to run and will get an error. If so, use the command `sudo npm install` instead.
  * NOTE: This will run a script post install as well. See: Usage.
3. Run the command `npm start` (on Windows or OSX) or `nodejs app.js` on Linux to start the server.
4. Navigate to localhost:8080

# Usage

## Scripts for Developers
These are located in the developer_scripts folder

* `npm run populatedb` Run post-install.
 * This populates the database with a user "Admin" and a password "123456789"
* `npm run cleandb` This will clean all the collections defined in the file (experimenters, microworlds, and sessions)
* `npm run resetdb` runs cleandb then populatedb
* `npm run devreset` runs cleandb then populate db and then starts up the server.
* `npm run sass` watches for style changes

## Docker
This project is also dockerized (no official repository available however). This project uses and tested on the following Docker technologies:

* Docker for Mac:
   * Client version: 17.03.1-ce
   * Server version: 17.03.1-ce
* Docker Compose version 3

### Container
The node application is run in a container named _dockered-fish_ and the MongoDB is run in a container
named _dockered-mongo-fish_. See `docker-compose.yml` for more details.

### Usage
In order to use the dockerized version do the following
1. npm run build-docker
2. Run the Docker services, one of
   * `npm run start-docker` (standard mode)
   * `npm run start-daemon-docker` (daemon mode a.k.a Docker detached mode)
3. If you run in daemon mode then you can do `npm run stop-daemon-docker` to stop daemon mode

### Logs
If Docker was run in non-detached mode then logs will be visible on console stdout.
The node application and MongoDB logs may also be found in **fish.log** and **mongo.log** respectively.

If Docker was run in detached mode you may see logs by running the following commands:
* node application: `npm run logs-docker-fish`
* MongoDB: `npm run logs-docker-mongo-fish`

### Volumes
The following volumes are bound from `host` to the `Docker container`
1. The whole directory of this repository is mounted on _dockered-fish_ to /fish/app
2. mongo.log is mounted on _dockered-mongo-fish_ to /logs/mongo.log

The first point implies that updates on your local files will propagate to the _dockered-fish_ container.
You can see more details in `docker-compose.yml` file

## Administrator
1. Navigate to http://localhost:8080/admin
2. Log in with the following credentials:
   * Username: `Admin`
   * Password: `123456789`

3. You now have access to the microworlds
4. Create and activate a microworld if you wish to run an experiment with users
   Note: Look at the Code for the experiment on an active microworld. eg `Active Microworld: QQ5HQP`

## Users (identified by an arbitrary ID#, which is not pre-assigned. Any number will work.)
1. Navigate to http://localhost:8080/
2. Enter the Experiment number of an active microworld
3. Enter an ID number
4. Fish!


# Attributions
* Black Fish Icon made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed under <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>
* Lighthouse Icon made by <a href="http://www.icons8.com" title="Icons8">Icons8</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed under <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>
* Sailboat Icon made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed under <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>
* Fishing Icon made by <a href="http://www.icons8.com" title="Icons8">Icons8</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed under <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>
