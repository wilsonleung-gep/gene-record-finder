<?php
class FeatureRecord
{
  const MINUS = "-";
  const PLUS = "+";

  public $id;
  public $FBid;
  public $FBname;
  public $chr;
  public $start;
  public $end;
  public $strand;
  public $fivePrimeStart;
  public $threePrimeEnd;

  public function __construct($prop)
  {
    $fields =
      array('id', 'FBid', 'FBname', 'chr', 'start', 'end', 'strand');

    foreach ($fields as $f) {
      if (array_key_exists($f, $prop)) {
        $this->$f = $prop[$f];
      } else {
        throw new Exception("Required parameter: {$f} missing");
      }
    }

    if ($this->isReversed()) {
      $this->fivePrimeStart = $this->end;
      $this->threePrimeEnd = $this->start;
    } else {
      $this->fivePrimeStart = $this->start;
      $this->threePrimeEnd = $this->end;
    }
  }

  public function isReversed()
  {
    return ($this->strand == self::MINUS);
  }

  public function toArray()
  {
    return array(
      "id" => $this->id,
      "FBid" => $this->FBid,
      "FBname" => $this->FBname,
      "chr" => $this->chr,
      "start" => $this->start,
      "end" => $this->end,
      "strand" => $this->strand,
      "fivePrimeStart" => $this->fivePrimeStart,
      "threePrimeEnd" => $this->threePrimeEnd
    );
  }
}

function FeatureRecord_sortByStart($a, $b)
{
  $startDiff = $a->start - $b->start;

  if ($startDiff === 0) {
    return ($b->end - $a->end < 0) ? -1 : 1;
  }

  return ($startDiff < 0) ? -1 : 1;
}

function FeatureRecord_sortByEnd($a, $b)
{
  $endDiff = $b->end - $a->end;

  if ($endDiff === 0) {
    return ($a->start - $b->start < 0) ? -1 : 1;
  }

  return ($endDiff < 0) ? -1 : 1;
}
