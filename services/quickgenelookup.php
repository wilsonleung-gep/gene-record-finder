<?php

function gep_autoloader($class_name) {
  include '../inc/'.$class_name.'.php';
}

spl_autoload_register('gep_autoloader');


$APPCONFIG_FILE = "../conf/app.ini.php";
$APPCONFIG = parse_ini_file($APPCONFIG_FILE, true);


function main()
{
  global $APPCONFIG;

  $validator = untaintVariables();
  $db = null;

  try {
    $db = new DBUtilities($APPCONFIG["database"]);

    $result = new Results(array(
        'status' => Results::SUCCESS,
        'message' => "",
        'results' => lookupMatches($db, $validator->clean)
    ));

    echo $result->toJSON();

    $db->disconnect();
  } catch (Exception $e) {
    if (isset($db)) {
      $db->disconnect();
    }

    reportErrors($e->getMessage());
  }
}

main();


function lookupMatches($db, $clean)
{
  $query = <<<SQL
SELECT FBname, mrnacount, exoncount, cdscount
  FROM gene_index
  WHERE FBname
  LIKE ?
  ORDER BY LENGTH(FBname) LIMIT ?
SQL;

  $searchName = $clean->q."%";

  $queryResults = $db->queryDb($query, array(
      "types" => "si",
      "params" => array($searchName, $clean->limit)
  ));

  return $queryResults;
}


function reportErrors($errorMessage)
{
  $result = new Results(array('status' => Results::FAILURE,
      'message' => $errorMessage
  ));

  echo $result->toJSON();

  exit;
}

function untaintVariables()
{
  $validator = validateVariables();

  if ($validator->has_errors()) {
    reportErrors($validator->list_errors());
  }

  return $validator;
}

function validateVariables()
{
  $validator = new Validator($_GET);

  $validator->clean->limit = 15;

  $checkDbFunc = function($t) {
    return in_array($t, array("dm6", "dm3"));
  };

  $variablesToCheck = array(
      new VType("string", "q", "Gene Name"),
      new VType("custom", "db", "Database", true, $checkDbFunc)
  );

  foreach ($variablesToCheck as $v) {
    $validator->validate($v);
  }

  return $validator;
}
