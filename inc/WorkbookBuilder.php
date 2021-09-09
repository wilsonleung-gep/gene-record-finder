<?php

class WorkbookBuilder
{
  protected $geneName;
  protected $featureType;
  protected $builder;

  public function __construct($geneName, $featureType, $cfg)
  {
    $this->geneName = $geneName;
    $this->featureType = $featureType;
    $this->builder = $cfg["rootdir"] . "/" . $cfg["workbookBuilder"];
  }

  public function createWorkbook($outfilePath)
  {
    $cmd = join(" ", array(
        $this->builder,
        "-o", $outfilePath,
        "-g", sprintf('"%s"', $this->geneName),
        "-t", $this->featureType
    ));

    exec($cmd, $output, $retcode);

    if ($retcode !== 0) {
      throw new Exception("Create workbook command failed");
    }
  }

}
