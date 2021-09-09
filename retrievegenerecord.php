<?php
function gep_autoloader($class_name) {
    include './inc/'.$class_name.'.php';
}

spl_autoload_register('gep_autoloader');


$APPCONFIG_FILE = "./conf/app.ini.php";
$APPCONFIG = parse_ini_file($APPCONFIG_FILE, true);
$VIEW = array();

function main() {
    global $APPCONFIG;
    global $VIEW;

    $validator = untaintVariables();
    $db = NULL;

    try {
        $db = new DBUtilities($APPCONFIG["database"]);

        $gene = GeneRecord::loadDbRecord($validator->clean->searchname, $db);
        $ucscChrom = ChromName::getUCSCChrom($gene->chr, $db);

        $VIEW["results"] = retrieveRecord($gene, $db);
        $VIEW["browserScreenshot"] =
                buildGenomeBrowserLink($gene, $ucscChrom, $APPCONFIG["app"]);

        $db->disconnect();
    } catch (Exception $e) {
        if (isset($db)) {
            $db->disconnect();
        }
        reportErrors($e->getMessage());
    }
}

main();


function buildGenomeBrowserLink($gene, $ucscChrom, $imageCfg) {
    $image = new BrowserImage($gene, $ucscChrom, $imageCfg);

    return $image->buildImageTag();
}

function retrieveRecord($gene, $db) {
    $mRNARecords = MRNARecord::loadDbRecord($gene, $db);
    $exonRecords = ExonRecord::getUniqueExons($mRNARecords, $db);
    $cdsRecords = CDSRecord::getUniqueCds($mRNARecords, $db);
    $intronRecords = IntronRecord::loadDbRecord($gene->FBname, $db);

    return json_encode(
      array(
        "gene" => $gene->toArray(),
        "mrnas" => $mRNARecords->toArray(),
        "exons" => $exonRecords->toArray(),
        "cds" => $cdsRecords->toArray(),
        "introns" => $intronRecords->toArray()
      )
    );
}

function reportErrors($errorMsg) {
  echo <<<MSG
  Cannot complete the request because of the following error:<br>
  $errorMsg
MSG;
  exit;
}


function untaintVariables() {
    $validator = validateVariables();

    if ($validator->has_errors()) {
        reportErrors($validator->list_errors());
    }

    return $validator;
}

