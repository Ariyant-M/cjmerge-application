//import important lib
const JSSoup = require("jssoup").default;
const fs = require("fs");
const path = require("path");
const cssParser = require("css");

//functions
function ArrayToSetToArray(arr) {
  arr = new Set(arr);
  arr = Array.from(arr);
  return arr;
}

function cssStringGenerator(attr, text) {
  styleOutput = styleOutput.concat(attr);
  styleOutput = styleOutput.concat("{\n");
  styleOutput = styleOutput.concat(text);
  styleOutput = styleOutput.concat("}\n");
}

//get value by arguments
var files = process.argv.slice(2);
var inputFilePath = files[0];

//get directory of input file
var inputDir = path.dirname(inputFilePath);
outputFilePath = files[1];

//read html file content
var inputFileCont = fs.readFileSync(inputFilePath, "utf8");

//make soup of html file content
var inputSoup = new JSSoup(inputFileCont);

//find all link and script tag
var javaFiles = inputSoup.findAll("script");
var cssFiles = inputSoup.findAll("link");
var imageTags = inputSoup.findAll("img");

//convert all image file to base64

for (i of imageTags) {
  if (fs.existsSync(i.attrs.src)) {
    var imageBase64 = fs.readFileSync(i.attrs.src, "base64");
    i.attrs.src = "data:image/png;base64,".concat(imageBase64);
  }
}
//get all styling tag from html
var allTag = inputSoup.findAll();
var styleTags = [];
var styleClass = [];
var styleID = [];
for (i of allTag) {
  styleTags.push(i.name);
  if (i.attrs.hasOwnProperty("class")) {
    styleClass.push(i.attrs.class);
  }
  if (i.attrs.hasOwnProperty("id")) {
    styleID.push(i.attrs.id);
  }
}

//get the first link tag and remove all other link tag
var firstCSSTag = "";
var internalCSS = "";
for (i in cssFiles) {
  if (i == 0) {
    firstCSSTag = cssFiles[0];
  } else if (cssFiles[i].attrs.hasOwnProperty("href")) {
    cssFiles[i].replaceWith("");
  } else {
    cssFiles[i].replaceWith("");
  }
}

//copy the internal css and remove style tag
var internalStyle = inputSoup.findAll("style");
for (i in internalStyle) {
  internalCSS = internalCSS.concat(internalStyle[i].contents[0]._text);
  internalStyle[i].replaceWith("");
}

//make array of all selector like class, id, tags
styleTags = new Set(styleTags);
styleTags = Array.from(styleTags);
styleTags = ArrayToSetToArray(styleTags);
styleID = ArrayToSetToArray(styleID);
styleClass = ArrayToSetToArray(styleClass);

//read content from external css file and add them to the html soup
var cssFileArray = [];
var cssFilePath = "";
for (i of cssFiles) {
  cssFilePath = inputDir;
  cssFilePath = cssFilePath.concat(i.attrs.href.substring(1));
  temp = fs.readFileSync(cssFilePath, "utf8");
  temp = temp.replace(
    /(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/gm,
    ""
  );
  temp = temp.split("}");
  temp.filter((val) => cssFileArray.push(val));
}

//create object of the css file content by making selector as key and styling as value
var cssDict = {};
for (i of cssFileArray) {
  temp = i.split("{");
  temp[0] = temp[0].replace(/(\r\n|\n|\r)/gm, "");
  getSelector = temp[0].split(",");
  for (i of getSelector) {
    cssDict[i.trim()] = temp.slice(1);
  }
}
//free up space by removing extra variables
delete cssDict[""];
delete cssFileArray;

// for(i in cssDict){
// 	if(i[0] == '.'|| i[0] == '#'){

// 	}
// 	else if(i[0] == '@'){

// 	}
// 	else{

// 	}
// }
//read data from css object and add them to string
var styleOutput = "<style>\n";
for (i in cssDict) {
  if (i[0] == ".") {
    temp = i.split(/[\s,; ]+/);
    for (j of styleClass) {
      if (j == temp[0].substring(1)) {
        cssStringGenerator(i, cssDict[i]);
        delete cssDict[i];
      }
    }
  } else if (i[0] == "#") {
    temp = i.split(/[\s,; ]+/);
    for (j of styleID) {
      if (j == temp[0].substring(1)) {
        cssStringGenerator(i, cssDict[i]);
        delete cssDict[i];
      }
    }
  } else {
    temp = i.split(/[\s,; ]+/);
    for (j of styleTags) {
      if (j == temp[0]) {
        cssStringGenerator(i, cssDict[i]);
        delete cssDict[i];
      }
    }
  }
}

styleOutput = styleOutput.concat(internalCSS);
styleOutput = styleOutput.concat("</style>\n");

//convert the css string to Soup
var cssCont = new JSSoup(styleOutput);
firstCSSTag.replaceWith(cssCont);

//read content from external javascript file and add them to the html soup
var javaFileCont = "<script>\n";
var javaFilePath = "";
var firstScriptTag = "";
var internalJS = "";

//
for (i in javaFiles) {
  if (i == 0) {
    firstScriptTag = javaFiles[0];
  }
  //only for the external js
  else if (javaFiles[i].attrs.hasOwnProperty("src")) {
    javaFiles[i].replaceWith("");
  }
  //copy the internal JS and remove script tag
  else {
    internalJS = internalJS.concat(javaFiles[i].contents[0]._text);
    javaFiles[i].replaceWith("");
  }
}

//read the data from external JS file
//copy data from external JS file and append that to the JS string
for (i of javaFiles) {
  if (i.attrs.hasOwnProperty("src")) {
    javaFilePath = inputDir;
    javaFilePath = javaFilePath.concat(i.attrs.src.substring(1));
    javaFileCont = javaFileCont.concat(fs.readFileSync(javaFilePath, "utf8"));
    javaFileCont = javaFileCont.concat("\n");
  }
}
javaFileCont = javaFileCont.concat(internalJS);
javaFileCont = javaFileCont.concat("\n</script>");

//convert the JS string to Soup
var JSCont = new JSSoup(javaFileCont);

//add the soup to the main soup by replacing it with first JS tag
firstScriptTag.replaceWith(JSCont);

//write final soup content to the given output file
// fs.writeFileSync(outputFilePath,inputSoup.toString());
// console.log("\n\n\n==>file has been merged, available at location: ",outputFilePath,"\n\n");
