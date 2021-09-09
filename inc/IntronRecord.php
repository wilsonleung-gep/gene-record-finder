<?php

class IntronRecord
{
  public $id;
  public $transcriptname;
  public $FBid;
  public $splicedonor;
  public $spliceacceptor;

  public function __construct($prop)
  {
    $fields =
        array("id", "transcriptname", "FBid", "splicedonor", "spliceacceptor");

    foreach ($fields as $f) {
      if (array_key_exists($f, $prop)) {
        $this->$f = $prop[$f];
      } else {
        throw new Exception("Required parameter: {$f} missing");
      }
    }
  }

  public function toArray()
  {
    return array(
        "id" => $this->id,
        "transcriptname" => $this->transcriptname,
        "FBid" => $this->FBid,
        "splicedonor" => $this->splicedonor,
        "spliceacceptor" => $this->spliceacceptor
    );
  }

  public static function loadDbRecord($geneName, $db)
  {
    $query = <<<SQL
    SELECT id, transcriptname, FBid, splicedonor, spliceacceptor
      FROM noncanonical_introns
      WHERE genename = ? ORDER BY FBid, transcriptname
SQL;

    $queryResults = $db->queryDb($query, array(
        "types" => "s", "params" => array($geneName)
    ));

    $intronCollection = new FeatureCollection();

    foreach ($queryResults as $intronInfo) {
      $intronCollection->add(new IntronRecord($intronInfo));
    }

    return $intronCollection;
  }
}
