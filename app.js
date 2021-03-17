
const JSSoup = require('jssoup').default;
const fs = require('fs');
var files = process.argv.slice(2);
mainFilePath = files[0];
secondaryFilePath = files[1];
var fileType = secondaryFilePath.substring(secondaryFilePath.length -3, secondaryFilePath.length);
mainFileCont = fs.readFileSync(mainFilePath,'utf8');
secondaryFileCont = fs.readFileSync(secondaryFilePath,'utf8');

if(fileType.includes('js')){
	var temp = "<script>";
	temp = temp.concat(secondaryFileCont);
	temp = temp.concat("</script></body>");
	var result = mainFileCont.replace(/<\/body>/g, temp);
	fs.writeFileSync("output.html", result);
}
else{
	var temp = "<style>";
	temp = temp.concat(secondaryFileCont);
	temp = temp.concat("</style></head>");
	var result = mainFileCont.replace(/<\/head>/g, temp);
	fs.writeFileSync("output.html", result);
}
console.log("done");