//Read CLI Arguments
var sourcePath = process.argv[2];
var destPath = process.argv[3];

//Require module dependencies
const fs = require("fs");
const path = require("path");
const JSSoup = require("jssoup").default;
const cssParser = require("css");

//Normalize the paths if they are properly passed in CLI arguments
sourcePath = path.normalize(sourcePath);
destPath = path.normalize(destPath);

//Function to print usage example
function printusageExample() {
  console.log("\nUSAGE");
  console.log(
    "-----------------------------------------------------------------------------------"
  );
  console.log(
    "node mergeCLI 'absolute/path/to/source_filename' 'absolute/path/to/dest_filename'"
  );
  console.log(
    "-----------------------------------------------------------------------------------"
  );
}

//Function to print the report after the process finishes
function printEndResult(
  fileCount,
  timeTaken,
  checkCount,
  sourceLoc,
  destLoc,
  scanCount,
  acceptCount
) {
  //Calculate the input and output file size
  let sourceFileSize = (fs.statSync(sourceLoc).size / 1024).toFixed(3);
  let destFileSize = (fs.statSync(destLoc).size / 1024).toFixed(3);

  console.log("\n");
  console.log("No of files merged = ", fileCount);
  console.log("Time taken in seconds = ", timeTaken / 1000);
  console.log("Total number of comparisions = ", checkCount);
  console.log("Total number of scanned classes = ", scanCount);
  console.log("Total number of accepted classes = ", acceptCount);
  console.log("Acceptance percentage = ", (acceptCount / scanCount) * 100);
  console.log("Input file = ", sourceLoc);
  console.log("Output file = ", destLoc);
  console.log("Input file size in Kb = ", sourceFileSize);
  console.log("Output file size in Kb = ", destFileSize);
  console.log("\n");
}

//Function that takes selector string and class name as input, and returns true if class is a part of that selector, false otherwise
function isClassSelector(selector, currentClass) {
  return selector.includes(currentClass);
}

//Function that takes selector string as input, and returns true if that selector is a pure element selector, false otherwise
//Pure element selector - A selector which selects just a native HTML DOM element, without using any class name/s or tag name/s
function isPureElementSelector(selector) {
  return !(selector.includes("#") || selector.includes("."));
}

//Get the time instance the process starts
let startTime = new Date().getTime();

//Handle the case for one or more undefined CLI arguments
if (sourcePath == undefined || destPath == undefined) {
  console.log("Unable to resolve path to source and/or destination files");
  printusageExample();
  process.exit();
}

//Parse file paths
let sourcePathParsed = path.parse(sourcePath);
let destPathParsed = path.parse(destPath);

//Handle the case for non-existing source file path
if (!fs.existsSync(sourcePath)) {
  console.log("Unable to access source file!");
  process.exit();
}

//Handle the case for non-existing destination directory
if (!fs.existsSync(destPathParsed.dir)) {
  console.log("Unable to access output directory!");
  process.exit();
}

//Handle the case for non-absolute paths
if (!path.isAbsolute(sourcePath) || !path.isAbsolute(destPath)) {
  console.log("Please provide absolute paths in CLI");
  printusageExample();
  process.exit();
}

//Handle the case for no source file name
if (sourcePathParsed.name == "") {
  console.log("Please provide the name of destination file!");
  process.exit();
}

//Handle the case for no destination file name
if (destPathParsed.name == "") {
  console.log("Please provide the name of destination file!");
  process.exit();
}

//Set the destination file extension to html explicitly
destPathParsed.ext = ".html";
destPathParsed.base = destPathParsed.name + destPathParsed.ext;
destPath = path.format(destPathParsed);

//Read HTML file content synchronously
var htmlfileContent = fs.readFileSync(sourcePath, "utf8");

//Make soup for HTML
var htmlsoup = new JSSoup(htmlfileContent);

