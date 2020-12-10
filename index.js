var http = require('http');
var formidable = require('formidable');
var fs = require('fs-extra');
var path = require('path'); 

const input_path = path.dirname(__filename) + "/_sourceFiles/";
const input_link ="../_sourceFiles/";
const rel_path = path.parse;

console.log("je to o.k.");


http.createServer(function (req, res) {
  if(req.url) {
    var part = req.url.split("/")[3];
    if(part){
      var output_file = `${input_path}${part}/package.pdf`;
      var output_link = `${input_link}${part}/package.pdf`;
    }
  }else{
    var output_file = NULL;
  }
  
  if (req.url == '/pdfs2/fileupload') {
    //fs.emptyDirSync(input_path);
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    

    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      //console.log('fields:', fields);
      //console.log('files:', files);
      var d = new Date();
      var uid = d.getTime();
      fs.mkdirSync(`${input_path}${uid}`);
      Object.keys(files).forEach(fileUpload);
      function fileUpload(value, index, array){
        var oldpath = files[value].path;
        var newpath = `${input_path}${uid}/${value}.pdf`;
        if(files[value].size){
          fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            //res.write(`<p>Soubor <strong>${files[value].name}</strong> nahrán úplně růžově!</p>`);
          });
        }
      }
      res.write("<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;700;800&display=swap' rel='stylesheet'>");
      res.write("<style>* {font-family: 'Open Sans', sans-serif;} body{margin:3rem} input {margin: .2rem 0} input[type='submit'] {background-color: #46A7F3; border: 1px solid #0B67AF; padding:.4rem 1rem; font-weight: 700; text-transform:uppercase}</style>");
      res.write("<h1>Sloučení PDF souborů</h1>");
      res.write(`<p><a href='./join/${uid}'>Sloučit soubory</a></p>`);
      res.end();
    });

    return;

  } else if (req.url.match('join')) {

    const { PDFNet } = require('@pdftron/pdfnet-node');

    ((exports) => {
      'use strict';
    
      exports.runPDFPackageTest = () => {
        // Relative path to the folder containing test files.
       
        //fs.mkdirSync(`${output_file}`);
        const addPackage = async (doc, file, desc) => {
          const files = await PDFNet.NameTree.create(doc, "EmbeddedFiles");
          const fs = await PDFNet.FileSpec.create(doc, file, true);
          files.put(file, await fs.getSDFObj());
          fs.setDesc(desc);
    
          const root = await doc.getRoot();
          var collection = await root.findObj("Collection");
          if (!collection) collection = await root.putDict("Collection");
    
          // You could here manipulate any entry in the Collection dictionary. 
          // For example, the following line sets the tile mode for initial view mode
          // Please refer to section '2.3.5 Collections' in PDF Reference for details.
          collection.putName("View", "T");
        }
    
        const addCoverPage = async (doc) => {
          // Here we dynamically generate cover page (please see ElementBuilder 
          // sample for more extensive coverage of PDF creation API).
          const page = await doc.pageCreate(await PDFNet.Rect.init(0, 0, 200, 200));
    
          const b = await PDFNet.ElementBuilder.create();
          const w = await PDFNet.ElementWriter.create();
          w.beginOnPage(page);
          const font = await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_helvetica);
          w.writeElement(await b.createTextBeginWithFont(font, 12));
          const e = await b.createNewTextRun("PDF soubory");
          e.setTextMatrixEntries(1, 0, 0, 1, 50, 96);
          const gstate = await e.getGState();
          gstate.setFillColorSpace(await PDFNet.ColorSpace.createDeviceRGB());
          gstate.setFillColorWithColorPt(await PDFNet.ColorPt.init(1, 0, 0));
          w.writeElement(e);
          w.writeElement(await b.createTextEnd());
          w.end();
          doc.pagePushBack(page);
    
          // Alternatively we could import a PDF page from a template PDF document
          // (for an example please see PDFPage sample project).
        }
    
        const main = async () => {
    
          // Create a PDF Package.
          try {
            const doc = await PDFNet.PDFDoc.create();
            for(let i = 1; i <= 20; i++){
              let file = input_path + part + "/soubor" + (i+'').padStart(2, '0') + ".pdf";
              if(fs.existsSync(file)) {await addPackage(doc, file, "File " + i);}
            }
           
            await addCoverPage(doc);
            await doc.save(output_file, PDFNet.SDFDoc.SaveOptions.e_linearized);
            console.log("Done.");
          } catch (err) {
            console.log(err);
          }
    
          try {
            const doc = await PDFNet.PDFDoc.createFromFilePath(output_file);
            await doc.initSecurityHandler();
    
            const files = await PDFNet.NameTree.find(doc, "EmbeddedFiles");
            if (await files.isValid()) {
              // Traverse the list of embedded files.
              const i = await files.getIteratorBegin();
              for (var counter = 0; await i.hasNext(); await i.next(), ++counter) {
                const entry_name = await i.key().then(key => key.getAsPDFText());
                console.log("Part: " + entry_name);
                const file_spec = await PDFNet.FileSpec.createFromObj(await i.value());
                const stm = await file_spec.getFileData();
                if (stm) {
                  //stm.writeToFile(output_path + 'extract_' + counter + '.pdf', false);
                }
              }
            }
    
            console.log("Done.");
          } catch (err) {
            console.log(err);
          }
        }
        // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
        
        PDFNet.runWithCleanup(main).catch(function(error) {
          console.log('Error: ' + error);
        }).then(function(){ PDFNet.shutdown(); });
        
      };
      exports.runPDFPackageTest();
    })(exports);

    
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.write("<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;700;800&display=swap' rel='stylesheet'>");
    res.write("<style>* {font-family: 'Open Sans', sans-serif;} body{margin:3rem} input {margin: .2rem 0} input[type='submit'] {background-color: #46A7F3; border: 1px solid #0B67AF; padding:.4rem 1rem; font-weight: 700; text-transform:uppercase}</style>");
    res.write("<h1>Sloučení PDF souborů</h1>");
    res.write("<p>Soubor stáhněte kliknutím pravým tlačítkem na odkazem a vyberte volbu 'Uložit odkaz jako'</p>");
    res.write(`<p><a href='./${output_link}'>sloučený pdf soubor</a></p>`); 
    res.end();   
  } else if (req.url.match("package")) {
      var file = fs.createReadStream(output_file);
      var stat = fs.statSync(output_file);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=package.pdf');
      file.pipe(res);

  } else {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.write("<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;700;800&display=swap' rel='stylesheet'>");
    res.write("<style>* {font-family: 'Open Sans', sans-serif;} body{margin:3rem} input {margin: .2rem 0} input[type='submit'] {background-color: #46A7F3; border: 1px solid #0B67AF; padding:.4rem 1rem; font-weight: 700; text-transform:uppercase}</style>");
    res.write("<h1>Sloučení PDF souborů</h1>");
    res.write('<form action="pdfs2/fileupload" method="post" enctype="multipart/form-data">');
    for(let i = 1; i <= 20; i++){
      res.write(`${(i+'').padStart(2, '0')}. <input type="file" name="soubor${(i+'').padStart(2, '0')}"><br>`);
    }
    res.write("<br><input type='submit' value='nahrát soubory'>");
    res.write('</form>');
    res.write('Poznámka: odeslání formuláře může chvíli trvat vzhledem k velikosti a počtu nahrávaných souborů.');
    return res.end();
  }
}).listen(process.env.PORT || 8088);
