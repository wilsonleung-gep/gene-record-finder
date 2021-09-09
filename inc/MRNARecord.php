<?php

class MRNARecord extends FeatureRecord
{
  public $proteinID;
  public $exonIDs;
  public $cdsIDs;

  public function __construct($prop)
  {
    parent::__construct($prop);
    $this->proteinID = $prop["protein_id"];
  }

  public function toArray()
  {
    return array_merge(
        parent::toArray(),
        array("proteinID" => $this->proteinID,
              "exonIDs" => $this->exonIDs,
              "cdsIDs" => $this->cdsIDs)
    );
  }

  public static function loadDbRecord($gene, $db)
  {
    $query = <<<SQL
    SELECT id, FBid, FBname, chr, start, end, strand, protein_id
        FROM mrna_feature WHERE gene_feature_id = ?
SQL;

    if ($gene->isReversed()) {
      $query .= " ORDER BY end DESC";
    } else {
      $query .= " ORDER BY start ASC";
    }

    $queryResults = $db->queryDb($query, array(
        "types" => "i", "params" => array($gene->id)
    ));

    if (count($queryResults) === 0) {
      throw new Exception("Cannot find the corresponding mRNA records");
    }

    $mRNACollection = new FeatureCollection();
    foreach ($queryResults as $mRNAInfo) {
      $mRNA = new MRNARecord($mRNAInfo);
      $mRNA->exonIDs = ExonRecord::getExonIDs($mRNA, $db);
      $mRNA->cdsIDs = CDSRecord::getCdsIDs($mRNA, $db);

      $mRNACollection->add($mRNA);
    }

    return $mRNACollection;
  }

  public static function getChildrenIDs($query, $parentID, $db)
  {
    $queryResults = $db->queryDb($query, array(
        "types" => "i", "params" => array($parentID)
    ));

    $exonIds = array();
    foreach ($queryResults as $result) {
      array_push($exonIds, $result["feature_id"]);
    }

    return $exonIds;
  }
}
