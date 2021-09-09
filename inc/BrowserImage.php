<?php
class BrowserImage
{
  public $gene;
  public $imageCfg;
  public $position;
  public $UCSCchrom;

  const DEFAULT_DB = "dm6";
  
  public function __construct($gene, $ucscChrom, $imageCfg)
  {
    if (!isset($imageCfg["db"])) {
      $imageCfg["db"] = self::DEFAULT_DB;
    }
  
    $this->gene = $gene;
    $this->UCSCchrom = $ucscChrom;
    $this->imageCfg = $imageCfg;
    $this->position = NULL;
  }

  public function buildImageTag()
  {
    if ($this->gene->chr === "mitochondrion_genome") {
      return "Genome Browser image unavailable.";
    }
    
    $links = $this->createLinks();
    
    $tpl= '<a target="_blank" alt="Image of gene model" '.
             'title="View in GEP UCSC Genome Browser" href="%s">'.
      '<img src="%s"></a>';
    
    return sprintf($tpl, $links["a"], $links["img"]);
  }
  
  protected function createLinks()
  {
    return array(
      "a" => $this->createAnchorLink(),
      "img" => $this->createImgLink()
    );
  }
  
  protected function createAnchorLink()
  {
    $cfg = $this->imageCfg;
    
    $hgTracks = sprintf("%s/%s", $cfg["ucscroot"], "cgi-bin/hgTracks");
    
    $params = $this->buildParamString(array(
      "db" => $cfg["db"],
      "position" => $this->getGenePositionString(),
      "pix" => "1024",
      "fbexon" => "pack",
      "fbcds" => "pack",
      "enableHighlightingDialog" => "0"
    ));
    
    return sprintf("%s?%s", $hgTracks, $params);
  }
  
  protected function createImgLink()
  {
    $cfg = $this->imageCfg;
    
    $hgRenderTracks = sprintf(
      "%s/%s", $cfg["ucscroot"], "cgi-bin/hgRenderTracks"
    );
    
    $trackSession = sprintf("%s/%s", $cfg["webroot"], $cfg["ucscSession"]);
    
    $params = $this->buildParamString(array(
      "hgS_doLoadUrl" => "submit",
      "hgS_loadUrlName" => $trackSession,
      "db" => $cfg["db"],
      "position" => $this->getGenePositionString()       
    ));
    
    return sprintf("%s?%s", $hgRenderTracks, $params);
  }
  
  protected function buildParamString($params)
  {
    $components = array();
      
    foreach ($params as $key => $value) {
      array_push($components, sprintf("%s=%s", $key, urlencode($value)));
    }
      
    return implode("&amp;", $components);
  }
  
  protected function getGenePositionString()
  {
    if ($this->position === NULL) {
      $gene = $this->gene;
      $chrom = $this->getChromName($gene->chr);
      $this->position = sprintf("%s:%d-%d", $chrom, $gene->start, $gene->end);
    }
    
    return $this->position;
  }
  
  protected function getChromName($chrom)
  {
    if ($this->imageCfg["db"] !== self::DEFAULT_DB) {
      return $chrom;
    }
  
    return $this->UCSCchrom;
  }
}
