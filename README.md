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
The node application is run in a container named `fish` and the MongoDB is run in a container
named `mongo-fish`. See `docker-compose.yml` for more details.

### Volumes
The following volumes are bound from `host` to the `Docker container`
1. The whole directory of this repository is mounted on `fish` to `/fish/app`
2. mongo.log is mounted on `mongo-fish` to `/logs/mongo.log`

You can see more details on [Docer setup](#docker-setup)

### Docker Setup
The following is a diagram of the Docker setup:
![Docker diagram](/docs/docker-setup.png)

From the above diagram you can infer several things:
1. You can access the Fish application from `http://localhost:8080` from your browser
2. Since all Fish files in this repo is mounted on the Fish container, any changes on the repo will be
reflected onto the Fish container. Therefore if you make changes to the application you don't need to
re-build the containers. See [Building the images](#building-the-images) for more info
3. Since the `/logs/mongo.log` is mounted to `mongo.log`, you may see all the mongo logs being saved
to `mongo.log` so you can check it out in the future

### Building the images
Before trying to run Dockerized application, please run `npm run build-docker` first beforehand.
This command only needs to be run once, unless you want to rebuild the containers due to changes.
Several possible changes that needs rebuilding:
1. Changing the commands that the containers execute
2. Changing the base image of the containers
3. Adding things to the containers' Dockerfiles, either `Dockerfile-app` or `Dockerfile-Db`
4. Other things that modifies the Dockerfiles

### Usage
In order to use the Dockerized version do the following
1. npm run build-docker
2. Run the Docker services, one of
   * `npm run start-docker` (standard mode)
   * `npm run start-daemon-docker` (daemon mode a.k.a Docker detached mode)
4. After running one of the above you should run `npm run docker-populatedb`. It's
the populate DB setup but for the docker setup

If you run in daemon mode then you can do `npm run stop-daemon-docker` to stop daemon mode

### Logs
If Docker was run in non-detached mode then logs will be visible on console stdout.
The node application and MongoDB logs may also be found in `fish.log` and `mongo.log` respectively.

If Docker was run in detached mode you may see logs by running the following commands:
* node application: `npm run logs-docker-fish`
* MongoDB: `npm run logs-docker-mongo-fish`

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
