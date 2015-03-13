var main, setButtons, submitUpdate;

submitUpdate = function() {
  var confirmPass, email, expId, name, password, sendData;
  name = $("#name").val();
  email = $("#email").val();
  password = $("#password").val();
  confirmPass = $("#confirmPass").val();
  sendData = {};
  if (name.length >= 1) {
    sendData.name = name;
  }
  if (email.length >= 1) {
    sendData.email = email;
  }
  if (password.length >= 1) {
    sendData.rawPassword = password;
  }
  if (confirmPass.length >= 1) {
    sendData.confirmPass = confirmPass;
  }
  expId = location.pathname.split("/")[2];
  $.ajax({
    type: "PUT",
    url: "/experimenters/" + expId,
    data: sendData,
    success: function() {
      location.replace("./dashboard");
    },
    error: function(jqXHR) {
      if (jqXHR.status === 409) {
        if (jqXHR.responseText === "password conflict") {
          alert("The passwords given did not match");
        } else {
          alert("Invalid email");
        }
      } else if (jqXHR.status === 403) {
        alert("At least one field needs to be filled");
      } else if (jqXHR.status === 401) {
        alert("You are unauthorized to change this profile");
      } else if (jqXHR.status === 400) {
        alert("Did not match any experimenters");
      } else {
        alert("Internal error");
      }
    }
  });
};

setButtons = function() {
  $("#do-update").click(submitUpdate);
};

main = function() {
  setButtons();
};

"use strict";

$(document).ready(main);
