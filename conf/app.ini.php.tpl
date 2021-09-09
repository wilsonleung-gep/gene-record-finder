; <?php exit; ?>
;-------------------
; Configurations for Gene Record Finder
;-------------------
[database]
username = "[Database username]"
password = "[Database password]"
db = "[Gene Record Finder database]"

[app]
trashdir = "[Path to directory for temporary files]"
rootdir = "[Path to gene-record-finder directory]"
webroot = "[URL to gene-record-finder directory]"
downloadservice = "services/downloadgeneworkbook.php"
workbookBuilder = "bin/create_gene_workbook_xlsx.pl"
ucscroot = "[URL to the UCSC Genome Browser]"
ucscSession = "conf/track_settings.txt"
