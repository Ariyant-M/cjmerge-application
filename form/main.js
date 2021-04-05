alert("from js");
function chkSetValue(elem) {
  if (elem.checked) {
    elem.value = "Yes";
  } else {
    elem.value = "No";
  }
}
function calculateDate(elem) {
  console.log("calculateDate", elem.value);
  if (elem.value == null || elem.value.length == 0) {
    return;
  }
  console.log("calculateDate", elem.value);
  var m = elem.value.match(/^(\d{1,2})[-\/]{0,1}(\d{1,2})[-\/]{0,1}(\d{2,4})$/);
  var msg =
    "Invalid date: Please input number in the form mmddyy, mm-dd-yy or mm-dd-yyyy";
  if (m && m.length == 4) {
    var month = parseInt(m[1]) - 1;
    var day = parseInt(m[2]);
    var year = m[3];
    if (year.length == 2) {
      if (parseInt(year) < 50) year = "20" + year;
    }

    if (isValidDate(day, month, year)) {
      var d = new Date(year, month, day);
      var dt = ("0" + d.getDate()).slice(-2);
      var m = ("0" + (d.getMonth() + 1)).slice(-2);
      elem.value = m + "-" + dt + "-" + d.getFullYear();
      return;
    }
  }

  alert(msg);
  elem.value = "";
  elem.focus();
}

function isValidDate(date, mon, year) {
  if (mon < 0 || mon > 11) {
    return false;
  }

  var months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (isLeap(year)) {
    months[1] = 29;
  }

  return date > months[mon] ? false : true;
}

function isLeap(year) {
  if ((0 == year % 4 && 0 != year % 100) || 0 == year % 400) {
    return true;
  }
  return false;
}
function formatPhoneNumber(elem) {
  console.log("formatPhoneNumber", elem.value);
  var m = elem.value.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (m.length > 3) elem.value = "(" + m[1] + ")" + " " + m[2] + "-" + m[3];
}

function setAllCheckboxValues() {
  var form = document.forms[0];
  for (var i = 0; i < form.elements.length; i++) {
    if (form.elements[i].type == "checkbox") {
      chkSetValue(form.elements[i]);
    }
  }
}