function validateVariables() {
    $validator = new Validator($_GET);

    $checkDbFunc = function($t) {
      return in_array($t, array("dm6", "dm3"));
    };

    $variablesToCheck = array(
        new VType("string", "searchname", "Gene Name"),
        new VType("custom", "db", "Database", true, $checkDbFunc)
    );

    foreach ($variablesToCheck as $v) {
          $validator->validate($v);
    }

    return $validator;
}
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="description"
          content="Retrieve D. melanogaster gene structure information from FlyBase">
    <title>Gene Record Finder V1.3</title>

    <link rel="stylesheet" href="https://unpkg.com/purecss@1.0.1/build/pure-min.css" integrity="sha384-oAOxQR6DkCoMliIh8yFnu25d7Eq/PHS21PClpwjOTeU2jRSq11vu66rf90/cZr47" crossorigin="anonymous">

    <link rel="stylesheet" href="styles/dmelgenerecord-main-v1.min.css">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/yui/3.18.1/yui/yui-min.js"></script>
  </head>

  <body class="yui3-skin-sam">
    <div id="hd">
      <div class="pure-g">
        <div class="pure-u-1-2">
          <img alt='main logo' id='mainimage' src='./images/small_logo.png' />
          <p>FlyBase Release 6.40 - (Last Update: 06/30/2021)</p>
        </div>
        <div class="pure-u-1-2">
          <form method="GET" action="retrievegenerecord.php" id="searchform" class="pure-form">
            <fieldset>
              <legend>Search <i>D. melanogaster</i> Gene Records:</legend>
              <div id="genesearch-ac">
                <input id="searchname" name="searchname" placeholder="FlyBase Gene Symbol" size="45">
                <input type="hidden" name="db" id="db" value="dm6">
                <button type="submit" class="pure-button pure-button-primary">Find Record</button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>

    <div id="bd">
      <div id="geneinfo-tab" class="detailsSection">
        <ul>
          <li><a href="#geneinfo">Gene Details</a></li>
        </ul>
        <div id="geneinfo">
          <div id="geneinfo-table"></div>
        </div>
      </div>
      <div id="mRNAinfo-tab" class="detailsSection">
        <ul>
          <li><a href="#mRNAinfo">mRNA Details</a></li>
        </ul>
        <div class="tabsSection">
          <div id="mRNAinfo">
            <div class="browserScreenshot"><?php echo $VIEW["browserScreenshot"];?></div>

            <p>Select a row to display the corresponding transcript and peptide details:</p>
            <div id="mRNAinfo-table"></div>
          </div>
        </div>
      </div>
      <div id="introninfo-tab" class="detailsSection hidden">
        <ul>
          <li><a href="#introninfo">Introns with Non-canonical Splice Sites</a></li>
        </ul>
        <div class="tabsSection">
          <div id="introninfo">
            <div id="introninfo-table"></div>
          </div>
        </div>
      </div>
      <div id="exoninfo-tab" class="detailsSection">
        <ul>
          <li><a href="#transcriptinfo">Transcript Details</a></li>
          <li><a href="#peptideinfo">Polypeptide Details</a></li>
        </ul>
        <div id="exoninfo-content" class="tabsSection">
          <div id="transcriptinfo">
            <div class="panelControls">
              Options:
              <button class="button-small pure-button" id="exportExons">Export All Unique Exons to FASTA</button>
              <button class="button-small pure-button" id="exportSelectedExons">Export All Exons for Selected Isoform to FASTA</button>
              <a class="button-small pure-button" id="downloadExonWorkbook" href="#">Download Exons Workbook</a>
            </div>

            <p>Exon usage map:</p>
            <div id="transcriptinfo-usage"></div>

            <div class="infoTable">
              <p>Select a row to display the corresponding exon sequence:</p>
              <div id="transcriptinfo-table"></div>
            </div>
          </div>
          <div id="peptideinfo">
            <div class="panelControls">
              Options:
              <button class="button-small pure-button" id="exportCds">Export All Unique CDS to FASTA</button>
              <button class="button-small pure-button" id="exportSelectedCds">Export All CDS for Selected Isoform to FASTA</button>
              <a class="button-small pure-button" id="downloadCdsWorkbook" href="#">Download CDS Workbook</a>
            </div>

            <p>CDS usage map:</p>
            <div id="peptideinfo-usage"></div>

            <div id="cdsUniqueProteins" class="hidden">
              <p>Isoforms with unique coding exons:</p>
              <div id="cdsUniqueProteins-table"></div>
            </div>

            <div class="infoTable">
              <p>Select a row to display the corresponding CDS sequence:</p>
              <div id="peptideinfo-table"></div>
            </div>
          </div>
        </div>
      </div>
      <div id="sequencepanel"></div>
    </div>

    <div id="ft">
      <p>
        | <a href="https://thegep.org">GEP Home Page</a> |
          <a href="https://community.gep.wustl.edu/repository/documentations/Gene_Record_Finder_User_Guide.pdf">User Guide</a> |
      </p>
    </div>


    <script id="geneInfo-list-template" type="text/x-handlebars-template">
      <div class="pure-g">
        <div class="pure-u-3-8">
          <span><i>{{FBname}}</i></span>
        </div>
        <div class="pure-u-5-8">
          <span class="countDetails">
            (#mRNA: {{mrnacount}}, #exons: {{exoncount}}, #CDS: {{cdscount}})
          </span>
        </div>
    </script>

    <script id="uniqueProteins-template" type="text/x-handlebars-template">
      <table id="{{id}}" class="pure-table pure-table-bordered">
        <thead>
          <tr>
            <th>Unique isoform(s) based on coding sequence</th>
            <th>Other isoforms with identical coding sequences</th>
          </tr>
        </thead>
        <tbody>
          {{#items}}
          <tr id="{{id}}">
            <td>{{name}}</td><td>{{isoformList}}</td></tr>
          {{/items}}
        </tbody>
      </table>
    </script>

    <script src="js/dmelgenerecord-main-v1.min.js"></script>
    <script type="text/javascript">
  YUI.namespace("Env.GEP").pageData = <?php echo $VIEW["results"];?>;
    </script>
    <script src="js/dmelgenerecord-viewer-v1.min.js"></script>
  </body>
</html>
