#!/usr/bin/perl

use warnings;
use strict;

=head1 NAME

create_gene_workbook_xlsx.pl - Create a Excel workbook for annotation

=head1 SYNOPSIS

create_gene_workbook_xlsx.pl -c <cfg_file> -g <gene_name> -o <outfile> [-t type]

=head1 DESCRIPTION

This script creates an Excel workbook with the list of unique exons and
the isoforms that use each exon.

=head1 OPTIONS

=over 4

=item -c <cfg_file>

=item -g <gene_name>

=item -o <outfile>

=back

=head1 VERSION

Last update: 2016-12-31

=cut


use Getopt::Long;
use Pod::Usage;

use Readonly;
use Carp;
use Data::Dumper;

use DBI;
use Excel::Writer::XLSX;

Readonly my $UNIQUE_KEY         => "unique_exon";
Readonly my $MINUS_STRAND       => "-";
Readonly my $CDS_TYPE           => "CDS";
Readonly my $EXON_TYPE          => "exon";
Readonly my $WIDE_COLUMN_WIDTH => 20;
Readonly my $COLUMN_WIDTH       => 15;


sub main {
  my %params = parse_arguments();

  my $ref_records =
    query_gene_record( $params{"cfgfile"}, $params{"gene"}, $params{"type"} );

  create_xlsx_file( $ref_records, $params{"outfile"} );

  return;
}

main();



sub create_xlsx_file {
  my ( $ref_records, $outfile ) = @_;

  my $workbook = Excel::Writer::XLSX->new($outfile)
    or croak("Cannot create file: ${outfile} $!");

  my $ref_formatter = { bold => $workbook->add_format( bold => 1 ) };

  my $ref_cds_order =
    create_base_worksheet( $workbook, $ref_records, $ref_formatter );

  my $ref_fbid_map = build_fbid_map( $ref_records->{cds_data} );

  foreach my $mrna ( sort keys %{ $ref_records->{mrnas} } ) {
    create_worksheet( $workbook, $mrna, {
      cds_order => $ref_cds_order,
      fbid_map => $ref_fbid_map,
      records => $ref_records,
      formatter => $ref_formatter
    });
  }

  $workbook->close() or croak("Cannot close file ${outfile} $!");

  return;
}


sub create_base_worksheet {
  my ( $workbook, $ref_records, $ref_formatter ) = @_;

  my $worksheet = $workbook->add_worksheet($UNIQUE_KEY);

  $worksheet->write_row(
    0, 0,
    [
      "FlyBase_ID",      "Dmel_isoforms",
      "Dmel_chrom",      "Dmel_start",
      "Dmel_end",        "Dmel_strand",
      "ortholog_start",  "ortholog_end",
      "ortholog_strand", "ortholog_frame",
      "comments"
    ],
    $ref_formatter->{bold}
  );
  $worksheet->set_column( "A:B", $WIDE_COLUMN_WIDTH );
  $worksheet->set_column( "C:K", $COLUMN_WIDTH );

  my $compare_func =
    ( $ref_records->{strand} eq $MINUS_STRAND )
    ? \&by_start_desc
    : \&by_start_asc;
  my @records =
    sort { $compare_func->( $a, $b ) } ( values %{ $ref_records->{cds_data} } );

  my %rec;
  my @sorted_order = ();
  my @row_data;

  for ( my $i = 0 ; $i < scalar(@records) ; $i++ ) {
    %rec      = %{ $records[$i] };
    @row_data = @rec{qw(FBid isoforms chr start end strand)};

    $worksheet->write_row( $i + 1, 0, \@row_data );

    push( @sorted_order, $records[$i]->{FBid} );
  }

  return \@sorted_order;
}


