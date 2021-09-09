<?php
function __autoload($class_name) {
    require_once('../inc/'.$class_name.".php");
}

$APPCONFIG_FILE = "../conf/app.ini.php";
$APPCONFIG = parse_ini_file($APPCONFIG_FILE, true);

function main() {
    try {
        $validator = untaintVariables();
        generateWorkbook($validator->clean->q, $validator->clean->t);

    } catch (Exception $e) {
       reportErrors($e->getMessage());
    }
}

main();


function generateWorkbook($geneName, $featureType) {
    global $APPCONFIG;

    $settings = $APPCONFIG["app"];

    $trashdir = $settings["trashdir"];
    $tmpdir = $settings["rootdir"] . "/" . $trashdir;

    $workbookFileName = getFileName($geneName, $featureType);
    $fullPath = $tmpdir."/".$workbookFileName;

    if (! is_readable($fullPath)) {
        $workbookBuilder =
            new WorkbookBuilder($geneName, $featureType, $settings);

        $workbookBuilder->createWorkbook($tmpdir."/".$workbookFileName);
    }

    $fsize = filesize($fullPath);

    header("Pragma: public");
    header("Expires: 0");
    header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
    header("Cache-Control: private", false);
    header('Content-Type: application/vnd.ms-excel');
    header("Content-Disposition: attachment; filename={$workbookFileName};");
    header('Content-Transfer-Encoding: binary');
    header("Content-Length: {$fsize}");

    if (count(ob_list_handlers()) > 0) {
        ob_clean();
        flush();
    }

    readfile($tmpdir."/".$workbookFileName);
}

function getFileName($geneName, $featureType) {
    $invalidChars = array('(', ')', ':', '|');

    return sprintf("%s_%s.xlsx", $featureType,
        str_replace($invalidChars, '_', $geneName));
}

function reportErrors($errorMessage)
{
  $result = new Results(array('status' => Results::FAILURE,
      'message' => $errorMessage
  ));

  echo $result->toJSON();

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

    $variablesToCheck = array(
        new VType("string", "q", "Gene name"),
        new VType("custom", "t", "Feature Type", true,
                create_function('$t', 'return in_array($t, array("cds", "exon"));')),
    );

    foreach ($variablesToCheck as $v) {
        $validator->validate($v);
    }

    return $validator;
}