//Make references to head, script, css, and image tags
var scriptTagArray = htmlsoup.findAll("script").filter((eachTag) => {
  return eachTag.attrs.type == "text/javascript";
});
var cssTagArray = htmlsoup.findAll("link").filter((eachTag) => {
  return eachTag.attrs.type == "text/css";
});
var imgTagArray = htmlsoup.findAll("img");

//Initialize algorithm counters
var comparisionCount = 0;
var totalCSSClassesScanned = 0;
var totalCSSClassesAccepted = 0;

//Start the aggregation process

//This block of code executes only if any script tag is found in HTML file
if (scriptTagArray.length > 0) {
  //Aggregate all the scripts from all the sources into one place
  //Reference to first script tag
  let firstScriptTag = scriptTagArray[0];

  //Variable to hold aggregate script content
  var scriptFileContent = "";

  //Loop through script references in soup and replace those with original script file content
  scriptTagArray.forEach((eachScriptTag, index) => {
    //Get the absolute path to the file referenced in the current script tag
    let pathtoJS = eachScriptTag.attrs.src;
    let absPathtoJS = path.join(sourcePathParsed.dir, pathtoJS.slice(1));

    //Add the content of file referenced in current script tag to aggregate script content
    scriptFileContent =
      scriptFileContent + fs.readFileSync(absPathtoJS, "utf8");

    //Add a new line to aggregated script content after reading every single JS file
    scriptFileContent = scriptFileContent + "\n\n";

    //Nulify every other script tag except the first one
    if (index !== 0) {
      eachScriptTag.replaceWith("");
    }
  });

  //Create a new soup of the Aggregate script
  let newJSSoupToAppend = new JSSoup(
    "<script>" + scriptFileContent + "</script>"
  );

  //Replace the first script tag with the new aggregated script soup content
  firstScriptTag.replaceWith(newJSSoupToAppend);
}

