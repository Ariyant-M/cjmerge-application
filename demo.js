//Read CLI Arguments
var sourcePath = process.argv[2];
var destPath = process.argv[3];

//Require module dependencies
const fs = require('fs');
const path = require('path');
const JSSoup = require('jssoup').default;
const cssParser = require('css');

//Parse file paths
let sourcePathParsed = path.parse(sourcePath);
let destPathParsed = path.parse(destPath);

//Read HTML file content synchronously
var htmlfileContent = fs.readFileSync(sourcePath, 'utf8');

//Make soup for HTML
var htmlsoup = new JSSoup(htmlfileContent);

//Make array of references to script and css tags
var scriptTagArray = htmlsoup.findAll('script').filter(eachTag => {return eachTag.attrs.type='text/javascript'});;
var cssTagArray = htmlsoup.findAll('link').filter(eachTag => {return eachTag.attrs.type == 'text/css'});

//Start the aggregation process

//This block of code executes only if any script tag is found in HTML file
if(scriptTagArray.length>0)
{
        //Aggregate all the scripts from all the sources into one place
        //Reference to first script tag
        let firstScriptTag = scriptTagArray[0];

        //Variable to hold aggregate script content
        var scriptFileContent='';

        //Loop through script references in soup and replace those with original script file content
        scriptTagArray.forEach((eachScriptTag, index) => {

                console.log(eachScriptTag.attrs.src);
                
                //Get the absolute path to the file referenced in the current script tag
                let pathtoJS = eachScriptTag.attrs.src;
                let absPathtoJS = path.join(sourcePathParsed.dir,pathtoJS.slice(1));

                //Add the content of file referenced in current script tag to aggregate script content
                scriptFileContent = scriptFileContent + fs.readFileSync(absPathtoJS, 'utf8');

                //Add a new line to aggregated script content after reading every single JS file
                scriptFileContent = scriptFileContent + '\n\n';

                //Nulify every other script tag except the first one
                if(index!==0)
                {
                        console.log('Replacing',eachScriptTag.attrs.src)
                        eachScriptTag.replaceWith('');
                }
        });

        //Create a new soup of the Aggregate script
        let newJSSoupToAppend = new JSSoup('<script>'+scriptFileContent+'</script>');

        //Replace the first script tag with the new aggregated script soup content
        firstScriptTag.replaceWith(newJSSoupToAppend);
}

//This block of code executes only if any CSS link tag is found in HTML file
if(cssTagArray.length>0)
{
        //Aggregate all the CSS from all the sources into one place
        //Reference to first CSS tag
        let firstCSSTag = cssTagArray[0];

        //Variable to hold aggregate CSS content
        var cssFileContent='';
        cssTagArray.forEach((eachCSSTag, index) => {

                //Get the absolute path to the file referenced in the current CSS tag
                let pathtoCSS = eachCSSTag.attrs.href;
                let absPathtoCSS = path.join(sourcePathParsed.dir, pathtoCSS.slice(1));

                //Add the content of file referenced in current CSS tag to aggregate CSS content
                cssFileContent = cssFileContent + fs.readFileSync(absPathtoCSS, 'utf8');

                //Add a new line to aggregated CSS content after reading every single CSS file
                cssFileContent = cssFileContent + '\n\n';

                //Nulify every other CSS tag except the first one
                if(index!==0)
                {
                        eachCSSTag.replaceWith('');
                }
        });

        //Fetch set of classes used in HTML Template
        //Variable to hold set of useful CSS classes used in HTML
        var usedCSSSet = new Set();

        //Get array of all the tags used in HTML
        var allTags = htmlsoup.findAll();

        //Iterate through each tag and fetch the classes used in that tag
        allTags.forEach(eachTag => 
                {
                        //Get all attributes of the current tag
                        let currentAttributes = eachTag.attrs;

                        //If 'class' attribute exists in the set of attributes of the current tag
                        if('class' in currentAttributes)
                        {       
                                //Get a list of all classes mentioned in 'class' attribute of that tag
                                classAttributes = currentAttributes.class.split(' ');

                                //Add those classes into the set of useful CSS classes
                                classAttributes.forEach(eachClass=> {
                                        usedCSSSet.add(eachClass);
                                });
                        }
        });

        //Parse the aggregate CSS collected from all the sources
        var cssParsedData = cssParser.parse(cssFileContent);

        //Variable to hold dictionary of non-repeating filtered CSS rule objects
        //or the rules of css selectors that the HTML template is dependent on
        let filteredCSSRules = {};

        //Iterate through each set of rules and consider it only if it is used in HTML template
        cssParsedData.stylesheet.rules.forEach(eachRule => 
                {
                
                //Variable to hold an intermediate object of the current CSS rule set
                let CSSRuleOBJ_Construct = {};
                
                //Get the selector of the current rule set as a string
                let selectorString = eachRule.selectors.join(' ');
        
                //Iterate through the set of used CSS classes in HTML
                usedCSSSet.forEach(eachUsedCSSClass => {
                        
                        //If that used class of HTML is included in the current selector
                        if(selectorString.includes(eachUsedCSSClass))
                        {
                                //Construct a css settings object out of the rule set of current selector
                                //Schema: [{attribute, value}+]
                                let CSS_Settings=[];
                                eachRule.declarations.forEach(eachRuleLine => {
                                        CSS_Settings.push({attribute: eachRuleLine.property, value: eachRuleLine.value});
                                });
        
                                // Push the css object into the list of filtered CSS rule objects
                                filteredCSSRules[selectorString] = CSS_Settings;
                        }
                });
                }
        );


        //Variable to hold the final filtered CSS content to be written to target file
        let usefulCSSString = '';
        

        //Iterate through each object in dictionary of filtered CSS rule objects
        //and format the output to the variable that holds final filtered CSS content

        for(var currentSelector of Object.keys(filteredCSSRules))
        {
                //Variable to hold well formatted CSS rule that matches native formatting of a CSS file
                let formattedCSSData='';

                //Format the data in the CSS rule object to the usefulCSSString variable
                formattedCSSData = formattedCSSData + currentSelector + '{\n';

                var currentSelectorSettings = filteredCSSRules[currentSelector];

                currentSelectorSettings.forEach(eachSetting => {
                        formattedCSSData = formattedCSSData + eachSetting.attribute + ':' + eachSetting.value + ';\n'
                })

                formattedCSSData = formattedCSSData + '}\n\n';

                usefulCSSString = usefulCSSString + formattedCSSData;
        }

        console.log(usefulCSSString);


        //Create a new soup of the final filtered CSS content
        let newCSSSoupToAppend = new JSSoup('<style>'+usefulCSSString+'</style>');

        //Replace the first CSS tag with the new aggregated CSS soup content 
        firstCSSTag.replaceWith(newCSSSoupToAppend);
}

//Synchronously write the updated soup to the file mentioned in destination location
fs.writeFileSync(destPath, htmlsoup.prettify());

//Alert the user of the location of the new file
console.log('Merged file is available at the location: '+ destPath);