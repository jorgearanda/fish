var socket = io.connect();

// TODO - I don't think I'll be using uid anymore, but account/:accountId
var user = $.url().param('uid');

socket.on("connect", function (data) {
   console.log("Connected to server.");
});

socket.on("group-created", function() {
   // Go back to mainadmin window
   location.href = "mainadmin?uid=" + user;
});

socket.on("group-not-created", function() {
   $("#create").prop("disabled", false);
   $(".status-message").toggleClass("red");
   $(".status-message").text("The simulation '" + $("#gid").val() + "' could not be created. That name may already be in use; please use a different one.");
});

function Robot(name, greed) {
   this.name = name;
   this.greed = greed;
}

function gameParameters() {
   // Getting all the parameters from the page's fields
   this.owner = user;
   this.name = $("#gid").val();
   this.numFishers = parseInt($("#numfishers").val());
   this.numHumans = parseInt($("#numhumans").val());
   this.numOceans = parseInt($("#numoceans").val());
   this.numSeasons = parseInt($("#seasons").val());
   this.initialDelay = parseInt($("#initialdelay").val());
   this.restDuration = parseInt($("#seasondelay").val());
   this.spawnFactor = parseFloat($("#spawnfactor").val());
   this.chanceOfCatch = parseFloat($("#chancecatch").val());
   this.costDepart = parseFloat($("#costdeparture").val());
   this.costAtSea = parseFloat($("#costsecond").val());
   this.costCast = parseFloat($("#costcast").val());
   this.valueFish = parseFloat($("#fishvalue").val());
   this.currencySymbol = $("#currencysymbol").val();
   this.seasonDuration = parseInt($("#seasonduration").val());
   this.certainFish = parseInt($("#realfish").val());
   this.maximumFish = parseInt($("#maxfish").val());
   this.actualMysteryFish = parseInt($("#startingmysteryfish").val());
   this.mysteryFish = parseInt($("#mysteryfish").val());
   this.showOtherFishers = $("#showallfishers-yes").prop("checked");
   this.showFisherNames = $("#shownames-yes").prop("checked");
   this.showFisherStatus = $("#showstatus-yes").prop("checked");
   this.showFishCaught = $("#shownumcaught-yes").prop("checked");
   this.showBalance = $("#showbalance-yes").prop("checked");
   this.pauseEnabled = $("#pauseenabled-yes").prop("checked");
   this.earlyEndEnabled = $("#earlyendenabled-yes").prop("checked");

   if ($("#greeduniformity-uniform").prop("checked")) {
      this.greedUniformity = 0;
   } else if ($("#greeduniformity-increasing").prop("checked")) {
      this.greedUniformity = 1;
   } else {
      this.greedUniformity = -1;
   }
   this.erratic = $("#erratic-yes").prop("checked");
   this.hesitation = parseFloat($("#hesitation").val());
   this.castsPerSecond = parseInt($("#castspersecond").val());
   this.castingProbability = parseFloat($("#castingprobability").val());

   this.robots = new Array();
   this.robots[0] = new Robot($("#agent1name").val(), parseFloat($("#agent1greed").val()));
   this.robots[1] = new Robot($("#agent2name").val(), parseFloat($("#agent2greed").val()));
   this.robots[2] = new Robot($("#agent3name").val(), parseFloat($("#agent3greed").val()));
   this.robots[3] = new Robot($("#agent4name").val(), parseFloat($("#agent4greed").val()));
   this.robots[4] = new Robot($("#agent5name").val(), parseFloat($("#agent5greed").val()));
   this.robots[5] = new Robot($("#agent6name").val(), parseFloat($("#agent6greed").val()));
   this.robots[6] = new Robot($("#agent7name").val(), parseFloat($("#agent7greed").val()));
   this.robots[7] = new Robot($("#agent8name").val(), parseFloat($("#agent8greed").val()));
   this.robots[8] = new Robot($("#agent9name").val(), parseFloat($("#agent9greed").val()));
   this.robots[9] = new Robot($("#agent10name").val(), parseFloat($("#agent10greed").val()));
   this.robots[10] = new Robot($("#agent11name").val(), parseFloat($("#agent11greed").val()));
   this.robots[11] = new Robot($("#agent12name").val(), parseFloat($("#agent12greed").val()));

   this.prepText = $("#preptext").val();
   this.depletedText = $("#depletedtext").val();
   this.endText = $("#endtext").val();
}

function validateParameters() {
   var invalidMessage = "";
   if ($("#gid").val().indexOf(" ") >= 0) {
      invalidMessage += "The simulation name cannot contain spaces.\n";
   }
   if ($("#gid").val().length < 1) {
      invalidMessage += "The simulation name cannot be empty.\n";
   }
   if (parseInt($("#numfishers").val()) > 13 || parseInt($("#numfishers").val()) < 1) {
      invalidMessage += "The number of fishers per ocean must be between 1 and 13.\n";
   }
   if (parseInt($("#numhumans").val()) > parseInt($("#numfishers").val()) || parseInt($("#numfishers").val()) < 1) {
      invalidMessage += "The number of humans per ocean must be at least 1 and at most equal to the total number of fishers.\n";
   }
   return invalidMessage;
}

var CreateGroup = function () {
   var invalidMessage = validateParameters();
   if (invalidMessage == "") {
      var gs = new gameParameters();
      $("#create").prop("disabled", true);
      $(".status-message").toggleClass("blue");
      $(".status-message").text("Requesting server to create simulation " + $("#gid").val() + "...");
      console.log("Requesting server to create group " + $("#gid").val());
      socket.emit("create group", gs);
   } else {
      alert(invalidMessage);
   }
}

var ToggleGreed = function() {
   // Enabling and disabling global and particular greed parameters
   var constantGreed = $("#globalgreed-constant").prop("checked");
   $("#globalconstantgreed").prop("disabled", !constantGreed);
   $(".agentgreed").prop("disabled", constantGreed);
   if (constantGreed) {
      $(".agentgreed").val( $("#globalconstantgreed").val() );
   }
}

var Main = function() {
   $(".greedtoggler").change(ToggleGreed);
   $("#create").click(CreateGroup);
}

$(document).ready(Main);