//This block of code executes only if any CSS link tag is found in HTML file
if (cssTagArray.length > 0) {
  //Aggregate all the CSS from all the sources into one place
  //Reference to first CSS tag
  let firstCSSTag = cssTagArray[0];

  //Variable to hold aggregate CSS content
  var cssFileContent = "";
  cssTagArray.forEach((eachCSSTag, index) => {
    //Get the absolute path to the file referenced in the current CSS tag
    let pathtoCSS = eachCSSTag.attrs.href;
    let absPathtoCSS = path.join(sourcePathParsed.dir, pathtoCSS.slice(1));

    //Add the content of file referenced in current CSS tag to aggregate CSS content
    cssFileContent = cssFileContent + fs.readFileSync(absPathtoCSS, "utf8");

    //Add a new line to aggregated CSS content after reading every single CSS file
    cssFileContent = cssFileContent + "\n\n";

    //Nulify every other CSS tag except the first one
    if (index !== 0) {
      eachCSSTag.replaceWith("");
    }
  });

  //Fetch set of classes used in HTML Template
  //Variable to hold set of useful CSS classes used in HTML
  var usedCSSClassSet = new Set();

  //Get array of all the tags used in HTML
  var allTags = htmlsoup.findAll();

  //Iterate through each tag and fetch the classes used in that tag
  allTags.forEach((eachTag) => {
    //Get all attributes of the current tag
    let currentAttributes = eachTag.attrs;

    //If 'class' attribute exists in the set of attributes of the current tag
    if ("class" in currentAttributes) {
      //Get a list of all classes mentioned in 'class' attribute of that tag
      classAttributes = currentAttributes.class.split(" ");

      //Add those classes into the set of useful CSS classes
      classAttributes.forEach((eachClass) => {
        usedCSSClassSet.add(eachClass);
      });
    }
  });

  //Parse the aggregate CSS collected from all the sources
  var cssParsedData = cssParser.parse(cssFileContent);

  //Variable to hold dictionary of non-repeating filtered CSS rule objects
  //or the rules of css selectors that the HTML template is dependent on
  let filteredCSSRules = {};

  let cssParsedList = cssParsedData.stylesheet.rules;
  //Iterate through each set of rules and consider it only if it is used in HTML template

  for (var index in cssParsedList) {
    let currentRule = cssParsedList[index];

    if (currentRule.type === "rule") {
      //Increment the counter for scanned CSS class
      totalCSSClassesScanned++;

      //Get the selector of the current rule set as a string
      let selectorString = currentRule.selectors.join(", ");

      //Iterate through the set of used CSS classes in HTML
      Array.from(usedCSSClassSet).every((eachUsedCSSClass) => {
        //Increment the counter for comparision
        comparisionCount++;

        //If that used class of HTML is a substring in the current selector or if the current selector is an element selector
        if (
          isClassSelector(selectorString, eachUsedCSSClass) ||
          isPureElementSelector(selectorString)
        ) {
          //Increment the counter for accepted CSS class
          totalCSSClassesAccepted++;

          //Construct a css settings object out of the rule set of current selector
          //Schema: [{attribute, value}+]
          let CSS_Settings = [];
          currentRule.declarations.forEach((eachRuleLine) => {
            CSS_Settings.push({
              attribute: eachRuleLine.property,
              value: eachRuleLine.value,
            });
          });

          // Push the css object into the list of filtered CSS rule objects
          filteredCSSRules[selectorString] = CSS_Settings;

          return false;
        }
        return true;
      });
    } else if (currentRule.type === "media") {
      //Get the selector of the current media rule as a string
      let selectorString = "@media " + currentRule.media;

      //Variable that references all the rules under the current media rule
      let mediaRules = currentRule.rules;

      //Variable to hold all the CSS rules under the current media rule as CSS objects
      //Schema: {selector: {attribute, value}+}
      let CSS_Settings_Under_Media = {};

      //Iterate through the CSS rules under the current media rule
      mediaRules.forEach((eachMediaRule) => {
        //Increment the counter for scanned CSS class
        totalCSSClassesScanned++;

        //Get the selector of the current rule set as a string
        let mediaRule_subSelectorString = eachMediaRule.selectors.join(", ");

        //Iterate through the set of used CSS classes in HTML
        Array.from(usedCSSClassSet).every((eachUsedCSSClass) => {
          //Increment the counter for comparision
          comparisionCount++;

          //If that used class of HTML is a substring in the current selector or if the current selector is an element selector
          if (
            isClassSelector(mediaRule_subSelectorString, eachUsedCSSClass) ||
            isPureElementSelector(mediaRule_subSelectorString)
          ) {
            //Increment the counter for accepted CSS class
            totalCSSClassesAccepted++;

            //Construct a css settings object out of the rule set of current selector
            //Schema: [{attribute, value}+]
            let CSS_Settings = [];
            eachMediaRule.declarations.forEach((eachRuleLine) => {
              CSS_Settings.push({
                attribute: eachRuleLine.property,
                value: eachRuleLine.value,
              });
            });

            //Add the newly created CSS object to the variable that holds all the CSS rules under the current media rule
            CSS_Settings_Under_Media[
              mediaRule_subSelectorString
            ] = CSS_Settings;

            return false;
          }
          return true;
        });
      });

      // Push the mediaquery css object into the list of filtered CSS rule objects
      filteredCSSRules[selectorString] = CSS_Settings_Under_Media;
    }
  }

  //Variable to hold the final filtered CSS content to be written to target file
  let usefulCSSString = "";

  //Iterate through each object in dictionary of filtered CSS rule objects
  //and format the output to the variable that holds final filtered CSS content
  for (var currentSelector of Object.keys(filteredCSSRules)) {
    //Variable to hold well formatted CSS rule that matches native formatting of a CSS file
    let formattedCSSData = "";

    //Format the data in the CSS rule object to the usefulCSSString variable
    formattedCSSData = formattedCSSData + currentSelector + "\n{\n";

    //Variable to hold the current selector in loop
    var currentSelectorSettings = filteredCSSRules[currentSelector];

    //Read and foormat normal CSS rules
    if (Array.isArray(currentSelectorSettings)) {
      currentSelectorSettings.forEach((eachSetting) => {
        formattedCSSData =
          formattedCSSData +
          eachSetting.attribute +
          ":" +
          eachSetting.value +
          ";\n";
      });
      formattedCSSData = formattedCSSData + "}\n\n";
    }

    //Read and format media CSS rules
    else {
      //Variable to hold sub selector data inside current media selector
      let formattedSubCSSData = "";

      for (var eachSubSetting of Object.keys(currentSelectorSettings)) {
        formattedSubCSSData = formattedSubCSSData + eachSubSetting + "\n{\n";

        let subSettingRules = currentSelectorSettings[eachSubSetting];
        subSettingRules.forEach((eachSubSettingRule) => {
          formattedSubCSSData =
            formattedSubCSSData +
            eachSubSettingRule.attribute +
            ":" +
            eachSubSettingRule.value +
            ";\n";
        });

        formattedSubCSSData = formattedSubCSSData + "}\n\n";
      }

      formattedCSSData = formattedCSSData + formattedSubCSSData + "}\n\n";
    }

    //Append the final mediaquery data to the variable that holds useful CSS only
    usefulCSSString = usefulCSSString + formattedCSSData;
  }

  //Create a new soup of the final filtered CSS content
  let newCSSSoupToAppend = new JSSoup("<style>" + usefulCSSString + "</style>");

  //Replace the first CSS tag with the new aggregated CSS soup content
  firstCSSTag.replaceWith(newCSSSoupToAppend);
}

