//import important lib
const JSSoup = require('jssoup').default;
const fs = require('fs');
const path = require('path');
const cssParser = require('css');



function ArrayToSetToArray(arr){
	arr = new Set(arr);
	arr = Array.from(arr);
	return arr;
}

function combineText(attr, text){
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
var inputFileCont = fs.readFileSync(inputFilePath,'utf8');

//make soup of html file content
var inputSoup = new JSSoup(inputFileCont);

//find all link and script tag
var javaFiles = inputSoup.findAll('script');
var cssFiles = inputSoup.findAll('link');

//get all styling tag from html
var allTag = inputSoup.findAll();
var styleTags = [];
var styleClass = [];
var styleID = [];
for(i of allTag){
	styleTags.push(i.name);
	if(i.attrs.hasOwnProperty('class')){
		styleClass.push(i.attrs.class);
	}
	if(i.attrs.hasOwnProperty('id')){
		styleID.push(i.attrs.id);
	}
}
var firstCSSTag = '';
for(i in cssFiles){
	if(i == 0){
		firstCSSTag = cssFiles[0];
	}
	else{
		cssFiles[i].replaceWith('');
	}
	
}
styleTags = new Set(styleTags);
styleTags = Array.from(styleTags);
styleTags = ArrayToSetToArray(styleTags);
styleID = ArrayToSetToArray(styleID);
styleClass = ArrayToSetToArray(styleClass);

//read content from external css file and add them to the html soup
var cssFileArray = [];
var cssFilePath = '';
for(i of cssFiles){
	cssFilePath = inputDir;
	cssFilePath = cssFilePath.concat(i.attrs.href.substring(1));
	temp = fs.readFileSync(cssFilePath, 'utf8').split('}');
	temp.filter(val => cssFileArray.push(val));
}

var cssDict = {};
for(i of cssFileArray){
	temp = i.split('{');
	temp[0] = temp[0].replace(/(\r\n|\n|\r)/gm, "");
	cssDict[temp[0]] = temp[1];
}
delete cssDict[''];
delete cssFileArray;
var styleOutput = '<style>\n';
for(i in cssDict){
	if(i[0] == '.'){
		temp = i.split(/[\s,; ]+/);
		for(j of styleClass){
			if(j == temp[0].substring(1)){
				combineText(i, cssDict[i]);
				delete cssDict[i];
			}
		}
	}
	else if(i[0] == '#'){
		temp = i.split(/[\s,; ]+/);
		for(j of styleID){
			if(j == temp[0].substring(1)){
				combineText(i, cssDict[i]);
				delete cssDict[i];
			}
		}
	}
	else{
		temp = i.split(/[\s,; ]+/);
		for(j of styleTags){
			if(j == temp[0]){
				combineText(i, cssDict[i]);
				delete cssDict[i];
			}
		}
	}
}
styleOutput = styleOutput.concat("</style>\n");
var cssCont = new JSSoup(styleOutput);
firstCSSTag.replaceWith(cssCont);



//read content from external javascript file and add them to the html soup
var javaFileCont = '<script>\n';
var javaFilePath = '';
var firstScriptTag = '';
for(i in javaFiles){
	if(i == 0){
		firstScriptTag = javaFiles[0];
	}
	else{
		javaFiles[i].replaceWith('');
	}
	
}
for(i of javaFiles){
	if(i.attrs.hasOwnProperty('src')){
		javaFilePath = inputDir;
		javaFilePath = javaFilePath.concat(i.attrs.src.substring(1));
		javaFileCont = javaFileCont.concat(fs.readFileSync(javaFilePath, 'utf8'));
		javaFileCont = javaFileCont.concat("\n");
	}
}
javaFileCont = javaFileCont.concat('\n</script>');
var JSCont = new JSSoup(javaFileCont);
firstScriptTag.replaceWith(JSCont);

//write final soup content to the given output file
fs.writeFileSync(outputFilePath,inputSoup.prettify());

















// //import important lib
// const JSSoup = require('jssoup').default;
// const fs = require('fs');
// const path = require('path');

// //get value by arguments
// var files = process.argv.slice(2);
// var inputFilePath = files[0];

// //get directory of input file
// var inputDir = path.dirname(inputFilePath);
// //outputFilePath = files[1];

// //read html file content
// var inputFileCont = fs.readFileSync(inputFilePath,'utf8');
// //make soup of html file content

// // var inputSoup = new JSSoup(inputFileCont);
// // var allTags =inputSoup.findAll();

// var x = inputFileCont;
// var y = x.split("}");
// console.log(y.length);
// //y.filter(a => console.log(a,'done'));
// //console.log(x.match(/{([^}]+)}/)[1]);
// // var classList = [];
// // var idList = [];
// // allTags.filter(f => f.attrs.hasOwnProperty('class') ? classList.push(f.attrs.class) : idList.push(f.attrs.id));
// // console.log(classList);
// // console.log(idList);
// // var i =0;

// // while(tag.hasOwnProperty('name')){
	
// // 	console.log("value is : ",tag.name);
// // 	tag = tag.nextElement;
	
// //  }
// // console.log("done");
// // var t = inputSoup.findAll('class');
// // var allClasses = [];

// // var allElements = inputFileCont.matchAll('*');

// // for (var i = 0; i < allElements.length; i++) {
// //   var classes = allElements[i].className.toString().split(/\s+/);
// //   for (var j = 0; j < classes.length; j++) {
// //     var cls = classes[j];
// //     if (cls && allClasses.indexOf(cls) === -1)
// //       allClasses.push(cls);
// //   }
// // }

// // console.log(allClasses);

// // //find all link and script tag
// // var javaFiles = inputSoup.findAll('script');
// // var cssFiles = inputSoup.findAll('link');

// // //read content from external css file and add them to the html soup
// // var cssFileCont = '';
// // var cssFilePath = '';
// // for(i of cssFiles){
// // 	cssFilePath = inputDir;
// // 	cssFilePath = cssFilePath.concat(i.attrs.href.substring(1));
// // 	cssFileCont = "<style>\n";
// // 	cssFileCont = cssFileCont.concat(fs.readFileSync(cssFilePath, 'utf8'));
// // 	cssFileCont = cssFileCont.concat("\n</style>");
// // 	i.replaceWith(cssFileCont);
// // }

// // //read content from external javascript file and add them to the html soup
// // var javaFileCont = '';
// // var javaFilePath = '';
// // for(i of javaFiles){
// // 	javaFilePath = inputDir;
// // 	javaFilePath = javaFilePath.concat(i.attrs.src.substring(1));
// // 	javaFileCont = "<script>\n";
// // 	javaFileCont = javaFileCont.concat(fs.readFileSync(javaFilePath, 'utf8'));
// // 	javaFileCont = javaFileCont.concat("\n</script>");
// // 	i.replaceWith(javaFileCont);
// // }

// // //write final soup content to the given output file
// // fs.writeFileSync(outputFilePath,inputSoup.prettify());