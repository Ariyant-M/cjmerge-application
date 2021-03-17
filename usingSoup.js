//import important lib
const JSSoup = require('jssoup').default;
const fs = require('fs');
const path = require('path');

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

//read content from external css file and add them to the html soup
var cssFileCont = '';
var cssFilePath = '';
for(i of cssFiles){
	cssFilePath = inputDir;
	cssFilePath = cssFilePath.concat(i.attrs.href.substring(1));
	cssFileCont = "<style>\n";
	cssFileCont = cssFileCont.concat(fs.readFileSync(cssFilePath, 'utf8'));
	cssFileCont = cssFileCont.concat("\n</style>");
	i.replaceWith(cssFileCont);
}

//read content from external javascript file and add them to the html soup
var javaFileCont = '';
var javaFilePath = '';
for(i of javaFiles){
	javaFilePath = inputDir;
	javaFilePath = javaFilePath.concat(i.attrs.src.substring(1));
	javaFileCont = "<script>\n";
	javaFileCont = javaFileCont.concat(fs.readFileSync(javaFilePath, 'utf8'));
	javaFileCont = javaFileCont.concat("\n</script>");
	i.replaceWith(javaFileCont);
}

//write final soup content to the given output file
fs.writeFileSync(outputFilePath,inputSoup.prettify());