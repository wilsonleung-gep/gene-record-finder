<?php
class Results
{
    const SUCCESS = 'success';
    const FAILURE = 'failure';

    protected $status;
    protected $message;
    protected $results;

    public function __construct($options=array())
    {
        $default_settings = array(
            "status" => self::SUCCESS,
            "message" => "",
            "results" => array()
        );

        $settings = array_merge($default_settings, $options);

        $this->status = $settings["status"];
        $this->message = $settings["message"];
        $this->results = $settings["results"];
    }

    public function toJSON()
    {
      return json_encode(array(
          "status" => $this->status,
          "message" => $this->message,
          "results" => $this->results
      ));
    }
}