//This block of code executes only if any image tag is found in HTML file
if (imgTagArray.length > 0) {
  imgTagArray.forEach((eachImageTag) => {
    //Get the absolute path to the file referenced in the current image tag
    let pathtoImage = eachImageTag.attrs.src;
    let absPathtoImage = path.join(sourcePathParsed.dir, pathtoImage.slice(1));

    //Get the 64 bit equivalent code of the image file
    var base64Code = fs.readFileSync(absPathtoImage, "base64");

    //Modify the source attribute of the current image tag to hold the 64 bit equivalent
    eachImageTag.attrs.src =
      "data:image/" +
      path.extname(absPathtoImage).slice(1) +
      ";base64," +
      base64Code;
  });
}

//Variable to hold the content of the body tag as it is
//This preserves the original indentation
var preservedbodyContent = htmlfileContent.match(
  /<body[^>]*>((.|[\n\r])*)<\/body>/
)[0];

//Manipulate the image tags in preserved body content
//Regular expression for catching an image tag
var imagetagPattern = /<img([\w\W]+?)>/g;

//Index to be used to iterate through processed binary image tags
var imageTagIndex = 0;

//Loop to iteratively replace image tags
do {
  //Variable to hold an image tag of the preserved body content
  findResult = imagetagPattern.exec(preservedbodyContent);

  //If an image tag is caught
  if (findResult) {
    //Get original and new image tag as strings
    let originalImageTag = findResult[0];
    let newImageTag = imgTagArray[imageTagIndex++].prettify();

    //Replace original image tag with new image tag in preserved body content
    preservedbodyContent = preservedbodyContent.replace(
      originalImageTag,
      newImageTag
    );
  }
} while (findResult);

//Variable to hold the processed soup that still holds the body content with preserved indentation
var finalContent = htmlsoup
  .prettify()
  .replace(/<body[^>]*>((.|[\n\r])*)<\/body>/, preservedbodyContent);

//Synchronously write the updated soup to the file mentioned in destination location
fs.writeFileSync(destPath, finalContent);

//Get the time instance the process ends
let endTime = new Date().getTime();

//Calculate the time elapsed by process
let timeElapsed = endTime - startTime;

//Alert the user of the performance and result
let totalFileCount =
  scriptTagArray.length + cssTagArray.length + imgTagArray.length + 1;
printEndResult(
  totalFileCount,
  timeElapsed,
  comparisionCount,
  sourcePath,
  destPath,
  totalCSSClassesScanned,
  totalCSSClassesAccepted
);
