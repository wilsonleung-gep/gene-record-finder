<?php
class ChromName
{
  public static function getUCSCChrom($chrom, $db) {
    $query = <<<SQL
SELECT UCSCchrom FROM chrom_mapping WHERE FBchrom = ? LIMIT 1;
SQL;

    $queryResults = $db->queryDb($query, array(
        "types" => "s", "params" => array($chrom)
    ));

    if (count($queryResults) !== 1) {
      return $chrom;
    }

    $result = $queryResults[0];
    
    return $result["UCSCchrom"];
  }
}