sub create_worksheet {
  my ( $workbook, $mrna, $wb_metadata ) = @_;

  my $ref_cds_order = $wb_metadata->{cds_order};
  my $ref_fbid_map = $wb_metadata->{fbid_map};

  my $worksheet = $workbook->add_worksheet($mrna);

  my $ref_cds_in_isoform = $wb_metadata->{records}->{cds_list}->{$mrna};

  $worksheet->write_row(
    0, 0,
    [
      "FlyBase_ID", "ortholog_start", "ortholog_end", "ortholog_strand",
      "coordinates"
    ],
    $wb_metadata->{formatter}->{bold}
  );
  $worksheet->set_column( "A:A", $WIDE_COLUMN_WIDTH );
  $worksheet->set_column( "B:E", $COLUMN_WIDTH );

  my @records     = ();
  my $row_offset  = 2;
  my $num_records = scalar( @{$ref_cds_order} );

  my $last_row_idx = $num_records + 1;

  my $num_cds = 0;
  for ( my $i = 0 ; $i < $num_records ; $i++ ) {
    my $cds_fbid = $ref_cds_order->[$i];

    my $cds_uid  = $ref_fbid_map->{$cds_fbid};
    my $cds_info = $ref_cds_in_isoform->{$cds_uid};

    if ( defined $cds_info ) {
      push( @records, $cds_fbid );
      $num_cds += 1;
    }
  }

  my $start_formula  = make_index_formula_tpl( "G", $last_row_idx );
  my $end_formula    = make_index_formula_tpl( "H", $last_row_idx );
  my $strand_formula = make_index_formula_tpl( "I", $last_row_idx );

  $worksheet->write_col( 1, 0, \@records );

  for my $row_idx ( 1 .. $num_cds ) {
    my $lookup_idx = $row_idx + 1;

    $worksheet->write( $row_idx, 1, sprintf( $start_formula,  $lookup_idx ) );
    $worksheet->write( $row_idx, 2, sprintf( $end_formula,    $lookup_idx ) );
    $worksheet->write( $row_idx, 3, sprintf( $strand_formula, $lookup_idx ) );

    $worksheet->write( $row_idx, 4, make_coords_formula($lookup_idx) );
  }

  return;
}

sub make_coords_formula {
  my ($row_idx) = @_;

  return
      sprintf( '=IF(D%d="-", ', $row_idx )
    . sprintf( 'CONCATENATE(C%d, "-", B%d, ","), ', $row_idx, $row_idx )
    . sprintf( 'CONCATENATE(B%d, "-", C%d, ","))',  $row_idx, $row_idx );
}

sub make_index_formula_tpl {
  my ( $column, $last_row_idx ) = @_;

  my $match_range = sprintf( ' % s!$A$2:$A$%d', $UNIQUE_KEY, $last_row_idx );
  my $match_tpl = 'MATCH($A%d,' . ${match_range} . ', 0)';

  return sprintf( '=INDEX(%s!%s$2:%s$%d, %s)',
    $UNIQUE_KEY, $column, $column, $last_row_idx, $match_tpl );
}

sub query_gene_record {
  my ( $cfg_file, $gene_name, $feature_type ) = @_;

  my $ref_dbconfig = load_db_config($cfg_file);

  my $connection_str = sprintf( 'DBI:mysql:%s', $ref_dbconfig->{db} );
  my $dbh = DBI->connect(
    $connection_str,
    $ref_dbconfig->{username},
    $ref_dbconfig->{password}
  ) or croak(" Cannot connect to the database ");

  my ( $strand, $ref_mrnas ) = get_mrna_list( $dbh, $gene_name );
  my ( $ref_cds_data, $ref_cds_list ) =
    get_cds_list( $dbh, $ref_mrnas, $feature_type );

  $dbh->disconnect or croak(" Cannot disconnect the database ");

  my $ref_records = {
    gene_name => $gene_name,
    strand    => $strand,
    mrnas     => $ref_mrnas,
    cds_data  => $ref_cds_data,
    cds_list  => $ref_cds_list
  };

  build_isoform_list($ref_records);

  return $ref_records;
}

sub get_cds_list {
  my ( $dbh, $ref_mrnas, $type ) = @_;

  my $query =
      " SELECT ${type}_feature_id FROM ${type}_feature_mrna_feature"
    . " WHERE mrna_feature_id = ?";

  my $sth = $dbh->prepare($query);

  my %results = ();
  my @rows;

  my ( $isoform, $ref_info );
  while ( ( $isoform, $ref_info ) = each %{$ref_mrnas} ) {
    $sth->execute( $ref_info->{id} ) or croak($sth->errstr);

    $results{$isoform} = {};

    while ( @rows = $sth->fetchrow_array ) {
      $results{$isoform}->{ $rows[0] }    = 1;
      $results{$UNIQUE_KEY}->{ $rows[0] } = 1;
    }
  }

  my @uniq_ids = ( keys %{ $results{$UNIQUE_KEY} } );
  my $ref_cds_data = get_cds_info( $dbh, \@uniq_ids, $type );

  return ( $ref_cds_data, \%results );
}

sub get_cds_info {
  my ( $dbh, $ref_unique_cds_ids, $type ) = @_;

  my $query = "SELECT FBid, chr, start, end, strand FROM ${type}_feature"
    . " WHERE ${type}_feature.id = ? LIMIT 1 ";

  my $sth = $dbh->prepare($query);

  my %results = ();
  foreach my $cds_id ( @{$ref_unique_cds_ids} ) {
    $sth->execute($cds_id) or croak($sth->errstr);

    while ( my $ref_cds = $sth->fetchrow_hashref ) {
      $results{$cds_id} = $ref_cds;
    }
  }

  return \%results;
}

