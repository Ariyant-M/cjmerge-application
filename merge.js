//import important lib
const JSSoup = require("jssoup").default;
const fs = require("fs");
const path = require("path");
const cssParser = require("css");

//function that convert array to set and again set to array
function getDistinct(arr) {
  var arr = new Set(arr);
  arr = Array.from(arr);
  return arr;
}

//function to generate CSS string
function cssStringGenerator(selector, value) {}

//get input and output file location
var inputFile = process.argv[2];
var outputFile = process.argv[3];

//get directory of input file
var inputDir = path.dirname(inputFile);

//read input file and store in variable
var inputFileContent = fs.readFileSync(inputFile, "utf-8");

//create soup of input file
var inputSoup = new JSSoup(inputFileContent);

//find all the link,script,style,img tag from soup
var javaFileArray = inputSoup.findAll("script");
var cssFileArray = inputSoup.findAll("link");
var imageTags = inputSoup.findAll("img");
var styleTagArray = inputSoup.findAll("style");

//convert image file to base64 image
for (i of imageTags) {
  if (fs.existsSync(i.attrs.src)) {
    var imageBase64 = fs.readFileSync(i.attrs.src, "base64");
    //i.attrs.src = "data:image/png;base64,".concat(imageBase64);
  }
}

//get all tag used in html file to check in CSS file
var allTags = inputSoup.findAll();

//create array for class,ID of html file
var htmlAttr = [];
var CSSclass = [];
var CSSid = [];

for (i of allTags) {
  htmlAttr.push(i.name);
  if (i.attrs.hasOwnProperty("class")) {
    //check for multiple class and split them to single class
    var temp = i.attrs.class.split(" ");
    //push each class to the main class array
    for (j of temp) {
      CSSclass.push(j);
    }
  }
  if (i.attrs.hasOwnProperty("id")) {
    //check for multiple id and split them to single id
    var temp = i.attrs.id.split(" ");
    //push each id to the main id array
    for (j of temp) {
      CSSid.push(j);
    }
  }
}

//get unique class, id, tags for optimum search
htmlAttr = getDistinct(htmlAttr);
CSSclass = getDistinct(CSSclass);
CSSid = getDistinct(CSSid);

//css processing begins
//store all internal CSS to a string
var internalCSS = "";

//copy the first style tag
//it will be replaced by processed CSS style
var firstCSSTag = cssFileArray[0];
var parsedArray = [];
for (i of cssFileArray) {
  if (i.attrs.hasOwnProperty("href")) {
    var filePath = inputDir + i.attrs.href.substring(1);
    var fileContent = fs.readFileSync(filePath, "utf-8");
    //remove comments before parsing the data
    fileContent = fileContent.replace(
      /(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/gm,
      ""
    );
    var parsedCSS = cssParser.parse(fileContent, { source: filePath });
    parsedArray.push(parsedCSS);
    i.replaceWith("");
  }
}

//create object of the style by replaceing with new one
var cssDict = {};
//array made of multiple css data
for (i of parsedArray) {
  //loop to find out its a media type or a normal rule
  for (j of i.stylesheet.rules) {
    if (j.type == "rule") {
      //get the selector name
      for (selector of j.selectors) {
        //check in
        var mainSelector = selector.split(/[\s,; :>+~]+/);
        if (selector[0] == ".") {
          if (CSSclass.includes(mainSelector[0].substring(1))) {
            //
            var styleValue = "";
            for (style of j.declarations) {
              styleValue =
                styleValue + style.property + " : " + style.value + "\n";
            }
            cssDict[selector] = styleValue;
          }
        } else if (selector[0] == "#") {
          if (CSSid.includes(mainSelector[0].substring(1))) {
            //
            var styleValue = "";
            for (style of j.declarations) {
              styleValue =
                styleValue + style.property + " : " + style.value + "\n";
            }
            cssDict[selector] = styleValue;
          }
        } else {
          if (htmlAttr.includes(mainSelector[0])) {
            //
            var styleValue = "";
            for (style of j.declarations) {
              styleValue =
                styleValue + style.property + " : " + style.value + "\n";
            }
            cssDict[selector] = styleValue;
          }
        }
      }
    } else if (j.type == "media") {
      for (i of j.rules) {
        console.log(i.selectors);
      }
    }
  }
}
