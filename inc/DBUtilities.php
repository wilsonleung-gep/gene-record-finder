<?php
// Database class based on
// https://stackoverflow.com/questions/18887954/
class DBUtilities
{
  protected $dbConn;
  protected $stmt;

  public function __construct($dbsettings)
  {
    $dbConfig = $this->loadDbConfig($dbsettings);
    $database = $dbConfig['db'];

    $this->dbConn = new mysqli(
            $dbConfig['hostname'],
            $dbConfig['username'],
            $dbConfig['password'],
            $database);

    if (mysqli_connect_errno()) {
      throw new Exception(
      "Cannot connect to database {$database}: " . mysqli_connect_error());
    }
  }

  public function disconnect()
  {
    $this->dbConn->close();
    $this->dbConn = NULL;
  }

  public function queryDb($query, $params, $func=NULL)
  {
    $this->prepare($query);
    $stmt = $this->stmt;

    $this->bindParams($params);

    $stmt->execute();
    $stmt->store_result();

    $queryResults = $this->fetchResults($func);

    $stmt->free_result();
    $stmt->close();

    return $queryResults;
  }

  public function batchQueryDb($query, $params, $queryList, $func=NULL)
  {
    $collection = array();

    $this->prepare($query);
    $stmt = $this->stmt;

    foreach ($queryList as $listItem) {
      $params["params"] = is_array($listItem) ? $listItem : array($listItem);

      $this->bindParams($params);

      $stmt->execute();
      $stmt->store_result();

      array_push($collection, $this->fetchResults($func));

      $stmt->free_result();
    }

    $stmt->close();

    return $collection;
  }

  protected function bindParams($params)
  {
    $stmt = $this->stmt;

    $bindParams = $params["params"];
    $bindNames[] = $params["types"];

    for ($i=0; $i<count($bindParams); $i++) {
      $bindVar = "bind{$i}";
      ${$bindVar} = $bindParams[$i];
      $bindNames[] = &${$bindVar};
    }

    call_user_func_array(array($stmt, "bind_param"), $bindNames);
  }

  protected function fetchResults($func=NULL)
  {
    $stmt = $this->stmt;

    $results = array();
    $fields = array();
    $meta = $stmt->result_metadata();

    while ($field = $meta->fetch_field()) {
      $var = $field->name;
      ${$var} = NULL;
      $fields[$var] = &${$var};
    }

    call_user_func_array(array($stmt, "bind_result"), $fields);

    $i=0;
    while ($stmt->fetch()) {
      $results[$i] = array();
      foreach($fields as $key => $value) {
        $results[$i][$key] = $value;
      }
      $i++;
    }

    if ($func !== NULL) {
      call_user_func($func, $results);
    }

    return $results;
  }

  public function prepare($query)
  {
    $stmt = $this->dbConn->prepare($query);

    if (empty($stmt)) {
      throw new Exception("Error in prepare statement: " . $this->dbConn->error);
    }

    $this->stmt = $stmt;
    return $stmt;
  }

  protected function loadDbConfig($cfg)
  {
    $requiredParams = array('username', 'password', 'db');

    foreach ($requiredParams as $param) {
      if (!isset($cfg[$param])) {
        throw new Exception("Error in database configuration file");
      }
    }

    if (!isset($cfg["hostname"])) {
      $cfg["hostname"] = "localhost";
    }

    return $cfg;
  }
}