sub get_mrna_list {
  my ( $dbh, $gene_name ) = @_;

  my $sth = $dbh->prepare(
        " SELECT mrna_feature.FBname, mrna_feature.id, mrna_feature.strand"
      . " FROM mrna_feature"
      . " INNER JOIN gene_feature ON gene_feature.id = mrna_feature.gene_feature_id"
      . " WHERE gene_feature . FBname = ?" );

  my $strand       = "+";
  my %mrna_records = ();
  $sth->execute($gene_name);

  my @row;
  while ( @row = $sth->fetchrow_array ) {
    $mrna_records{ $row[0] } = { "id" => $row[1], "strand" => $row[2] };
    $strand = $row[2];
  }

  if ( scalar( keys %mrna_records ) == 0 ) {
    $dbh->disconnect or croak("Cannot disconnect from database");
    croak("No mRNA records found.");
  }

  return ( $strand, \%mrna_records );
}

sub build_fbid_map {
  my ($ref_cds_data) = @_;

  my %fbid_map = ();
  while ( my ( $key, $val ) = each( %{$ref_cds_data} ) ) {
    $fbid_map{ $val->{FBid} } = $key;
  }

  return \%fbid_map;
}

sub build_isoform_list {
  my ($ref_records) = @_;

  my $cds_list = $ref_records->{cds_list};
  my $cds_data = $ref_records->{cds_data};

  foreach my $id (keys %{$cds_list->{unique_exon}}) {
    $cds_data->{$id}->{isoforms} = [];
  }

  foreach my $isoform (sort keys %{$cds_list}) {
    next if ($isoform eq $UNIQUE_KEY);

    foreach my $cds_id (keys %{$cds_list->{$isoform}}) {
      push(@{$cds_data->{$cds_id}->{isoforms}}, get_isoform_suffix($isoform));
    }
  }

  foreach my $id (keys %{$cds_list->{unique_exon}}) {
    $cds_data->{$id}->{isoforms} = join(", ", @{$cds_data->{$id}->{isoforms}});
  }

  return;
}

sub get_isoform_suffix {
  my ($isoform) = @_;

  if ($isoform =~ /(.*)\-[RP](\S+)$/x) {
    return $2;
  }

  croak("Invalid isoform name: ${isoform}");
}

sub by_start_desc {
  if ( $a->{start} == $b->{start} ) {
    return ( $b->{end} <=> $a->{end} );
  }

  return ( $b->{start} <=> $a->{start} );
}

sub by_start_asc {
  if ( $a->{start} == $b->{start} ) {
    return ( $b->{end} <=> $a->{end} );
  }

  return ( $a->{start} <=> $b->{start} );
}

sub load_db_config {
  my ($cfg_file) = @_;

  my %cfg;

  open my $fh_cfg_file, "<", $cfg_file
    or croak("Cannot open file: $cfg_file: $!");

  while ( my $line = <$fh_cfg_file> ) {
    next if ( ( $line =~ /^[;\[]/x ) || ( $line =~ /^\s*$/x ) );
    chomp($line);

    my $cfgitem = parse_config_item($line);

    $cfg{ $cfgitem->{key} } = $cfgitem->{value};
  }

  close($fh_cfg_file) or croak(" Cannot close file : $cfg_file : $! ");

  return \%cfg;
}

sub parse_config_item {
  my ($line) = @_;

  if ($line =~ /(.*)=(.*)/x) {
    return { key => trim($1), value => trim($2) };
  }

  croak("Invalid configuration line: ${line}");
}

sub trim {
  my ($str) = @_;

  $str =~ s/^\s+//x;
  $str =~ s/\s+$//x;

  $str =~ s/^["']//x;
  $str =~ s/["']$//x;

  return $str;
}


sub parse_arguments {
  my $gene    = undef;
  my $outfile = undef;
  my $cfgfile = "../conf/app.ini.php";
  my $type    = $CDS_TYPE;

  my $help = 0;

  GetOptions(
    'help|?'      => \$help,
    'gene|g=s'    => \$gene,
    'cfgfile|i=s' => \$cfgfile,
    'outfile|o=s' => \$outfile,
    'type|t=s'    => \$type
  ) or usage();

  pod2usage( { verbose => 2 } ) if ($help);

  usage("Missing configuration file") unless ( defined($cfgfile) );
  usage("Missing gene name")          unless ( defined($gene) );

  return (
    gene    => $gene,
    type    => $type,
    cfgfile => $cfgfile,
    outfile => $outfile
  );
}

sub usage {
  my $msg = shift;

  pod2usage( { verbose => 1, message => $msg || "" } );
  exit 1;
}
