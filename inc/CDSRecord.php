<?php
class CDSRecord extends SequenceRecord
{
  public $phase;

  public function __construct($prop)
  {
    parent::__construct($prop);
    $this->phase = $prop["phase"];
  }

  public function toArray()
  {
    return array_merge(
        parent::toArray(),
        array("phase" => $this->phase)
    );
  }
  public static function getCdsIDs($mrna, $db)
  {
    $query = <<<SQL
SELECT cds_feature_id AS feature_id FROM cds_feature_mrna_feature
  INNER JOIN cds_feature
    ON cds_feature.id = cds_feature_mrna_feature.cds_feature_id
  WHERE mrna_feature_id = ?
SQL;

    if ($mrna->isReversed()) {
      $query .= " ORDER BY cds_feature.end DESC";
    } else {
      $query .= " ORDER BY cds_feature.start ASC;";
    }

    return MRNARecord::getChildrenIDs($query, $mrna->id, $db);
  }

  public static function getUniqueCds($mRNARecords, $db)
  {
    $query = <<<SQL
    SELECT id, FBid, FBname, chr, start, end, strand, phase, sequence
        FROM cds_feature WHERE id = ? LIMIT 1;
SQL;

    $uniqueIds = $mRNARecords->buildUniqueList("cdsIDs");

    return SequenceRecord::getRecordData($query, $uniqueIds, "CDSRecord", $db);
  }
}
