<?php
class FeatureCollection
{
  public $idMap;
  public $collection;
  protected $idx = 0;

  public function __construct($contentArray=NULL)
  {
    $this->collection = array();
    $this->idMap = array();

    if ($contentArray !== NULL) {
      $this->initCollection($contentArray);
    }
  }

  public function add($item)
  {
    array_push($this->collection, $item);
    $this->idMap[$item->id] = $this->idx;

    $this->idx++;
  }

  public function remove($itemID)
  {
    if (! array_key_exists($itemID, $this->idMap)) {
      throw new Exception("Collection does not contain item: {$itemID}");
    }

    array_splice($this->collection, $this->idMap[$itemID], 1);

    $this->reindexMapping();
  }

  public function buildUniqueList($fieldName)
  {
    if (is_array($this->collection[0]->$fieldName)) {
      return $this->buildUniqueListFromArrayField($fieldName);
    }

    return $this->buildUniqueListFromProperty($fieldName);
  }

  public function toArray()
  {
    $collectionArray = array();

    foreach ($this->collection as $item)
    {
      array_push($collectionArray, $item->toArray());
    }

    return array(
        "idMap" => $this->idMap,
        "items" => $collectionArray
    );
  }

  protected function initCollection($contentArray)
  {
    foreach ($contentArray as $rowData) {
      $this->add($rowData);
    }
  }

  protected function reindexMapping()
  {
    $idx = 0;
    $this->idMap = array();

    foreach ($this->collection as $item) {
      $this->idMap[$item->id] = $idx;
      $idx++;
    }

    $this->idx = $idx;
  }

  protected function buildUniqueListFromArrayField($fieldName)
  {
    $uniqueList = array();

    foreach ($this->collection as $item) {
      $fieldContent = $item->$fieldName;

      foreach ($fieldContent as $fieldID) {
        $uniqueList[$fieldID] = 1;
      }
    }

    return array_keys($uniqueList);
  }

  protected function buildUniqueListFromProperty($fieldName)
  {
    $uniqueList = array();

    foreach ($this->collection as $item) {
      $uniqueList[$item->$fieldName] = 1;
    }

    return array_keys($uniqueList);
  }
}
