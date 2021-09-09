<?php
class ExonRecord extends SequenceRecord
{
  public static function getExonIDs($mrna, $db)
  {
    $query = <<<SQL
SELECT exon_feature_id AS feature_id FROM exon_feature_mrna_feature
  INNER JOIN exon_feature
    ON exon_feature.id = exon_feature_mrna_feature.exon_feature_id
  WHERE mrna_feature_id = ?
SQL;

    if ($mrna->isReversed()) {
      $query .= " ORDER BY exon_feature.end DESC";
    } else {
      $query .= " ORDER BY exon_feature.start ASC";
    }

    return MRNARecord::getChildrenIDs($query, $mrna->id, $db);
  }

  public static function getUniqueExons($mRNARecords, $db)
  {
    $query = <<<SQL
    SELECT id, FBid, FBname, chr, start, end, strand, sequence
        FROM exon_feature WHERE id = ? LIMIT 1;
SQL;

    $uniqueIds = $mRNARecords->buildUniqueList("exonIDs");

    return SequenceRecord::getRecordData($query, $uniqueIds, "ExonRecord", $db);
  }
}
