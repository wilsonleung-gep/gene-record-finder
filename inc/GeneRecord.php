<?php
class GeneRecord extends FeatureRecord
{
  
  public static function loadDbRecord($geneName, $db) {
    $query = <<<SQL
SELECT id, FBid, FBname, chr, start, end, strand
  FROM gene_feature WHERE FBname = ? LIMIT 1;
SQL;

    $queryResults = $db->queryDb($query, array(
        "types" => "s", "params" => array($geneName)
    ));

    if (count($queryResults) !== 1) {
      throw new Exception("Cannot find the FlyBase gene record: {$geneName}");
    }

    return new GeneRecord($queryResults[0]);
  }
}
