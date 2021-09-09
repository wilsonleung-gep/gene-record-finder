<?php
class IsoformTable {
    public function __construct($mrnas, $featuredata, $featureorders, $itemsuffix) {
        $this->mrnanamemap = $this->map_idx_to_FBname($mrnas);
        $this->featuredata = $featuredata;
        $this->featureorders = $featureorders;
        $this->itemsuffix = $itemsuffix;
        $this->featuredictionary = $this->create_feature_dictionary($featureorders);
    }

    function create_isoform_table($tableprefix) {
        $tableid = $tableprefix."_table";
        $tablediv = $tableprefix."_division";
        $tableclass = "isoform_table";
        $tablecontainer = "isoformtbl_container";

        $coltableid = $tableprefix."_coltable";
        $coltableclass = "isoformcol_table";


        $uniqueorder = $this->get_unique_order();
        $tableheaders = $this->create_table_headers($uniqueorder);

        $results = array();
        $coltable_results = array();

        foreach (array_keys($this->featuredictionary) as $isoform) {
            $fields = array();

            for ($i=0; $i<count($uniqueorder); $i++) {
               if (array_key_exists($uniqueorder[$i]["id"], $this->featuredictionary[$isoform])) {
                    array_push($fields, '<td class="match">Y</td>');
               } else {
                    array_push($fields, '<td></td>');
               }
            }

            $isoform_name = $this->mrnanamemap[$isoform]["FBname"];
            $tr_attr = $this->get_row_attr($isoform);

            if ($isoform_name != "Unique") {
                array_push($results,
                    sprintf("<tr %s>%s</tr>", $tr_attr, join("", $fields)));

                array_push($coltable_results,
                    sprintf("<tr><td>%s</td></tr>", $isoform_name));
            }
        }

        $tablecontents = join("\n", $results);
        $coltablecontents = join("\n", $coltable_results);

        return <<<TABLEHTML
<div id="{$tablediv}">
    <table id="{$coltableid}" class="{$coltableclass}">
        <thead><tr><th>Isoform</th></tr></thead>
        <tbody>
            {$coltablecontents}
        </tbody>
    </table>

    <div class="{$tablecontainer}">
        <table id="{$tableid}" class="{$tableclass}">
            <thead>{$tableheaders}</thead>
            <tbody>
                {$tablecontents}
            </tbody>
        </table>
    </div>
</div>
TABLEHTML;
    }

    function get_unique_order() {
        $FBids = array();

        foreach ($this->featuredata as $f) {
            array_push($FBids, array("id" => $f->id, "FBid" => $f->FBid));
        }

        return $FBids;
    }

    function get_row_attr($isoform) {
        $isoform_id = $this->mrnanamemap[$isoform]["FBid"];

        $tr_attr = "id='{$isoform_id}_{$this->itemsuffix}'";

        if ($isoform_id == "Unique") {
            $tr_attr .= " class='selected_{$this->itemsuffix}'";
        }

        return $tr_attr;
    }

    public function create_feature_dictionary($featureorders) {
        $featuredictionary = array();
        foreach (array_keys($featureorders) as $k) {
            $featuredictionary[$k] = array_flip($featureorders[$k]);
        }
        return $featuredictionary;
    }

    public function map_idx_to_FBname($mrnas) {
        $mapping = array();

        foreach ($mrnas as $m) {
            $mapping[$m->id] = array("FBname" => $m->FBname, "FBid" => $m->FBid);
        }

        return $mapping;
    }

    public function create_table_headers($uniqueorder) {
        $FBids = array();
        $header_css = "clickable";

        for ($i=0; $i<count($uniqueorder); $i++) {
            array_push($FBids, $uniqueorder[$i]["FBid"]);
        }

        return "<tr><th class='{$header_css}'>".
            join("</th><th class='{$header_css}'>", $FBids)."</th></tr>";
    }

    function map_feature_orders() {
        $map_FBids = $this->map_id_to_FBid();

        $mapped_orders = array();

        foreach ($this->featureorders as $isoform => $orders) {
            $mrna_id = $this->mrnanamemap[$isoform]["FBid"];
            $num_items = count($orders);
            $mapping = array();

            for ($i=0; $i<$num_items; $i++) {
                $featureid = $map_FBids[$orders[$i]];
                $mapping[$featureid] = 1;
            }

            $mapped_orders[$mrna_id] = $mapping;
        }

        return $mapped_orders;
    }

    function map_id_to_FBid() {
        $map_id_FBid = array();

        foreach ($this->featuredata as $f) {
            $map_id_FBid[$f->id] = $f->FBid;
        }

        return $map_id_FBid;
    }

    public $mrnanamemap;
    public $featuredata;
    public $featureorders;
    public $itemsuffix;
}
?>
