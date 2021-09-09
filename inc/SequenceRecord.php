<?php

class SequenceRecord extends FeatureRecord
{
  public $sequence;
  public $FBprefix;

  public function __construct($prop)
  {
    parent::__construct($prop);
    $this->sequence = $prop["sequence"];
    $this->truncateFBid($prop["FBid"]);
  }

  public function formatSequence($lineWidth = 50, $newLine = "\n")
  {
    return implode(
      $newLine,
      array(wordwrap($this->sequence, $lineWidth, $newLine, true),
          $newLine));
  }

  public function restoreFullFBid()
  {
    $this->FBid = sprintf("%s:%s", $this->FBprefix, $this->FBid);
  }

  public function toArray()
  {
    return array_merge(
        parent::toArray(),
        array("sequence" => $this->formatSequence(),
              "FBprefix" => $this->FBprefix)
    );
  }
  public static function getRecordData($query, $recordList, $className, $db)
  {
    $featurePrefixes = array();
    $recordCollection = array();

    $results = $db->batchQueryDb($query, array("types" => "i"), $recordList);

    foreach ($results as $recordMatches) {
      if (count($recordMatches) < 1) {
        throw new Exception(
            "Batch retrieve failed: ". implode(", ",$recordList));
      }

      $record = new $className($recordMatches[0]);
      $featurePrefixes[$record->FBprefix] = 1;

      array_push($recordCollection, $record);
    }

    $hasMultiplePrefixes = (count(array_keys($featurePrefixes)) > 1);
    if ($hasMultiplePrefixes) {
      foreach ($recordCollection as $record) {
        $record->restoreFullFBid();
      }
    }

    if (count($recordCollection) > 0) {
      $sortFunc = ($recordCollection[0]->isReversed()) ?
          'FeatureRecord_sortByEnd' : 'FeatureRecord_sortByStart';

      usort($recordCollection, $sortFunc);
    }

    return new FeatureCollection($recordCollection);
  }

  private function truncateFBid($originalID)
  {
    $this->FBprefix = "";
    $this->FBid = $originalID;

    if (preg_match('/^(.*):(.*)$/', $originalID, $match)) {
      $this->FBprefix = $match[1];
      $this->FBid = $match[2];
    }
  }
}

