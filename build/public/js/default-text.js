var endDepletedText, endTimeText, pageHeader, panelBody, panelTitle, prepText;

pageHeader = {
  "new": "New Microworld",
  test: "Microworld in Testing: ",
  active: "Active Microworld: ",
  archived: "Archived Microworld"
};

panelTitle = {
  "new": "You are creating a new microworld",
  test: "You are viewing a microworld in testing. " + "It is available for testing with the code ",
  active: "You are viewing an active microworld. " + "It is available for participants with the code ",
  archived: "You are viewing an archived microworld"
};

panelBody = {
  "new": "After saving your changes, " + "this microworld will be available for testing. " + "You can change its parameters after saving.",
  test: "You can still make changes to this microworld. " + "You can also perform a dry-run of the microworld " + "with its current parameters, clone the microworld, " + "activate it, or delete it. " + "Notes: no data from dry-runs is kept by this system. " + "Once you activate the microworld " + "you won't be able to change its parameters anymore " + "(though you will still be able to clone it)",
  active: "To preserve the same conditions for all participants, " + "you cannot make any changes to the parameters of " + "this microworld anymore. " + "However, you can clone it, and change the parameters " + "of the clone. " + "You can also archive or delete this microworld.",
  archived: "This microworld is no longer accessible to participants. " + "You can re-activate this microworld, " + "clone it, or delete it."
};

prepText = "FISH simulates fishing in an ocean. " + "You and the other fishers are the only fishers in this ocean. " + "All the fishers see the same ocean that you do. " + "At the beginning, the number of fish will be displayed on the screen. " + "However, sometimes there is some uncertainty about the number of fish. " + "In those cases, \"mystery fish\" will be shown on the screen as well, " + "and the number is displayed as a certain range, " + "not as an absolute number. " + "Once the simulation begins, " + "you and the other fishers may catch as many of these fish as you like. " + "Once  you have taken as many fish as you want, " + "you return to port with your catches, " + "and the first season ends. " + "Then the fish spawn for the next season, " + "if any are left to spawn " + "(if no fish are left, they cannot spawn). " + "For every fish left at the end of one season, " + "two fish will be available to be caught in the next season. " + "However, because the ocean can support only so many fish, " + "the total number of fish will never exceed the original number of fish. " + "Fishing can go on this way for many seasons, " + "but all fishing permanently ceases any time that all the fish are caught.\n\n" + "You can make money fishing. " + "You will be paid $5 for every fish you catch. " + "(For now, this is \"play\" money... " + "but please treat it as if it were real money.)\n\n" + "Your job is to consider all these factors, " + "and the other fishers, " + "and make your own decisions about how to fish. " + "Fish however you wish.\n\n" + "Please ask if anything is unclear. " + "We want you to fully understand the rules before you start fishing.\n\n" + "If you are sure you understand all the above, you are ready to fish. " + "Click on the Go Fishing button on the right when you are ready. " + "Once all the fishers have clicked this button, " + "the first season will begin. " + "(You may have to wait briefly for all the others fishers to click the button.)";

endTimeText = "Seasons come and seasons go, but for now we are done.";

endDepletedText = "All the fish are now gone.";
